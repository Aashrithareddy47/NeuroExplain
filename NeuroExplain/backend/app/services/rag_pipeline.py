"""
RAG Pipeline Orchestrator for NeuroExplain.
Connects Document Processor, Medical NLP, Multilingual FAISS Retriever, and LLM Service.
"""

import time
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.models.schemas import (
    ReportUploadResponse,
    ReportAnalysisResponse,
    FollowUpQuestionResponse,
    SimplifyTermResponse,
    SourceReference
)
from app.services.document_processor import document_processor
from app.services.ocr_service import ocr_service
from app.services.medical_nlp import medical_nlp
from app.services.retriever import medical_retriever
from app.services.llm_service import llm_service
from app.services.language_service import language_service
from app.config import settings

class RAGPipeline:
    def __init__(self):
        # In-memory store for active session reports: report_id -> report_data
        self._reports_store: Dict[str, Dict[str, Any]] = {}

    def process_and_store_upload(
        self,
        report_id: str,
        filename: str,
        file_bytes: bytes
    ) -> ReportUploadResponse:
        """Processes an uploaded PDF or image file and stores it in session cache."""
        ext = os.path.splitext(filename)[1].lower()
        file_size_kb = round(len(file_bytes) / 1024, 2)
        
        # Save temporary file on disk for processing
        _, temp_path = document_processor.save_upload_file(file_bytes, filename)

        extracted_text = ""
        page_count = 1
        is_scanned = False
        is_raw_image = False
        warning_msg = None
        warnings = []

        try:
            if ext == ".pdf":
                pdf_res = document_processor.extract_text_from_pdf(temp_path)
                extracted_text = pdf_res["extracted_text"]
                page_count = pdf_res["page_count"]
                is_scanned = pdf_res["is_scanned"]

                if is_scanned or not extracted_text.strip():
                    warnings.append("Document appears to contain scanned pages with minimal digital text.")
            else:
                # Image file (PNG, JPG, JPEG)
                img_res = ocr_service.extract_text_from_image(temp_path)
                extracted_text = img_res["extracted_text"]
                is_raw_image = img_res["is_raw_medical_image"]
                warning_msg = img_res["safety_warning"]
                if warning_msg:
                    warnings.append(warning_msg)
        finally:
            # Delete temporary file immediately after text extraction to protect patient privacy
            document_processor.cleanup_file(temp_path)

        # NLP Section Parsing
        sections = medical_nlp.parse_sections(extracted_text)
        detected_sections = [k.capitalize() for k, v in sections.items() if v.strip()]

        # Store in session memory with expiry timestamp
        self._reports_store[report_id] = {
            "report_id": report_id,
            "filename": filename,
            "file_type": ext,
            "extracted_text": extracted_text,
            "page_count": page_count,
            "sections": sections,
            "is_raw_image": is_raw_image,
            "image_safety_warning": warning_msg,
            "created_at": time.time(),
            "last_analysis": None,
            "retrieved_sources": []
        }

        # Clean old reports from store
        self._clean_expired_reports()

        preview = extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text

        return ReportUploadResponse(
            report_id=report_id,
            filename=filename,
            file_type=ext,
            file_size_kb=file_size_kb,
            page_count=page_count,
            extracted_character_count=len(extracted_text),
            raw_text_preview=preview or "(No readable text detected)",
            detected_sections=detected_sections,
            is_scanned_ocr=is_scanned,
            is_medical_image_only=is_raw_image,
            warnings=warnings
        )

    def analyze_report(
        self,
        report_id: str,
        language: str = "en",
        user_notes: Optional[str] = None
    ) -> ReportAnalysisResponse:
        """Executes full RAG workflow: NLP -> FAISS Multilingual Retrieval -> Grounded LLM."""
        report = self._reports_store.get(report_id)
        if not report:
            raise ValueError(f"Report with ID '{report_id}' not found or session expired.")

        extracted_text = report["extracted_text"]
        sections = report["sections"]
        is_raw_image = report["is_raw_image"]
        warning_msg = report["image_safety_warning"]

        if is_raw_image or not extracted_text.strip():
            # Return safety guidance
            return llm_service.generate_report_analysis(
                report_id=report_id,
                report_text=extracted_text,
                sections=sections,
                nlp_findings=[],
                nlp_terms=[],
                retrieved_sources=[],
                language=language,
                is_medical_image_only=True,
                image_safety_warning=warning_msg
            )

        # 1. NLP extraction
        findings_nlp = medical_nlp.extract_findings_list(sections.get("findings", ""), sections.get("impression", ""))
        terms_nlp = medical_nlp.match_known_terms(extracted_text)

        # 2. RAG Retrieval Query Formulation
        # Formulate query from Impression & Findings
        query_text = f"{sections.get('impression', '')} {sections.get('findings', '')[:300]}".strip()
        if not query_text:
            query_text = extracted_text[:400]

        retrieved_sources = medical_retriever.retrieve(query_text, k=4)
        report["retrieved_sources"] = retrieved_sources

        # 3. Grounded LLM Generation
        analysis_response = llm_service.generate_report_analysis(
            report_id=report_id,
            report_text=extracted_text,
            sections=sections,
            nlp_findings=findings_nlp,
            nlp_terms=terms_nlp,
            retrieved_sources=retrieved_sources,
            language=language,
            is_medical_image_only=False
        )

        report["last_analysis"] = analysis_response
        return analysis_response

    def answer_question(
        self,
        report_id: str,
        question: str,
        language: str = "en"
    ) -> FollowUpQuestionResponse:
        """Answers a follow-up question in the context of the uploaded report and knowledge base."""
        report = self._reports_store.get(report_id)
        if not report:
            raise ValueError(f"Report '{report_id}' not found or expired.")

        extracted_text = report["extracted_text"]
        
        # Retrieve relevant passages specifically for the question
        question_query = f"{question} {extracted_text[:200]}"
        retrieved_sources = medical_retriever.retrieve(question_query, k=3)

        return llm_service.answer_followup_question(
            report_id=report_id,
            report_text=extracted_text,
            question=question,
            retrieved_sources=retrieved_sources,
            language=language
        )

    def get_report_sources(self, report_id: str) -> List[SourceReference]:
        """Returns the retrieved supporting sources for a report."""
        report = self._reports_store.get(report_id)
        if not report:
            raise ValueError(f"Report '{report_id}' not found.")

        sources_raw = report.get("retrieved_sources", [])
        return [
            SourceReference(
                id=s["id"],
                title=s["title"],
                publisher_or_journal=s.get("publisher_or_journal", "Medical Literature"),
                year=s.get("year"),
                doi_or_url=s.get("doi_or_url"),
                relevant_excerpt=s["relevant_excerpt"],
                similarity_score=s.get("similarity_score", 0.9)
            )
            for s in sources_raw
        ]

    def store_custom_text_report(self, report_id: str, title: str, text: str) -> ReportUploadResponse:
        """Allows directly loading pre-defined synthetic sample reports."""
        sections = medical_nlp.parse_sections(text)
        self._reports_store[report_id] = {
            "report_id": report_id,
            "filename": f"{title}.pdf",
            "file_type": ".pdf",
            "extracted_text": text,
            "page_count": 1,
            "sections": sections,
            "is_raw_image": False,
            "image_safety_warning": None,
            "created_at": time.time(),
            "last_analysis": None,
            "retrieved_sources": []
        }
        return ReportUploadResponse(
            report_id=report_id,
            filename=f"{title}.pdf",
            file_type=".pdf",
            file_size_kb=2.5,
            page_count=1,
            extracted_character_count=len(text),
            raw_text_preview=text[:300],
            detected_sections=[k.capitalize() for k, v in sections.items() if v.strip()],
            is_scanned_ocr=False,
            is_medical_image_only=False,
            warnings=[]
        )

    def _clean_expired_reports(self):
        """Removes reports older than TEMP_FILE_EXPIRY_MINUTES to preserve patient privacy."""
        expiry_seconds = settings.TEMP_FILE_EXPIRY_MINUTES * 60
        now = time.time()
        to_delete = [
            rid for rid, rdata in self._reports_store.items()
            if now - rdata.get("created_at", now) > expiry_seconds
        ]
        for rid in to_delete:
            del self._reports_store[rid]

rag_pipeline = RAGPipeline()
