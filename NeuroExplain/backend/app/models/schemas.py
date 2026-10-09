from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MedicalTermExplanation(BaseModel):
    original_term: str = Field(..., description="The original medical or anatomical term")
    simplified_explanation: str = Field(..., description="Plain-language explanation for patients with everyday words")
    analogy_or_example: Optional[str] = Field(None, description="A relatable everyday analogy or real-life comparison")
    clinical_context: Optional[str] = Field(None, description="What this term specifically relates to in the report")

class ReportFinding(BaseModel):
    finding_text: str = Field(..., description="The finding as stated or closely preserved from the report")
    category: str = Field("Key Finding", description="Category: Normal, Key Finding, Incidental Finding, Negated Finding")
    is_negated: bool = Field(False, description="True if the finding explicitly states absence (e.g. 'No infarct')")
    simplified_explanation: str = Field(..., description="Simple patient-friendly explanation preserving medical accuracy")

class EducationalInterpretation(BaseModel):
    topic: str = Field(..., description="Topic area (e.g. Frontal Lobe White Matter, Posterior Alpha Rhythm)")
    explanation: str = Field(..., description="Educational explanation grounded in verified clinical guidelines")
    grounded_source_ids: List[str] = Field(default_factory=list, description="IDs of literature sources supporting this")

class UncertaintyItem(BaseModel):
    uncertainty_description: str = Field(..., description="Aspect that cannot be definitively determined from text alone")
    reason_for_uncertainty: str = Field(..., description="Why further clinical evaluation or comparison is required")

class DoctorQuestion(BaseModel):
    question: str = Field(..., description="Actionable question the patient can ask their neurologist/doctor")
    why_to_ask: str = Field(..., description="Reason why this question is helpful for the patient's care")

class SourceReference(BaseModel):
    id: str = Field(..., description="Unique identifier for the reference document")
    title: str = Field(..., description="Title of the clinical guideline, study, or textbook")
    publisher_or_journal: str = Field(..., description="Publisher or journal (e.g., Stroke / AHA, AAN, NINDS, PubMed)")
    year: Optional[int] = Field(None, description="Publication year")
    doi_or_url: Optional[str] = Field(None, description="DOI link, PubMed URL, or clinical guideline portal")
    relevant_excerpt: str = Field(..., description="Passage from literature retrieved and used as evidence")
    similarity_score: Optional[float] = Field(None, description="Vector similarity / relevance score")

class ReportAnalysisResponse(BaseModel):
    report_id: str
    language: str = Field("en", description="Language code: en, te, hi")
    patient_summary: str = Field(..., description="Accessible 2-3 paragraph overview of the report for the patient")
    modality_detected: str = Field("Brain MRI", description="Imaging/Test modality detected (e.g. MRI, EEG, EMG/NCS, CT)")
    is_medical_image_only: bool = Field(False, description="True if raw medical scan was uploaded without written report")
    image_safety_warning: Optional[str] = Field(None, description="Mandatory safety advisory if medical scan image is detected")
    important_findings: List[ReportFinding] = Field(default_factory=list)
    medical_terms_explained: List[MedicalTermExplanation] = Field(default_factory=list)
    educational_interpretations: List[EducationalInterpretation] = Field(default_factory=list)
    uncertainties: List[UncertaintyItem] = Field(default_factory=list)
    questions_for_doctor: List[DoctorQuestion] = Field(default_factory=list)
    trusted_sources: List[SourceReference] = Field(default_factory=list)
    suggested_next_steps: List[str] = Field(default_factory=list)
    medical_disclaimer: str = Field(..., description="Standard medical disclaimer for patient safety")
    analysis_timestamp: str

class ReportAnalysisRequest(BaseModel):
    language: str = Field("en", description="Language code: en (English), te (Telugu), hi (Hindi)")
    user_notes: Optional[str] = Field(None, description="Optional patient symptom notes or specific concerns")

class FollowUpQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Patient's follow-up question")
    language: str = Field("en", description="Target language: en, te, hi")

class FollowUpQuestionResponse(BaseModel):
    report_id: str
    question: str
    answer: str
    language: str
    relevant_sources: List[SourceReference] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)

class SimplifyTermRequest(BaseModel):
    term: str
    context: Optional[str] = None
    language: str = "en"

class SimplifyTermResponse(BaseModel):
    term: str
    simplified_explanation: str
    analogy: str
    language: str

class ReportUploadResponse(BaseModel):
    report_id: str
    filename: str
    file_type: str
    file_size_kb: float
    page_count: int
    extracted_character_count: int
    raw_text_preview: str
    detected_sections: List[str]
    is_scanned_ocr: bool
    is_medical_image_only: bool
    warnings: List[str] = Field(default_factory=list)

class SampleReportItem(BaseModel):
    id: str
    title: str
    modality: str
    description: str
    file_name: str
    has_pre_extracted_text: bool = True

class SampleReportsListResponse(BaseModel):
    samples: List[SampleReportItem]

class HealthResponse(BaseModel):
    status: str
    version: str
    rag_index_ready: bool
    gemini_configured: bool
    supported_languages: List[str]
