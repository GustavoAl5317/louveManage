import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { parseCSV, parseNumber } from "@/lib/csv";
import { calcPrecoVenda } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureSchema();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (!rows.length)
    return NextResponse.json({ error: "Planilha vazia" }, { status: 400 });

  let inserted = 0;
  let updated = 0;
  const erros: { linha: number; motivo: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const nome = (r.nome ?? r.produto ?? "").trim();
    if (!nome) {
      erros.push({ linha: i + 2, motivo: "Sem nome" });
      continue;
    }
    const sku = (r.sku ?? r.codigo ?? "").trim() || null;
    const categoria = (r.categoria ?? "").trim() || null;
    const custo = parseNumber(r.custo ?? r["custo_unit"] ?? "0");
    const margem = parseNumber(r.margem ?? "0");
    let preco_venda = parseNumber(r.preco_venda ?? r["preco"] ?? "0");
    if (!preco_venda || preco_venda <= 0)
      preco_venda = calcPrecoVenda(custo, margem);
    const estoque = Math.round(parseNumber(r.estoque ?? r.qtde ?? "0"));
    const estoque_minimo = Math.round(
      parseNumber(r.estoque_minimo ?? r["minimo"] ?? "0")
    );

    try {
      let existing: any = null;
      if (sku) {
        const { rows: ex } = await sql`SELECT id FROM produtos WHERE sku=${sku} LIMIT 1`;
        existing = ex[0];
      }
      if (!existing) {
        const { rows: ex } = await sql`
          SELECT id FROM produtos WHERE LOWER(nome)=LOWER(${nome}) LIMIT 1`;
        existing = ex[0];
      }

      if (existing) {
        await sql`
          UPDATE produtos SET
            nome=${nome},
            sku=${sku},
            categoria=${categoria},
            custo=${custo},
            margem=${margem},
            preco_venda=${preco_venda},
            estoque=${estoque},
            estoque_minimo=${estoque_minimo},
            updated_at=NOW()
          WHERE id=${existing.id}`;
        updated++;
      } else {
        await sql`
          INSERT INTO produtos
            (nome, sku, categoria, custo, margem, preco_venda, estoque, estoque_minimo)
          VALUES
            (${nome}, ${sku}, ${categoria}, ${custo}, ${margem},
             ${preco_venda}, ${estoque}, ${estoque_minimo})`;
        inserted++;
      }
    } catch (e: any) {
      erros.push({ linha: i + 2, motivo: e.message ?? "erro desconhecido" });
    }
  }

  return NextResponse.json({
    total: rows.length,
    inserted,
    updated,
    erros,
  });
}
