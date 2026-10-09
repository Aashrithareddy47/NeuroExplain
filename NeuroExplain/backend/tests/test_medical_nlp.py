import pytest
from app.services.medical_nlp import medical_nlp

def test_negation_preservation():
    # Strict test: Negated findings must be recognized as negative/absent
    negated_sentences = [
        "No evidence of an acute territorial infarct.",
        "No intracranial hemorrhage or mass effect.",
        "Without any focal diffusion restriction.",
        "Negative for acute intracranial pathology.",
        "Ventricles are unremarkable."
    ]
    for sent in negated_sentences:
        assert medical_nlp.check_negation(sent) is True, f"Failed to detect negation in: {sent}"

    positive_sentences = [
        "Punctate foci of T2/FLAIR hyperintensity in the frontal lobes.",
        "2.4 cm avidly enhancing right frontal extra-axial mass.",
        "Prolonged distal motor latency of the median nerve."
    ]
    for sent in positive_sentences:
        assert medical_nlp.check_negation(sent) is False, f"False positive negation in: {sent}"

def test_section_parsing():
    sample_text = """
    CLINICAL INDICATION:
    48-year-old female with tension headaches.
    
    TECHNIQUE:
    MRI brain 3.0T without contrast.
    
    FINDINGS:
    Scattered punctate foci of high T2/FLAIR signal intensity in frontal lobes.
    No diffusion restriction.
    
    IMPRESSION:
    1. No acute territorial infarction.
    2. Chronic microvascular ischemic changes.
    """
    sections = medical_nlp.parse_sections(sample_text)
    assert "tension headaches" in sections["indication"]
    assert "without contrast" in sections["technique"]
    assert "Scattered punctate foci" in sections["findings"]
    assert "No acute territorial infarction" in sections["impression"]

def test_medical_terminology_matching():
    text = "Report demonstrates punctate T2/FLAIR hyperintensities and normal ventricles."
    terms = medical_nlp.match_known_terms(text)
    term_names = [t["original_term"].lower() for t in terms]
    assert any("t2/flair hyperintensities" in t for t in term_names)
    assert any("ventricles" in t for t in term_names)
