import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "en" in data["supported_languages"]
    assert "te" in data["supported_languages"]
    assert "hi" in data["supported_languages"]

def test_sample_reports_list():
    response = client.get("/api/reports/samples")
    assert response.status_code == 200
    samples = response.json()["samples"]
    assert len(samples) >= 4
    sample_ids = [s["id"] for s in samples]
    assert "sample-mri-wmh" in sample_ids
    assert "sample-mri-mass" in sample_ids

def test_sample_load_and_analyze_flow():
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
