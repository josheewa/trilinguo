import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const client = new OpenAI()
export const runtime = 'edge'

// Map language codes to appropriate OpenAI TTS voices
// Based on voice quality and naturalness for each language
const VOICE_MAP = {
  'zh-tw': 'nova',     // Clear, natural female voice - good for Chinese tones
  'zh-cn': 'alloy',    // Neutral, versatile voice - good for mainland pronunciation  
  'ja': 'shimmer',     // Soft, clear voice - works well with Japanese pitch accent
  'ko': 'nova',        // Clear articulation - good for Korean consonant clusters
  'fr': 'echo',        // Rich, expressive voice - good for French liaisons and rhythm
}

// Extract text content from message for TTS
const extractTextForTTS = (messageContent, language) => {
  if (!messageContent) return ''
  
  // For languages with characters array (Chinese, Japanese, Korean)
  if (messageContent.characters && Array.isArray(messageContent.characters)) {
    return messageContent.characters.map(char => char.text).join('')
  }
  
  // For text-based languages (French) or fallback
  if (messageContent.text) {
    return messageContent.text
  }
  
  return ''
}

export default async function POST(req) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageContent, language = 'zh-tw' } = await req.json()
    
    if (!messageContent) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const textToSpeak = extractTextForTTS(messageContent, language)
    
    if (!textToSpeak.trim()) {
      return NextResponse.json({ error: 'No text content found to synthesize' }, { status: 400 })
    }

    // Validate text length (OpenAI TTS has a limit of 4096 characters)
    if (textToSpeak.length > 4000) {
      return NextResponse.json({ 
        error: 'Text too long for synthesis',
        details: 'Maximum 4000 characters supported' 
      }, { status: 400 })
    }

    const voice = VOICE_MAP[language] || 'alloy'

    // Generate speech using OpenAI TTS
    const mp3Response = await client.audio.speech.create({
      model: 'tts-1', // Use tts-1 for speed (streaming), tts-1-hd for quality
      voice: voice,
      input: textToSpeak,
      response_format: 'mp3',
    })

    // Convert the response to a buffer
    const audioBuffer = await mp3Response.arrayBuffer()
    
    // Validate audio response
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from OpenAI')
    }
    
    // Return audio as blob with proper headers for caching
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': 'inline',
        'X-Audio-Text-Length': textToSpeak.length.toString(), // Debug info
      },
    })
  } catch (error) {
    console.error('TTS API Error:', error)
    
    // Provide specific error messages based on error type
    if (error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        details: 'Please wait a moment before trying again' 
      }, { status: 429 })
    }
    
    if (error.message?.includes('quota')) {
      return NextResponse.json({ 
        error: 'Service temporarily unavailable',
        details: 'Please try again later' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate speech',
      details: error.message?.substring(0, 100) || 'Unknown error' 
    }, { status: 500 })
  }
}