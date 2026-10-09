import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Database, FileText, Cpu } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function ProgressBar({ currentStep, language }) {
  const t = translations[language] || translations.en;

  const steps = [
    { id: 1, label: t.statusExtracting, icon: FileText },
    { id: 2, label: t.statusParsing, icon: Cpu },
    { id: 3, label: t.statusRetrieving, icon: Database },
    { id: 4, label: t.statusGenerating, icon: Sparkles },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 my-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <Loader2 className="w-5 h-5 text-hospital-600 animate-spin" />
        <h4 className="text-sm font-semibold text-navy-900">{t.analyzingButton}</h4>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center p-3 rounded-xl transition ${
                isCurrent
                  ? 'bg-hospital-50 border border-hospital-200 text-hospital-900 shadow-sm'
                  : isDone
                  ? 'bg-slate-50 text-slate-700'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className="mr-3">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-hospital-600 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
