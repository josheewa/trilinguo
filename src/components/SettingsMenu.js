import React from 'react'
import { LANGUAGES } from '../config/languages'

export default function SettingsMenu({
  uiState,
  updateUiState,
  mobileMenuRef,
  settings,
  updateSettings,
  handleLanguageChange,
  handleClearChat,
  messages,
}) {
  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        uiState.showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => updateUiState({ showMobileMenu: false })}
      ></div>
      <div
        ref={mobileMenuRef}
        className={`fixed right-0 top-0 h-full w-80 max-w-[90vw] backdrop-blur-xl bg-gradient-to-b from-white/20 via-white/15 to-white/10 border-l border-white/30 shadow-2xl transition-transform duration-300 ease-out z-[101] ${
          uiState.showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={() => updateUiState({ showMobileMenu: false })}
              className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/30 cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-gray-300 hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Choose Language</h3>
          <div className="space-y-2">
            {Object.values(LANGUAGES).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm border shadow-lg cursor-pointer ${
                  settings.currentLanguage === lang.code
                    ? 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white border-blue-400/50 shadow-blue-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border-white/20 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-xs opacity-80">{lang.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-white/20">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-3">
              <span className="text-sm text-gray-200 font-medium">Predictive Text</span>
              <button
                onClick={() =>
                  updateSettings({ enablePredictiveText: !settings.enablePredictiveText })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 backdrop-blur-sm border shadow-lg cursor-pointer ${
                  settings.enablePredictiveText
                    ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 border-emerald-400/50 shadow-emerald-500/25'
                    : 'bg-white/20 border-white/30 hover:bg-white/30'
                }`}
                role="switch"
                aria-checked={settings.enablePredictiveText}
              >
                <span className="sr-only">Enable predictive text</span>
                <span
                  className={`${
                    settings.enablePredictiveText ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-lg ring-0`}
                />
              </button>
            </label>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="w-full text-left px-4 py-3 rounded-xl backdrop-blur-sm bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-200 hover:text-white transition-all duration-200 border border-red-400/30 hover:border-red-300/50 shadow-lg cursor-pointer"
              >
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  Clear Chat History
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 