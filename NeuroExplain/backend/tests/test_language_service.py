import pytest
from app.services.language_service import language_service, SUPPORTED_LANGUAGES

def test_supported_languages():
    langs = language_service.get_supported_languages()
    assert "en" in langs
    assert "te" in langs
    assert "hi" in langs

def test_disclaimers():
    for lang in ["en", "te", "hi"]:
        disclaimer = language_service.get_disclaimer(lang)
        assert len(disclaimer) > 20
        assert "Disclaimer" in disclaimer or "నిరాకరణ" in disclaimer or "अस्वीकरण" in disclaimer

def test_language_normalization():
    assert language_service.normalize_lang_code("en") == "en"
    assert language_service.normalize_lang_code("Telugu") == "te"
    assert language_service.normalize_lang_code("hindi") == "hi"
    assert language_service.normalize_lang_code("unknown") == "en"
