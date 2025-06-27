import { Inter } from 'next/font/google'
import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { LANGUAGES } from '../config/languages'
import { defaultSettings } from '../config/settings'
import {
  loadSettings,
  saveSettings,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  loadAuth,
  saveAuth,
} from '../lib/storage'
import Header from '../components/Header'
import SettingsMenu from '../components/SettingsMenu'
import ChatInput from '../components/ChatInput'
import WelcomeScreen from '../components/WelcomeScreen'
import ChatHistory from '../components/ChatHistory'
import CulturalContextPanel from '../components/CulturalContextPanel'
import ClearChatModal from '../components/ClearChatModal'

const inter = Inter({
  subsets: ['latin'],
})

// Future regional variants to implement later
// TODO: Add regional toggles for:
// - Chinese: China/Hong Kong/Singapore
// - Japanese: Tokyo/Osaka
// - French: France/Quebec

// Helper function to parse message content for API
const parseMessageContent = (msg, currentLanguageName) => {
  if (typeof msg.content === 'string') return msg.content
  
  let languageText = ''
  if (msg.content.characters && Array.isArray(msg.content.characters)) {
    languageText = msg.content.characters.map((obj) => obj.text).join('')
  } else if (msg.content.chinese && Array.isArray(msg.content.chinese)) {
    languageText = msg.content.chinese.map((obj) => obj.text).join('')
  } else if (msg.content.text) {
    languageText = msg.content.text
  }

  const englishText = msg.content.english || ''
  return `${currentLanguageName.toLowerCase()}: ${languageText} english: ${englishText}`
}

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  // Core app state
  const [settings, setSettings] = useState(defaultSettings)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // UI state - consolidated for better management
  const [uiState, setUiState] = useState({
    showLanguageDropdown: false,
    showMobileMenu: false,
    showClearConfirmModal: false,
    culturalContextModal: null,
    isLoading: false,
    retryingMessageIndex: null,
  })

  // Feature state
  const [conversationStarters, setConversationStarters] = useState([])
  const [loadingStarters, setLoadingStarters] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  // Refs
  const fetchingSuggestionsRef = useRef(false)
  const languageDropdownRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Derived state
  const currentLanguage = LANGUAGES[settings.currentLanguage]
  const showEnglish = settings.showEnglish
  const showRomanization = settings.showRomanization && currentLanguage.hasRomanization

  // UI state helpers
  const updateUiState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }))
  }, [])

  const closeAllDropdowns = useCallback(() => {
    updateUiState({
      showLanguageDropdown: false,
      showMobileMenu: false,
    })
  }, [updateUiState])

  // Settings helper
  const updateSettings = useCallback((newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    saveSettings(updatedSettings)
  }, [settings])

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initialize app on mount
  useEffect(() => {
    if (loadAuth()) {
      setIsAuthenticated(true)
    }

    const loadedSettings = loadSettings()
    setSettings(loadedSettings)
    setMessages(loadChatHistory(loadedSettings.currentLanguage))
  }, [])

  // Scroll when new messages are added or typing indicator appears
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages, uiState.isLoading, scrollToBottom])

  // Load conversation starters
  const loadConversationStarters = useCallback(async (force = false) => {
    if (messages.length > 0 && !force) return

    setLoadingStarters(true)
    try {
      const response = await fetch('/api/conversation-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: settings.currentLanguage,
          count: 4,
        }),
      })
      const data = await response.json()
      setConversationStarters(data.starters || [])
    } catch (error) {
      console.error('Error loading conversation starters:', error)
      setConversationStarters([])
    }
    setLoadingStarters(false)
  }, [messages.length, settings.currentLanguage])

  // Load conversation starters when language changes
  useEffect(() => {
    if (isAuthenticated) {
      loadConversationStarters()
    }
  }, [settings.currentLanguage, isAuthenticated, loadConversationStarters])

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(settings.currentLanguage, messages)
    }
  }, [messages, settings.currentLanguage])

  // Handle outside clicks and escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        updateUiState({ showLanguageDropdown: false })
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        updateUiState({ showMobileMenu: false })
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns()
        updateUiState({ culturalContextModal: null, showClearConfirmModal: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [updateUiState, closeAllDropdowns])

  // Predictive text fetching and management logic
  const fetchSuggestions = useCallback(async () => {
    if (fetchingSuggestionsRef.current) return
    fetchingSuggestionsRef.current = true
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input,
          language: settings.currentLanguage,
          context: messages.slice(-3),
        }),
      })
      const data = await response.json()

      let newSuggestions = []
      if (data.suggestions && data.suggestions.length > 0) {
        newSuggestions = data.suggestions.filter(
          (s) =>
            s.toLowerCase().startsWith(input.toLowerCase()) &&
            s.toLowerCase() !== input.toLowerCase(),
        )
      }

      setSuggestions((currentSuggestions) => {
        if (
          currentSuggestions.length === newSuggestions.length &&
          currentSuggestions.every((val, i) => val === newSuggestions[i])
        ) {
          return currentSuggestions
        }
        return newSuggestions
      })
    } catch (error) {
      console.error('Predictive text error:', error)
      setSuggestions([])
    }
    
    fetchingSuggestionsRef.current = false
  }, [input, messages, settings.currentLanguage])

  useEffect(() => {
    if (!settings.enablePredictiveText || input.length < 2 || input.length > 80) {
      if (suggestions.length > 0) {
        setSuggestions([])
      }
      return
    }

    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [input, settings.enablePredictiveText, fetchSuggestions, suggestions.length])

  // Handle language switching
  const handleLanguageChange = (languageCode) => {
    if (messages.length > 0) {
      saveChatHistory(settings.currentLanguage, messages)
    }

    const newChatHistory = loadChatHistory(languageCode)
    setMessages(newChatHistory)
    updateSettings({ currentLanguage: languageCode })
    updateUiState({ showLanguageDropdown: false, showMobileMenu: false })
  }

  // Handle clearing chat
  const handleClearChat = () => {
    if (messages.length === 0) {
      updateUiState({ showMobileMenu: false })
      return
    }
    updateUiState({ showClearConfirmModal: true })
  }

  const confirmClearChat = () => {
    setMessages([])
    clearChatHistory(settings.currentLanguage)
    updateUiState({ showMobileMenu: false, showClearConfirmModal: false })
    loadConversationStarters(true)
  }

  // Handle conversation starter click
  const handleStarterClick = async (starter) => {
    setInput(starter)
    setSuggestions([])
    const syntheticEvent = { preventDefault: () => {} }
    await handleSubmit(syntheticEvent, null, starter)
  }

  // Password authentication
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwordInput === 'trilinguo2024') {
      setIsAuthenticated(true)
      saveAuth()
      setPasswordInput('')
    } else {
      alert('Incorrect password')
      setPasswordInput('')
    }
  }

  // Main chat submission handler
  const handleSubmit = async (e, retryIndex = null, messageContent = null) => {
    e?.preventDefault()

    let newMessages, newApiMessages, userMessage

    if (retryIndex !== null) {
      updateUiState({ retryingMessageIndex: retryIndex })
      userMessage = messages[retryIndex].content

      const messagesUpToRetry = messages.slice(0, retryIndex + 1)
      newMessages = messagesUpToRetry

      newApiMessages = messagesUpToRetry
        .filter((msg) => msg.role === 'user' || !msg.isError)
        .map((msg) => ({
          role: msg.role,
          content: parseMessageContent(msg, currentLanguage.name),
        }))
    } else {
      userMessage = messageContent || input

      const apiMessages = messages
        .filter((msg) => !msg.isError)
        .map((msg) => ({
          role: msg.role,
          content: parseMessageContent(msg, currentLanguage.name),
        }))

      newMessages = [...messages, { role: 'user', content: userMessage }]
      newApiMessages = [...apiMessages, { role: 'user', content: userMessage }]
      setMessages(newMessages)
    }

    if (retryIndex === null) {
      setInput('')
      setSuggestions([])
    }

    updateUiState({ isLoading: true })
    
    const createErrorMessage = (text) => ({
      role: 'assistant',
      content: { text, english: text },
      isError: true,
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newApiMessages,
          language: settings.currentLanguage,
          personality: currentLanguage.personality,
        }),
      })
      const data = await response.json()

      if (data.error) {
        console.error('API Error:', data.error)
        setMessages([
          ...newMessages,
          createErrorMessage('Sorry, there was an error processing your message. Please try again.'),
        ])
      } else if (data.output) {
        setMessages([...newMessages, { role: 'assistant', content: data.output }])
      } else {
        console.error('Unexpected API response format:', data)
        setMessages([
          ...newMessages,
          createErrorMessage('Received an unexpected response format. Please try again.'),
        ])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages([
        ...newMessages,
        createErrorMessage(
          'Sorry, I encountered an error. Please check your connection and try again.',
        ),
      ])
    }

    updateUiState({ isLoading: false, retryingMessageIndex: null })
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <form
          onSubmit={handlePasswordSubmit}
          className="p-8 bg-white/10 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/20 w-full max-w-sm"
        >
          <h2 className="text-xl text-white font-semibold mb-4 text-center">Enter Access Code</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/20 text-white placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Password"
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Trilinguo</title>
        <meta name="description" content="Trilinguo is a chat duolingo app." />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>

      {/* Main App Container */}
      <div className={`${inter.className} flex flex-col h-[100dvh] relative text-white overflow-hidden`}>
        {/* Liquid Glass Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-all duration-300 ${uiState.showMobileMenu ? 'blur-sm' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <Header
          currentLanguage={currentLanguage}
          showRomanization={showRomanization}
          showEnglish={showEnglish}
          messages={messages}
          uiState={uiState}
          updateUiState={updateUiState}
          updateSettings={updateSettings}
          handleClearChat={handleClearChat}
          handleLanguageChange={handleLanguageChange}
          languageDropdownRef={languageDropdownRef}
        />

        <SettingsMenu
          uiState={uiState}
          updateUiState={updateUiState}
          mobileMenuRef={mobileMenuRef}
          settings={settings}
          updateSettings={updateSettings}
          handleLanguageChange={handleLanguageChange}
          handleClearChat={handleClearChat}
          messages={messages}
        />

        {/* Chat Container */}
        <div className={`relative flex-1 flex flex-col max-w-4xl mx-auto w-full z-10 min-h-0 transition-all duration-300 ${uiState.showMobileMenu ? 'blur-sm' : ''}`}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4 min-h-0">
            {messages.length === 0 ? (
              <WelcomeScreen
                currentLanguage={currentLanguage}
                loadingStarters={loadingStarters}
                conversationStarters={conversationStarters}
                handleStarterClick={handleStarterClick}
              />
            ) : (
              <ChatHistory
                messages={messages}
                uiState={uiState}
                currentLanguage={currentLanguage}
                showRomanization={showRomanization}
                showEnglish={showEnglish}
                handleSubmit={handleSubmit}
                updateUiState={updateUiState}
                messagesEndRef={messagesEndRef}
              />
            )}
          </div>

          <ChatInput
            settings={settings}
            suggestions={suggestions}
            input={input}
            setInput={setInput}
            setSuggestions={setSuggestions}
            handleSubmit={handleSubmit}
            inputRef={inputRef}
          />
        </div>
      </div>

      <CulturalContextPanel
        culturalContext={uiState.culturalContextModal}
        onClose={() => updateUiState({ culturalContextModal: null })}
      />

      <ClearChatModal
        isOpen={uiState.showClearConfirmModal}
        onClose={() => updateUiState({ showClearConfirmModal: false })}
        onConfirm={confirmClearChat}
        currentLanguageName={currentLanguage.name}
      />
    </>
  )
}
