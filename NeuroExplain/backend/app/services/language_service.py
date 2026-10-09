"""
Multilingual Service for NeuroExplain.
Provides language metadata, translations, script prompts, and UI strings
for English (en), Telugu (te), and Hindi (hi).
"""

from typing import Dict, Any, List

SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "font_family": "Inter, sans-serif"
    },
    "te": {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "font_family": "'Noto Sans Telugu', sans-serif"
    },
    "hi": {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "font_family": "'Noto Sans Devanagari', sans-serif"
    }
}

STANDARD_DISCLAIMERS: Dict[str, str] = {
    "en": (
        "Medical Disclaimer: NeuroExplain provides educational explanations of neurological reports "
        "and is not a substitute for formal medical diagnosis or clinical judgment. "
        "Always discuss your report with your treating neurologist or physician before making healthcare decisions."
    ),
    "te": (
        "వైద్య నిరాకరణ (Medical Disclaimer): NeuroExplain న్యూరోలాజికల్ నివేదికల గురించి అవగాహన కోసం మాత్రమే సమాచారాన్ని అందిస్తుంది. "
        "ఇది డాక్టర్ రోగనిర్ధారణ లేదా చికిత్స సలహాకు ప్రత్యామ్నాయం కాదు. ఆరోగ్యపరమైన నిర్ణయాలు తీసుకునే ముందు మీ న్యూరాలజిస్ట్‌తో తప్పక చర్చించండి."
    ),
    "hi": (
        "चिकित्सा अस्वीकरण (Medical Disclaimer): NeuroExplain न्यूरोलॉजिकल रिपोर्ट को समझने के लिए केवल शैक्षिक जानकारी प्रदान करता है। "
        "यह किसी डॉक्टर के निदान या चिकित्सकीय परामर्श का विकल्प नहीं है। कोई भी निर्णय लेने से पहले अपने न्यूरोलॉजिस्ट या चिकित्सक से परामर्श अवश्य करें।"
    )
}

LANGUAGE_INSTRUCTIONS: Dict[str, str] = {
    "en": (
        "Respond in clear, compassionate, patient-friendly English. "
        "Use everyday words and relatable analogies for complex medical terms."
    ),
    "te": (
        "మీ సమాధానాన్ని సహజమైన, స్పష్టమైన మరియు సులభంగా అర్థమయ్యే తెలుగులో (Telugu script) అందించండి. "
        "సాధారణ ప్రజలు అర్థం చేసుకునే రోజువారీ ఉపమానాలను ఉపయోగించండి. ముఖ్యమైన ఇంగ్లీష్ వైద్య పదాలను బ్రాకెట్లలో ఉంచవచ్చు."
    ),
    "hi": (
        "अपना उत्तर सरल, स्पष्ट और सहज हिंदी (Devanagari script) में दें। "
        "कठिन चिकित्सीय शब्दों को आम बोलचाल के उदाहरणों से समझाएं। आवश्यक होने पर अंग्रेजी चिकित्सा शब्दों को कोष्ठक में लिख सकते हैं।"
    )
}

class LanguageService:
    @staticmethod
    def get_supported_languages() -> List[str]:
        return list(SUPPORTED_LANGUAGES.keys())

    @staticmethod
    def get_disclaimer(lang_code: str = "en") -> str:
        return STANDARD_DISCLAIMERS.get(lang_code, STANDARD_DISCLAIMERS["en"])

    @staticmethod
    def get_language_prompt_instruction(lang_code: str = "en") -> str:
        return LANGUAGE_INSTRUCTIONS.get(lang_code, LANGUAGE_INSTRUCTIONS["en"])

    @staticmethod
    def normalize_lang_code(code: str) -> str:
        code_clean = (code or "en").lower().strip()
        if code_clean.startswith("te") or "telugu" in code_clean:
            return "te"
        if code_clean.startswith("hi") or "hindi" in code_clean:
            return "hi"
        return "en"

language_service = LanguageService()
