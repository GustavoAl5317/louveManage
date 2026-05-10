import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();

  const totalProdutos = (await sql`SELECT COUNT(*)::int AS c FROM produtos`).rows[0].c;
  const produtosComEstoque = (
    await sql`SELECT COUNT(*)::int AS c FROM produtos WHERE estoque > 0`
  ).rows[0].c;
  const semEstoque = (
    await sql`SELECT COUNT(*)::int AS c FROM produtos WHERE estoque <= 0`
  ).rows[0].c;
  const baixoEstoque = (
    await sql`SELECT COUNT(*)::int AS c FROM produtos WHERE estoque > 0 AND estoque <= estoque_minimo`
  ).rows[0].c;
  const totalCategorias = (
    await sql`SELECT COUNT(DISTINCT categoria)::int AS c FROM produtos WHERE categoria IS NOT NULL AND categoria <> ''`
  ).rows[0].c;

  const estoqueRow = (
    await sql`
      SELECT
        COALESCE(SUM(custo * GREATEST(estoque, 0)), 0)        AS custo,
        COALESCE(SUM(preco_venda * GREATEST(estoque, 0)), 0)  AS receita,
        COALESCE(SUM(GREATEST(estoque, 0)), 0)::int          AS unidades,
        COALESCE(AVG(NULLIF(margem, 0)), 0)                   AS margem_media,
        COALESCE(MAX(preco_venda), 0)                        AS preco_max,
        COALESCE(MIN(NULLIF(preco_venda, 0)), 0)              AS preco_min
      FROM produtos`
  ).rows[0] as any;
  const estoqueCusto = Number(estoqueRow.custo);
  const estoqueReceita = Number(estoqueRow.receita);
  const estoqueLucro = estoqueReceita - estoqueCusto;
  const estoqueMargem =
    estoqueCusto > 0 ? (estoqueLucro / estoqueCusto) * 100 : 0;
  const valorEstoque = estoqueCusto;

  const porCategoria = (
    await sql`
      SELECT
        COALESCE(NULLIF(categoria,''),'Sem categoria') AS categoria,
        COUNT(*)::int                      AS produtos,
        COALESCE(SUM(GREATEST(estoque, 0)), 0)::int      AS unidades,
        COALESCE(SUM(custo * GREATEST(estoque, 0)), 0)     AS custo,
        COALESCE(SUM(preco_venda * GREATEST(estoque, 0)), 0) AS receita
      FROM produtos
      GROUP BY 1
      ORDER BY receita DESC`
  ).rows.map((r: any) => ({
    categoria: r.categoria,
    produtos: r.produtos,
    unidades: r.unidades,
    custo: Number(r.custo),
    receita: Number(r.receita),
    lucro: Number(r.receita) - Number(r.custo),
  }));

  const hojeRow = (
    await sql`
      SELECT COALESCE(SUM(total),0) AS v, COUNT(*)::int AS n
        FROM vendas
       WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')`
  ).rows[0];

  const mesRow = (
    await sql`
      SELECT COALESCE(SUM(total),0) AS v,
             COALESCE(SUM(total-custo_total),0) AS l,
             COUNT(*)::int AS n,
             COALESCE(AVG(total),0) AS ticket
        FROM vendas
       WHERE DATE_TRUNC('month', created_at AT TIME ZONE 'America/Sao_Paulo')
           = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')`
  ).rows[0];

  const totalVendas = (
    await sql`SELECT COUNT(*)::int AS c, COALESCE(SUM(total),0) AS v, COALESCE(SUM(total-custo_total),0) AS l FROM vendas`
  ).rows[0] as any;

  const ultimos7 = (
    await sql`
      SELECT TO_CHAR(d::date, 'YYYY-MM-DD') AS dia,
             COALESCE(SUM(v.total),0) AS total,
             COALESCE(SUM(v.total - v.custo_total),0) AS lucro
        FROM generate_series(
          DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '6 day',
          DATE(NOW() AT TIME ZONE 'America/Sao_Paulo'),
          INTERVAL '1 day'
        ) d
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

  return NextResponse.json(
    {
      totalProdutos,
      produtosComEstoque,
      semEstoque,
      baixoEstoque,
      totalCategorias,
      valorEstoque,
      estoque: {
        unidades: estoqueRow.unidades,
        custo: estoqueCusto,
        receita: estoqueReceita,
        lucro: estoqueLucro,
        margem: estoqueMargem,
        margemMedia: Number(estoqueRow.margem_media),
        precoMin: Number(estoqueRow.preco_min),
        precoMax: Number(estoqueRow.preco_max),
      },
      porCategoria,
      geral: {
        vendas: totalVendas.c,
        receita: Number(totalVendas.v),
        lucro: Number(totalVendas.l),
      },
      hoje: { v: Number(hojeRow.v), n: hojeRow.n },
      mes: {
        v: Number(mesRow.v),
        l: Number(mesRow.l),
        n: mesRow.n,
        ticket: Number(mesRow.ticket),
      },
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
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
