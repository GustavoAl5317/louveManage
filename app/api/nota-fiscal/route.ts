import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é um extrator de notas fiscais e cupons de pedido brasileiros (NF-e, NFC-e, romaneios, pedidos de fornecedor).

Devolva APENAS um JSON válido no formato:
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

LAYOUT comum desse tipo de nota (atenção, é o mais frequente):
As colunas no topo costumam ser: CÓDIGO | QTDE | DESCRIÇÃO | P.U. | TOTAL.
Cada item normalmente ocupa DUAS linhas visuais:
  Linha 1: <código_sku>            <DESCRIÇÃO DO PRODUTO>
  Linha 2: <qtde>      <preço_unit>                    <total>
Exemplo real:
  121975108           BRINCO METAL FOLHEAD
  4        13,10                              52,40
Isso deve virar:
  { "sku": "121975108", "nome": "BRINCO METAL FOLHEAD", "quantidade": 4, "custo_unit": 13.10, "total": 52.40 }

REGRAS:
- Vírgula brasileira "," → ponto "." nos números do JSON (ex.: "29,90" → 29.90).
- "custo_unit" = preço unitário (P.U.) que aparece na nota.
- "total" = total da linha (qtde × custo_unit). Se não bater, prefira o valor impresso.
- Quantidade padrão é 1 quando o número da segunda linha é "1".
- PRESERVE o nome do produto EXATAMENTE como está na nota, mantendo abreviações
  (MT = metal, MET = metal, PRAT = prata, FOLH/FOLHEAD = folheado). Não expanda, não traduza.
- O SKU/código costuma ter 8–10 dígitos e fica à esquerda da descrição. Capture sempre que possível.
- Ignore linhas de cabeçalho ("QTDE", "P.U.", "TOTAL"), tracejados, carimbos ("ENTREGUE"),
  rodapé ("Total", "Impressão", endereço, telefone, "Fabricacao", etc.).
- NÃO invente produtos. Se a imagem estiver ilegível, devolva "produtos": [].
- A imagem pode ser apenas um PEDAÇO da nota (recorte / continuação). Extraia só o que estiver visível.
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
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length)
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const dataUrls: string[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    dataUrls.push(`data:${mime};base64,${buf.toString("base64")}`);
  }

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
            {
              type: "text",
              text:
                files.length > 1
                  ? `Estas são ${files.length} fotos da MESMA nota (partes/continuação). Junte tudo numa única lista de produtos, sem duplicar.`
                  : "Extraia os produtos desta nota fiscal.",
            },
            ...dataUrls.map(
              (url) =>
                ({ type: "image_url", image_url: { url } }) as const
            ),
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
