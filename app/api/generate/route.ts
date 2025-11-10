import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Build the messages array
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant integrated into MindCanvas AI, a visual knowledge management tool. Provide clear, concise, and helpful responses.',
      },
    ];

    // Add context if provided
    if (context && context.length > 0) {
      const contextText = context
        .map((ctx: any) => `${ctx.label || 'Context'}:\n${ctx.content}`)
        .join('\n\n');
      
      messages.push({
        role: 'user',
        content: `Here is some context:\n\n${contextText}`,
      });
    }

    // Add the actual prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to generate response' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';

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

