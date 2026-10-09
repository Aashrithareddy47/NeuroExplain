"""
Medical NLP Module for NeuroExplain.
Performs clinical text normalization, report section parsing, negation detection,
uncertainty extraction, and medical terminology recognition.
"""

import re
from typing import Dict, Any, List, Tuple, Optional

# Common neurological section header patterns
SECTION_PATTERNS = {
    "indication": r"(?:CLINICAL\s+(?:INDICATION|HISTORY|INFORMATION)|REASON\s+FOR\s+EXAM(?:INATION)?|HISTORY):?",
    "technique": r"(?:TECHNIQUE|PROCEDURE|METHODOLOGY|SEQUENCES|PROTOCOL):?",
    "findings": r"(?:FINDINGS|OBSERVATIONS|EXAMINATION|STUDY\s+RESULTS):?",
    "impression": r"(?:IMPRESSION|CONCLUSION|DIAGNOSTIC\s+IMPRESSION|SUMMARY|RECOMMENDATION[S]?):?",
    "eeg_background": r"(?:BACKGROUND|RESTING\s+BACKGROUND):?",
    "eeg_activation": r"(?:ACTIVATION\s+PROCEDURES?|HYPERVENTILATION|PHOTIC\s+STIMULATION):?",
    "emg_nerve_conduction": r"(?:NERVE\s+CONDUCTION\s+STUDIES|NCS):?",
    "emg_needle": r"(?:NEEDLE\s+ELECTROMYOGRAPHY|NEEDLE\s+EMG|EMG\s+EXAMINATION):?",
}

# Negation trigger patterns in clinical text
NEGATION_PATTERNS = [
    r"\bno\s+evidence\s+of\b",
    r"\bno\s+acute\b",
    r"\bno\s+definite\b",
    r"\bnegative\s+for\b",
    r"\bwithout(?:\s+any|\s+evidence\s+of)?\b",
    r"\bfree\s+of\b",
    r"\bruled\s+out\b",
    r"\bnot\s+(?:seen|identified|present|observed|noted)\b",
    r"\babsent\b",
    r"\bunremarkable\b",
    r"\bwithin\s+normal\s+limits\b",
    r"\bno\s+focal\b",
    r"\bno\s+intracranial\b",
    r"\bno\s+diffusion\s+restriction\b",
]

# Uncertainty trigger patterns in clinical text
UNCERTAINTY_PATTERNS = [
    r"\bnon-specific\b",
    r"\bcannot\s+be\s+(?:excluded|ruled\s+out)\b",
    r"\bpossible\b",
    r"\bprobable\b",
    r"\bquestionable\b",
    r"\bequivocal\b",
    r"\bdifferential\s+(?:diagnosis\s+)?includes\b",
    r"\bclinical\s+correlation\s+(?:is\s+)?recommended\b",
    r"\bsuggestive\s+of\b",
    r"\bindeterminate\b",
]

# Medical Terminology Dictionary for instant rule-based enrichment & fallback explanations
KNOWN_MEDICAL_TERMS: Dict[str, Dict[str, str]] = {
    "t2/flair hyperintensities": {
        "simple": "Small bright spots on the MRI scan in the brain's wiring (white matter).",
        "analogy": "Like tiny areas of wear and tear or microscopic scuffs on insulation wire, commonly seen with aging, headaches, or mild blood pressure changes.",
        "category": "Imaging Finding"
    },
    "diffusion-weighted imaging (dwi)": {
        "simple": "A sensitive MRI sequence that tracks water movement in brain cells to spot acute stroke within minutes.",
        "analogy": "Like a high-speed motion detector that flashes bright when brain cells swell from sudden blood supply loss.",
        "category": "MRI Sequence"
    },
    "no diffusion restriction": {
        "simple": "Water is moving freely in brain tissue, which confirms NO sudden fresh stroke or acute cell death.",
        "analogy": "Like water flowing smoothly through pipes without any fresh blockages.",
        "category": "Normal / Reassuring"
    },
    "mass effect": {
        "simple": "Pressure or pushing by a swelling or lump on nearby brain structures.",
        "analogy": "Like a small balloon gently pressing against adjacent soft cushions.",
        "category": "Structural Feature"
    },
    "midline shift": {
        "simple": "The central divider dividing the two brain halves has been pushed to one side.",
        "analogy": "Like the central partition wall of a house being pushed off-center by uneven pressure.",
        "category": "Structural Feature"
    },
    "posterior alpha rhythm": {
        "simple": "The normal, healthy brainwave pattern that appears at the back of the head when resting with eyes closed.",
        "analogy": "Like an engine idling smoothly and peacefully when the car is parked.",
        "category": "EEG Rhythm"
    },
    "epileptiform discharges": {
        "simple": "Abnormal sudden electrical spikes on an EEG that may indicate a tendency toward seizures.",
        "analogy": "Like unexpected static sparks or electrical surges in a power grid.",
        "category": "EEG Finding"
    },
    "carpal tunnel syndrome": {
        "simple": "Pinching or compression of the median nerve as it passes through the wrist into the hand.",
        "analogy": "Like stepping on a garden hose, slowing down the flow of nerve signals to the thumb and fingers.",
        "category": "Neuromuscular"
    },
    "distal latency": {
        "simple": "The time it takes for an electrical pulse to travel along a nerve from the wrist to the finger or muscle.",
        "analogy": "Like the delivery time of a message; a longer delay means the nerve path has some resistance.",
        "category": "NCS Parameter"
    },
    "mucosal thickening": {
        "simple": "Mild swelling of the lining inside the sinuses, commonly due to colds or allergies.",
        "analogy": "Like a mildly stuffy nose lining after seasonal pollen exposure.",
        "category": "Incidental Finding"
    },
    "ventricles": {
        "simple": "Fluid-filled chambers in the center of the brain that produce and hold cerebrospinal fluid.",
        "analogy": "Like internal shock absorbers and freshwater reservoirs that cushion the brain.",
        "category": "Anatomy"
    }
}

