import os
import json
import pytest
from unittest.mock import MagicMock, patch

from app.services.llm_service import LLMService
from app.models.schemas import ReportAnalysisResponse, FollowUpQuestionResponse, SimplifyTermResponse


def test_gemini_client_initialization_missing_key():
    """Gemini initialization reports missing API key without exposing secrets."""
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
        service = LLMService()
        service.api_key = ""
        service._initialize_gemini()
        assert service.is_configured() is False
        assert "not configured" in service.get_last_error_detail().lower()


def test_gemini_client_initialization_placeholder_key():
    """Placeholder keys are recognized as not configured."""
    service = LLMService()
    service.api_key = "your_gemini_api_key_here"
    service._initialize_gemini()
    assert service.is_configured() is False


def test_gemini_successful_generation():
    """Mocked successful Gemini response generates structured response."""
    service = LLMService()
    service.client = MagicMock()
    service._configured = True

    mock_response = MagicMock()
    mock_response.text = json.dumps({"status": "ok", "message": "hello"})
    service.client.models.generate_content.return_value = mock_response

    output, err = service._generate_with_gemini("test prompt", response_mime_type="application/json")
    assert err is None
    assert output is not None
    assert json.loads(output)["status"] == "ok"


def test_gemini_timeout_handling():
    """Simulated Gemini timeout (504) is handled gracefully with clear reporting."""
    from google.genai import errors

    service = LLMService()
    service.client = MagicMock()
    service._configured = True

    # Simulate 504 Deadline Exceeded ServerError
    mock_server_error = errors.ServerError(504, {}, MagicMock())
    service.client.models.generate_content.side_effect = mock_server_error

    output, err = service._generate_with_gemini("test prompt", max_retries=0)
    assert output is None
    assert err is not None
    assert "504" in err or "timed out" in err.lower() or "deadline" in err.lower()

    # Verify follow-up question handles timeout without crashing
    qa_res = service.answer_followup_question(
        report_id="test-123",
        report_text="Sample report text",
        question="What is a tumor?",
        retrieved_sources=[]
    )
    assert isinstance(qa_res, FollowUpQuestionResponse)
    assert len(qa_res.answer) > 20
    assert "tumor" in qa_res.answer.lower()


def test_gemini_quota_rate_limit_handling():
    """Simulated 429 Resource Exhausted is caught and categorized without retrying."""
    from google.genai import errors

    service = LLMService()
    service.client = MagicMock()
    service._configured = True

    mock_client_error = errors.ClientError(429, {"error": {"message": "RESOURCE_EXHAUSTED"}}, MagicMock())
    service.client.models.generate_content.side_effect = mock_client_error

    output, err = service._generate_with_gemini("test prompt", max_retries=0)
    assert output is None
    assert err is not None
    assert "429" in err or "quota" in err.lower()


def test_gemini_malformed_json_fallback():
    """Malformed non-JSON AI output falls back safely to deterministic response."""
    service = LLMService()
    service.client = MagicMock()
    service._configured = True

    mock_response = MagicMock()
    mock_response.text = "This is NOT json content at all! {broken..."
    service.client.models.generate_content.return_value = mock_response

    res = service.generate_report_analysis(
        report_id="test-rep",
        report_text="Report with no acute infarct or hemorrhage.",
        sections={"impression": "No acute infarct."},
        nlp_findings=[{"finding_text": "No acute infarct", "is_negated": True, "category": "Normal"}],
        nlp_terms=[],
        retrieved_sources=[]
    )
    assert isinstance(res, ReportAnalysisResponse)
    assert res.patient_summary is not None
    assert len(res.important_findings) > 0
