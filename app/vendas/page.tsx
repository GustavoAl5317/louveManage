"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingCart, X, User } from "lucide-react";
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
  cliente: string | null;
  created_at: string;
  itens: { nome: string; quantidade: number; preco_unit: number }[];
};

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [cliente, setCliente] = useState("");
  const [busca, setBusca] = useState("");
  const [drawerAberto, setDrawerAberto] = useState(false);

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

  const totalQtd = carrinho.reduce((s, c) => s + c.quantidade, 0);
  const total = carrinho.reduce((s, c) => s + c.preco_unit * c.quantidade, 0);

  const finalizar = async () => {
    if (!carrinho.length) return;
    const r = await fetch("/api/vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: cliente.trim() || null,
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
    setCliente("");
    setDrawerAberto(false);
    carregar();
  };

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const Carrinho = (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-brand-600" />
          <h2 className="font-semibold">Carrinho</h2>
        </div>
        <button
          className="md:hidden p-1 rounded hover:bg-slate-100"
          onClick={() => setDrawerAberto(false)}
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {carrinho.map((c) => (
          <div
            key={c.produto_id}
            className="border border-slate-200 rounded-lg p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium line-clamp-2 flex-1">
                {c.nome}
              </div>
              <button
                className="text-red-500 hover:bg-red-50 p-1 rounded shrink-0"
                onClick={() => remover(c.produto_id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="label">Qtd</label>
                <div className="flex items-center gap-1">
                  <button
                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 grid place-items-center"
                    onClick={() => setQtd(c.produto_id, c.quantidade - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={c.estoque}
                    className="input py-1 text-center"
                    value={c.quantidade}
                    onChange={(e) =>
                      setQtd(c.produto_id, Number(e.target.value))
                    }
                  />
                  <button
                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 grid place-items-center"
                    onClick={() => setQtd(c.produto_id, c.quantidade + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Preço un.</label>
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
            Toque em um produto para adicionar.
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3 mt-3">
        <label className="label flex items-center gap-1">
          <User size={12} /> Cliente (opcional)
        </label>
        <input
          className="input mb-3"
          placeholder="Nome do cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-2xl font-bold text-brand-700">{brl(total)}</span>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!carrinho.length}
          onClick={finalizar}
        >
          <Plus size={16} />
          Finalizar venda
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Vendas" subtitle="Registre uma venda e veja o histórico" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-semibold">Produtos</h2>
            <input
              className="input max-w-xs"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 max-h-[60vh] overflow-y-auto">
            {filtrados.map((p) => (
              <button
                key={p.id}
                disabled={p.estoque < 1}
                onClick={() => adicionar(p)}
                className="text-left p-3 rounded-xl border border-slate-200 active:scale-[0.97] hover:border-brand-500 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <div className="font-medium text-sm line-clamp-2">{p.nome}</div>
                <div className="text-brand-700 font-semibold mt-1 text-sm">
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

        {/* Carrinho lateral (desktop) */}
        <div className="hidden lg:block">{Carrinho}</div>
      </div>

      {/* Botão flutuante do carrinho (mobile) */}
      {carrinho.length > 0 && (
        <button
          className="lg:hidden fixed left-4 right-4 z-30 bg-brand-600 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between font-semibold"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
          onClick={() => setDrawerAberto(true)}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart size={18} />
            {totalQtd} {totalQtd === 1 ? "item" : "itens"}
          </span>
          <span>{brl(total)}</span>
        </button>
      )}

      {/* Drawer carrinho (mobile) */}
      {drawerAberto && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 flex items-end"
          onClick={() => setDrawerAberto(false)}
        >
          <div
            className="bg-white w-full max-h-[85vh] rounded-t-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {Carrinho}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="card mt-4 md:mt-6">
        <h2 className="font-semibold mb-3">Histórico</h2>

        {/* Cards (mobile) */}
        <div className="md:hidden space-y-2">
          {vendas.map((v) => (
            <div key={v.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                  </div>
                  {v.cliente && (
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                      <User size={12} className="text-brand-600" />
                      {v.cliente}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">{brl(v.total)}</div>
                  <div className="text-xs text-emerald-700">
                    +{brl(v.total - v.custo_total)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                {v.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(", ")}
              </div>
            </div>
          ))}
          {!vendas.length && (
            <div className="text-sm text-slate-400 py-6 text-center">
              Sem vendas ainda.
            </div>
          )}
        </div>

        {/* Tabela (desktop) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Data</th>
                <th className="pr-4">Cliente</th>
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
                  <td className="pr-4 font-medium">
                    {v.cliente ?? <span className="text-slate-300">—</span>}
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
                  <td colSpan={6} className="py-6 text-center text-slate-400">
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
