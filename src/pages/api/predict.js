import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI()
export const runtime = 'edge'

const LANGUAGES = {
  'zh-tw': 'Traditional Chinese',
  'zh-cn': 'Simplified Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'fr': 'French',
}

export default async function POST(req) {
  try {
    const { input, language = 'zh-tw', context = [], count = 3 } = await req.json()

    // Only predict for inputs with 2+ characters and less than 80 characters
    if (!input || input.length < 2 || input.length > 80) {
      return NextResponse.json({ suggestions: [] })
    }

    // Stop predictions if input ends with sentence-ending punctuation
    if (/[.!?。！？]$/.test(input.trim())) {
      return NextResponse.json({ suggestions: [] })
    }

    const languageName = LANGUAGES[language] || 'the target language'

    // Create context from recent messages if available
    const contextString =
      context.length > 0
        ? `This is the recent conversation history for context:
${context
  .slice(-2)
  .map(
    (msg) =>
      `${msg.role}: ${
        typeof msg.content === 'string'
          ? msg.content
          : msg.content?.text || JSON.stringify(msg.content) || ''
      }`,
  )
  .join('\n')}`
        : 'There is no previous conversation history.'

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI autocomplete assistant for a language learning app.
The user is typing in ${languageName} and needs help completing their sentence.
Your task is to provide natural, realistic, and useful sentence completions.

${contextString}

Rules:
1.  Provide up to ${count} likely, complete, and natural-sounding continuations of the user's input text.
2.  Return a JSON object with a "suggestions" key containing an array of strings, like: {"suggestions": ["completion one", "completion two"]}.
3.  **Crucially, each completion you provide MUST start with the user's exact input text.** For example, if the input is "I want to", your output could be {"suggestions": ["I want to go to the park", "I want to eat pizza"]}.
4.  Keep completions concise and practical for a language learner.
5.  Do NOT suggest vague placeholders. For "How do I say...", suggest concrete words to translate, not "this" or "something".
6.  If no good continuations are possible, return an object with an empty array: {"suggestions": []}.
7.  The output must be ONLY the JSON object. Do not add any other text or explanation.`,
        },
        {
          role: 'user',
          content: `Here is my current text, please complete it: "${input}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
      response_format: { type: 'json_object' }, // Using JSON mode for reliability
    })

    const assistantOutput = response.choices[0].message.content
    
    try {
      const parsed = JSON.parse(assistantOutput)
      const suggestions = parsed.suggestions || []

      if (Array.isArray(suggestions)) {
        const uniqueSuggestions = [
          ...new Set(
            suggestions
              .slice(0, count)
              .filter(
                (s) =>
                  s &&
                  typeof s === 'string' &&
                  s.length > 0 &&
                  s.length < 100 &&
                  s.toLowerCase().startsWith(input.toLowerCase()) && // Sanity check
                  s.toLowerCase() !== input.toLowerCase(), // Don't suggest the input itself
              )
              .map((s) => s.trim()),
          ),
        ]
        return NextResponse.json({ suggestions: uniqueSuggestions })
      }
    } catch (parseError) {
      console.error('Predict API JSON parse error:', parseError, 'Raw output:', assistantOutput)
      return NextResponse.json({ suggestions: [] })
    }

    return NextResponse.json({ suggestions: [] })
  } catch (error) {
    console.error('Predict API Error:', error)
    // Don't expose internal errors to the client
    return NextResponse.json({ suggestions: [] })
  }
} 