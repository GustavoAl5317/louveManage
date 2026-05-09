import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();

  const totalProdutos = (await sql`SELECT COUNT(*)::int AS c FROM produtos`).rows[0].c;
  const baixoEstoque = (
    await sql`SELECT COUNT(*)::int AS c FROM produtos WHERE estoque <= estoque_minimo`
  ).rows[0].c;
  const valorEstoque = Number(
    (await sql`SELECT COALESCE(SUM(custo*estoque),0) AS v FROM produtos`).rows[0].v
  );

  const hojeRow = (
    await sql`
      SELECT COALESCE(SUM(total),0) AS v, COUNT(*)::int AS n
        FROM vendas
       WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE`
  ).rows[0];

  const mesRow = (
    await sql`
      SELECT COALESCE(SUM(total),0) AS v,
             COALESCE(SUM(total-custo_total),0) AS l,
             COUNT(*)::int AS n
        FROM vendas
       WHERE DATE_TRUNC('month', created_at AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', CURRENT_DATE)`
  ).rows[0];

  const ultimos7 = (
    await sql`
      SELECT TO_CHAR(d::date, 'YYYY-MM-DD') AS dia,
             COALESCE(SUM(v.total),0) AS total,
             COALESCE(SUM(v.total - v.custo_total),0) AS lucro
        FROM generate_series(CURRENT_DATE - INTERVAL '6 day', CURRENT_DATE, INTERVAL '1 day') d
        LEFT JOIN vendas v
          ON DATE(v.created_at AT TIME ZONE 'America/Sao_Paulo') = d::date
       GROUP BY d
       ORDER BY d`
  ).rows;

  const topProdutos = (
    await sql`
      SELECT nome, SUM(quantidade)::int AS qtd, SUM(preco_unit*quantidade) AS total
        FROM venda_itens
       GROUP BY produto_id, nome
       ORDER BY qtd DESC
       LIMIT 5`
  ).rows;

  return NextResponse.json({
    totalProdutos,
    baixoEstoque,
    valorEstoque,
    hoje: { v: Number(hojeRow.v), n: hojeRow.n },
    mes: { v: Number(mesRow.v), l: Number(mesRow.l), n: mesRow.n },
    ultimos7: ultimos7.map((r: any) => ({
      dia: r.dia,
      total: Number(r.total),
      lucro: Number(r.lucro),
    })),
    topProdutos: topProdutos.map((r: any) => ({
      nome: r.nome,
      qtd: r.qtd,
      total: Number(r.total),
    })),
  });
}
