import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ProgressBar from './components/ProgressBar';
import ResultsDashboard from './components/ResultsDashboard';
import FollowUpChat from './components/FollowUpChat';
import Footer from './components/Footer';
import HowItWorksModal from './components/HowItWorksModal';
import { translations } from './i18n/translations';
import { uploadReport, analyzeReport, loadSampleReport, checkHealth } from './services/api';
import { ArrowDown, Brain, Stethoscope, Shield, CheckCircle2, ChevronRight } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState('en');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const t = translations[language] || translations.en;

  useEffect(() => {
    checkHealth().catch((err) => console.log('Backend health check:', err.message));
  }, []);

  const handleFileSelect = async (file) => {
    setError(null);
    setSelectedFile(file);
    setAnalysisResult(null);

    try {
      const uploadRes = await uploadReport(file);
      setUploadMetadata(uploadRes);
      setReportId(uploadRes.report_id);
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
      setUploadMetadata(null);
    }
  };

  const handleLoadSample = async (sampleId) => {
    setError(null);
    setSelectedFile({ name: `${sampleId}.pdf`, size: 2500 });
    setAnalysisResult(null);

    try {
      const res = await loadSampleReport(sampleId);
      setUploadMetadata(res);
      setReportId(res.report_id);
    } catch (err) {
      setError(err.message || 'Failed to load sample report.');
    }
  };

  const handleAnalyze = async () => {
    if (!reportId) return;

    setError(null);
    setIsProcessing(true);
    setCurrentStep(1);

    // Simulate animated step indicators for calm patient UX
    const timer1 = setTimeout(() => setCurrentStep(2), 700);
    const timer2 = setTimeout(() => setCurrentStep(3), 1500);
    const timer3 = setTimeout(() => setCurrentStep(4), 2300);

    try {
      const res = await analyzeReport(reportId, language);
      setAnalysisResult(res);
    } catch (err) {
      setError(err.message || 'Analysis could not be completed.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsProcessing(false);
    }
  };

  const handleLanguageSwitch = async (newLang) => {
    setLanguage(newLang);
    // If analysis is already loaded, re-analyze seamlessly in the newly selected language
    if (reportId && analysisResult) {
      setIsProcessing(true);
      setCurrentStep(4);
      try {
        const res = await analyzeReport(reportId, newLang);
        setAnalysisResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNewUpload = () => {
    setSelectedFile(null);
    setUploadMetadata(null);
    setReportId(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-navy-900">
      <Navbar
        language={language}
        onLanguageChange={handleLanguageSwitch}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Hero Section (shown when no analysis is active) */}
        {!analysisResult && (
          <section className="py-12 sm:py-16 text-center max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-hospital-100 border border-hospital-200 text-hospital-800 text-xs font-semibold">
              <Brain className="w-4 h-4 text-hospital-700" />
              <span>Multilingual Clinical NLP & Grounded RAG</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
              {t.heroHeading}
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* 3-Step Simple Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="font-bold text-xs text-hospital-700 uppercase tracking-wider">{t.step1Title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step1Desc}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="font-bold text-xs text-hospital-700 uppercase tracking-wider">{t.step2Title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step2Desc}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="font-bold text-xs text-hospital-700 uppercase tracking-wider">{t.step3Title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step3Desc}</p>
              </div>
            </div>
          </section>
        )}

        {/* Upload Interface */}
        {!analysisResult && (
          <UploadSection
            language={language}
            onLanguageChange={handleLanguageSwitch}
            onFileSelect={handleFileSelect}
            onLoadSample={handleLoadSample}
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            uploadMetadata={uploadMetadata}
            onAnalyze={handleAnalyze}
            error={error}
          />
        )}

        {/* Real-Time Processing Progress */}
        {isProcessing && (
          <ProgressBar currentStep={currentStep} language={language} />
        )}

        {/* Results Dashboard */}
        {analysisResult && !isProcessing && (
          <div className="animate-in fade-in space-y-8">
            <ResultsDashboard
              analysis={analysisResult}
              language={language}
              onLanguageChange={handleLanguageSwitch}
              reportId={reportId}
              onNewUpload={handleNewUpload}
            />

            {/* Follow Up Interactive Chat grounded in this report */}
            <FollowUpChat
              reportId={reportId}
              language={language}
            />
          </div>
        )}

      </main>

      <Footer language={language} />

      {/* How it Works Information Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        language={language}
      />
    </div>
  );
}
