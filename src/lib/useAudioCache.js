import { useState, useRef, useCallback, useEffect } from 'react'

export const useAudioCache = () => {
  // Local cache per hook instance - no global sharing
  const audioCache = useRef(new Map())
  const audioRefs = useRef(new Map())
  
  const [loadingStates, setLoadingStates] = useState(new Map())
  const [playingStates, setPlayingStates] = useState(new Map())
  const [errorStates, setErrorStates] = useState(new Map())

  // Set loading state for a specific message
  const setLoading = useCallback((messageId, isLoading) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev)
      if (isLoading) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Set playing state for a specific message
  const setPlaying = useCallback((messageId, isPlaying) => {
    setPlayingStates(prev => {
      const newStates = new Map(prev)
      if (isPlaying) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Set error state for a specific message
  const setError = useCallback((messageId, errorMessage) => {
    setErrorStates(prev => {
      const newStates = new Map(prev)
      if (errorMessage) {
        newStates.set(messageId, errorMessage)
        // Clear error after 5 seconds
        setTimeout(() => {
          setErrorStates(current => {
            const updated = new Map(current)
            updated.delete(messageId)
            return updated
          })
        }, 5000)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Generate and cache audio for a specific message
  const generateAudio = useCallback(async (messageContent, language, messageId) => {
    // Check if we already have cached audio for this specific message
    if (audioCache.current.has(messageId)) {
      return { success: true, audioUrl: audioCache.current.get(messageId) }
    }

    setLoading(messageId, true)

    try {
      // Normalize and validate input text before making the request
      const text = typeof messageContent === 'string' 
        ? messageContent 
        : (messageContent?.text || (Array.isArray(messageContent?.characters) ? messageContent.characters.map(c => c.text).join('') : ''))

      if (!text || !text.trim()) {
        throw new Error('Nothing to read aloud')
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Send a plain string to simplify server parsing
          messageContent: text,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Please wait a moment before trying again')
        } else if (response.status === 503) {
          throw new Error('Audio service temporarily unavailable')
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again')
        } else {
          throw new Error(errorData.details || errorData.error || `Error: ${response.status}`)
        }
      }

      const audioBlob = await response.blob()
      
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data received')
      }
      
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Cache the audio URL for this specific message only
      audioCache.current.set(messageId, audioUrl)
      
      return { success: true, audioUrl }
    } catch (error) {
      console.error('Error generating audio:', error)
      return { success: false, error: error.message || 'Failed to generate audio' }
    } finally {
      setLoading(messageId, false)
    }
  }, [setLoading])

  // Play audio for a message
  const playAudio = useCallback(async (messageContent, language, messageId) => {
    // Clear any existing error
    setError(messageId, null)
    
    // Stop any currently playing audio
    audioRefs.current.forEach((audio, id) => {
      if (id !== messageId && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
        setPlaying(id, false)
      }
    })

    // Check if we have cached audio for this message
    let audioUrl = audioCache.current.get(messageId)
    
    // Generate audio if not cached for this specific message
    if (!audioUrl) {
      const result = await generateAudio(messageContent, language, messageId)
      if (!result.success) {
        setError(messageId, result.error)
        return
      }
      audioUrl = result.audioUrl
    }

    if (!audioUrl) {
      setError(messageId, 'No audio available')
      return
    }

    // Create or get audio element for this specific message
    let audio = audioRefs.current.get(messageId)
    if (!audio) {
      audio = new Audio(audioUrl)
      audioRefs.current.set(messageId, audio)
      
      // Setup event listeners
      audio.addEventListener('ended', () => {
        setPlaying(messageId, false)
      })
      
      audio.addEventListener('error', (event) => {
        console.error('Audio playback error:', event)
        setPlaying(messageId, false)
        setError(messageId, 'Audio playback failed')
      })
    }

    // Play audio
    try {
      setPlaying(messageId, true)
      await audio.play()
    } catch (error) {
      console.error('Audio play error:', error)
      setPlaying(messageId, false)
      setError(messageId, 'Could not play audio')
    }
  }, [generateAudio, setPlaying, setError])

  // Stop audio for a message
  const stopAudio = useCallback((messageId) => {
    const audio = audioRefs.current.get(messageId)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPlaying(messageId, false)
  }, [setPlaying])

  // Get loading state for a message
  const isLoading = useCallback((messageId) => {
    return loadingStates.has(messageId)
  }, [loadingStates])

  // Get playing state for a message
  const isPlaying = useCallback((messageId) => {
    return playingStates.has(messageId)
  }, [playingStates])

  // Get error state for a message
  const getError = useCallback((messageId) => {
    return errorStates.get(messageId) || null
  }, [errorStates])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop all audio
    audioRefs.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    audioRefs.current.clear()
    
    // Clean up audio URLs to prevent memory leaks
    audioCache.current.forEach((audioUrl) => {
      URL.revokeObjectURL(audioUrl)
    })
    audioCache.current.clear()
    
    // Clear states
    setLoadingStates(new Map())
    setPlayingStates(new Map())
    setErrorStates(new Map())
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    getError,
    cleanup,
  }
}