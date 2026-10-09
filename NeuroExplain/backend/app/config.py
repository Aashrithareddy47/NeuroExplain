import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Enable fast offline loading for cached Hugging Face models
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

BASE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_BASE_DIR = BASE_DIR.parent / "knowledge_base" / "documents"

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroExplain"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Multilingual Embeddings & Vector DB
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    FAISS_INDEX_DIR: str = str(BASE_DIR / "faiss_index")
    KNOWLEDGE_BASE_DOCS_DIR: str = str(KNOWLEDGE_BASE_DIR)
    
    # Temporary files & storage
    UPLOADS_DIR: str = str(BASE_DIR / "temp_uploads")
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg"}
    TEMP_FILE_EXPIRY_MINUTES: int = int(os.getenv("TEMP_FILE_EXPIRY_MINUTES", "30"))
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)
os.makedirs(settings.KNOWLEDGE_BASE_DOCS_DIR, exist_ok=True)
