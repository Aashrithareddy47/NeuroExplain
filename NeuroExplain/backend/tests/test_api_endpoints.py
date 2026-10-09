import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Reusable mock response for deterministic fast tests without burning Gemini quota
MOCK_GEMINI_ANALYSIS = """{
  "patient_summary": "Your Brain MRI report shows mild frontal white matter changes with no acute stroke or hemorrhage.",
  "modality_detected": "Brain Magnetic Resonance Imaging (MRI)",
  "important_findings": [
    {
      "finding_text": "No acute territorial infarction",
      "category": "Normal / Negative (Absent)",
      "is_negated": true,
      "simplified_explanation": "Confirmed Normal: No fresh stroke was identified on the scan."
    }
  ],
  "medical_terms_explained": [
    {
      "original_term": "T2/FLAIR hyperintensities",
      "simplified_explanation": "Small bright spots on the scan.",
      "analogy_or_example": "Like small harmless freckles.",
      "clinical_context": "White matter change"
    }
  ],
  "educational_interpretations": [
    {
      "topic": "White Matter Hyperintensities",
      "explanation": "Common benign spots often seen with age or migraines.",
      "grounded_source_ids": ["KB-WMH-002"]
    }
  ],
  "uncertainties": [
    {
      "uncertainty_description": "Whether findings correlate with current dizziness.",
      "reason_for_uncertainty": "Requires physical clinical exam."
    }
  ],
  "questions_for_doctor": [
    {
      "question": "Do these white matter spots explain my symptoms?",
      "why_to_ask": "To understand relationship with clinical history."
    }
  ],
  "suggested_next_steps": [
    "Follow up with your referring doctor."
  ]
}"""

MOCK_GEMINI_QA = """{
  "answer": "Punctate foci are tiny spots on the scan. They are very common and typically represent minor wear-and-tear changes that do not restrict daily activities.",
  "suggested_followups": [
    "Should I modify my exercise routine?",
    "When should I repeat this scan?"
  ]
}"""

MOCK_GEMINI_SIMPLIFY = """{
  "simplified_explanation": "Tiny bright spots visible on MRI sequences reflecting minor vascular changes.",
  "analogy": "Like small flecks of dust on a windshield."
}"""


def test_health_endpoint():
    """Confirms service health and capability status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "en" in data["supported_languages"]
    assert "te" in data["supported_languages"]
    assert "hi" in data["supported_languages"]


def test_sample_reports_list():
    """Confirms pre-loaded synthetic clinical samples are available."""
    response = client.get("/api/reports/samples")
    assert response.status_code == 200
    samples = response.json()["samples"]
    assert len(samples) >= 4
    sample_ids = [s["id"] for s in samples]
    assert "sample-mri-wmh" in sample_ids
    assert "sample-mri-mass" in sample_ids


def test_sample_load_and_analyze_flow_mocked():
    """Full workflow test with mocked external LLM for fast credit-free execution."""
    with patch("app.services.llm_service.llm_service._generate_with_gemini") as mock_gen:
        mock_gen.side_effect = [
            (MOCK_GEMINI_ANALYSIS, None),    # English analysis
            (MOCK_GEMINI_ANALYSIS, None),    # Telugu analysis
            (MOCK_GEMINI_QA, None),          # Follow-up Q&A
            (MOCK_GEMINI_SIMPLIFY, None)     # Term simplification
        ]

        # 1. Load sample report
        load_res = client.post("/api/reports/sample/sample-mri-wmh/load")
        assert load_res.status_code == 200
        report_data = load_res.json()
        report_id = report_data["report_id"]
        assert report_id is not None
        assert report_data["extracted_character_count"] > 100

        # 2. Analyze report in English
        analyze_res = client.post(
            f"/api/reports/{report_id}/analyze",
            json={"language": "en", "user_notes": "Mild headaches"}
        )
        assert analyze_res.status_code == 200
        analysis = analyze_res.json()
        assert analysis["report_id"] == report_id
        assert analysis["language"] == "en"
        assert len(analysis["important_findings"]) > 0
        assert len(analysis["trusted_sources"]) > 0
        assert analysis["medical_disclaimer"] is not None

        # 3. Analyze report in Telugu
        analyze_res_te = client.post(
            f"/api/reports/{report_id}/analyze",
            json={"language": "te"}
        )
        assert analyze_res_te.status_code == 200
        assert analyze_res_te.json()["language"] == "te"

        # 4. Ask follow-up question
        q_res = client.post(
            f"/api/reports/{report_id}/questions",
            json={"question": "What does punctate foci mean for my daily activities?", "language": "en"}
        )
        assert q_res.status_code == 200
        q_data = q_res.json()
        assert len(q_data["answer"]) > 10
        assert len(q_data["relevant_sources"]) > 0

        # 5. Get sources endpoint
        src_res = client.get(f"/api/reports/{report_id}/sources")
        assert src_res.status_code == 200
        sources = src_res.json()
        assert len(sources) > 0
        assert "title" in sources[0]
        assert "relevant_excerpt" in sources[0]

        # 6. Simplify term endpoint
        term_res = client.post(
            f"/api/reports/{report_id}/simplify-term",
            json={"term": "T2/FLAIR hyperintensities", "language": "en"}
        )
        assert term_res.status_code == 200
        assert "simplified_explanation" in term_res.json()


def test_question_endpoint_validation():
    """Tests question input validation: empty question returns 400, missing report returns 404."""
    # 1. Empty question returns 400
    res_empty = client.post(
        "/api/reports/general/questions",
        json={"question": "   ", "language": "en"}
    )
    assert res_empty.status_code == 400

    # 2. Non-existent report ID returns 404
    res_missing = client.post(
        "/api/reports/nonexistent-report-id-999/questions",
        json={"question": "What is this finding?", "language": "en"}
    )
    assert res_missing.status_code == 404

    # 3. General educational question without report succeeds
    with patch("app.services.llm_service.llm_service._generate_with_gemini") as mock_gen:
        mock_gen.return_value = (MOCK_GEMINI_QA, None)
        res_general = client.post(
            "/api/reports/general/questions",
            json={"question": "What is a tumor?", "language": "en"}
        )
        assert res_general.status_code == 200
        data = res_general.json()
        assert len(data["answer"]) > 10
        assert len(data["relevant_sources"]) > 0
