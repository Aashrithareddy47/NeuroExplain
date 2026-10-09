import React from 'react';
import { ShieldCheck, Stethoscope, Lock, Heart, Globe } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Footer({ language }) {
  const t = translations[language] || translations.en;

  return (
    <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white tracking-tight">Neuro<span className="text-hospital-400">Explain</span></span>
              <span className="text-[10px] bg-hospital-950 text-hospital-300 px-2 py-0.5 rounded border border-hospital-800 font-semibold">PATIENT PORTAL</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering patients and caregivers with clear, compassionate, evidence-grounded explanations of brain MRI, EEG, and neuromuscular diagnostic reports.
            </p>
            <div className="flex items-center space-x-2 text-xs text-hospital-400">
              <Globe className="w-3.5 h-3.5" />
              <span>Available in English • తెలుగు • हिन्दी</span>
            </div>
          </div>

          {/* Privacy & Safety */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
              <Lock className="w-4 h-4 text-hospital-400" />
              <span>{t.navPrivacy}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.privacyStatement}
            </p>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300">
              🔒 Zero permanent report logging • Session RAM only • Automatic 30-minute expiry
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm font-semibold text-amber-400">
              <Stethoscope className="w-4 h-4 text-amber-400" />
              <span>{t.medicalDisclaimerTitle}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.medicalDisclaimerText}
            </p>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © 2026 NeuroExplain Patient Neuro-Informatics Portal. All medical literature indexed from verified PubMed & clinical guidelines.
          </div>
          <div className="flex items-center space-x-1">
            <span>Designed with care for patient communication</span>
            <Heart className="w-3 h-3 text-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
