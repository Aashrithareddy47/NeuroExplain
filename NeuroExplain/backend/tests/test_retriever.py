import pytest
from app.services.retriever import medical_retriever

def test_retriever_initialization_and_search():
    medical_retriever.initialize()
    assert medical_retriever.is_ready is True
    assert medical_retriever.vector_store is not None

    # English retrieval
    results_en = medical_retriever.retrieve("acute ischemic stroke and diffusion restriction", k=2)
    assert len(results_en) > 0
    assert "id" in results_en[0]
    assert "title" in results_en[0]
    assert "relevant_excerpt" in results_en[0]

    # Cross-lingual Telugu retrieval
    results_te = medical_retriever.retrieve("మెదడులో రక్త ప్రసరణ లేదా స్ట్రోక్", k=2)
    assert len(results_te) > 0

    # Cross-lingual Hindi retrieval
    results_hi = medical_retriever.retrieve("स्ट्रोक या इन्फार्क्ट के लक्षण", k=2)
    assert len(results_hi) > 0
