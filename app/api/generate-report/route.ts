import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userContent } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Voici les informations du rapport :\n\n${userContent}\n\nGénère le rapport médical complet.` }],
      }),
    });

    const data = await response.json();
    const report = data.content?.[0]?.text ?? '';

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: 'Erreur génération' }, { status: 500 });
  }
}