export const translations = {
  en: {
    appTitle: "NeuroExplain",
    tagline: "Patient Neurological Report Portal",
    navHome: "Home",
    navUpload: "Analyze Report",
    navHowItWorks: "How It Works",
    navPrivacy: "Privacy & Safety",
    emergencyAlert: "For acute medical emergencies, call emergency services (112 / 911) immediately.",
    
    // Hero
    heroHeading: "Understand Your Neurological Report",
    heroSubtitle: "Clear, compassionate explanations of your Brain MRI, EEG, and EMG reports in everyday words you understand.",
    primaryCta: "Upload Your Report",
    orTrySample: "Or try a sample clinical report",
    
    // Steps
    step1Title: "1. Upload Report",
    step1Desc: "Upload your PDF or scanned report. Your document stays confidential and temporary.",
    step2Title: "2. Understand Plainly",
    step2Desc: "Read plain-language summaries, medical term analogies, and evidence-grounded insights.",
    step3Title: "3. Discuss With Doctor",
    step3Desc: "Take personalized, actionable questions to your next neurology consultation.",

    // Upload Box
    uploadHeader: "Upload Neurological Report",
    uploadSubtitle: "Supports PDF, JPG, and PNG documents up to 15MB",
    dragDropText: "Drag and drop your report here, or",
    browseButton: "Browse Files",
    targetLanguageLabel: "Select Explanation Language:",
    analyzeButton: "Analyze Report",
    analyzingButton: "Analyzing Report...",
    sampleReportsLabel: "Sample Reports for Demonstration:",
    selectSamplePlaceholder: "-- Choose a synthetic clinical case --",
    sampleMriWmh: "Brain MRI — White Matter Changes & Migraines",
    sampleMriMass: "Brain MRI — Suspected Mass (Safety Protocol Case)",
    sampleEeg: "EEG — Routine Awake & Drowsy Study",
    sampleEmg: "EMG/NCS — Carpal Tunnel Syndrome",
    
    // Progress Steps
    statusExtracting: "Reading document and extracting text...",
    statusParsing: "Identifying clinical sections and preserving negative findings...",
    statusRetrieving: "Retrieving verified PubMed guidelines via FAISS...",
    statusGenerating: "Generating grounded explanation in your language...",
    
    // Results Dashboard
    resultsHeader: "Report Explanation",
    detectedModality: "Test Type:",
    analysisDate: "Analyzed on:",
    switchLanguage: "Change Explanation Language:",
    
    tabSummary: "Summary",
    tabFindings: "Findings",
    tabTerms: "Medical Terms",
    tabMeaning: "What It Means",
    tabUncertain: "Uncertainties",
    tabDoctorQuestions: "Questions for Doctor",
    tabSources: "Trusted Sources",
    tabChat: "Ask Questions",

    sectionSummaryTitle: "A. Report Summary",
    sectionFindingsTitle: "B. Important Findings",
    sectionTermsTitle: "C. Medical Terms Explained",
    sectionMeaningTitle: "D. What These Findings May Mean",
    sectionUncertainTitle: "E. What Is Uncertain",
    sectionDoctorQuestionsTitle: "F. Questions for Your Doctor",
    sectionSourcesTitle: "G. Trusted Clinical Sources",
    sectionNextStepsTitle: "H. Suggested Next Steps",

    simplifyButton: "Explain More Simply",
    simplifiedHeading: "Super-Simple Analogy:",
    negatedBadge: "Absent / Reassuring (Negative)",
    keyFindingBadge: "Key Finding",
    normalBadge: "Normal",
    incidentalBadge: "Incidental / Non-Critical",

    // Follow Up Chat
    chatHeader: "Ask a Follow-Up Question",
    chatPlaceholder: "Ask anything about your report (e.g., 'What does punctate foci mean?')...",
    sendButton: "Ask",
    suggestedQuestionsLabel: "Suggested questions:",
    noQuestionsYet: "Have a question about a term or finding in your report? Type it below.",

    // Disclaimers & Footer
    medicalDisclaimerTitle: "Medical Disclaimer",
    medicalDisclaimerText: "NeuroExplain is an educational tool and does not provide medical diagnosis or treatment advice. Always consult a qualified neurologist or physician regarding your health.",
    privacyStatement: "Patient Privacy: Reports are processed in temporary memory and never stored permanently or sold to third parties.",
    
    // Image Safety Alert
    imageSafetyTitle: "Radiographic Scan Detected Without Written Report",
    imageSafetyAdvice: "NeuroExplain interprets written diagnostic reports. Direct visual analysis of medical scan pixels requires a certified radiologist."
  },

  te: {
    appTitle: "NeuroExplain",
    tagline: "రోగుల న్యూరోలాజికల్ నివేదికల పోర్టల్",
    navHome: "హోమ్",
    navUpload: "నివేదిక విశ్లేషించండి",
    navHowItWorks: "ఇది ఎలా పనిచేస్తుంది",
    navPrivacy: "గోప్యత & భద్రత",
    emergencyAlert: "తీవ్రమైన అత్యవసర పరిస్థితుల్లో వెంటనే అత్యవసర సేవలకు (112) కాల్ చేయండి.",
    
    // Hero
    heroHeading: "మీ న్యూరాలజీ నివేదికను సులభంగా అర్థం చేసుకోండి",
    heroSubtitle: "మీ బ్రెయిన్ MRI, EEG మరియు EMG నివేదికల సంక్లిష్ట సమాచారాన్ని సులభమైన రోజువారీ తెలుగు భాషలో తెలుసుకోండి.",
    primaryCta: "మీ నివేదికను అప్‌లోడ్ చేయండి",
    orTrySample: "లేదా నమూనా నివేదికను ప్రయత్నించండి",
    
    // Steps
    step1Title: "1. నివేదిక అప్‌లోడ్",
    step1Desc: "మీ PDF లేదా స్కాన్ చేసిన రిపోర్ట్‌ను అప్‌లోడ్ చేయండి. మీ పత్రం పూర్తిగా తాత్కాలికమైనది మరియు గోప్యంగా ఉంటుంది.",
    step2Title: "2. సరళంగా తెలుసుకోండి",
    step2Desc: "సులభమైన సారాంశం, వైద్య పదాలకు రోజువారీ ఉపమానాలు మరియు క్లినికల్ ఆధారాలను చూడండి.",
    step3Title: "3. డాక్టర్‌తో చర్చించండి",
    step3Desc: "మీ తదుపరి న్యూరాలజిస్ట్ సంప్రదింపుల కోసం అనుకూలీకరించిన ప్రశ్నలను పొందండి.",

    // Upload Box
    uploadHeader: "న్యూరోలాజికల్ నివేదికను అప్‌లోడ్ చేయండి",
    uploadSubtitle: "PDF, JPG, మరియు PNG ఫైళ్ళకు మద్దతు ఉంది (గరిష్టంగా 15MB)",
    dragDropText: "మీ నివేదికను ఇక్కడ డ్రాగ్ చేయండి, లేదా",
    browseButton: "ఫైళ్ళను బ్రౌజ్ చేయండి",
    targetLanguageLabel: "వివరణ భాషను ఎంచుకోండి:",
    analyzeButton: "నివేదికను విశ్లేషించండి",
    analyzingButton: "విశ్లేషిస్తోంది...",
    sampleReportsLabel: "డెమో కోసం నమూనా నివేదికలు:",
    selectSamplePlaceholder: "-- డెమో రిపోర్ట్‌ను ఎంచుకోండి --",
    sampleMriWmh: "Brain MRI — మైగ్రేన్ & వైట్ మ్యాటర్ మార్పులు",
    sampleMriMass: "Brain MRI — అనుమానిత గడ్డ (సురక్షిత ప్రోటోకాల్)",
    sampleEeg: "EEG — సాధారణ బ్రెయిన్ వేవ్ పరీక్ష",
    sampleEmg: "EMG/NCS — కార్పల్ టన్నెల్ సిండ్రోమ్ (నరాల సమస్య)",
    
    // Progress Steps
    statusExtracting: "పత్రాన్ని చదివి పాఠాన్ని సేకరిస్తోంది...",
    statusParsing: "వైద్య విభాగాలను గుర్తించి, నెగెటివ్ స్టేట్‌మెంట్‌లను పరిశీలిస్తోంది...",
    statusRetrieving: "FAISS ద్వారా ప్రామాణికమైన PubMed పరిశోధనలను పొందుతోంది...",
    statusGenerating: "తెలుగులో సరళమైన వివరణను సిద్ధం చేస్తోంది...",
    
    // Results Dashboard
    resultsHeader: "నివేదిక వివరణ",
    detectedModality: "పరీక్ష రకం:",
    analysisDate: "విశ్లేషణ తేదీ:",
    switchLanguage: "వివరణ భాష మార్చండి:",
    
    tabSummary: "సారాంశం",
    tabFindings: "ముఖ్య ఫలితాలు",
    tabTerms: "వైద్య పదాలు",
    tabMeaning: "దీని అర్థం ఏమిటి",
    tabUncertain: "అస్పష్టతలు",
    tabDoctorQuestions: "డాక్టర్‌ను అడగాల్సిన ప్రశ్నలు",
    tabSources: "ప్రామాణిక ఆధారాలు",
    tabChat: "ప్రశ్నలు అడగండి",

    sectionSummaryTitle: "A. నివేదిక సారాంశం",
    sectionFindingsTitle: "B. ముఖ్యమైన పరిశీలనలు (Findings)",
    sectionTermsTitle: "C. వైద్య పదాల వివరణ",
    sectionMeaningTitle: "D. ఈ ఫలితాలు ఏమి సూచిస్తాయి",
    sectionUncertainTitle: "E. నిర్ధారణకు రాలేని అంశాలు",
    sectionDoctorQuestionsTitle: "F. మీ డాక్టర్‌ను అడగవలసిన ప్రశ్నలు",
    sectionSourcesTitle: "G. ప్రామాణిక వైద్య ఆధారాలు (Trusted Sources)",
    sectionNextStepsTitle: "H. సూచించిన తదుపరి చర్యలు",

    simplifyButton: "ఇంకా సులభంగా వివరించండి",
    simplifiedHeading: "సులభమైన ఉపమానం:",
    negatedBadge: "లేదు / సాధారణం (Negative Finding)",
    keyFindingBadge: "ముఖ్య పరిశీలన",
    normalBadge: "సాధారణం",
    incidentalBadge: "సాధారణ ఉప-ఫలితం",

    // Follow Up Chat
    chatHeader: "తదుపరి ప్రశ్న అడగండి",
    chatPlaceholder: "మీ నివేదిక గురించి ఏదైనా అడగండి (ఉదా: 'ఈ పదానికి అర్థం ఏమిటి?')...",
    sendButton: "అడగండి",
    suggestedQuestionsLabel: "సూచించిన ప్రశ్నలు:",
    noQuestionsYet: "మీ నివేదికలోని ఏదైనా విషయం గురించి సందేహం ఉందా? క్రింద టైప్ చేయండి.",

    // Disclaimers & Footer
    medicalDisclaimerTitle: "వైద్య నిరాకరణ (Medical Disclaimer)",
    medicalDisclaimerText: "NeuroExplain కేవలం విద్యావగాహన కోసం మాత్రమే. ఇది డాక్టర్ రోగనిర్ధారణ లేదా చికిత్స సలహాకు ప్రత్యామ్నాయం కాదు. మీ ఆరోగ్య నిర్ణయాల కోసం ఎల్లప్పుడూ అర్హతగల న్యూరాలజిస్ట్‌ను సంప్రదించండి.",
    privacyStatement: "గోప్యతా హామీ: నివేదికలు తాత్కాలికంగా మాత్రమే ప్రాసెస్ చేయబడతాయి మరియు శాశ్వతంగా సేవ్ చేయబడవు.",
    
    // Image Safety Alert
    imageSafetyTitle: "రాతపూర్వక నివేదిక లేకుండా స్కాన్ చిత్రం మాత్రమే గుర్తించబడింది",
    imageSafetyAdvice: "NeuroExplain రాతపూర్వక నివేదికలను వివరిస్తుంది. నేరుగా స్కాన్ చిత్రాల విశ్లేషణకు సర్టిఫైడ్ రేడియాలజిస్ట్ పరిశీలన అవసరం."
  },

  hi: {
    appTitle: "NeuroExplain",
    tagline: "मरीजों के लिए न्यूरोलॉजिकल रिपोर्ट पोर्टल",
    navHome: "होम",
    navUpload: "रिपोर्ट विश्लेषण",
    navHowItWorks: "यह कैसे काम करता है",
    navPrivacy: "गोपनीयता और सुरक्षा",
    emergencyAlert: "गंभीर आपातकालीन स्थिति में तुरंत आपातकालीन सेवा (112) पर संपर्क करें।",
    
    // Hero
    heroHeading: "अपनी न्यूरोलॉजिकल रिपोर्ट को आसानी से समझें",
    heroSubtitle: "अपनी ब्रेन एमआरआई (Brain MRI), ईईजी (EEG) और ईएमजी (EMG) रिपोर्ट को सरल हिंदी में समझें।",
    primaryCta: "अपनी रिपोर्ट अपलोड करें",
    orTrySample: "या सैंपल रिपोर्ट आज़माएं",
    
    // Steps
    step1Title: "1. रिपोर्ट अपलोड करें",
    step1Desc: "अपनी PDF या स्कैन की गई रिपोर्ट अपलोड करें। आपका दस्तावेज़ पूरी तरह गोपनीय और अस्थायी रहता है।",
    step2Title: "2. सरल भाषा में समझें",
    step2Desc: "आसान सारांश, चिकित्सीय शब्दों के सरल उदाहरण और वैज्ञानिक संदर्भ प्राप्त करें।",
    step3Title: "3. डॉक्टर से चर्चा करें",
    step3Desc: "अपने डॉक्टर से पूछने के लिए महत्वपूर्ण और उपयोगी प्रश्नों की सूची प्राप्त करें।",

    // Upload Box
    uploadHeader: "न्यूरोलॉजिकल रिपोर्ट अपलोड करें",
    uploadSubtitle: "PDF, JPG और PNG फाइलों का समर्थन (अधिकतम 15MB)",
    dragDropText: "अपनी रिपोर्ट यहाँ खींचें और छोड़ें, या",
    browseButton: "फ़ाइलें चुनें",
    targetLanguageLabel: "व्याख्या की भाषा चुनें:",
    analyzeButton: "रिपोर्ट का विश्लेषण करें",
    analyzingButton: "विश्लेषण हो रहा है...",
    sampleReportsLabel: "प्रदर्शन के लिए नमूना रिपोर्ट:",
    selectSamplePlaceholder: "-- एक सैंपल केस चुनें --",
    sampleMriWmh: "ब्रेन MRI — माइग्रेन और वाइट मैटर परिवर्तन",
    sampleMriMass: "ब्रेन MRI — संभावित गांठ (सुरक्षा प्रोटोकॉल केस)",
    sampleEeg: "EEG — सामान्य ब्रेन वेव जांच",
    sampleEmg: "EMG/NCS — कार्पल टनल सिंड्रोम (नसों की जांच)",
    
    // Progress Steps
    statusExtracting: "दस्तावेज़ से पाठ निकाला जा रहा है...",
    statusParsing: "रिपोर्ट के अनुभागों और सामान्य निष्कर्षों की पहचान हो रही है...",
    statusRetrieving: "FAISS द्वारा प्रमाणित PubMed शोध संदर्भ खोजे जा रहे हैं...",
    statusGenerating: "सरल हिंदी में व्याख्या तैयार की जा रही है...",
    
    // Results Dashboard
    resultsHeader: "रिपोर्ट की व्याख्या",
    detectedModality: "जांच का प्रकार:",
    analysisDate: "विश्लेषण दिनांक:",
    switchLanguage: "व्याख्या की भाषा बदलें:",
    
    tabSummary: "सारांश",
    tabFindings: "मुख्य निष्कर्ष",
    tabTerms: "चिकित्सीय शब्द",
    tabMeaning: "इसका क्या अर्थ है",
    tabUncertain: "अनिश्चितताएं",
    tabDoctorQuestions: "डॉक्टर के लिए सवाल",
    tabSources: "विश्वसनीय स्रोत",
    tabChat: "सवाल पूछें",

    sectionSummaryTitle: "A. रिपोर्ट का सारांश",
    sectionFindingsTitle: "B. मुख्य निष्कर्ष (Findings)",
    sectionTermsTitle: "C. कठिन चिकित्सीय शब्दों की सरल व्याख्या",
    sectionMeaningTitle: "D. इन परिणामों का क्या अर्थ हो सकता है",
    sectionUncertainTitle: "E. क्या अनिश्चित है",
    sectionDoctorQuestionsTitle: "F. अपने डॉक्टर से पूछे जाने वाले प्रश्न",
    sectionSourcesTitle: "G. विश्वसनीय चिकित्सीय स्रोत (PubMed / Guidelines)",
    sectionNextStepsTitle: "H. सुझाए गए अगले कदम",

    simplifyButton: "और अधिक सरल बनाएं",
    simplifiedHeading: "दैनिक जीवन का उदाहरण:",
    negatedBadge: "अनुपस्थित / सामान्य (Negative)",
    keyFindingBadge: "प्रमुख निष्कर्ष",
    normalBadge: "सामान्य",
    incidentalBadge: "गौण / सामान्य बदलाव",

    // Follow Up Chat
    chatHeader: "फॉलो-अप प्रश्न पूछें",
    chatPlaceholder: "अपनी रिपोर्ट के बारे में कोई भी प्रश्न पूछें (उदा: 'इस शब्द का क्या अर्थ है?')...",
    sendButton: "पूछें",
    suggestedQuestionsLabel: "सुझाए गए प्रश्न:",
    noQuestionsYet: "क्या रिपोर्ट में किसी शब्द को लेकर कोई सवाल है? नीचे लिखकर पूछें।",

    // Disclaimers & Footer
    medicalDisclaimerTitle: "चिकित्सा अस्वीकरण (Medical Disclaimer)",
    medicalDisclaimerText: "NeuroExplain केवल शैक्षिक जानकारी प्रदान करता है। यह किसी डॉक्टर के निदान या उपचार सलाह का विकल्प नहीं है। अपनी स्वास्थ्य संबंधी निर्णयों के लिए हमेशा अपने न्यूरोलॉजिस्ट से परामर्श लें।",
    privacyStatement: "गोपनीयता आश्वासन: रिपोर्ट केवल अस्थायी मेमोरी में प्रोसेस की जाती है और कभी भी स्थायी रूप से स्टोर नहीं की जाती।",
    
    // Image Safety Alert
    imageSafetyTitle: "लिखित रिपोर्ट के बिना केवल स्कैन छवि पाई गई",
    imageSafetyAdvice: "NeuroExplain लिखित रिपोर्ट की व्याख्या करता है। सीधे स्कैन छवियों के विश्लेषण के लिए एक प्रमाणित रेडियोलॉजिस्ट की समीक्षा आवश्यक है।"
  }
};
