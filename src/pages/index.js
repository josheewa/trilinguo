import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, useAuth, SignIn, SignUp } from '@clerk/nextjs'
import { LANGUAGES } from '../config/languages'
import { defaultSettings } from '../config/settings'
import {
  loadSettings,
  saveSettings,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
} from '../lib/storage'
import Header from '../components/Header'
import SettingsMenu from '../components/SettingsMenu'
import ChatInput from '../components/ChatInput'
import WelcomeScreen from '../components/WelcomeScreen'
import ChatHistory from '../components/ChatHistory'
import CulturalContextPanel from '../components/CulturalContextPanel'
import ClearChatModal from '../components/ClearChatModal'

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
  // Clerk authentication
  const { isSignedIn, isLoaded } = useUser()
  const { signOut } = useAuth()

  // Core app state
  const [settings, setSettings] = useState(defaultSettings)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // UI state - consolidated for better management
  const [uiState, setUiState] = useState({
    showLanguageDropdown: false,
    showUserDropdown: false,
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
      showUserDropdown: false,
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
    if (isSignedIn) {
      loadConversationStarters()
    }
  }, [settings.currentLanguage, isSignedIn, loadConversationStarters])

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(settings.currentLanguage, messages)
    }
  }, [messages, settings.currentLanguage])

  // Handle outside clicks and escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside language dropdown (including the dropdown menu itself)
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        // Also check if the click is on the dropdown menu (which is rendered separately)
        const dropdownMenu = document.querySelector('.glass-dropdown-fixed')
        if (!dropdownMenu || !dropdownMenu.contains(event.target)) {
          updateUiState({ showLanguageDropdown: false })
        }
      }
      // Check if click is outside user dropdown
      const userDropdown = document.querySelector('[data-user-dropdown]')
      if (userDropdown && !userDropdown.contains(event.target)) {
        updateUiState({ showUserDropdown: false })
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        updateUiState({ showMobileMenu: false })
      }
    }

    const handleKeyboardShortcuts = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns()
        updateUiState({ culturalContextModal: null, showClearConfirmModal: false })
      }
      
      // Cmd/Ctrl + ',' to open settings
      if (event.key === ',' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        updateUiState({ showMobileMenu: !uiState.showMobileMenu })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    }
      }, [updateUiState, closeAllDropdowns, uiState.showMobileMenu])

  // Mouse tracking for glass hover effects - SIMPLE approach like ChatInput
  useEffect(() => {
    const handleMouseMove = (e) => {
            const glassElements = document.querySelectorAll('.glass-surface, .glass-button, .glass-button-primary, .glass-button-secondary, .glass-button-blue, .glass-button-selected, .glass-card, .glass-dropdown, .glass-dropdown-fixed, .glass-modal, .glass-surface-subtle, .glass-panel, .glass-bubble-user, .glass-bubble-assistant, .glass-input, .glass-error, .glass-button-danger, .glass-toggle-active, .glass-toggle-inactive, .glass-toggle-inactive-contrast, .glass-nav, .glass-logo, .glass-button-light, .glass-button-blue-light, .glass-button-emerald-light, .glass-button-red-light, .glass-panel .glass-button, .glass-panel .glass-button-selected, .glass-panel .glass-surface-subtle, .glass-panel .glass-error')
        
        glassElements.forEach((element) => {
          const rect = element.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          
          element.style.setProperty('--mouse-x', `${x}%`)
          element.style.setProperty('--mouse-y', `${y}%`)
        })



    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

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

  // Handle sign out
  const handleSignOut = () => {
    signOut()
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

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen liquid-bg-primary">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show authentication screen if not signed in
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen liquid-bg-primary">
        {/* Liquid Glass Background Effects */}
        <div className="absolute inset-0">
          <div className="liquid-bg-overlay absolute inset-0"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 liquid-orb-blue liquid-pulse-1"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 liquid-orb-purple liquid-pulse-2"></div>
        </div>
        
        <SignIn 
          routing="hash"
          hideDevelopmentModeMessage={true}
          appearance={{
            elements: {
              formButtonPrimary: 'glass-button-primary text-white rounded-xl font-medium',
              card: 'bg-transparent shadow-none',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-300',
              formFieldInput: 'glass-input text-white placeholder-gray-400 focus:outline-none rounded-xl',
              formFieldLabel: 'text-white',
              footerActionLink: 'text-blue-300 hover:text-blue-200',
              dividerLine: 'bg-gray-600',
              dividerText: 'text-gray-300',
              socialButtonsBlockButton: 'glass-button-secondary text-white rounded-xl',
              formFieldInputShowPasswordButton: 'text-gray-400',
              formResendCodeLink: 'text-blue-300 hover:text-blue-200',
              identityPreviewEditButton: 'text-blue-300 hover:text-blue-200',
              formFieldAction: 'text-blue-300 hover:text-blue-200',
              footerAction: 'text-gray-300',
              formFieldLabelRow: 'text-gray-300',
              formFieldHintText: 'text-gray-400',
              alertText: 'text-red-300',
              alert: 'bg-red-900/20 border-red-500/50',
              alertIcon: 'text-red-400',
              formFieldErrorText: 'text-red-300',
              formFieldError: 'border-red-500',
              formFieldSuccessText: 'text-green-300',
              formFieldSuccess: 'border-green-500',
            }
          }}
        />
      </div>
    )
  }

  

  return (
    <>
      

      {/* Main App Container - Pure Tailwind */}
      <div className="h-screen flex flex-col overflow-hidden overscroll-none text-gray-800">
        {/* Background */}
        <div className={`absolute inset-0 liquid-bg-primary`}>
          <div className="liquid-bg-overlay absolute inset-0"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 liquid-orb-blue"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 liquid-orb-purple"></div>
        </div>

        {/* Header - Fixed at top */}
        <div className="flex-none">
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
        </div>

        <SettingsMenu
          uiState={uiState}
          updateUiState={updateUiState}
          mobileMenuRef={mobileMenuRef}
          settings={settings}
          updateSettings={updateSettings}
          handleLanguageChange={handleLanguageChange}
          handleClearChat={handleClearChat}
          messages={messages}
          currentLanguage={currentLanguage}
          showRomanization={showRomanization}
          showEnglish={showEnglish}
        />

        {/* Chat Content - Scrollable with proper edge handling */}
        <div className="flex-1 overflow-y-auto overscroll-contain relative z-10">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
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
        </div>

        {/* Input - Natural flow at bottom */}
        <div className="flex-none">
          <ChatInput
            settings={settings}
            suggestions={suggestions}
            input={input}
            setInput={setInput}
            setSuggestions={setSuggestions}
            handleSubmit={handleSubmit}
            inputRef={inputRef}
          />
          
          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto w-full px-4 pb-2 sm:px-6 pb-0 relative z-20">
            <div className="text-center">
              <p className="text-base text-gray-700">
                Chats are stored locally and may disappear if you clear your browser data.
              </p>
            </div>
          </div>
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
      <footer className="footer"></footer>
    </>
  )
}