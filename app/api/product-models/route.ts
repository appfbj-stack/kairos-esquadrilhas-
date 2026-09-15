import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productModels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId obrigatorio' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(productModels)
    .where(
      and(eq(productModels.productId, productId), eq(productModels.tenantId, session.user.tenantId))
    );

  return NextResponse.json(rows);
}
