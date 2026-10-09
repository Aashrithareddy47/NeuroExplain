import os
import pytest
from app.services.document_processor import document_processor
from reportlab.pdfgen import canvas

def create_temp_pdf(path: str, text_lines: list):
    c = canvas.Canvas(path)
    c.drawString(100, 750, "METROPOLITAN NEUROLOGICAL INSTITUTE")
    y = 700
    for line in text_lines:
        c.drawString(100, y, line)
        y -= 25
    c.save()

def test_file_validation():
    # Valid PDF
    valid, err = document_processor.validate_file("report.pdf", 1024 * 1024)
    assert valid is True
    assert err is None

    # Invalid extension
    valid, err = document_processor.validate_file("report.exe", 1024)
    assert valid is False
    assert "Unsupported file extension" in err

    # Exceeds max size
    valid, err = document_processor.validate_file("large.pdf", 50 * 1024 * 1024)
    assert valid is False
    assert "exceeds maximum limit" in err

def test_pdf_extraction_and_cleanup(tmp_path):
    pdf_path = str(tmp_path / "test_report.pdf")
    create_temp_pdf(pdf_path, [
        "FINDINGS: Normal brain parenchyma without acute infarct.",
        "IMPRESSION: No evidence of intracranial hemorrhage."
    ])

    # Extract text using PyMuPDF
    res = document_processor.extract_text_from_pdf(pdf_path)
    assert res["page_count"] == 1
    assert "Normal brain parenchyma" in res["extracted_text"]
    assert "No evidence of intracranial hemorrhage" in res["extracted_text"]

    # Test file cleanup for patient privacy
    cleanup_success = document_processor.cleanup_file(pdf_path)
    assert cleanup_success is True
    assert not os.path.exists(pdf_path)
