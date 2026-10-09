import React from 'react';
import { BookOpen, ShieldCheck, CheckCircle2, Sparkles, Brain, Cpu, Database } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function HowItWorksModal({ isOpen, onClose, language }) {
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-hospital-100 text-hospital-700 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-900">How NeuroExplain Works</h3>
              <p className="text-xs text-slate-500">Patient-Centric Multilingual AI Report Interpretation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-hospital-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900 font-semibold block mb-1">1. Clinical NLP & Negation Preservation</strong>
              <span>
                Extracts clinical text sections (Findings, Impression, Indication) and applies clinical rule checkers.
                Critical medical negations (e.g. "No acute infarct") are strictly preserved so normal results are never mistaken for illness.
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-3">
            <Database className="w-5 h-5 text-hospital-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900 font-semibold block mb-1">2. Multilingual Semantic Vector Retrieval (RAG)</strong>
              <span>
                Retrieves peer-reviewed literature and guidelines from PubMed, Stroke / AHA, and AAN using multilingual sentence embeddings and a local FAISS index.
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-hospital-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900 font-semibold block mb-1">3. Grounded Plain-Language Generation</strong>
              <span>
                Google Gemini 2.5 Flash explains the report in simple English, Telugu (తెలుగు), or Hindi (हिन्दी) using relatable analogies, without making definitive diagnoses.
              </span>
            </div>
          </div>

          <div className="p-4 bg-hospital-50/60 rounded-2xl border border-hospital-200 text-hospital-900 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-hospital-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-1">Strict Patient Privacy Protocol</strong>
              <span className="text-xs text-hospital-800">
                Uploaded documents are processed in temporary RAM and automatically purged within 30 minutes. No personal health records are permanently stored or sold.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-hospital-600 hover:bg-hospital-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm"
        >
          Got It, Return to Portal
        </button>
      </div>
    </div>
  );
}
