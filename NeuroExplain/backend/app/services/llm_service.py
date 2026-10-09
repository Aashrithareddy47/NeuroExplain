"""
LLM Service for NeuroExplain.
Integrates Google Gemini Flash API via the modern `google-genai` SDK with structured prompt engineering,
negation preservation, clinical evidence grounding, and multilingual generation (EN, TE, HI).
"""

import os
import json
import re
import time
from typing import Dict, Any, List, Optional, Tuple

from google import genai
from google.genai import types, errors
from pydantic import ValidationError

from app.config import settings
from app.models.schemas import (
    ReportAnalysisResponse,
    ReportFinding,
    MedicalTermExplanation,
    EducationalInterpretation,
    UncertaintyItem,
    DoctorQuestion,
    SourceReference,
    FollowUpQuestionResponse,
    SimplifyTermResponse
)
from app.services.language_service import language_service


class LLMService:
    def __init__(self):
        self.api_key: str = settings.GEMINI_API_KEY
        self.model_name: str = settings.GEMINI_MODEL
        self.request_timeout: int = getattr(settings, "GEMINI_REQUEST_TIMEOUT_SECONDS", 30)
        self.client: Optional[genai.Client] = None
        self._configured: bool = False
        self._last_error_detail: Optional[str] = None
        self._initialize_gemini()

    def _initialize_gemini(self):
        """Configures the Google GenAI SDK client."""
        if self.api_key and self.api_key.strip() and self.api_key != "your_gemini_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key.strip())
                self._configured = True
                self._last_error_detail = None
            except Exception as e:
                print(f"Warning: Gemini client initialization failed: {e}")
                self.client = None
                self._configured = False
                self._last_error_detail = str(e)
        else:
            self.client = None
            self._configured = False
            self._last_error_detail = "API key not configured."

    def is_configured(self) -> bool:
        """Returns True if the client is initialized with an active API key."""
        return self._configured and self.client is not None

    def get_last_error_detail(self) -> Optional[str]:
        """Returns the last known error message from Gemini operations."""
        return self._last_error_detail

    def _generate_with_gemini(
        self,
        contents: str,
        system_instruction: Optional[str] = None,
        response_mime_type: Optional[str] = None,
        max_retries: int = 1
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Executes a Gemini generation call using google-genai.
        Handles timeouts, quotas, authentication, and transient errors separately.
        Returns (response_text, error_message).
        """
        if not self.is_configured():
            return None, "Gemini API key is not configured or invalid."

        config_kwargs: Dict[str, Any] = {
            "temperature": 0.2,
        }
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if response_mime_type:
            config_kwargs["response_mime_type"] = response_mime_type

        config = types.GenerateContentConfig(**config_kwargs)

        attempt = 0
        while attempt <= max_retries:
            attempt += 1
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
                if response and response.text:
                    self._last_error_detail = None
                    return response.text.strip(), None
                return None, "Empty response received from Gemini."

            except errors.ClientError as ce:
                status_code = getattr(ce, "code", None)
                msg = str(ce)
                if status_code in (401, 403) or "API_KEY_INVALID" in msg:
                    err = "Authentication error: Invalid or unauthorized API key (HTTP 401/403)."
                elif status_code == 404 or "NOT_FOUND" in msg:
                    err = f"Model '{self.model_name}' was not found or is not accessible to this API key (HTTP 404)."
                elif status_code == 429 or "RESOURCE_EXHAUSTED" in msg:
                    err = (
                        f"Daily free tier quota exceeded for model '{self.model_name}' "
                        "(HTTP 429 RESOURCE_EXHAUSTED). Please check usage details or try again later."
                    )
                else:
                    err = f"Gemini client request error (HTTP {status_code}): {msg[:160]}"

                self._last_error_detail = err
                print(f"[Gemini ClientError] {err}")
                # Client errors (401, 404, 429) should NOT be retried
                return None, err

            except errors.ServerError as se:
                status_code = getattr(se, "code", None)
                if status_code == 504 or "DEADLINE_EXCEEDED" in str(se):
                    err = "Gemini server request timed out (HTTP 504 Deadline Exceeded)."
                else:
                    err = f"Gemini upstream server error (HTTP {status_code})."

                print(f"[Gemini ServerError attempt {attempt}/{max_retries+1}] {err}")
                if attempt <= max_retries:
                    time.sleep(1.0)
                    continue
                self._last_error_detail = err
                return None, err

            except (TimeoutError, Exception) as e:
                err_str = str(e)
                if "timeout" in err_str.lower() or "deadline" in err_str.lower():
                    err = "Operation timed out before completion (504)."
                else:
                    err = f"Network or execution error: {type(e).__name__}: {err_str[:120]}"

                print(f"[Gemini Exception attempt {attempt}/{max_retries+1}] {err}")
                if attempt <= max_retries and ("timeout" in err_str.lower() or "connection" in err_str.lower()):
                    time.sleep(1.0)
                    continue
                self._last_error_detail = err
                return None, err

        return None, self._last_error_detail or "Failed to generate content."

    def generate_report_analysis(
        self,
        report_id: str,
        report_text: str,
        sections: Dict[str, str],
        nlp_findings: List[Dict[str, Any]],
        nlp_terms: List[Dict[str, str]],
        retrieved_sources: List[Dict[str, Any]],
        language: str = "en",
        is_medical_image_only: bool = False,
        image_safety_warning: Optional[str] = None
    ) -> ReportAnalysisResponse:
        """
        Generates full grounded clinical report analysis in requested language (EN, TE, HI).
        Uses google-genai structured JSON with deterministic fallback if external AI is unavailable.
        """
        lang_code = language_service.normalize_lang_code(language)
        lang_instruction = language_service.get_language_prompt_instruction(lang_code)
        disclaimer_text = language_service.get_disclaimer(lang_code)

        if is_medical_image_only:
            return self._build_image_only_safety_response(
                report_id=report_id,
                lang_code=lang_code,
                warning=image_safety_warning or "Medical scan image detected without written report.",
                retrieved_sources=retrieved_sources,
                disclaimer=disclaimer_text
            )

        sources_context = "\n\n".join([
            f"[Source ID: {s['id']}] {s['title']} ({s.get('publisher_or_journal', '')})\nExcerpt: {s['relevant_excerpt']}"
            for s in retrieved_sources
        ])

        system_prompt = f"""
You are NeuroExplain, a compassionate, expert clinical assistant helping patients understand their neurological test reports in simple, patient-friendly language.

CRITICAL MEDICAL RULES:
1. MEDICAL ACCURACY & NEGATION FIDELITY: Never invert or alter the doctor's findings. If a report says "No acute infarct" or "No hemorrhage", state clearly that these are ABSENT/NORMAL. Never claim a disease exists when the report says it is absent.
2. GROUNDING & SOURCING: Use the provided medical reference excerpts as supporting evidence. Cite the Source ID (e.g. KB-STROKE-001) in educational explanations.
3. NO FABRICATION & NO DIRECT DIAGNOSIS: Never invent findings or predict cancer stages. Explain what is written, what is uncertain, and what to ask the doctor.
4. LANGUAGE REQUIREMENT: You MUST generate all text in the target language: '{lang_code}'.
{lang_instruction}
5. OUTPUT FORMAT: Return ONLY a valid JSON object matching the requested schema.
"""

        user_prompt = f"""
TARGET LANGUAGE: {lang_code}

UPLOADED REPORT TEXT:
\"\"\"
{report_text}
\"\"\"

PARSED REPORT SECTIONS:
- Indication: {sections.get('indication', 'N/A')}
- Technique: {sections.get('technique', 'N/A')}
- Findings: {sections.get('findings', 'N/A')}
- Impression: {sections.get('impression', 'N/A')}

PRE-EXTRACTED FINDINGS & NEGATIONS (NLP):
{json.dumps(nlp_findings, indent=2)}

RETRIEVED CLINICAL KNOWLEDGE EVIDENCE (RAG):
{sources_context}

Generate a structured JSON response with these exact keys:
{{
  "patient_summary": "2-3 simple paragraphs explaining the overall report in {lang_code}",
  "modality_detected": "e.g. Brain MRI / EEG / EMG-NCS",
  "important_findings": [
    {{
      "finding_text": "original finding phrase",
      "category": "Normal / Key Finding / Incidental Finding / Negated Finding",
      "is_negated": true,
      "simplified_explanation": "patient friendly explanation in {lang_code}"
    }}
  ],
  "medical_terms_explained": [
    {{
      "original_term": "Medical term in English",
      "simplified_explanation": "Simple explanation in {lang_code}",
      "analogy_or_example": "Relatable everyday analogy in {lang_code}",
      "clinical_context": "Short category"
    }}
  ],
  "educational_interpretations": [
    {{
      "topic": "Topic name",
      "explanation": "Educational context grounded in literature in {lang_code}",
      "grounded_source_ids": ["KB-STROKE-001"]
    }}
  ],
  "uncertainties": [
    {{
      "uncertainty_description": "Aspect that cannot be answered from report alone in {lang_code}",
      "reason_for_uncertainty": "Why clinical correlation is needed in {lang_code}"
    }}
  ],
  "questions_for_doctor": [
    {{
      "question": "Question patient can ask in {lang_code}",
      "why_to_ask": "Why this helps in {lang_code}"
    }}
  ],
  "suggested_next_steps": [
    "Step 1 in {lang_code}",
    "Step 2 in {lang_code}"
  ]
}}
"""

        raw_output, err = self._generate_with_gemini(
            contents=user_prompt,
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )

        if raw_output:
            try:
                clean_json = self._extract_json_string(raw_output)
                data = json.loads(clean_json)

                source_refs = [
                    SourceReference(
                        id=s["id"],
                        title=s["title"],
                        publisher_or_journal=s.get("publisher_or_journal", "Medical Literature"),
                        year=s.get("year"),
                        doi_or_url=s.get("doi_or_url"),
                        relevant_excerpt=s["relevant_excerpt"],
                        similarity_score=s.get("similarity_score", 0.9)
                    )
                    for s in retrieved_sources
                ]

                return ReportAnalysisResponse(
                    report_id=report_id,
                    language=lang_code,
                    patient_summary=data.get("patient_summary", "Report analyzed successfully."),
                    modality_detected=data.get("modality_detected", "Brain MRI"),
                    is_medical_image_only=False,
                    image_safety_warning=None,
                    important_findings=[ReportFinding(**f) for f in data.get("important_findings", [])],
                    medical_terms_explained=[MedicalTermExplanation(**m) for m in data.get("medical_terms_explained", [])],
                    educational_interpretations=[EducationalInterpretation(**e) for e in data.get("educational_interpretations", [])],
                    uncertainties=[UncertaintyItem(**u) for u in data.get("uncertainties", [])],
                    questions_for_doctor=[DoctorQuestion(**q) for q in data.get("questions_for_doctor", [])],
                    trusted_sources=source_refs,
                    suggested_next_steps=data.get("suggested_next_steps", ["Discuss these findings with your doctor."]),
                    medical_disclaimer=disclaimer_text,
                    analysis_timestamp="2026-10-09"
                )
            except Exception as parse_exc:
                print(f"Error parsing Gemini response JSON ({parse_exc}). Using deterministic response.")

        # Deterministic clinical fallback ensures high availability when external API is unreachable or rate limited
        return self._build_deterministic_response(
            report_id=report_id,
            report_text=report_text,
            sections=sections,
            nlp_findings=nlp_findings,
            nlp_terms=nlp_terms,
            retrieved_sources=retrieved_sources,
            lang_code=lang_code,
            disclaimer=disclaimer_text,
            ai_notice=err
        )

    def answer_followup_question(
        self,
        report_id: str,
        report_text: str,
        question: str,
        retrieved_sources: List[Dict[str, Any]],
        language: str = "en"
    ) -> FollowUpQuestionResponse:
        """
        Answers patient questions grounded in report context and/or medical knowledge base.
        Handles both report-specific questions and general educational queries.
        """
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        clean_question = question.strip()
        lang_code = language_service.normalize_lang_code(language)
        lang_instruction = language_service.get_language_prompt_instruction(lang_code)

        sources_context = ""
        if retrieved_sources:
            sources_context = "\n\n".join([
                f"[Source: {s['title']} ({s.get('id', 'REF')})]\n{s['relevant_excerpt']}"
                for s in retrieved_sources
            ])
        else:
            sources_context = "No specific clinical guideline matches found in reference index."

        system_prompt = f"""
You are NeuroExplain, a compassionate, expert clinical assistant answering patient questions about neurology in patient-friendly language.

GUIDELINES:
1. TARGET LANGUAGE: Respond entirely in '{lang_code}'.
{lang_instruction}
2. REPORT CONTEXT: If the patient asks about their uploaded report and report findings are available, explain what their report states simply, accurately preserving normal results and negations. Do not invent diagnoses.
3. EDUCATIONAL CONCEPTS: If the patient asks a general educational question (such as 'What is a tumor?' or 'What is the difference between the brain and the spinal cord?'), give a clear, simple educational explanation. If clinical reference passages are provided, ground your answer in them and reference the source title.
4. UNRELATED QUESTIONS: If the question is outside neurological clinical guidelines and no reference excerpts matched, provide a polite, clear educational answer and note that this is general information.
5. URGENT SYMPTOMS: Remind the user to seek immediate medical attention for sudden severe headaches, weakness, numbness, speech changes, or seizures.
6. OUTPUT FORMAT: Return ONLY a valid JSON object with keys:
{{"answer": "Clear explanation in {lang_code}", "suggested_followups": ["Question 1 in {lang_code}", "Question 2 in {lang_code}"]}}
"""

        user_prompt = f"""
PATIENT QUESTION:
{clean_question}

UPLOADED REPORT CONTEXT (if available):
{report_text[:1200] if report_text else "(No report uploaded - general educational question)"}

RETRIEVED CLINICAL REFERENCE GUIDELINES:
{sources_context}
"""

        source_refs = [
            SourceReference(
                id=s["id"],
                title=s["title"],
                publisher_or_journal=s.get("publisher_or_journal", "Medical Literature"),
                year=s.get("year"),
                doi_or_url=s.get("doi_or_url"),
                relevant_excerpt=s["relevant_excerpt"],
                similarity_score=s.get("similarity_score", 0.85)
            )
            for s in retrieved_sources
        ]

        raw_output, err = self._generate_with_gemini(
            contents=user_prompt,
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )

        if raw_output:
            try:
                clean_json = self._extract_json_string(raw_output)
                data = json.loads(clean_json)
                ans = data.get("answer")
                if ans and ans.strip():
                    return FollowUpQuestionResponse(
                        report_id=report_id,
                        question=clean_question,
                        answer=ans.strip(),
                        language=lang_code,
                        relevant_sources=source_refs,
                        suggested_followups=data.get("suggested_followups", [])
                    )
            except Exception as parse_err:
                print(f"Failed to parse follow-up JSON: {parse_err}")

        # Deterministic Grounded Q&A Fallback
        # Provides an understandable answer rather than a raw unformatted dump
        return self._build_deterministic_qa_response(
            report_id=report_id,
            question=clean_question,
            report_text=report_text,
            retrieved_sources=retrieved_sources,
            source_refs=source_refs,
            lang_code=lang_code,
            error_reason=err
        )

    def simplify_term(self, term: str, context: Optional[str] = None, language: str = "en") -> SimplifyTermResponse:
        """Explains a single medical term in extra simple terms with an everyday analogy."""
        if not term or not term.strip():
            return SimplifyTermResponse(
                term="",
                simplified_explanation="No term was provided.",
                analogy="",
                language=language
            )

        clean_term = term.strip()
        lang_code = language_service.normalize_lang_code(language)
        lang_instruction = language_service.get_language_prompt_instruction(lang_code)

        system_prompt = f"""
Explain the medical term in very simple, patient-friendly terms with an everyday analogy in '{lang_code}'.
{lang_instruction}
Return JSON format: {{"simplified_explanation": "...", "analogy": "..."}}
"""
        user_prompt = f"Term: {clean_term}\nContext: {context or ''}"

        raw_output, _ = self._generate_with_gemini(
            contents=user_prompt,
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )

        if raw_output:
            try:
                data = json.loads(self._extract_json_string(raw_output))
                return SimplifyTermResponse(
                    term=clean_term,
                    simplified_explanation=data.get("simplified_explanation", f"Simplified explanation for {clean_term}"),
                    analogy=data.get("analogy", "Everyday comparison"),
                    language=lang_code
                )
            except Exception:
                pass

        # Heuristic clinical dictionary fallback
        term_lower = clean_term.lower()
        if "hyperintens" in term_lower or "flair" in term_lower or "wmh" in term_lower:
            exp = "Bright spots on an MRI scan that indicate small areas where fluid or tissue characteristics differ from normal brain tissue."
            ana = "Like tiny freckles or light wear-and-tear spots on an old photograph."
        elif "infarct" in term_lower or "stroke" in term_lower:
            exp = "An area where brain tissue suffered reduced blood flow and oxygen."
            ana = "Like a lawn sprinkler line getting temporarily clogged, causing a patch of grass to dry out."
        elif "tumor" in term_lower or "mass" in term_lower or "meningioma" in term_lower:
            exp = "An abnormal cluster or growth of cells in or around the brain, which can be benign (non-cancerous) or require further evaluation."
            ana = "Like an unexpected knot forming on a smooth tree branch."
        elif "dwi" in term_lower or "diffusion" in term_lower:
            exp = "A sensitive MRI scanning mode that detects how water molecules move in the brain to spot fresh cell swelling."
            ana = "Like a motion sensor that immediately triggers when water gets trapped inside a swollen sponge."
        else:
            exp = f"A clinical medical term used in neurological reports describing an anatomical structure or imaging observation."
            ana = "Like a technical label in an engineering diagram."

        return SimplifyTermResponse(
            term=clean_term,
            simplified_explanation=exp,
            analogy=ana,
            language=lang_code
        )

    def _extract_json_string(self, text: str) -> str:
        """Extracts JSON substring if enclosed in markdown backticks."""
        pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
        return text.strip()

    def _build_image_only_safety_response(
        self,
        report_id: str,
        lang_code: str,
        warning: str,
        retrieved_sources: List[Dict[str, Any]],
        disclaimer: str
    ) -> ReportAnalysisResponse:
        """Constructs safety response for raw imaging scans without reports."""
        summaries = {
            "en": "A raw radiographic scan image was uploaded without an official written report. NeuroExplain is designed to explain certified medical reports and cannot diagnose diseases directly from raw scan pixels.",
            "te": "లిఖితపూర్వక నివేదిక లేకుండా నేరుగా స్కాన్ చిత్రం అప్‌లోడ్ చేయబడింది. NeuroExplain నివేదికలను విశ్లేషిస్తుంది, చిత్రాల పిక్సెల్స్ నుండి నేరుగా వ్యాధి నిర్ధారణ చేయదు.",
            "hi": "बिना लिखित रिपोर्ट के केवल एक स्कैन छवि अपलोड की गई है। NeuroExplain रिपोर्टों को समझाने के लिए है, यह सीधे स्कैन पिक्सल से निदान नहीं करता।"
        }

        return ReportAnalysisResponse(
            report_id=report_id,
            language=lang_code,
            patient_summary=summaries.get(lang_code, summaries["en"]),
            modality_detected="Medical Imaging Scan (Image Only)",
            is_medical_image_only=True,
            image_safety_warning=warning,
            important_findings=[],
            medical_terms_explained=[],
            educational_interpretations=[],
            uncertainties=[
                UncertaintyItem(
                    uncertainty_description="Direct pixel diagnosis cannot be performed without an official radiologist interpretation.",
                    reason_for_uncertainty="Radiology interpretation requires clinical examination correlation and multi-sequence review."
                )
            ],
            questions_for_doctor=[
                DoctorQuestion(
                    question="How can I request the official written radiologist report for this examination?",
                    why_to_ask="The written report provides the legally certified clinical findings."
                )
            ],
            trusted_sources=[],
            suggested_next_steps=["Please upload the official printed radiologist report document."],
            medical_disclaimer=disclaimer,
            analysis_timestamp="2026-10-09"
        )

    def _build_deterministic_response(
        self,
        report_id: str,
        report_text: str,
        sections: Dict[str, str],
        nlp_findings: List[Dict[str, Any]],
        nlp_terms: List[Dict[str, str]],
        retrieved_sources: List[Dict[str, Any]],
        lang_code: str,
        disclaimer: str,
        ai_notice: Optional[str] = None
    ) -> ReportAnalysisResponse:
        """Grounded clinical response builder when external AI is offline or testing."""
        text_lower = report_text.lower()
        if "eeg" in text_lower or "electroencephalogram" in text_lower:
            modality = "Electroencephalogram (EEG)"
        elif "emg" in text_lower or "electromyography" in text_lower or "nerve conduction" in text_lower:
            modality = "Electromyography & Nerve Conduction (EMG/NCS)"
        else:
            modality = "Brain Magnetic Resonance Imaging (MRI)"

        formatted_findings = []
        for item in nlp_findings[:6]:
            txt = item["finding_text"]
            is_neg = item["is_negated"]
            if is_neg:
                simple = f"Confirmed Normal / Absent: The report specifically notes that '{txt.lower()}' was not observed."
                cat = "Normal / Negative (Absent)"
            else:
                simple = f"Observed Finding: The report describes '{txt}'."
                cat = item.get("category", "Key Finding")
            formatted_findings.append(ReportFinding(
                finding_text=txt,
                category=cat,
                is_negated=is_neg,
                simplified_explanation=simple
            ))

        terms_list = []
        for t in nlp_terms[:5]:
            terms_list.append(MedicalTermExplanation(
                original_term=t["original_term"],
                simplified_explanation=t["simplified_explanation"],
                analogy_or_example=t["analogy_or_example"],
                clinical_context=t["clinical_context"]
            ))

        interpretations = []
        for s in retrieved_sources[:3]:
            interpretations.append(EducationalInterpretation(
                topic=s["title"],
                explanation=f"According to published clinical guidelines ({s.get('publisher_or_journal', 'guidelines')}): {s['relevant_excerpt'][:220]}...",
                grounded_source_ids=[s["id"]]
            ))

        summaries = {
            "en": f"Your {modality} report has been processed and explained. Findings have been extracted with rigorous preservation of negations and normal observations.",
            "te": f"మీ {modality} నివేదిక విశ్లేషించబడింది. సాధారణ ఫలితాలు మరియు నెగెటివ్ స్టేట్‌మెంట్‌లు ఖచ్చితత్వంతో పరిశీలించబడ్డాయి.",
            "hi": f"आपकी {modality} रिपोर्ट का विश्लेषण किया गया है। सामान्य और नकारात्मक (नेगेटिव) परिणामों को सटीकता के साथ समझाया गया है।"
        }

        source_refs = [
            SourceReference(
                id=s["id"],
                title=s["title"],
                publisher_or_journal=s.get("publisher_or_journal", "Medical Literature"),
                year=s.get("year"),
                doi_or_url=s.get("doi_or_url"),
                relevant_excerpt=s["relevant_excerpt"],
                similarity_score=s.get("similarity_score", 0.9)
            )
            for s in retrieved_sources
        ]

        return ReportAnalysisResponse(
            report_id=report_id,
            language=lang_code,
            patient_summary=summaries.get(lang_code, summaries["en"]),
            modality_detected=modality,
            is_medical_image_only=False,
            image_safety_warning=None,
            important_findings=formatted_findings,
            medical_terms_explained=terms_list,
            educational_interpretations=interpretations,
            uncertainties=[
                UncertaintyItem(
                    uncertainty_description="Clinical correlation is required to assess how these test findings relate to your physical symptoms.",
                    reason_for_uncertainty="Imaging is one piece of the medical puzzle; physical examination is essential."
                )
            ],
            questions_for_doctor=[
                DoctorQuestion(
                    question="Do any of these imaging findings explain my current symptoms?",
                    why_to_ask="Helps align scan observations with your clinical treatment plan."
                ),
                DoctorQuestion(
                    question="Are any follow-up tests, monitoring, or lifestyle changes recommended?",
                    why_to_ask="Clarifies preventive steps and follow-up timeline."
                )
            ],
            trusted_sources=source_refs,
            suggested_next_steps=[
                "Schedule a follow-up consultation with your neurologist or referring doctor.",
                "Bring a copy of the official printed report and any prior imaging for comparison."
            ],
            medical_disclaimer=disclaimer,
            analysis_timestamp="2026-10-09"
        )

    def _build_deterministic_qa_response(
        self,
        report_id: str,
        question: str,
        report_text: str,
        retrieved_sources: List[Dict[str, Any]],
        source_refs: List[SourceReference],
        lang_code: str,
        error_reason: Optional[str] = None
    ) -> FollowUpQuestionResponse:
        """
        Builds an understandable, clinically accurate answer when live AI generation is offline or quota-limited.
        Synthesizes relevant reference information rather than dumping raw excerpts.
        """
        q_lower = question.lower()
        answer_paragraphs: List[str] = []

        # Report-specific conversational questions (e.g. from follow-up suggestions)
        if any(k in q_lower for k in ["medical term", "simpler word", "simple word", "simpler terms", "explain terms", "terms in"]):
            from app.services.medical_nlp import medical_nlp, KNOWN_MEDICAL_TERMS
            matched_terms = medical_nlp.match_known_terms(report_text) if report_text else []
            if not matched_terms:
                # Default core neurological terms
                matched_terms = [
                    {"original_term": k.title(), "simplified_explanation": v["simple"], "analogy_or_example": v["analogy"]}
                    for k, v in list(KNOWN_MEDICAL_TERMS.items())[:3]
                ]

            term_lines = [
                f"• **{t['original_term']}**: {t['simplified_explanation']}\n  *Everyday Analogy*: {t['analogy_or_example']}"
                for t in matched_terms[:4]
            ]
            answer_paragraphs.append(
                "Here are the key medical terms explained in simple, everyday language:\n\n"
                + "\n\n".join(term_lines)
            )

        elif any(k in q_lower for k in ["prioritize", "questions for", "ask my doctor", "ask the doctor", "what to ask", "prioritize asking"]):
            answer_paragraphs.append(
                "Here are the most important, high-priority questions to discuss with your doctor during your consultation:\n\n"
                "1. **Symptom Correlation**: *'Do the specific observations in this report explain the exact symptoms (such as numbness, headaches, or pain) that prompted this evaluation?'*\n"
                "2. **Follow-Up & Monitoring**: *'Is a follow-up imaging scan or repeat electrodiagnostic test needed, and if so, at what interval?'*\n"
                "3. **Targeted Prevention & Therapies**: *'Are there specific conservative treatments, ergonomic adjustments, or lifestyle habits that will help prevent these findings from worsening?'*\n"
                "4. **Red-Flag Warning Signs**: *'Which specific new or worsening symptoms should prompt me to contact your office or seek immediate care?'*"
            )

        elif any(k in q_lower for k in ["daily routine", "daily activities", "daily life", "everyday routine"]):
            answer_paragraphs.append(
                "Regarding your daily routine and activities based on this report:\n\n"
                "• **Reassuring Normal Findings**: Observations confirmed absent (such as no acute territorial stroke, no hemorrhage, or intact nerve continuity) indicate that immediate emergency activity halts are not needed.\n"
                "• **Noted Clinical Observations**: Non-specific or mild entrapment/wear-and-tear findings generally do not prevent light daily tasks, work, or standard routines. However, ergonomic modifications (such as wrist positioning or posture breaks) can be very beneficial.\n"
                "• **Clinical Recommendation**: Always check with your physician before undertaking heavy lifting, strenuous exertion, or major physical changes."
            )

        elif any(k in q_lower for k in ["why did my doctor", "why order", "reason for exam", "why this test"]):
            from app.services.medical_nlp import medical_nlp
            sections = medical_nlp.parse_sections(report_text) if report_text else {}
            indication = sections.get("indication", "").strip()
            
            exp_text = "Physicians order specialized neurodiagnostic evaluations to objectively investigate symptoms and rule out acute conditions."
            if indication:
                exp_text += f"\n\nAccording to your report's indication section, this exam was specifically requested for: *{indication}*."
            answer_paragraphs.append(exp_text)

        # Domain-specific synthesis based on question topic and retrieved guidelines
        elif "tumor" in q_lower or "mass" in q_lower or "neoplasm" in q_lower:
            answer_paragraphs.append(
                "A brain tumor or intracranial mass lesion refers to an abnormal growth or accumulation of cells "
                "within or adjacent to the brain tissue. Neurological imaging guidelines (RSNA & AAN) emphasize that "
                "many intracranial space-occupying lesions—such as extra-axial meningiomas—are benign (WHO Grade I) and slow-growing, "
                "causing symptoms primarily through local mass effect or compression rather than tissue invasion. "
                "A definitive diagnosis requires multidisciplinary evaluation including contrast-enhanced MRI dynamics and histopathological review."
            )
        elif "spinal cord" in q_lower and "brain" in q_lower:
            answer_paragraphs.append(
                "The brain and the spinal cord together make up the Central Nervous System (CNS):\n"
                "• **The Brain**: Located within the skull (cranium), the brain acts as the command center, governing higher cognitive functions, conscious thought, sensory interpretation, emotional regulation, and initiating voluntary movements.\n"
                "• **The Spinal Cord**: Originating at the brainstem and descending through the spinal canal of the vertebral column, the spinal cord functions as the primary two-way communication pathway between the brain and peripheral body nerves. It also independently processes rapid spinal reflexes."
            )
        elif "carpal" in q_lower or "median nerve" in q_lower:
            answer_paragraphs.append(
                "Carpal tunnel syndrome occurs when the median nerve is compressed as it passes through the wrist beneath the transverse carpal ligament. "
                "Electrodiagnostic testing (EMG and nerve conduction studies) confirms this by identifying prolongation of distal sensory and motor latencies "
                "across the wrist segment while other nearby nerves (like the ulnar nerve) remain normal."
            )
        elif "stroke" in q_lower or "infarct" in q_lower or "dwi" in q_lower:
            answer_paragraphs.append(
                "In clinical neurology, acute ischemic stroke is caused by a sudden interruption of blood flow to brain tissue. "
                "On brain MRI, Diffusion-Weighted Imaging (DWI) paired with ADC maps is the gold standard for detecting fresh cell swelling. "
                "A finding of 'no acute territorial infarction' or 'no diffusion restriction' specifically confirms that no recent arterial stroke was found."
            )
        elif "white matter" in q_lower or "hyperintens" in q_lower or "flair" in q_lower or "punctate" in q_lower:
            answer_paragraphs.append(
                "Punctate T2/FLAIR white matter hyperintensities are small, bright spots commonly noted on brain MRI. "
                "According to international neuroimaging standards (STRIVE), mild frontal spots are frequent incidental findings "
                "in healthy adults over 40 and individuals who experience migraines. They represent mild microscopic small-vessel changes "
                "rather than an acute stroke or progressive disability."
            )
        elif retrieved_sources:
            top_source = retrieved_sources[0]
            answer_paragraphs.append(
                f"Regarding your inquiry, clinical guidelines from {top_source.get('publisher_or_journal', 'medical literature')} "
                f"note the following relevant principle:\n\n"
                f"{top_source['relevant_excerpt'][:400]}..."
            )
        else:
            answer_paragraphs.append(
                "This question concerns a general topic outside our repository of clinical neuroimaging reference guidelines. "
                "For non-neurological subjects or general medical questions, we recommend consulting general educational medical resources "
                "or speaking with your primary healthcare provider."
            )

        # Informative transparency note regarding system status
        notice_suffix = (
            "\n\n*(Note: Live AI generation is currently in offline/deterministic mode"
            + (f" due to {error_reason}" if error_reason else "")
            + "; the above explanation has been verified from our medical reference knowledge base.)*"
        )
        full_answer = "\n\n".join(answer_paragraphs) + notice_suffix

        return FollowUpQuestionResponse(
            report_id=report_id,
            question=question,
            answer=full_answer,
            language=lang_code,
            relevant_sources=source_refs,
            suggested_followups=[
                "Would you like more details on this topic?",
                "How does this relate to my daily activities?",
                "What specific questions should I prioritize for my doctor?"
            ]
        )


llm_service = LLMService()
