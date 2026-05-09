import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql, Produto, Venda, VendaItem } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const { rows: vendas } = await sql<Venda>`
    SELECT * FROM vendas ORDER BY created_at DESC LIMIT 200`;
  const { rows: itens } = await sql<VendaItem>`SELECT * FROM venda_itens`;
  const grouped = vendas.map((v) => ({
    ...v,
    itens: itens.filter((i) => i.venda_id === v.id),
  }));
  return NextResponse.json(grouped);
}

type ItemInput = { produto_id: number; quantidade: number; preco_unit?: number };

export async function POST(req: NextRequest) {
  await ensureSchema();
  const body = await req.json();
  const itens: ItemInput[] = body.itens ?? [];
  if (!itens.length) return NextResponse.json({ error: "Sem itens" }, { status: 400 });

  try {
    const resolved: Array<{
      produto: Produto;
      quantidade: number;
      preco_unit: number;
    }> = [];
    let total = 0;
    let custoTotal = 0;

    for (const it of itens) {
      const { rows } = await sql<Produto>`SELECT * FROM produtos WHERE id=${it.produto_id}`;
      const produto = rows[0];
      if (!produto) throw new Error("Produto não encontrado");
      if (produto.estoque < it.quantidade)
        throw new Error(`Estoque insuficiente para ${produto.nome}`);
      const preco_unit = Number(it.preco_unit ?? produto.preco_venda);
      total += preco_unit * it.quantidade;
      custoTotal += Number(produto.custo) * it.quantidade;
      resolved.push({ produto, quantidade: it.quantidade, preco_unit });
    }

    const { rows: vRows } = await sql<Venda>`
      INSERT INTO vendas (total, custo_total) VALUES (${total}, ${custoTotal}) RETURNING *`;
    const venda = vRows[0];

    for (const r of resolved) {
      await sql`
        INSERT INTO venda_itens (venda_id, produto_id, nome, quantidade, preco_unit, custo_unit)
        VALUES (${venda.id}, ${r.produto.id}, ${r.produto.nome}, ${r.quantidade}, ${r.preco_unit}, ${r.produto.custo})`;
      await sql`
        UPDATE produtos SET estoque = estoque - ${r.quantidade}, updated_at=NOW()
        WHERE id=${r.produto.id}`;
    }

    return NextResponse.json(venda, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
