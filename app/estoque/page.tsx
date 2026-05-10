"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { brl, calcPrecoVenda, pct } from "@/lib/format";

type Produto = {
  id: number;
  nome: string;
  sku: string | null;
  categoria: string | null;
  custo: number;
  margem: number;
  preco_venda: number;
  estoque: number;
  estoque_minimo: number;
};

const empty = {
  nome: "",
  sku: "",
  categoria: "",
  custo: 0,
  margem: 50,
  preco_venda: 0,
  estoque: 0,
  estoque_minimo: 0,
};

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any | null>(null);

  const carregar = async () => {
    const r = await fetch("/api/produtos");
    const data = await r.json();
    setProdutos(data.map((p: any) => ({
      ...p,
      custo: Number(p.custo),
      margem: Number(p.margem),
      preco_venda: Number(p.preco_venda),
    })));
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvar = async () => {
    if (!editando.nome.trim()) return alert("Nome é obrigatório");
    const isEdit = !!editando.id;
    const url = isEdit ? `/api/produtos/${editando.id}` : "/api/produtos";
    const method = isEdit ? "PUT" : "POST";
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editando),
    });
    if (!r.ok) {
      const e = await r.json();
      return alert(e.error ?? "Erro ao salvar");
    }
    setEditando(null);
    carregar();
  };

  const remover = async (id: number) => {
    if (!confirm("Excluir produto?")) return;
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    carregar();
  };

  const filtrados = produtos.filter((p) =>
    [p.nome, p.sku, p.categoria]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Gerencie seus produtos, custos e margens"
        right={
          <button
            className="btn-primary"
            onClick={() => setEditando({ ...empty })}
          >
            <Plus size={16} />
            Novo produto
          </button>
        }
      />

      <div className="card mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, SKU ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filtrados.map((p) => {
          const baixo = p.estoque <= p.estoque_minimo;
          return (
            <div key={p.id} className="card !p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm leading-tight">
                    {p.nome}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.sku ?? "sem SKU"}
                    {p.categoria ? ` · ${p.categoria}` : ""}
                  </div>
                </div>
                <span
                  className={`pill shrink-0 ${
                    baixo
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {baixo && <AlertTriangle size={12} className="mr-1" />}
                  {p.estoque} un
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <div className="text-slate-400">Custo</div>
                  <div className="font-medium">{brl(p.custo)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Margem</div>
                  <div className="font-medium">{pct(p.margem)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Preço</div>
                  <div className="font-semibold text-brand-700">
                    {brl(p.preco_venda)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="btn-ghost flex-1"
                  onClick={() =>
                    setEditando({
                      ...p,
                      sku: p.sku ?? "",
                      categoria: p.categoria ?? "",
                    })
                  }
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  className="btn-danger"
                  onClick={() => remover(p.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {!filtrados.length && (
          <div className="card text-center text-slate-400 text-sm py-8">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* Tabela (desktop) */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">Produto</th>
              <th className="pr-4">SKU</th>
              <th className="pr-4">Categoria</th>
              <th className="pr-4 text-right">Custo</th>
              <th className="pr-4 text-right">Margem</th>
              <th className="pr-4 text-right">Preço</th>
              <th className="pr-4 text-right">Estoque</th>
              <th className="pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const baixo = p.estoque <= p.estoque_minimo;
              return (
                <tr key={p.id} className="table-row">
                  <td className="py-3 pr-4 font-medium">{p.nome}</td>
                  <td className="pr-4 text-slate-500">{p.sku ?? "—"}</td>
                  <td className="pr-4 text-slate-500">{p.categoria ?? "—"}</td>
                  <td className="pr-4 text-right">{brl(p.custo)}</td>
                  <td className="pr-4 text-right">{pct(p.margem)}</td>
                  <td className="pr-4 text-right font-semibold">
                    {brl(p.preco_venda)}
                  </td>
                  <td className="pr-4 text-right">
                    <span
                      className={`pill ${
                        baixo
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {baixo && <AlertTriangle size={12} className="mr-1" />}
                      {p.estoque}
                    </span>
                  </td>
                  <td className="pr-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        className="p-2 rounded-lg hover:bg-slate-100"
                        onClick={() =>
                          setEditando({
                            ...p,
                            sku: p.sku ?? "",
                            categoria: p.categoria ?? "",
                          })
                        }
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        onClick={() => remover(p.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtrados.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <ProdutoModal
          produto={editando}
          setProduto={setEditando}
          onSave={salvar}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}

function ProdutoModal({
  produto,
  setProduto,
  onSave,
  onClose,
}: {
  produto: any;
  setProduto: (p: any) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = (k: string, v: any) => setProduto({ ...produto, [k]: v });
  const precoSugerido = calcPrecoVenda(Number(produto.custo), Number(produto.margem));

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-end md:items-center md:justify-center md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-4 md:p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-lg">
            {produto.id ? "Editar produto" : "Novo produto"}
          </h2>
        </div>
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nome *</label>
            <input
              className="input"
              value={produto.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input
              className="input"
              value={produto.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <input
              className="input"
              value={produto.categoria}
              onChange={(e) => set("categoria", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Custo (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={produto.custo}
              onChange={(e) => set("custo", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Margem (%)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={produto.margem}
              onChange={(e) => {
                const margem = Number(e.target.value);
                setProduto({
                  ...produto,
                  margem,
                  preco_venda: calcPrecoVenda(Number(produto.custo), margem),
                });
              }}
            />
          </div>
          <div>
            <label className="label">
              Preço de venda (R$){" "}
              <span className="text-slate-400">
                (sugerido {brl(precoSugerido)})
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={produto.preco_venda}
              onChange={(e) => set("preco_venda", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Estoque atual</label>
            <input
              type="number"
              className="input"
              value={produto.estoque}
              onChange={(e) => set("estoque", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Estoque mínimo (alerta)</label>
            <input
              type="number"
              className="input"
              value={produto.estoque_minimo}
              onChange={(e) => set("estoque_minimo", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="p-4 md:p-5 border-t border-slate-100 flex gap-2 sticky bottom-0 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" onClick={onSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
