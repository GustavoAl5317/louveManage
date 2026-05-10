# Louve Manage

Sistema de gestão de loja com:

- **Dashboard** de vendas (hoje, mês, gráfico 7 dias, top produtos)
- **Estoque** (CRUD de produtos com custo, margem %, preço, mínimo)
- **Calculadora de preço** (custo + margem + frete + taxas → preço sugerido)
- **Vendas** (carrinho, finalização, baixa automática no estoque)
- **Nota Fiscal** (foto da nota → IA extrai produtos → editar → importar)

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Postgres (Vercel) + OpenAI Vision.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha OPENAI_API_KEY e POSTGRES_URL
npm run dev
```

## Deploy na Vercel

1. Crie um projeto na Vercel apontando para este repositório.
2. No dashboard do projeto → **Storage** → criar um **Postgres** (Neon). As variáveis `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc. são injetadas automaticamente.
3. Em **Settings → Environment Variables** adicione:
   - `OPENAI_API_KEY` = sua chave da OpenAI
   - `OPENAI_MODEL` = `gpt-4o-mini` (opcional)
4. Faça **Deploy**. Na primeira chamada de qualquer rota, o schema é criado automaticamente.

## Variáveis de ambiente

| Variável         | Obrigatório | Descrição                              |
| ---------------- | ----------- | -------------------------------------- |
| `POSTGRES_URL`   | sim         | Vercel Postgres / Neon / Supabase      |
| `OPENAI_API_KEY` | sim         | Chave da OpenAI para leitura da nota   |
| `OPENAI_MODEL`   | não         | Padrão `gpt-4o-mini`                   |