class MedicalNLP:
    def __init__(self):
        self.negation_regex = re.compile("|".join(NEGATION_PATTERNS), re.IGNORECASE)
        self.uncertainty_regex = re.compile("|".join(UNCERTAINTY_PATTERNS), re.IGNORECASE)

    def clean_and_normalize(self, text: str) -> str:
        """Cleans and standardizes raw extracted text."""
        # Replace multiple spaces / tabs with single space
        text = re.sub(r"[ \t]+", " ", text)
        # Standardize linebreaks
        text = re.sub(r"\r\n|\r", "\n", text)
        # Remove repeated empty lines (>2)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def parse_sections(self, text: str) -> Dict[str, str]:
        """Splits report text into structured sections."""
        normalized = self.clean_and_normalize(text)
        sections: Dict[str, str] = {
            "indication": "",
            "technique": "",
            "findings": "",
            "impression": "",
            "other": ""
        }

        # Build composite split pattern
        pattern_str = r"(?=(?:^|\n)\s*(?:" + "|".join(
            [f"(?P<{k}>{pat})" for k, pat in SECTION_PATTERNS.items()]
        ) + "))"

        chunks = re.split(pattern_str, normalized, flags=re.IGNORECASE | re.MULTILINE)
        
        current_section = "other"
        for chunk in chunks:
            if not chunk or not chunk.strip():
                continue
            chunk_clean = chunk.strip()
            
            # Check if this chunk starts with a recognized section header
            matched_sec = None
            for sec_name, sec_regex in SECTION_PATTERNS.items():
                if re.match(r"^" + sec_regex, chunk_clean, re.IGNORECASE):
                    matched_sec = sec_name
                    # Remove the header text itself
                    chunk_clean = re.sub(r"^" + sec_regex, "", chunk_clean, flags=re.IGNORECASE).strip()
                    break
            
            if matched_sec:
                # Map subheadings to standard buckets
                if matched_sec in ["eeg_background", "eeg_activation", "emg_nerve_conduction", "emg_needle"]:
                    current_section = "findings"
                else:
                    current_section = matched_sec
                sections[current_section] = (sections.get(current_section, "") + "\n" + chunk_clean).strip()
            else:
                sections[current_section] = (sections.get(current_section, "") + "\n" + chunk_clean).strip()

        # If findings and impression were not explicitly detected, keep full text in findings
        if not sections["findings"] and not sections["impression"]:
            sections["findings"] = normalized

        return sections

    def check_negation(self, sentence: str) -> bool:
        """Returns True if the sentence or finding explicitly contains a negation."""
        return bool(self.negation_regex.search(sentence))

    def check_uncertainty(self, sentence: str) -> bool:
        """Returns True if the sentence expresses medical uncertainty or non-specificity."""
        return bool(self.uncertainty_regex.search(sentence))

    def extract_findings_list(self, findings_text: str, impression_text: str) -> List[Dict[str, Any]]:
        """
        Extracts individual finding items, classifies their negation status,
        and ensures no inverted meanings.
        """
        combined = f"{findings_text}\n{impression_text}".strip()
        lines = re.split(r"\n|(?<=[.!?])\s+(?=[A-Z0-9])", combined)
        findings = []

        for raw_line in lines:
            line = raw_line.strip()
            # Ignore short junk lines or pure numbers
            if len(line) < 10 or line.isdigit():
                continue
            # Remove leading numbering like "1. ", "2. ", "- "
            clean_line = re.sub(r"^[\d\.\-\*\•\)]+\s*", "", line).strip()
            if not clean_line:
                continue

            is_neg = self.check_negation(clean_line)
            is_unc = self.check_uncertainty(clean_line)

            category = "Key Finding"
            if is_neg:
                category = "Normal / Negative (Absent)"
            elif is_unc:
                category = "Uncertain / Non-Specific"
            elif any(w in clean_line.lower() for w in ["normal", "symmetric", "unremarkable", "preserved"]):
                category = "Normal"

            findings.append({
                "finding_text": clean_line,
                "is_negated": is_neg,
                "is_uncertain": is_unc,
                "category": category
            })

        return findings[:10]  # Return top 10 relevant items

    def match_known_terms(self, text: str) -> List[Dict[str, str]]:
        """Finds known medical terms mentioned in the text."""
        text_lower = text.lower()
        matched = []
        for term, info in KNOWN_MEDICAL_TERMS.items():
            if term in text_lower:
                matched.append({
                    "original_term": term.title(),
                    "simplified_explanation": info["simple"],
                    "analogy_or_example": info["analogy"],
                    "clinical_context": info["category"]
                })
        return matched

medical_nlp = MedicalNLP()
