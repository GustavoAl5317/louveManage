import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql, Produto } from "@/lib/db";
import { calcPrecoVenda } from "@/lib/format";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema();
  const id = Number(params.id);
  const { rows } = await sql<Produto>`SELECT * FROM produtos WHERE id = ${id}`;
  const existing = rows[0];
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const nome = body.nome ?? existing.nome;
  const sku = body.sku ?? existing.sku;
  const categoria = body.categoria ?? existing.categoria;
  const custo = Number(body.custo ?? existing.custo);
  const margem = Number(body.margem ?? existing.margem);
  const preco_venda =
    body.preco_venda != null && Number(body.preco_venda) > 0
      ? Number(body.preco_venda)
      : calcPrecoVenda(custo, margem);
  const estoque = Number(body.estoque ?? existing.estoque);
  const estoque_minimo = Number(body.estoque_minimo ?? existing.estoque_minimo);

  const { rows: updated } = await sql`
    UPDATE produtos SET
      nome=${nome}, sku=${sku}, categoria=${categoria},
      custo=${custo}, margem=${margem}, preco_venda=${preco_venda},
      estoque=${estoque}, estoque_minimo=${estoque_minimo},
      updated_at=NOW()
    WHERE id=${id}
    RETURNING *`;
  return NextResponse.json(updated[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema();
  const id = Number(params.id);
  await sql`DELETE FROM produtos WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
