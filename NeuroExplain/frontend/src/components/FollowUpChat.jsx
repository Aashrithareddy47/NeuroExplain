import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, BookOpen, Loader2, Bot, User, ChevronRight } from 'lucide-react';
import { translations } from '../i18n/translations';
import { askFollowUpQuestion } from '../services/api';

export default function FollowUpChat({ reportId, language }) {
  const t = translations[language] || translations.en;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = {
    en: [
      "What does this finding mean for my daily routine?",
      "Can you explain the medical terms in simpler words?",
      "Why did my doctor order this specific test?",
      "What questions should I prioritize asking my doctor?"
    ],
    te: [
      "ఈ ఫలితాలు నా రోజువారీ పనులపై ఎలాంటి ప్రభావం చూపుతాయి?",
      "వైద్య పదాలను ఇంకా సరళమైన తెలుగులో వివరించగలరా?",
      "డాక్టర్ ఈ పరీక్షను ఎందుకు సూచించారు?",
      "నా తదుపరి సంప్రదింపుల్లో డాక్టర్‌ను ఏ ముఖ్యమైన ప్రశ్నలు అడగాలి?"
    ],
    hi: [
      "इन परिणामों का मेरी दिनचर्या पर क्या प्रभाव पड़ेगा?",
      "क्या आप इन कठिन शब्दों को और सरल हिंदी में समझा सकते हैं?",
      "डॉक्टर ने यह विशेष जांच क्यों करवाई थी?",
      "मुझे अपने डॉक्टर से कौन से मुख्य सवाल पूछने चाहिए?"
    ]
  };

  const currentSuggestions = suggestedQuestions[language] || suggestedQuestions.en;

  const handleSend = async (questionText) => {
    const textToSend = (questionText || inputValue).trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await askFollowUpQuestion(reportId, textToSend, language);
      const botMsg = {
        sender: 'bot',
        text: res.answer,
        sources: res.relevant_sources,
        suggestedFollowups: res.suggested_followups
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an issue generating an answer. Please try asking again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-hospital-100 text-hospital-700 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy-900">{t.chatHeader}</h3>
          <p className="text-xs text-slate-500">
            Ask specific questions in your selected language about this report and supporting guidelines
          </p>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div>
        <span className="text-xs font-semibold text-slate-600 block mb-2">
          {t.suggestedQuestionsLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {currentSuggestions.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(q)}
              className="text-left text-xs bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>{t.noQuestionsYet}</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-hospital-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  NE
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-navy-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-3'
                }`}
              >
                <p>{msg.text}</p>

                {/* Grounded Sources */}
                {msg.sources?.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1.5">
                    <strong className="text-slate-700 flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-hospital-600" />
                      <span>Supporting Evidence from Guidelines:</span>
                    </strong>
                    {msg.sources.map((s, sIdx) => (
                      <div key={sIdx} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 italic">
                        "{s.relevant_excerpt?.slice(0, 160)}..." — <span className="font-semibold text-navy-900">{s.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-3 text-slate-500 text-xs py-2">
            <div className="w-8 h-8 rounded-xl bg-hospital-600 text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-hospital-600" />
              <span>Retrieving clinical guidelines and formulating answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-slate-100"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.chatPlaceholder}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center space-x-1.5 transition ${
            !inputValue.trim() || isLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-hospital-600 hover:bg-hospital-700 text-white shadow-sm'
          }`}
        >
          <span>{t.sendButton}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
