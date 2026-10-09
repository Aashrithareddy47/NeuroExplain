"""
FastAPI Routes for NeuroExplain.
Provides endpoints for health check, report upload, analysis, follow-up Q&A, and sample loading.
"""

from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from app.models.schemas import (
    HealthResponse,
    ReportUploadResponse,
    ReportAnalysisRequest,
    ReportAnalysisResponse,
    FollowUpQuestionRequest,
    FollowUpQuestionResponse,
    SimplifyTermRequest,
    SimplifyTermResponse,
    SourceReference,
    SampleReportsListResponse,
    SampleReportItem
)
from app.services.rag_pipeline import rag_pipeline
from app.services.document_processor import document_processor
from app.services.llm_service import llm_service
from app.services.retriever import medical_retriever
from app.services.language_service import language_service
from app.services.sample_data_service import get_all_sample_reports, get_sample_report_by_id
from app.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Service health and RAG readiness check."""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        rag_index_ready=medical_retriever.is_ready,
        gemini_configured=llm_service.is_configured(),
        supported_languages=language_service.get_supported_languages()
    )

@router.post("/api/reports/upload", response_model=ReportUploadResponse)
async def upload_report(
    file: UploadFile = File(...)
):
    """
    Upload and validate a neurological report (PDF, PNG, JPG, JPEG).
    Extracts text, parses sections, and stores in temporary session memory.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file was provided.")

    contents = await file.read()
    valid, err_msg = document_processor.validate_file(file.filename, len(contents))
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    import uuid
    report_id = str(uuid.uuid4())
    
    try:
        upload_resp = rag_pipeline.process_and_store_upload(
            report_id=report_id,
            filename=file.filename,
            file_bytes=contents
        )
        return upload_resp
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the document: {str(e)}"
        )

@router.post("/api/reports/{report_id}/analyze", response_model=ReportAnalysisResponse)
async def analyze_report(
    report_id: str,
    request: ReportAnalysisRequest
):
    """
    Executes the full NLP + RAG + LLM analysis pipeline.
    Grounds findings in clinical literature and generates structured output in EN, TE, or HI.
    """
    try:
        response = rag_pipeline.analyze_report(
            report_id=report_id,
            language=request.language,
            user_notes=request.user_notes
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )

@router.post("/api/reports/{report_id}/questions", response_model=FollowUpQuestionResponse)
async def ask_followup_question(
    report_id: str,
    request: FollowUpQuestionRequest
):
    """
    Answers a patient follow-up question in the context of the report and retrieved medical evidence.
    """
    try:
        response = rag_pipeline.answer_question(
            report_id=report_id,
            question=request.question,
            language=request.language
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating answer: {str(e)}"
        )

@router.get("/api/reports/{report_id}/sources", response_model=List[SourceReference])
async def get_report_sources(report_id: str):
    """Returns verified PubMed / clinical literature sources supporting the analysis."""
    try:
        return rag_pipeline.get_report_sources(report_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/api/reports/{report_id}/simplify-term", response_model=SimplifyTermResponse)
async def simplify_medical_term(
    report_id: str,
    request: SimplifyTermRequest
):
    """Explains a single medical term in extra-simple terms with an everyday analogy."""
    try:
        return llm_service.simplify_term(
            term=request.term,
            context=request.context,
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/reports/samples", response_model=SampleReportsListResponse)
async def list_sample_reports():
    """Lists pre-configured synthetic sample neurological reports for instant testing."""
    samples = get_all_sample_reports()
    return SampleReportsListResponse(
        samples=[
            SampleReportItem(
                id=s["id"],
                title=s["title"],
                modality=s["modality"],
                description=s["description"],
                file_name=s["file_name"]
            )
            for s in samples
        ]
    )

@router.post("/api/reports/sample/{sample_id}/load", response_model=ReportUploadResponse)
async def load_sample_report(sample_id: str):
    """Loads a pre-configured synthetic sample report directly into active session."""
    try:
        sample = get_sample_report_by_id(sample_id)
        import uuid
        report_id = f"sample-{uuid.uuid4().hex[:8]}"
        return rag_pipeline.store_custom_text_report(
            report_id=report_id,
            title=sample["title"],
            text=sample["text"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
