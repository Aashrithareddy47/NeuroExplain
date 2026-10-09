"""
Document Processor Service for NeuroExplain.
Extracts text from PDF and Image neurological reports using PyMuPDF and OCR.
Preserves page numbers, checks text density, and enforces security & privacy policies.
"""

import os
import re
import uuid
import fitz  # PyMuPDF
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from app.config import settings

class DocumentProcessor:
    def __init__(self, uploads_dir: Optional[str] = None):
        self.uploads_dir = uploads_dir or settings.UPLOADS_DIR
        os.makedirs(self.uploads_dir, exist_ok=True)

    def validate_file(self, filename: str, file_size_bytes: int) -> Tuple[bool, Optional[str]]:
        """Validates file extension and size."""
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size_bytes > max_bytes:
            return False, f"File size ({file_size_bytes / (1024 * 1024):.1f}MB) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB."
        
        return True, None

    def save_upload_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        """Saves uploaded bytes to a temporary UUID-named file."""
        report_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        temp_filename = f"{report_id}{ext}"
        temp_path = os.path.join(self.uploads_dir, temp_filename)
        
        with open(temp_path, "wb") as f:
            f.write(file_bytes)
            
        return report_id, temp_path

    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Extracts text from PDF using PyMuPDF.
        Detects if pages are scanned (low text yield) to trigger OCR.
        """
        doc = fitz.open(file_path)
        page_count = len(doc)
        full_text_list = []
        pages_data = []
        total_chars = 0
        has_scanned_pages = False

        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text("text").strip()
            char_count = len(text)
            total_chars += char_count
            
            # If text is extremely short for a full page, it could be a scanned image
            is_scanned = char_count < 50
            if is_scanned:
                has_scanned_pages = True

            pages_data.append({
                "page_number": page_num + 1,
                "text": text,
                "character_count": char_count,
                "is_likely_scanned": is_scanned
            })
            if text:
                full_text_list.append(f"--- PAGE {page_num + 1} ---\n{text}")

        doc.close()
        combined_text = "\n\n".join(full_text_list).strip()

        return {
            "page_count": page_count,
            "total_character_count": total_chars,
            "pages": pages_data,
            "extracted_text": combined_text,
            "is_scanned": has_scanned_pages and total_chars < 100,
        }

    def cleanup_file(self, file_path: str) -> bool:
        """Safely removes temporary report file to preserve patient privacy."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception:
            pass
        return False

document_processor = DocumentProcessor()
