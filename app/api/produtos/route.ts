import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { calcPrecoVenda } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM produtos ORDER BY LOWER(nome)`;
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const body = await req.json();
  const nome = String(body.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const sku = body.sku ?? null;
  const categoria = body.categoria ?? null;
  const custo = Number(body.custo ?? 0);
  let margem = Number(body.margem ?? 0);
  let preco_venda =
    body.preco_venda != null && Number(body.preco_venda) > 0
      ? Number(body.preco_venda)
      : calcPrecoVenda(custo, margem);
  if (custo > 0) {
    margem = Number((((preco_venda - custo) / custo) * 100).toFixed(2));
  }
  const estoque = Number(body.estoque ?? 0);
  const estoque_minimo = Number(body.estoque_minimo ?? 0);

  if (sku) {
    const { rows: existe } = await sql`SELECT id FROM produtos WHERE sku=${sku} LIMIT 1`;
    if (existe[0]) {
      return NextResponse.json(
        {
          error: `Já existe um produto com o SKU "${sku}". Edite o produto existente em vez de criar outro.`,
          existing_id: existe[0].id,
        },
        { status: 409 }
      );
    }
  }

  const { rows } = await sql`
    INSERT INTO produtos (nome, sku, categoria, custo, margem, preco_venda, estoque, estoque_minimo)
    VALUES (${nome}, ${sku}, ${categoria}, ${custo}, ${margem}, ${preco_venda}, ${estoque}, ${estoque_minimo})
    RETURNING *`;
  return NextResponse.json(rows[0], { status: 201 });
}
