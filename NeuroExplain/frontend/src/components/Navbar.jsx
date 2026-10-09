import React from 'react';
import { Brain, Globe, Shield, AlertTriangle, Stethoscope } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Navbar({ language, onLanguageChange, onOpenHowItWorks }) {
  const t = translations[language] || translations.en;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Hospital Portal Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-hospital-700 via-hospital-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-hospital-500/20">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold tracking-tight text-navy-900 font-sans">Neuro<span className="text-hospital-600">Explain</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-hospital-100 text-hospital-800 rounded-full border border-hospital-200">Patient Portal</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Center Emergency Badge */}
          <div className="hidden lg:flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
            <span>{t.emergencyAlert}</span>
          </div>

          {/* Right Navigation & Language Selection */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenHowItWorks}
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-hospital-700 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            >
              {t.navHowItWorks}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative inline-flex items-center">
              <Globe className="w-4 h-4 text-hospital-600 absolute left-3 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-hospital-500 transition cursor-pointer appearance-none shadow-sm"
              >
                <option value="en">English (English)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <div className="absolute right-3 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
