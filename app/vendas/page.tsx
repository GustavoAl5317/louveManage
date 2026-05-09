"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { brl } from "@/lib/format";

type Produto = {
  id: number;
  nome: string;
  custo: number;
  preco_venda: number;
  estoque: number;
};

type ItemCarrinho = {
  produto_id: number;
  nome: string;
  quantidade: number;
  preco_unit: number;
  estoque: number;
};

type Venda = {
  id: number;
  total: number;
  custo_total: number;
  created_at: string;
  itens: { nome: string; quantidade: number; preco_unit: number }[];
};

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    const [pr, vr] = await Promise.all([
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/vendas").then((r) => r.json()),
    ]);
    setProdutos(
      pr.map((p: any) => ({
        ...p,
        custo: Number(p.custo),
        preco_venda: Number(p.preco_venda),
      }))
    );
    setVendas(
      vr.map((v: any) => ({
        ...v,
        total: Number(v.total),
        custo_total: Number(v.custo_total),
        itens: (v.itens ?? []).map((i: any) => ({
          ...i,
          preco_unit: Number(i.preco_unit),
        })),
      }))
    );
  };

  useEffect(() => {
    carregar();
  }, []);

  const adicionar = (p: Produto) => {
    const existing = carrinho.find((c) => c.produto_id === p.id);
    if (existing) {
      if (existing.quantidade + 1 > p.estoque) return alert("Sem estoque");
      setCarrinho(
        carrinho.map((c) =>
          c.produto_id === p.id ? { ...c, quantidade: c.quantidade + 1 } : c
        )
      );
    } else {
      if (p.estoque < 1) return alert("Sem estoque");
      setCarrinho([
        ...carrinho,
        {
          produto_id: p.id,
          nome: p.nome,
          quantidade: 1,
          preco_unit: p.preco_venda,
          estoque: p.estoque,
        },
      ]);
    }
  };

  const setQtd = (id: number, q: number) =>
    setCarrinho(
      carrinho.map((c) =>
        c.produto_id === id ? { ...c, quantidade: Math.max(1, q) } : c
      )
    );

  const setPreco = (id: number, p: number) =>
    setCarrinho(
      carrinho.map((c) => (c.produto_id === id ? { ...c, preco_unit: p } : c))
    );

  const remover = (id: number) =>
    setCarrinho(carrinho.filter((c) => c.produto_id !== id));

  const total = carrinho.reduce((s, c) => s + c.preco_unit * c.quantidade, 0);

  const finalizar = async () => {
    if (!carrinho.length) return;
    const r = await fetch("/api/vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itens: carrinho.map((c) => ({
          produto_id: c.produto_id,
          quantidade: c.quantidade,
          preco_unit: c.preco_unit,
        })),
      }),
    });
    if (!r.ok) {
      const e = await r.json();
      return alert(e.error ?? "Erro");
    }
    setCarrinho([]);
    carregar();
  };

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Vendas" subtitle="Registre uma venda e veja o histórico" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Produtos</h2>
            <input
              className="input max-w-xs"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {filtrados.map((p) => (
              <button
                key={p.id}
                disabled={p.estoque < 1}
                onClick={() => adicionar(p)}
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <div className="font-medium text-sm line-clamp-2">{p.nome}</div>
                <div className="text-brand-700 font-semibold mt-1">
                  {brl(p.preco_venda)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Estoque: {p.estoque}
                </div>
              </button>
            ))}
            {!filtrados.length && (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                Nenhum produto.
              </div>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={18} className="text-brand-600" />
            <h2 className="font-semibold">Carrinho</h2>
          </div>
          <div className="flex-1 space-y-2 max-h-[50vh] overflow-y-auto">
            {carrinho.map((c) => (
              <div
                key={c.produto_id}
                className="border border-slate-200 rounded-lg p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium line-clamp-1">{c.nome}</div>
                  <button
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                    onClick={() => remover(c.produto_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="label">Qtd</label>
                    <input
                      type="number"
                      min={1}
                      max={c.estoque}
                      className="input py-1"
                      value={c.quantidade}
                      onChange={(e) =>
                        setQtd(c.produto_id, Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Preço</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input py-1"
                      value={c.preco_unit}
                      onChange={(e) =>
                        setPreco(c.produto_id, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="text-right text-sm font-semibold mt-1">
                  {brl(c.preco_unit * c.quantidade)}
                </div>
              </div>
            ))}
            {!carrinho.length && (
              <div className="text-sm text-slate-400 py-8 text-center">
                Clique em um produto para adicionar.
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-2xl font-bold text-brand-700">
                {brl(total)}
              </span>
            </div>
            <button
              className="btn-primary w-full justify-center"
              disabled={!carrinho.length}
              onClick={finalizar}
            >
              <Plus size={16} />
              Finalizar venda
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold mb-3">Histórico</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Data</th>
                <th className="pr-4">Itens</th>
                <th className="pr-4 text-right">Custo</th>
                <th className="pr-4 text-right">Lucro</th>
                <th className="pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} className="table-row align-top">
                  <td className="py-2 pr-4">
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="pr-4">
                    {v.itens
                      .map((i) => `${i.quantidade}× ${i.nome}`)
                      .join(", ")}
                  </td>
                  <td className="pr-4 text-right text-slate-500">
                    {brl(v.custo_total)}
                  </td>
                  <td className="pr-4 text-right text-emerald-700">
                    {brl(v.total - v.custo_total)}
                  </td>
                  <td className="pr-4 text-right font-semibold">
                    {brl(v.total)}
                  </td>
                </tr>
              ))}
              {!vendas.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Sem vendas ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
