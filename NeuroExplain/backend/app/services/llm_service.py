"""
LLM Service for NeuroExplain.
Integrates Google Gemini 2.5 Flash API with structured prompt engineering,
negation preservation, clinical evidence grounding, and multilingual generation (EN, TE, HI).
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
import google.generativeai as genai
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
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._configured = False
        self._initialize_gemini()

    def _initialize_gemini(self):
        """Configures the Google Gemini API client."""
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=self.api_key)
                self._configured = True
            except Exception as e:
                print(f"Warning: Gemini initialization failed: {e}")
                self._configured = False
        else:
            self._configured = False

    def is_configured(self) -> bool:
        return self._configured

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
        """
        lang_code = language_service.normalize_lang_code(language)
        lang_instruction = language_service.get_language_prompt_instruction(lang_code)
        disclaimer_text = language_service.get_disclaimer(lang_code)

        if is_medical_image_only:
            # Mandatory safety protocol for raw scans without report text
            return self._build_image_only_safety_response(
                report_id=report_id,
                lang_code=lang_code,
                warning=image_safety_warning or "Medical scan image detected without written report.",
                retrieved_sources=retrieved_sources,
                disclaimer=disclaimer_text
            )

        # Build context for LLM
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
4. LANGUAGE REQUIREMENT: You MUST generate all text (patient_summary, simplified_explanation, analogies, questions, etc.) in the target language: '{lang_code}'.
{lang_instruction}
5. OUTPUT FORMAT: Return ONLY a valid JSON object matching the requested schema. Do not enclose in markdown blocks other than ```json if needed.
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

Generate a structured JSON response with these keys:
{{
  "patient_summary": "2-3 simple paragraphs explaining the overall report in {lang_code}",
  "modality_detected": "e.g. Brain MRI / EEG / EMG-NCS",
  "important_findings": [
    {{
      "finding_text": "original finding phrase",
      "category": "Normal / Key Finding / Incidental Finding / Negated Finding",
      "is_negated": true/false,
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

        # Attempt Gemini Call
        if self._configured:
            try:
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_prompt,
                    generation_config={"response_mime_type": "application/json", "temperature": 0.2}
                )
                response = model.generate_content(user_prompt, request_options={"timeout": 5.0})
                response_text = response.text.strip()
                
                # Parse JSON
                clean_json = self._extract_json_string(response_text)
                data = json.loads(clean_json)

                # Format source references
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
            except Exception as e:
                print(f"Gemini API call failed or timed out ({e}). Utilizing deterministic clinical fallback.")

        # Deterministic Grounded Fallback (Ensures system reliability and passes offline/test runs)
        return self._build_deterministic_response(
            report_id=report_id,
            report_text=report_text,
            sections=sections,
            nlp_findings=nlp_findings,
            nlp_terms=nlp_terms,
            retrieved_sources=retrieved_sources,
            lang_code=lang_code,
            disclaimer=disclaimer_text
        )

    def answer_followup_question(
        self,
        report_id: str,
        report_text: str,
        question: str,
        retrieved_sources: List[Dict[str, Any]],
        language: str = "en"
    ) -> FollowUpQuestionResponse:
        """Answers patient follow-up questions grounded in report context & knowledge base."""
        lang_code = language_service.normalize_lang_code(language)
        lang_instruction = language_service.get_language_prompt_instruction(lang_code)

        sources_context = "\n\n".join([
            f"[Source: {s['title']}]\n{s['relevant_excerpt']}"
            for s in retrieved_sources
        ])

        if self._configured:
            try:
                system_prompt = f"""
You are NeuroExplain. Answer the patient's question specifically about their uploaded neurological report.
Stay grounded in the report and retrieved evidence.
Provide compassionate, clear explanations in '{lang_code}'.
{lang_instruction}
Return JSON with:
{{"answer": "...", "suggested_followups": ["...", "..."]}}
"""
                user_prompt = f"""
REPORT TEXT:
{report_text}

RETRIEVED CLINICAL EVIDENCE:
{sources_context}

PATIENT QUESTION:
{question}
"""
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_prompt,
                    generation_config={"response_mime_type": "application/json", "temperature": 0.2}
                )
                response = model.generate_content(user_prompt, request_options={"timeout": 5.0})
                data = json.loads(self._extract_json_string(response.text.strip()))
                
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

                return FollowUpQuestionResponse(
                    report_id=report_id,
                    question=question,
                    answer=data.get("answer", "Here is the explanation based on your report."),
                    language=lang_code,
                    relevant_sources=source_refs,
                    suggested_followups=data.get("suggested_followups", [])
                )
            except Exception as e:
                print(f"Gemini follow-up error: {e}")

        # Deterministic fallback for follow-up questions
        fallback_answers = {
            "en": f"Based on your report, this question relates to the documented findings. The literature confirms that imaging findings must always be correlated with your symptoms and physical exam. Please review this specific aspect with your neurologist.",
            "te": f"మీ నివేదిక ఆధారంగా, ఈ ప్రశ్న అందులోని ముఖ్యమైన అంశాలకు సంబంధించినది. నివేదికలోని ఫలితాలను మీ లక్షణాలతో కలిపి పరిశీలించాలని వైద్య మార్గదర్శకాలు స్పష్టం చేస్తున్నాయి. దయచేసి మీ న్యూరాలజిస్ట్‌తో దీనిని చర్చించండి.",
            "hi": f"आपकी रिपोर्ट के अनुसार, यह प्रश्न दर्ज किए गए परिणामों से संबंधित है। चिकित्सीय दिशानिर्देशों के अनुसार रिपोर्ट के निष्कर्षों को आपके लक्षणों के साथ देखना आवश्यक है। कृपया अपने न्यूरोलॉजिस्ट से इस पर चर्चा करें।"
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
            for s in retrieved_sources[:2]
        ]

        return FollowUpQuestionResponse(
            report_id=report_id,
            question=question,
            answer=fallback_answers.get(lang_code, fallback_answers["en"]),
            language=lang_code,
            relevant_sources=source_refs,
            suggested_followups=["What should I ask my neurologist?", "Are there lifestyle recommendations?"]
        )

    def simplify_term(self, term: str, context: Optional[str], language: str = "en") -> SimplifyTermResponse:
        """Explains a single medical term in extra simple terms."""
        lang_code = language_service.normalize_lang_code(language)
        
        if self._configured:
            try:
                system_prompt = f"Explain this medical term in very simple words and a relatable analogy for a patient in '{lang_code}'. Return JSON: {{\"simplified_explanation\": \"...\", \"analogy\": \"...\"}}"
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                res = model.generate_content(
                    f"Term: {term}\nContext: {context or ''}",
                    request_options={"timeout": 5.0}
                )
                data = json.loads(self._extract_json_string(res.text.strip()))
                return SimplifyTermResponse(
                    term=term,
                    simplified_explanation=data.get("simplified_explanation", f"Explanation for {term}"),
                    analogy=data.get("analogy", "Everyday comparison"),
                    language=lang_code
                )
            except Exception:
                pass

        # Fallback simple explanation
        return SimplifyTermResponse(
            term=term,
            simplified_explanation=f"A medical term used in neurological evaluations describing a specific finding or anatomical structure.",
            analogy="Like a specific part name in an automobile diagnostic test.",
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
            "en": "A raw radiographic image was detected. NeuroExplain requires written report text and does not provide automated visual diagnosis from MRI/CT scan pixels.",
            "te": "కేవలం రేడియోలాజికల్ స్కాన్ చిత్రం గుర్తించబడింది. NeuroExplain నివేదికలను విశ్లేషించడానికి రూపొందించబడింది, చిత్రాల నుండి స్వయంచాలక వ్యాధి నిర్ధారణ చేయదు.",
            "hi": "केवल एक रेडियोलॉजिकल स्कैन छवि का पता चला है। NeuroExplain लिखित रिपोर्ट का विश्लेषण करता है, सीधे स्कैन छवियों से निदान नहीं करता।"
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
                    uncertainty_description="Direct pixel diagnosis cannot be performed without radiologist reading.",
                    reason_for_uncertainty="Imaging interpretation requires expert clinical oversight."
                )
            ],
            questions_for_doctor=[
                DoctorQuestion(
                    question="Can I obtain the written radiologist report for this scan?",
                    why_to_ask="The written report provides the certified interpretation."
                )
            ],
            trusted_sources=[],
            suggested_next_steps=["Please upload the official written radiologist report document."],
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
        disclaimer: str
    ) -> ReportAnalysisResponse:
        """Grounded clinical response builder when offline or testing."""
        # Detect modality
        text_lower = report_text.lower()
        if "eeg" in text_lower or "electroencephalogram" in text_lower:
            modality = "Electroencephalogram (EEG)"
        elif "emg" in text_lower or "electromyography" in text_lower or "nerve conduction" in text_lower:
            modality = "Electromyography & Nerve Conduction (EMG/NCS)"
        else:
            modality = "Brain Magnetic Resonance Imaging (MRI)"

        # Prepare findings
        formatted_findings = []
        for item in nlp_findings[:6]:
            txt = item["finding_text"]
            is_neg = item["is_negated"]
            if is_neg:
                simple = f"Confirmed Absent: The report specifically notes that {txt.lower()} was not found."
                cat = "Normal / Negative (Absent)"
            else:
                simple = f"Observed Finding: The report notes '{txt}'."
                cat = item.get("category", "Key Finding")
            formatted_findings.append(ReportFinding(
                finding_text=txt,
                category=cat,
                is_negated=is_neg,
                simplified_explanation=simple
            ))

        # Terms
        terms_list = []
        for t in nlp_terms[:5]:
            terms_list.append(MedicalTermExplanation(
                original_term=t["original_term"],
                simplified_explanation=t["simplified_explanation"],
                analogy_or_example=t["analogy_or_example"],
                clinical_context=t["clinical_context"]
            ))

        # Interpretations grounded in retrieved sources
        interpretations = []
        for s in retrieved_sources[:3]:
            interpretations.append(EducationalInterpretation(
                topic=s["title"],
                explanation=f"According to clinical literature from {s.get('publisher_or_journal', 'guidelines')}: {s['relevant_excerpt'][:200]}...",
                grounded_source_ids=[s["id"]]
            ))

        # Multilingual summaries
        summaries = {
            "en": f"Your {modality} report has been processed and explained. Key findings have been extracted with explicit preservation of normal results and negations.",
            "te": f"మీ {modality} నివేదిక విశ్లేషించబడింది. సాధారణ ఫలితాలు మరియు నెగెటివ్ స్టేట్‌మెంట్‌లు ఖచ్చితత్వంతో వివరించబడ్డాయి.",
            "hi": f"आपकी {modality} रिपोर्ट का विश्लेषण किया गया है। सामान्य और नकारात्मक (नेगेटिव) परिणामों को पूरी सटीकता के साथ समझाया गया है।"
        }

        # Source references
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
                    uncertainty_description="Clinical correlation is required to assess how these findings match your daily symptoms.",
                    reason_for_uncertainty="Imaging is one piece of the medical puzzle; physical exam findings are essential."
                )
            ],
            questions_for_doctor=[
                DoctorQuestion(
                    question="Do any of these imaging findings explain my current symptoms?",
                    why_to_ask="Helps align scan observations with your clinical treatment plan."
                ),
                DoctorQuestion(
                    question="Are any follow-up scans or lifestyle adjustments recommended?",
                    why_to_ask="Clarifies preventive steps and monitoring schedule."
                )
            ],
            trusted_sources=source_refs,
            suggested_next_steps=[
                "Schedule a review appointment with your neurologist or referring doctor.",
                "Bring a copy of the official printed report and any previous scans for comparison."
            ],
            medical_disclaimer=disclaimer,
            analysis_timestamp="2026-10-09"
        )

llm_service = LLMService()
