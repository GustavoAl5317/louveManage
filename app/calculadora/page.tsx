"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { brl, calcMargem, calcPrecoVenda, pct } from "@/lib/format";

export default function CalculadoraPage() {
  const [custo, setCusto] = useState(10);
  const [margem, setMargem] = useState(50);
  const [taxas, setTaxas] = useState(0);
  const [frete, setFrete] = useState(0);
  const [precoManual, setPrecoManual] = useState<number | null>(null);

  const precoVenda = useMemo(() => {
    if (precoManual != null) return precoManual;
    return calcPrecoVenda(custo + frete + (custo * taxas) / 100, margem);
  }, [custo, margem, taxas, frete, precoManual]);

  const custoTotal = custo + frete + (custo * taxas) / 100;
  const lucro = precoVenda - custoTotal;
  const margemReal = calcMargem(custoTotal, precoVenda);
  const markup = custoTotal > 0 ? precoVenda / custoTotal : 0;

  return (
    <>
      <PageHeader
        title="Calculadora de preço"
        subtitle="Calcule o preço de venda com base no custo e margem"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="font-semibold mb-2">Entradas</h2>
          <div>
            <label className="label">Custo do produto (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={custo}
              onChange={(e) => {
                setCusto(Number(e.target.value));
                setPrecoManual(null);
              }}
            />
          </div>
          <div>
            <label className="label">Frete por unidade (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={frete}
              onChange={(e) => {
                setFrete(Number(e.target.value));
                setPrecoManual(null);
              }}
            />
          </div>
          <div>
            <label className="label">Taxas/Impostos sobre o custo (%)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={taxas}
              onChange={(e) => {
                setTaxas(Number(e.target.value));
                setPrecoManual(null);
              }}
            />
          </div>
          <div>
            <label className="label">Margem desejada (%)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={margem}
              onChange={(e) => {
                setMargem(Number(e.target.value));
                setPrecoManual(null);
              }}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="label">
              Forçar preço de venda (R$){" "}
              <span className="text-slate-400">
                (opcional — recalcula a margem real)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={precoManual ?? ""}
              placeholder="Deixe vazio para usar a margem"
              onChange={(e) =>
                setPrecoManual(e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {[30, 50, 80, 100, 150, 200].map((m) => (
              <button
                key={m}
                className="btn-ghost justify-center text-sm"
                onClick={() => {
                  setMargem(m);
                  setPrecoManual(null);
                }}
              >
                {m}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-3">Resultado</h2>
            <div className="text-sm text-slate-500">Preço de venda sugerido</div>
            <div className="text-4xl font-bold text-brand-700 mt-1">
              {brl(precoVenda)}
            </div>
          </div>

          <div className="card grid grid-cols-2 gap-4">
            <Metric label="Custo total" value={brl(custoTotal)} />
            <Metric label="Lucro por unidade" value={brl(lucro)} positive={lucro > 0} />
            <Metric label="Margem real" value={pct(margemReal)} />
            <Metric label="Markup" value={`${markup.toFixed(2)}x`} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3 text-sm">
              Tabela de cenários (margem × preço × lucro)
            </h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="text-left py-1">Margem</th>
                  <th className="text-right">Preço</th>
                  <th className="text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {[20, 30, 50, 80, 100, 150, 200].map((m) => {
                  const p = calcPrecoVenda(custoTotal, m);
                  return (
                    <tr key={m} className="table-row">
                      <td className="py-1.5">{m}%</td>
                      <td className="text-right">{brl(p)}</td>
                      <td className="text-right text-emerald-700">
                        {brl(p - custoTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`text-lg font-semibold ${
          positive === undefined
            ? "text-slate-900"
            : positive
            ? "text-emerald-700"
            : "text-red-600"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
