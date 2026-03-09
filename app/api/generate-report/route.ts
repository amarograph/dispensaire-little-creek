import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { template, values } = await req.json();

    let report = template;
    Object.entries(values).forEach(([key, value]) => {
      report = report.replaceAll(`{{${key}}}`, value as string);
    });

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: 'Erreur génération' }, { status: 500 });
  }
}