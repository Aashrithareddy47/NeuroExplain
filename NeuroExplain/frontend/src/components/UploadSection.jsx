import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, AlertCircle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function UploadSection({
  language,
  onLanguageChange,
  onFileSelect,
  onLoadSample,
  selectedFile,
  isProcessing,
  uploadMetadata,
  onAnalyze,
  error
}) {
  const t = translations[language] || translations.en;
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      {/* Upload Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        
        {/* Card Header */}
        <div className="bg-gradient-to-r from-navy-900 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t.uploadHeader}</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">{t.uploadSubtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-hospital-300">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-hospital-400" />
            <span>Encrypted & Temporary Memory</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-hospital-500 bg-hospital-50/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-hospital-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-hospital-100 text-hospital-700'
              }`}>
                {selectedFile ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-navy-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-navy-900">{t.dragDropText}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    {t.browseButton}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upload Metadata Preview if available */}
          {uploadMetadata && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between font-semibold text-navy-900 border-b border-slate-200 pb-2">
                <span>Document Status: Ready for NLP & RAG</span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {uploadMetadata.page_count} Page(s) • {uploadMetadata.extracted_character_count} Characters
                </span>
              </div>
              {uploadMetadata.detected_sections?.length > 0 && (
                <p className="text-slate-600">
                  <strong className="text-slate-800">Detected Clinical Sections:</strong>{' '}
                  {uploadMetadata.detected_sections.join(', ')}
                </p>
              )}
              {uploadMetadata.raw_text_preview && (
                <div className="mt-1 p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-600 line-clamp-3">
                  "{uploadMetadata.raw_text_preview}"
                </div>
              )}
              {uploadMetadata.warnings?.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{uploadMetadata.warnings.join(' ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Demonstration Quick Selector */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {t.sampleReportsLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onLoadSample('sample-mri-wmh')}
                className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50/60 hover:border-hospital-300 transition text-xs"
              >
                <div className="font-semibold text-navy-900">{t.sampleMriWmh}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Migraine workup • Frontal white matter punctate foci</div>
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('sample-mri-mass')}
                className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50/60 hover:border-hospital-300 transition text-xs"
              >
                <div className="font-semibold text-navy-900">{t.sampleMriMass}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Safety Case • Extra-axial mass & biopsy context</div>
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('sample-eeg-routine')}
                className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50/60 hover:border-hospital-300 transition text-xs"
              >
                <div className="font-semibold text-navy-900">{t.sampleEeg}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">30-min EEG • Reassuring posterior alpha rhythm</div>
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('sample-emg-ncs')}
                className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50/60 hover:border-hospital-300 transition text-xs"
              >
                <div className="font-semibold text-navy-900">{t.sampleEmg}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hand numbness • Median sensory latency prolongation</div>
              </button>
            </div>
          </div>

          {/* Language Selection and Primary Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="w-full sm:w-auto flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">{t.targetLanguageLabel}</span>
              <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    language === 'en' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('te')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    language === 'te' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('hi')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    language === 'hi' ? 'bg-white text-hospital-800 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!uploadMetadata || isProcessing}
              onClick={onAnalyze}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-sm shadow-md transition ${
                !uploadMetadata || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-hospital-600 hover:bg-hospital-700 text-white shadow-hospital-600/30'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>{isProcessing ? t.analyzingButton : t.analyzeButton}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
