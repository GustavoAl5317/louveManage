import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Grupo = { chave: string; itens: { id: number; nome: string; created_at: string }[] };

async function encontrarGrupos(): Promise<Grupo[]> {
  const grupos: Grupo[] = [];

  const { rows: porSku } = await sql<{
    sku: string;
    ids: number[];
    nomes: string[];
    datas: string[];
  }>`
    SELECT sku,
           array_agg(id ORDER BY created_at DESC)         AS ids,
           array_agg(nome ORDER BY created_at DESC)       AS nomes,
           array_agg(created_at::text ORDER BY created_at DESC) AS datas
      FROM produtos
     WHERE sku IS NOT NULL AND sku <> ''
     GROUP BY sku
    HAVING COUNT(*) > 1`;

  for (const r of porSku) {
    grupos.push({
      chave: `SKU ${r.sku}`,
      itens: r.ids.map((id, i) => ({
        id,
        nome: r.nomes[i],
        created_at: r.datas[i],
      })),
    });
  }

  const idsJaUsados = new Set(grupos.flatMap((g) => g.itens.map((i) => i.id)));

  const { rows: porNome } = await sql<{
    nome: string;
    ids: number[];
    datas: string[];
  }>`
    SELECT LOWER(nome) AS nome,
           array_agg(id ORDER BY created_at DESC)         AS ids,
           array_agg(created_at::text ORDER BY created_at DESC) AS datas
      FROM produtos
     WHERE nome IS NOT NULL AND nome <> ''
     GROUP BY LOWER(nome)
    HAVING COUNT(*) > 1`;

  for (const r of porNome) {
    const itens = r.ids
      .map((id, i) => ({ id, nome: r.nome, created_at: r.datas[i] }))
      .filter((i) => !idsJaUsados.has(i.id));
    if (itens.length > 1) {
      grupos.push({
        chave: `Nome "${r.nome}"`,
        itens,
      });
      itens.forEach((i) => idsJaUsados.add(i.id));
    }
  }

  return grupos;
}

export async function GET() {
  await ensureSchema();
  const grupos = await encontrarGrupos();
  const totalExtras = grupos.reduce((s, g) => s + (g.itens.length - 1), 0);
  return NextResponse.json(
    { grupos, totalExtras },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  await ensureSchema();
  const grupos = await encontrarGrupos();
  let removidos = 0;
  for (const g of grupos) {
    const idsParaRemover = g.itens.slice(1).map((i) => i.id);
    for (const id of idsParaRemover) {
      await sql`DELETE FROM produtos WHERE id = ${id}`;
      removidos++;
    }
  }
  return NextResponse.json(
    { removidos },
    { headers: { "Cache-Control": "no-store" } }
  );
}
