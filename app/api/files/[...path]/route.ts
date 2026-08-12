import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth/config';

const UPLOAD_DIR = process.env.STORAGE_LOCAL_PATH ?? './uploads';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

type Params = { path: string[] };

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const segments = params.path;
  if (!segments || segments.length < 3) {
    return new NextResponse('Bad path', { status: 400 });
  }

  const [tenantId, projectId, ...rest] = segments;
  // tenantId no path deve bater com o do usuario logado
  if (tenantId !== session.user.tenantId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const filename = rest.join('/');
  // Bloqueia path traversal
  if (filename.includes('..') || filename.includes('\0')) {
    return new NextResponse('Bad path', { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, tenantId, projectId, filename);
  try {
    await stat(filePath);
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
