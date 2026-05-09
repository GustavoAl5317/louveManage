import { sql } from "@vercel/postgres";

export type Produto = {
  id: number;
  nome: string;
  sku: string | null;
  categoria: string | null;
  custo: number;
  margem: number;
  preco_venda: number;
  estoque: number;
  estoque_minimo: number;
  created_at: string;
  updated_at: string;
};

export type Venda = {
  id: number;
  total: number;
  custo_total: number;
  created_at: string;
};

export type VendaItem = {
  id: number;
  venda_id: number;
  produto_id: number;
  nome: string;
  quantidade: number;
  preco_unit: number;
  custo_unit: number;
};

let initialized = false;
export async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      sku TEXT,
      categoria TEXT,
      custo NUMERIC(12,2) NOT NULL DEFAULT 0,
      margem NUMERIC(8,2) NOT NULL DEFAULT 0,
      preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
      estoque INTEGER NOT NULL DEFAULT 0,
      estoque_minimo INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS vendas (
      id SERIAL PRIMARY KEY,
      total NUMERIC(12,2) NOT NULL,
      custo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS venda_itens (
      id SERIAL PRIMARY KEY,
      venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id),
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unit NUMERIC(12,2) NOT NULL,
      custo_unit NUMERIC(12,2) NOT NULL
    );
  `;
  initialized = true;
}

export { sql };
