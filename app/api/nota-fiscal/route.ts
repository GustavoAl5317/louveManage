import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é um extrator de notas fiscais brasileiras (NF-e, NFC-e, cupons fiscais).
Receba uma imagem e devolva APENAS um JSON válido no formato:
{
  "fornecedor": "string ou null",
  "numero": "string ou null",
  "data": "YYYY-MM-DD ou null",
  "produtos": [
    {
      "nome": "string",
      "sku": "string ou null",
      "quantidade": number,
      "custo_unit": number,
      "total": number
    }
  ]
}
Regras:
- Use ponto como separador decimal.
- "custo_unit" é o valor de custo unitário (preço unitário do item na nota).
- Se não conseguir ler algum campo, use null.
- Não invente produtos. Se a imagem não for legível, devolva produtos: [].
- Devolva SOMENTE o JSON, sem markdown, sem explicações.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada no .env" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const base64 = buf.toString("base64");
  const dataUrl = `data:${mime};base64,${base64}`;

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia os produtos desta nota fiscal." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Resposta inválida da IA", raw: content },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro ao chamar OpenAI" },
      { status: 500 }
    );
  }
}
