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
  currentLanguage,
  showRomanization,
  showEnglish,
}) {
  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        uiState.showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="glass-overlay fixed inset-0"
        onClick={() => updateUiState({ showMobileMenu: false })}
      ></div>
      <div
        ref={mobileMenuRef}
        className={`h-full w-80 max-w-[90vw] glass-panel border-l border-white/30 transition-transform duration-500 ease-in-out z-[101] ${
          uiState.showMobileMenu ? 'settings-panel-open' : 'settings-panel-closed'
        }`}
      >
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={() => updateUiState({ showMobileMenu: false })}
              className="glass-button p-2 rounded-xl cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-gray-300"
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
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  settings.currentLanguage === lang.code
                    ? 'glass-button-selected text-white'
                    : 'glass-button text-gray-300'
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
            {/* English Toggle */}
            <label className="glass-surface-subtle flex items-center justify-between rounded-xl p-3 cursor-pointer">
              <span className="text-sm text-gray-200 font-medium">Show English</span>
              <button
                onClick={() => updateSettings({ showEnglish: !showEnglish })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 cursor-pointer ${
                  showEnglish
                    ? 'glass-toggle-active'
                    : 'glass-toggle-inactive-contrast'
                }`}
                role="switch"
                aria-checked={showEnglish}
              >
                <span className="sr-only">Show English translations</span>
                <span
                  className={`${
                    showEnglish ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-lg ring-0`}
                />
              </button>
            </label>

            {/* Romanization Toggle - only show if current language supports it */}
            {currentLanguage.hasRomanization && (
              <label className="glass-surface-subtle flex items-center justify-between rounded-xl p-3 cursor-pointer">
                <span className="text-sm text-gray-200 font-medium">Show {currentLanguage.romanizationLabel}</span>
                <button
                  onClick={() => updateSettings({ showRomanization: !showRomanization })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 cursor-pointer ${
                    showRomanization
                      ? 'glass-toggle-active'
                      : 'glass-toggle-inactive-contrast'
                  }`}
                  role="switch"
                  aria-checked={showRomanization}
                >
                  <span className="sr-only">Show {currentLanguage.romanizationLabel}</span>
                  <span
                    className={`${
                      showRomanization ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-lg ring-0`}
                  />
                </button>
              </label>
            )}

            <label className="glass-surface-subtle flex items-center justify-between rounded-xl p-3 cursor-pointer">
              <span className="text-sm text-gray-200 font-medium">Predictive Text</span>
              <button
                onClick={() =>
                  updateSettings({ enablePredictiveText: !settings.enablePredictiveText })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 cursor-pointer ${
                  settings.enablePredictiveText
                    ? 'glass-toggle-active'
                    : 'glass-toggle-inactive-contrast'
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
                className="w-full text-left px-4 py-3 rounded-xl glass-error text-red-200 transition-all duration-200 cursor-pointer"
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