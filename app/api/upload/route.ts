import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { projectPhotos } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenantContext } from '@/lib/tenant/context';

const UPLOAD_DIR = process.env.STORAGE_LOCAL_PATH ?? './uploads';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request) {
  const ctx = await requireTenantContext();

  const form = await req.formData();
  const file = form.get('file');
  const projectId = String(form.get('projectId') ?? '');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId obrigatorio' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo invalido' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo maior que 10MB' }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Tipo nao permitido (JPG/PNG/WebP)' }, { status: 415 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const tenantDir = path.join(UPLOAD_DIR, ctx.tenantId, projectId);
  const filePath = path.join(tenantDir, filename);

  await mkdir(tenantDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // URL publica
  const publicUrl = `/api/files/${ctx.tenantId}/${projectId}/${filename}`;

  // Conta quantas fotos o projeto ja tem (para position)
  const existing = await db
    .select({ id: projectPhotos.id })
    .from(projectPhotos)
    .where(projectPhotos.projectId === projectId);

  const [created] = await db
    .insert(projectPhotos)
    .values({
      tenantId: ctx.tenantId,
      projectId,
      url: publicUrl,
      path: filePath,
      kind: 'ambiente',
      position: existing.length,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    photo: {
      id: created.id,
      url: created.url,
      kind: created.kind,
      position: created.position,
    },
  });
}

export async function DELETE(req: Request) {
  const ctx = await requireTenantContext();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(projectPhotos)
    .where(and(eq(projectPhotos.id, id), eq(projectPhotos.tenantId, ctx.tenantId)))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: 'Foto nao encontrada' }, { status: 404 });
  }

  await db
    .delete(projectPhotos)
    .where(and(eq(projectPhotos.id, id), eq(projectPhotos.tenantId, ctx.tenantId)));

  // Tenta remover arquivo do disco (best effort)
  try {
    await unlink(row.path);
  } catch {
    // Ignora se ja foi removido
  }

  return NextResponse.json({ ok: true });
}
