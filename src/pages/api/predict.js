import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI()
export const runtime = 'edge'

// Language-specific prediction prompts
const PREDICTION_PROMPTS = {
  'zh-tw': 'You are helping a Traditional Chinese learner. Complete their sentence naturally in Traditional Chinese. Be concise - provide only 1-2 short, likely completions.',
  'zh-cn': 'You are helping a Simplified Chinese learner. Complete their sentence naturally in Simplified Chinese. Be concise - provide only 1-2 short, likely completions.',
  'ja': 'You are helping a Japanese learner. Complete their sentence naturally in Japanese. Be concise - provide only 1-2 short, likely completions.',
  'ko': 'You are helping a Korean learner. Complete their sentence naturally in Korean. Be concise - provide only 1-2 short, likely completions.',
  'fr': 'You are helping a French learner. Complete their sentence naturally in French. Be concise - provide only 1-2 short, likely completions.'
}

export default async function POST(req, res) {
  try {
    const { input, language = 'zh-tw', context = [] } = await req.json()
    
    // Only predict for inputs with 2+ characters and less than 50 characters
    if (!input || input.length < 2 || input.length > 50) {
      return NextResponse.json({ suggestions: [] })
    }

    const prompt = PREDICTION_PROMPTS[language] || PREDICTION_PROMPTS['zh-tw']
    
    // Create context from recent messages if available
    const contextString = context.length > 0 
      ? `Recent conversation context: ${context.slice(-3).map(msg => msg.content).join(' ')}\n\n`
      : ''

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${prompt}
          
Rules:
- Only complete the sentence, don't repeat the input
- Provide 1-2 natural completions maximum
- Keep completions short (5-15 characters)
- Return only the completion text, no explanations
- If input seems complete, return empty array
- Format as JSON array of strings: ["completion1", "completion2"]`
        },
        {
          role: 'user',
          content: `${contextString}Complete this: "${input}"`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    })

    const assistantOutput = response.choices[0].message.content.trim()
    
    try {
      // Try to parse as JSON array
      const suggestions = JSON.parse(assistantOutput)
      if (Array.isArray(suggestions)) {
        return NextResponse.json({ 
          suggestions: suggestions.slice(0, 2).filter(s => s && s.length > 0) 
        })
      }
    } catch (parseError) {
      // If not valid JSON, try to extract suggestions
      const lines = assistantOutput.split('\n').filter(line => line.trim())
      const suggestions = lines.slice(0, 2).map(line => line.replace(/^[-•\d.\s]+/, '').trim())
      
      return NextResponse.json({ 
        suggestions: suggestions.filter(s => s && s.length > 0 && s.length < 50)
      })
    }

    return NextResponse.json({ suggestions: [] })
  } catch (error) {
    console.error('Predict API Error:', error)
    return NextResponse.json({ suggestions: [] })
  }
} 