import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Phone, MessageCircle, Ruler, Palette, Square, FileText, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProject, getProjectPhotos, getOrCreateQuote } from '@/lib/actions/projects';
import { db } from '@/lib/db';
import { products, productModels, customers, colors as colorsT, glasses as glassesT } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireTenantContext } from '@/lib/tenant/context';
import { formatBRL } from '@/lib/utils';
import { ProjectViewer3D } from './project-viewer-3d';
import { Colors as ViewerColors, Glasses as ViewerGlasses, type GlassKey } from '@/components/viewer3d/Materials';

export const metadata = { title: 'Projeto' };

const PRODUCT_TO_KIND: Record<string, 'janela' | 'porta' | 'box' | 'guarda_corpo' | 'corrimao' | 'fechamento' | 'fachada'> = {
  janela: 'janela',
  porta: 'porta',
  box: 'box',
  guarda_corpo: 'guarda_corpo',
  corrimao: 'corrimao',
  fechamento: 'fechamento',
  fachada: 'fachada',
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireTenantContext();
  const project = await getProject(params.id);
  if (!project) notFound();

  const [photos, quote, product, model, customer, color, glass] = await Promise.all([
    getProjectPhotos(params.id),
    getOrCreateQuote(params.id),
    project.productId
      ? db.select().from(products).where(eq(products.id, project.productId)).limit(1).then((r) => r[0])
      : Promise.resolve(null),
    project.modelId
      ? db.select().from(productModels).where(eq(productModels.id, project.modelId)).limit(1).then((r) => r[0])
      : Promise.resolve(null),
    project.customerId
      ? db.select().from(customers).where(eq(customers.id, project.customerId)).limit(1).then((r) => r[0])
      : Promise.resolve(null),
    project.colorId
      ? db.select().from(colorsT).where(eq(colorsT.id, project.colorId)).limit(1).then((r) => r[0])
      : Promise.resolve(null),
    project.glassId
      ? db.select().from(glassesT).where(eq(glassesT.id, project.glassId)).limit(1).then((r) => r[0])
      : Promise.resolve(null),
  ]);

  const kind = product ? PRODUCT_TO_KIND[product.category] ?? 'janela' : 'janela';
  const colorHex = color?.hex ?? ViewerColors.preto;
  const glassKey: GlassKey = (glass?.type as GlassKey) ?? 'incolor';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/projetos" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{project.title}</h1>
          <p className="text-xs text-muted-foreground">
            {project.code} · {project.status}
          </p>
        </div>
      </div>

      {project.widthMm && project.heightMm && (
        <div className="aspect-square w-full sm:aspect-[16/10]">
          <ProjectViewer3D
            kind={kind}
            widthMm={project.widthMm}
            heightMm={project.heightMm}
            depthMm={project.depthMm}
            modules={project.modulesCount}
            leaves={project.leavesCount}
            opening={project.opening ?? undefined}
            colorHex={colorHex}
            glassKey={glassKey}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {customer && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{customer.name}</p>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </a>
              )}
              {customer.whatsapp && (
                <a
                  href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3 w-3" />
                  {customer.whatsapp}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {product && <p className="font-medium">{product.name}</p>}
            {model && <p className="text-muted-foreground">Modelo: {model.name}</p>}
            {project.opening && <p className="text-muted-foreground">Abertura: {project.opening}</p>}
          </CardContent>
        </Card>

        {project.widthMm && project.heightMm && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                Medidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <strong>{project.widthMm} mm</strong> × <strong>{project.heightMm} mm</strong>
              </p>
              {project.depthMm && <p className="text-muted-foreground">Profundidade: {project.depthMm} mm</p>}
              <p className="text-muted-foreground">
                Area: {((project.widthMm * project.heightMm) / 1_000_000).toFixed(2)} m²
              </p>
              {project.leavesCount && <p className="text-muted-foreground">Folhas: {project.leavesCount}</p>}
              {project.modulesCount && <p className="text-muted-foreground">Modulos: {project.modulesCount}</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              Acabamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {color && (
              <p className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border" style={{ background: color.hex ?? '#888' }} />
                Cor: <strong>{color.name}</strong>
              </p>
            )}
            {glass && (
              <p>
                Vidro: <strong>{glass.name}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {photos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              Fotos ({photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {quote && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Orcamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Materiais" value={Number(quote.materialsTotal)} />
            <Row label="Vidro" value={Number(quote.glassTotal)} />
            <Row label="Ferragens" value={Number(quote.hardwareTotal)} />
            <Row label="Mao de obra" value={Number(quote.laborTotal)} />
            <Row label="Instalacao" value={Number(quote.installationTotal)} />
            <Row label="Desperdicio" value={Number(quote.wasteTotal)} />
            <Row label="Margem" value={Number(quote.marginTotal)} />
            {Number(quote.extrasTotal) > 0 && <Row label="Extras" value={Number(quote.extrasTotal)} />}
            {Number(quote.discount) > 0 && <Row label="Desconto" value={-Number(quote.discount)} />}
            <div className="border-t pt-2">
              <Row label={<strong>Total</strong>} value={Number(quote.total)} big />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="lg" asChild className="flex-1">
          <Link href={`/projetos/novo?pid=${project.id}`}>
            <Square className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button size="lg" className="flex-1" disabled>
          <FileText className="h-4 w-4" />
          Gerar proposta (em breve)
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, big }: { label: React.ReactNode; value: number; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'text-base' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={big ? 'font-bold' : 'font-medium'}>{formatBRL(value)}</span>
    </div>
  );
}
