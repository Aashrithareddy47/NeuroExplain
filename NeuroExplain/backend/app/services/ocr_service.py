"""
OCR and Image Processing Service for NeuroExplain.
Extracts text from scanned report images (JPG, PNG) and differentiates
between text-based neurological reports and raw medical imaging scans (MRI/CT slices).
"""

import os
import re
from typing import Dict, Any, Optional, Tuple
from PIL import Image

class OCRService:
    def __init__(self):
        self._paddle_ocr = None
        self._initialized = False

    def _get_ocr_engine(self):
        """Lazy loader for OCR engine to optimize startup time."""
        if not self._initialized:
            try:
                from paddleocr import PaddleOCR
                # Initialize PaddleOCR with English
                self._paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception:
                # Fallback if PaddleOCR native binaries are unavailable
                self._paddle_ocr = None
            self._initialized = True
        return self._paddle_ocr

    def is_likely_raw_medical_image(self, image_path: str, extracted_text: str) -> Tuple[bool, Optional[str]]:
        """
        Analyzes whether an image is a raw radiographic scan (MRI/CT slice)
        versus a photographed written text report.
        """
        text_clean = extracted_text.strip()
        word_count = len(text_clean.split())
        
        # Medical reports typically have substantial words and common section headings
        report_keywords = [
            "indication", "technique", "findings", "impression", "patient", "mri",
            "ct", "eeg", "emg", "ventricle", "signal", "doctor", "hospital", "clinic",
            "brain", "normal", "abnormal", "scan", "exam", "report", "dr."
        ]
        keyword_hits = sum(1 for kw in report_keywords if kw in text_clean.lower())

        # If very few words or no report structure, check image characteristics
        if word_count < 15 and keyword_hits < 2:
            try:
                with Image.open(image_path) as img:
                    width, height = img.size
                    # Check if grayscale / dark background characteristic of MRI/CT
                    img_gray = img.convert("L")
                    # Sample pixels or average brightness
                    stat = img_gray.resize((50, 50))
                    pixels = list(stat.getdata())
                    avg_brightness = sum(pixels) / len(pixels)
                    
                    # Radiographs often have very dark backgrounds (brightness < 80)
                    if avg_brightness < 100 and word_count < 10:
                        return True, (
                            "Uploaded file appears to be a raw radiographic image (such as an MRI or CT scan slice) "
                            "rather than a written diagnostic text report. NeuroExplain is designed to interpret "
                            "formal written clinical reports and does not diagnose disease directly from medical scan pixels. "
                            "Please upload the written radiologist report document."
                        )
            except Exception:
                pass

        return False, None

    def extract_text_from_image(self, image_path: str) -> Dict[str, Any]:
        """
        Extracts text from image file using PaddleOCR or fallback.
        """
        extracted_lines = []
        engine = self._get_ocr_engine()
        
        if engine:
            try:
                result = engine.ocr(image_path, cls=True)
                if result and result[0]:
                    for line in result[0]:
                        text = line[1][0]
                        confidence = line[1][1]
                        if confidence > 0.4:
                            extracted_lines.append(text)
            except Exception:
                pass

        # Fallback text extraction if OCR engine was unable to load
        if not extracted_lines:
            # Check if PyMuPDF or alternative can inspect
            extracted_lines = []

        combined_text = "\n".join(extracted_lines).strip()
        is_raw_image, warning_msg = self.is_likely_raw_medical_image(image_path, combined_text)

        return {
            "extracted_text": combined_text,
            "character_count": len(combined_text),
            "is_raw_medical_image": is_raw_image,
            "safety_warning": warning_msg,
            "method_used": "PaddleOCR" if engine else "Fallback",
        }

ocr_service = OCRService()
