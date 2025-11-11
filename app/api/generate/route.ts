import { NextRequest, NextResponse } from 'next/server';

type AIProvider = 'openai' | 'gemini' | 'claude';

async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  model: string = 'gpt-4o'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(
  prompt: string,
  systemPrompt: string,
  model: string = 'gemini-1.5-pro'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY not configured');
  }

  // Combine system prompt and user prompt for Gemini
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(
  prompt: string,
  systemPrompt: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const messages = [
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemPrompt || undefined,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, agent } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Determine provider and configuration
    const provider: AIProvider = agent?.provider || 'openai';
    const model = agent?.model || (provider === 'openai' ? 'gpt-4o' : provider === 'gemini' ? 'gemini-1.5-pro' : 'claude-3-5-sonnet-20241022');
    const systemPrompt = agent?.systemPrompt || 'You are a helpful AI assistant integrated into MindCanvas AI, a visual knowledge management tool. Provide clear, concise, and helpful responses.';
    
    // Build context text from connected nodes
    let contextText = '';
    if (context && context.length > 0) {
      contextText = context
        .map((ctx: any) => {
          const label = ctx.label || 'Untitled';
          const content = ctx.content || '';
          return `${label}:\n${content}`;
        })
        .join('\n\n---\n\n');
    }

    // Build the final prompt in the required format
    let taskPrompt = `<Task>\n\n${prompt}\n\n`;
    
    if (contextText) {
      taskPrompt += `<Context>\n\n${contextText}\n\n`;
    } else {
      taskPrompt += `<Context>\n\n(No context provided)\n\n`;
    }

    // Log the final prompt for debugging
    console.log('\n========== FINAL PROMPT TO AI ==========');
    console.log(`Provider: ${provider}, Model: ${model}`);
    console.log(`System Prompt:\n${systemPrompt || '(empty)'}`);
    console.log(`Task Prompt:\n${taskPrompt}`);
    console.log('\n========================================\n');

    // Call the appropriate API
    // For OpenAI and Claude, we pass system prompt separately
    // For Gemini, we combine everything
    let generatedText: string;
    switch (provider) {
      case 'openai':
        generatedText = await callOpenAI(taskPrompt, systemPrompt, model);
        break;
      case 'gemini':
        // For Gemini, combine system prompt and task prompt
        const geminiPrompt = systemPrompt 
          ? `<Role>\n\n${systemPrompt}\n\n${taskPrompt}`
          : taskPrompt;
        generatedText = await callGemini(geminiPrompt, '', model);
        break;
      case 'claude':
        generatedText = await callClaude(taskPrompt, systemPrompt, model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('Generated text length:', generatedText.length);
    
    return NextResponse.json({
      content: generatedText,
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

