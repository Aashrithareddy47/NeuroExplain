import React, { useState } from 'react';
import {
  FileText, CheckCircle2, AlertCircle, HelpCircle, BookOpen, MessageSquare,
  Sparkles, ExternalLink, ChevronRight, Stethoscope, RefreshCw, ShieldAlert,
  ArrowRight, Info, AlertTriangle, Lightbulb
} from 'lucide-react';
import { translations } from '../i18n/translations';
import { simplifyTerm } from '../services/api';

export default function ResultsDashboard({
  analysis,
  language,
  onLanguageChange,
  reportId,
  onNewUpload
}) {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState('summary');
  const [simplifyingTerm, setSimplifyingTerm] = useState(null);
  const [simplifiedTermData, setSimplifiedTermData] = useState(null);
  const [simplifyLoading, setSimplifyLoading] = useState(false);

  const handleSimplifyTerm = async (term, context) => {
    setSimplifyingTerm(term);
    setSimplifyLoading(true);
    try {
      const res = await simplifyTerm(reportId, term, context, language);
      setSimplifiedTermData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimplifyLoading(false);
    }
  };

  const closeSimplifyModal = () => {
    setSimplifyingTerm(null);
    setSimplifiedTermData(null);
  };

  if (!analysis) return null;

  return (
    <div className="max-w-5xl mx-auto my-8 space-y-6">
      
      {/* Top Banner & Language Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-hospital-100 text-hospital-800 text-xs font-bold rounded-full border border-hospital-200">
                {analysis.modality_detected || 'Neurological Exam'}
              </span>
              <span className="text-xs text-slate-500">
                {t.analysisDate} {analysis.analysis_timestamp || 'Today'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-2 font-sans tracking-tight">
              {t.resultsHeader}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">{t.switchLanguage}</span>
              <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    language === 'en' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => onLanguageChange('te')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    language === 'te' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  onClick={() => onLanguageChange('hi')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    language === 'hi' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <button
              onClick={onNewUpload}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Upload Another</span>
            </button>
          </div>
        </div>

        {/* Safety Warning for Raw Imaging Scan Upload */}
        {analysis.is_medical_image_only && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{t.imageSafetyTitle}</h4>
              <p className="text-xs mt-1 text-amber-800 leading-relaxed">
                {analysis.image_safety_warning || t.imageSafetyAdvice}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 mt-6 pt-2">
          {[
            { id: 'summary', label: t.tabSummary, icon: FileText },
            { id: 'findings', label: t.tabFindings, icon: CheckCircle2, count: analysis.important_findings?.length },
            { id: 'terms', label: t.tabTerms, icon: Lightbulb, count: analysis.medical_terms_explained?.length },
            { id: 'meaning', label: t.tabMeaning, icon: Sparkles },
            { id: 'uncertain', label: t.tabUncertain, icon: HelpCircle, count: analysis.uncertainties?.length },
            { id: 'doctor', label: t.tabDoctorQuestions, icon: Stethoscope, count: analysis.questions_for_doctor?.length },
            { id: 'sources', label: t.tabSources, icon: BookOpen, count: analysis.trusted_sources?.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition ${
                  isActive
                    ? 'bg-hospital-600 text-white shadow-md shadow-hospital-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-hospital-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        
        {/* SECTION A: Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-hospital-100 text-hospital-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">{t.sectionSummaryTitle}</h3>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4">
              <div className="p-5 bg-gradient-to-br from-hospital-50/70 to-slate-50 rounded-2xl border border-hospital-100 text-navy-900 font-normal leading-relaxed text-sm sm:text-base">
                {analysis.patient_summary}
              </div>
            </div>

            {/* Next Steps preview */}
            {analysis.suggested_next_steps?.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t.sectionNextStepsTitle}
                </h4>
                <div className="space-y-2">
                  {analysis.suggested_next_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                      <ChevronRight className="w-4 h-4 text-hospital-600 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION B: Findings */}
        {activeTab === 'findings' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionFindingsTitle}</h3>
                <p className="text-xs text-slate-500">Exact doctor statements preserved with negation safeguards</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.important_findings?.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition ${
                    f.is_negated
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      "{f.finding_text}"
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      f.is_negated
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-hospital-100 text-hospital-800 border border-hospital-200'
                    }`}>
                      {f.is_negated ? t.negatedBadge : f.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-navy-900 font-medium">
                    {f.simplified_explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: Medical Terms Explained */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionTermsTitle}</h3>
                <p className="text-xs text-slate-500">Everyday words and relatable analogies for complex jargon</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.medical_terms_explained?.map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-navy-900">{m.original_term}</h4>
                      {m.clinical_context && (
                        <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {m.clinical_context}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      {m.simplified_explanation}
                    </p>
                    {m.analogy_or_example && (
                      <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-start space-x-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800">Analogy:</strong> {m.analogy_or_example}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSimplifyTerm(m.original_term, m.simplified_explanation)}
                    className="self-start inline-flex items-center text-[11px] font-semibold text-hospital-700 hover:text-hospital-800 hover:underline pt-1"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>{t.simplifyButton}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION D: Educational Interpretations */}
        {activeTab === 'meaning' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-hospital-100 text-hospital-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionMeaningTitle}</h3>
                <p className="text-xs text-slate-500">Educational insights grounded in verified clinical neurology literature</p>
              </div>
            </div>

            <div className="space-y-4">
              {analysis.educational_interpretations?.map((e, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-hospital-50/40 border border-hospital-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-navy-900">{e.topic}</h4>
                    {e.grounded_source_ids?.length > 0 && (
                      <span className="text-[10px] font-semibold text-hospital-800 bg-hospital-100 px-2 py-0.5 rounded-full border border-hospital-200">
                        Evidence Grounded ({e.grounded_source_ids.join(', ')})
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {e.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION E: Uncertainties */}
        {activeTab === 'uncertain' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionUncertainTitle}</h3>
                <p className="text-xs text-slate-500">Questions or details that imaging alone cannot answer</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.uncertainties?.map((u, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-navy-900 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>{u.uncertainty_description}</span>
                  </h4>
                  <p className="text-xs text-slate-600 pl-6">
                    <strong className="text-slate-800">Why clinical review is needed:</strong> {u.reason_for_uncertainty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION F: Doctor Questions */}
        {activeTab === 'doctor' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionDoctorQuestionsTitle}</h3>
                <p className="text-xs text-slate-500">Actionable, high-yield questions for your next doctor appointment</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.questions_for_doctor?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-teal-950 flex items-start space-x-2">
                    <ChevronRight className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>{q.question}</span>
                  </h4>
                  <p className="text-xs text-slate-600 pl-6">
                    <strong className="text-teal-900">Why ask:</strong> {q.why_to_ask}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION G: Trusted Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{t.sectionSourcesTitle}</h3>
                <p className="text-xs text-slate-500">Real PubMed studies, clinical practice guidelines, and textbooks</p>
              </div>
            </div>

            <div className="space-y-4">
              {analysis.trusted_sources?.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <h4 className="font-bold text-xs sm:text-sm text-navy-900">{s.title}</h4>
                    {s.similarity_score && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full self-start font-semibold">
                        Relevance: {Math.round(s.similarity_score * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {s.publisher_or_journal} {s.year ? `(${s.year})` : ''} • ID: {s.id}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 italic font-mono leading-relaxed">
                    "{s.relevant_excerpt}"
                  </div>
                  {s.doi_or_url && (
                    <a
                      href={s.doi_or_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-hospital-700 hover:text-hospital-800 hover:underline pt-1"
                    >
                      <span>View Verified PubMed / Guideline Source</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Super Simple Term Modal */}
      {simplifyingTerm && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-hospital-600" />
                <h3 className="font-bold text-navy-900 text-base">Super-Simple Explanation</h3>
              </div>
              <button
                onClick={closeSimplifyModal}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-hospital-800 uppercase tracking-wide">
                Term: {simplifyingTerm}
              </div>

              {simplifyLoading ? (
                <div className="flex items-center justify-center p-8 space-x-2 text-slate-500 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-hospital-600" />
                  <span>Generating super-simple analogy...</span>
                </div>
              ) : simplifiedTermData ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {simplifiedTermData.simplified_explanation}
                  </p>
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <strong className="text-amber-800 flex items-center space-x-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.simplifiedHeading}</span>
                    </strong>
                    <p>{simplifiedTermData.analogy}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              onClick={closeSimplifyModal}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
