import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productModels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function GET(req: Request) {
  const session = await auth();
  console.error('[api/product-models] session:', session?.user?.email, 'tenant:', session?.user?.tenantId);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  console.error('[api/product-models] productId:', productId);
  if (!productId) {
    return NextResponse.json({ error: 'productId obrigatorio' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(productModels)
    .where(
      and(eq(productModels.productId, productId), eq(productModels.tenantId, session.user.tenantId))
    );
  console.error('[api/product-models] rows count:', rows.length);

  return NextResponse.json(rows);
}
