import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE produtos
       SET preco_venda = ROUND(custo * (1 + margem/100.0), 2),
           updated_at  = NOW()
     WHERE custo > 0
       AND ABS(preco_venda - ROUND(custo * (1 + margem/100.0), 2)) > 0.01
    RETURNING id`;
  return NextResponse.json(
    { atualizados: rows.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}
