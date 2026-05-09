"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Loader2,
  Plus,
  Trash2,
  Check,
  ScanLine,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { brl, calcMargem, calcPrecoVenda } from "@/lib/format";

type ProdutoExtraido = {
  nome: string;
  sku: string | null;
  quantidade: number;
  custo_unit: number;
  total: number;
  margem: number;
  preco_venda: number;
  estoque_minimo: number;
  importar: boolean;
};

type RespostaIA = {
  fornecedor: string | null;
  numero: string | null;
  data: string | null;
  produtos: {
    nome: string;
    sku: string | null;
    quantidade: number;
    custo_unit: number;
    total: number;
  }[];
};

const MARGEM_PADRAO = 80;

export default function NotaFiscalPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    fornecedor: string | null;
    numero: string | null;
    data: string | null;
  } | null>(null);
  const [produtos, setProdutos] = useState<ProdutoExtraido[]>([]);
  const [salvando, setSalvando] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setErro(null);
    setProdutos([]);
    setInfo(null);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));
      const r = await fetch("/api/nota-fiscal", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) {
        setErro(data.error ?? "Erro ao processar nota fiscal");
        return;
      }
      const ia: RespostaIA = data;
      setInfo({
        fornecedor: ia.fornecedor,
        numero: ia.numero,
        data: ia.data,
      });
      const seen = new Set<string>();
      const lista: ProdutoExtraido[] = [];
      for (const p of ia.produtos ?? []) {
        const key = (p.sku ?? p.nome ?? "").trim().toLowerCase();
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        lista.push({
          nome: p.nome ?? "",
          sku: p.sku ?? null,
          quantidade: Number(p.quantidade ?? 1),
          custo_unit: Number(p.custo_unit ?? 0),
          total: Number(p.total ?? 0),
          margem: MARGEM_PADRAO,
          preco_venda: calcPrecoVenda(Number(p.custo_unit ?? 0), MARGEM_PADRAO),
          estoque_minimo: 0,
          importar: true,
        });
      }
      setProdutos(lista);
    } catch (e: any) {
      setErro(e.message ?? "Falha");
    } finally {
      setLoading(false);
    }
  };

  const update = (i: number, patch: Partial<ProdutoExtraido>) => {
    setProdutos((arr) =>
      arr.map((p, idx) => {
        if (idx !== i) return p;
        const next = { ...p, ...patch };
        if (patch.custo_unit != null || patch.margem != null) {
          next.preco_venda = calcPrecoVenda(next.custo_unit, next.margem);
        } else if (patch.preco_venda != null) {
          next.margem = calcMargem(next.custo_unit, patch.preco_venda);
        }
        return next;
      })
    );
  };

  const remover = (i: number) =>
    setProdutos((arr) => arr.filter((_, idx) => idx !== i));

  const adicionarLinha = () =>
    setProdutos((arr) => [
      ...arr,
      {
        nome: "",
        sku: null,
        quantidade: 1,
        custo_unit: 0,
        total: 0,
        margem: MARGEM_PADRAO,
        preco_venda: 0,
        estoque_minimo: 0,
        importar: true,
      },
    ]);

  const importar = async () => {
    const sel = produtos.filter((p) => p.importar && p.nome.trim());
    if (!sel.length) return alert("Selecione ao menos um produto");
    setSalvando(true);
    try {
      for (const p of sel) {
        await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: p.nome,
            sku: p.sku,
            custo: p.custo_unit,
            margem: p.margem,
            preco_venda: p.preco_venda,
            estoque: p.quantidade,
            estoque_minimo: p.estoque_minimo,
          }),
        });
      }
      alert(`${sel.length} produto(s) importado(s) para o estoque.`);
      setProdutos([]);
      setPreviews([]);
      setInfo(null);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Nota Fiscal"
        subtitle="Tire foto da nota e a IA extrai os produtos automaticamente"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-1">
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition"
            onClick={() => inputRef.current?.click()}
          >
            {previews.length ? (
              <div className="grid grid-cols-2 gap-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`nota ${i + 1}`}
                    className="max-h-60 rounded-lg object-contain w-full bg-slate-50"
                  />
                ))}
              </div>
            ) : (
              <div className="py-10">
                <ScanLine
                  size={48}
                  className="mx-auto text-brand-600 mb-3"
                />
                <div className="font-semibold">Tire foto ou envie a nota</div>
                <div className="text-xs text-slate-500 mt-1">
                  JPG, PNG ou HEIC · pode enviar várias fotos da mesma nota
                </div>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                if (fs.length) handleFiles(fs);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              className="btn-ghost justify-center"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} /> Enviar
            </button>
            <button
              className="btn-primary justify-center"
              onClick={() => inputRef.current?.click()}
            >
              <Camera size={16} /> Câmera
            </button>
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-brand-700">
              <Loader2 size={16} className="animate-spin" />
              Lendo a nota com IA...
            </div>
          )}
          {erro && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
              {erro}
            </div>
          )}
          {info && (
            <div className="mt-4 text-sm bg-slate-50 rounded-lg p-3 space-y-1">
              <div>
                <span className="text-slate-500">Fornecedor:</span>{" "}
                <b>{info.fornecedor ?? "—"}</b>
              </div>
              <div>
                <span className="text-slate-500">NF:</span>{" "}
                <b>{info.numero ?? "—"}</b>
              </div>
              <div>
                <span className="text-slate-500">Data:</span>{" "}
                <b>{info.data ?? "—"}</b>
              </div>
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Produtos identificados</h2>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={adicionarLinha}>
                <Plus size={16} /> Adicionar linha
              </button>
              <button
                className="btn-primary"
                disabled={!produtos.length || salvando}
                onClick={importar}
              >
                <Check size={16} />
                {salvando ? "Importando..." : "Importar para estoque"}
              </button>
            </div>
          </div>

          {produtos.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Envie uma foto para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={produtos.every((p) => p.importar)}
                        onChange={(e) =>
                          setProdutos((arr) =>
                            arr.map((p) => ({ ...p, importar: e.target.checked }))
                          )
                        }
                      />
                    </th>
                    <th className="px-2">Nome</th>
                    <th className="px-2">SKU</th>
                    <th className="px-2 text-right">Qtd</th>
                    <th className="px-2 text-right">Custo un.</th>
                    <th className="px-2 text-right">Margem %</th>
                    <th className="px-2 text-right">Preço venda</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => (
                    <tr key={i} className="table-row align-top">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={p.importar}
                          onChange={(e) =>
                            update(i, { importar: e.target.checked })
                          }
                        />
                      </td>
                      <td className="px-2">
                        <input
                          className="input py-1 min-w-[180px]"
                          value={p.nome}
                          onChange={(e) => update(i, { nome: e.target.value })}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          className="input py-1 w-24"
                          value={p.sku ?? ""}
                          onChange={(e) => update(i, { sku: e.target.value })}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          className="input py-1 w-16 text-right"
                          value={p.quantidade}
                          onChange={(e) =>
                            update(i, { quantidade: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          className="input py-1 w-24 text-right"
                          value={p.custo_unit}
                          onChange={(e) =>
                            update(i, { custo_unit: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          className="input py-1 w-20 text-right"
                          value={p.margem}
                          onChange={(e) =>
                            update(i, { margem: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          className="input py-1 w-24 text-right font-semibold text-brand-700"
                          value={p.preco_venda}
                          onChange={(e) =>
                            update(i, { preco_venda: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-2">
                        <button
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                          onClick={() => remover(i)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-sm font-semibold">
                    <td colSpan={4} className="py-3 px-2 text-right">
                      Total custo:
                    </td>
                    <td className="px-2 text-right">
                      {brl(
                        produtos.reduce(
                          (s, p) => s + p.custo_unit * p.quantidade,
                          0
                        )
                      )}
                    </td>
                    <td colSpan={2} className="px-2 text-right">
                      Total venda:
                    </td>
                    <td className="px-2 text-right text-brand-700">
                      {brl(
                        produtos.reduce(
                          (s, p) => s + p.preco_venda * p.quantidade,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
