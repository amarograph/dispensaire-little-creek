/**
 * /api/redm/upload-portrait
 *
 * PRÉREQUIS — créer le bucket dans Supabase Storage (Dashboard → Storage → New bucket) :
 *   Nom     : portraits
 *   Public  : ✔ (les images sont accessibles publiquement)
 *   Max size: 5 MB
 *
 * Ensuite ajouter la policy RLS (Dashboard → Storage → portraits → Policies) :
 *   CREATE POLICY "service role storage" ON storage.objects
 *     FOR ALL TO service_role USING (bucket_id = 'portraits') WITH CHECK (bucket_id = 'portraits');
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRedmStaff } from '@/lib/redm-api-auth';

export async function POST(req: NextRequest) {
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { dataUrl } = body as { dataUrl?: string };
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
  }

  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mime      = mimeMatch?.[1] ?? 'image/jpeg';
  const ext       = mime.split('/')[1] === 'png' ? 'png' : 'jpg';
  const base64    = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer    = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 5 Mo)' }, { status: 413 });
  }

  const filename = `redm_${ctx.discordId}_${Date.now()}.${ext}`;
  const db = await createServiceClient();

  const { error: uploadErr } = await db.storage
    .from('portraits')
    .upload(filename, buffer, { contentType: mime, upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from('portraits').getPublicUrl(filename);
  return NextResponse.json({ url: publicUrl });
}
