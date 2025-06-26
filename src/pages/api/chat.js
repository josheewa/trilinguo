import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const client = new OpenAI()
export const runtime = 'edge'

// Language-specific response schemas
const ChineseResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const JapaneseResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const KoreanResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const FrenchResponseSchema = z.object({
  text: z.string(),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

// Schema mapping
const getResponseSchema = (languageCode) => {
  switch (languageCode) {
    case 'zh-tw':
    case 'zh-cn':
      return ChineseResponseSchema
    case 'ja':
      return JapaneseResponseSchema
    case 'ko':
      return KoreanResponseSchema
    case 'fr':
      return FrenchResponseSchema
    default:
      return ChineseResponseSchema
  }
}

// Language configurations for prompts
const LANGUAGE_CONFIGS = {
  'zh-tw': {
    languageName: 'Traditional Chinese',
    scriptName: 'Chinese characters',
    romanizationName: 'pinyin',
    romanizationExample: 'nǐ hǎo',
    culturalContext: 'Taiwan'
  },
  'zh-cn': {
    languageName: 'Simplified Chinese',
    scriptName: 'Chinese characters', 
    romanizationName: 'pinyin',
    romanizationExample: 'nǐ hǎo',
    culturalContext: 'Mainland China'
  },
  'ja': {
    languageName: 'Japanese',
    scriptName: 'Japanese characters',
    romanizationName: 'romaji',
    romanizationExample: 'arigatou',
    culturalContext: 'Japan'
  },
  'ko': {
    languageName: 'Korean',
    scriptName: 'Korean characters',
    romanizationName: 'romanization',
    romanizationExample: 'annyeonghaseyo',
    culturalContext: 'South Korea'
  },
  'fr': {
    languageName: 'French',
    scriptName: 'French text',
    romanizationName: null,
    romanizationExample: null,
    culturalContext: 'France'
  }
}

// Generate parameterized system prompt
const createSystemPrompt = (languageCode, personality) => {
  const config = LANGUAGE_CONFIGS[languageCode]
  const hasRomanization = config.romanizationName !== null
  
  return `
<role>
You are ${personality.name}, ${personality.description}
</role>

<instructions>
CRITICAL BEHAVIORAL RULES:
1. DEFAULT TO CONVERSATION: Unless the user explicitly asks for translation (using words like "translate", "how do you say", "what does X mean"), ALWAYS respond conversationally in ${config.languageName}
2. TRANSLATION MODE: Only activate when user explicitly requests translation with phrases like:
   - "Translate this: [text]"
   - "How do you say [text] in ${config.languageName}?"
   - "What does [text] mean in English?"
   - "Translate [text] to ${config.languageName}"
3. CONVERSATION MODE (default): For ALL other inputs, respond naturally to their question/statement in ${config.languageName}

CONVERSATION GUIDELINES:
- Respond naturally to what the user is saying/asking, don't just translate their words
- If user asks "How are you?" respond with how you are, don't translate "How are you?"
- If user asks "What should I eat?" suggest foods, don't translate "What should I eat?"
- If user speaks in ${config.languageName}, continue the conversation naturally in ${config.languageName}
- If user speaks in ${config.languageName} and makes mistakes, gently correct them while responding to their query
- NEVER repeat or echo the user's input back to them
- Provide helpful, natural responses that advance the conversation
- When teaching vocabulary/grammar, provide examples and explanations in context
- Include cultural context when it adds value to understanding ${config.culturalContext} culture

FORMATTING:
${hasRomanization ? `- Break down your ${config.languageName} responses character by character with ${config.romanizationName}` : '- Provide your response in natural ${config.languageName}'}
- Always include English translation of your response for learning purposes
</instructions>

<format>
${hasRomanization ? `
All responses must follow this format for languages with romanization:
{
  "characters": [
    {
      "text": "string",
      "romanization": "string"
    }
  ],
  "english": "string",
  "culturalContext": "string or null"
}
- ${config.romanizationName.charAt(0).toUpperCase() + config.romanizationName.slice(1)} should be in the proper format with accents, like ${config.romanizationExample}
- Each ${config.scriptName.toLowerCase()} should have its accompanying ${config.romanizationName}
- ${config.romanizationName.charAt(0).toUpperCase() + config.romanizationName.slice(1)} MUST line up with the characters, no more, no less
- For punctuation marks (！？。，), include them directly with the preceding character instead of as separate entries
- Keep responses natural and flowing, not overly segmented
` : `
All responses must follow this format for languages without romanization:
{
  "text": "string",
  "english": "string", 
  "culturalContext": "string or null"
}
`}
- English translation should be natural and conversational
- culturalContext should explain cultural nuances, slang meanings, or cultural references when relevant
- Set culturalContext to null if there are no meaningful cultural insights to share, otherwise provide a helpful cultural explanation
</format>
`
}

export default async function POST(req, res) {
  try {
    const { messages, language = 'zh-tw', personality } = await req.json()
    
    if (!personality) {
      return NextResponse.json({ error: 'Personality data is required' }, { status: 400 })
    }

    const responseSchema = getResponseSchema(language)
    const systemPrompt = createSystemPrompt(language, personality)
    const responseFormat = zodResponseFormat(responseSchema, 'response')

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      response_format: responseFormat,
    })

    const assistantOutput = response.choices[0].message.content
    let parsedOutput
    
    try {
      parsedOutput = JSON.parse(assistantOutput)
    } catch (parseError) {
      console.error(`JSON Parse Error for ${language}:`, {
        error: parseError.message,
        content: assistantOutput,
      })
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`)
    }

    return NextResponse.json({ output: parsedOutput })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: error.message 
    }, { status: 500 })
  }
}
