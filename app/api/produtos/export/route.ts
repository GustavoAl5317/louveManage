import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { toCSV } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  "nome",
  "sku",
  "categoria",
  "custo",
  "margem",
  "preco_venda",
  "estoque",
  "estoque_minimo",
];

export async function GET() {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM produtos ORDER BY LOWER(nome)`;
  const csv = toCSV(
    rows.map((r: any) => ({
      nome: r.nome,
      sku: r.sku ?? "",
      categoria: r.categoria ?? "",
      custo: Number(r.custo).toFixed(2),
      margem: Number(r.margem).toFixed(2),
      preco_venda: Number(r.preco_venda).toFixed(2),
      estoque: r.estoque,
      estoque_minimo: r.estoque_minimo,
    })),
    HEADERS
  );

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produtos-${today}.csv"`,
    },
  });
}
