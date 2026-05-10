"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  Wallet,
  Target,
  Layers,
  Tag,
  Boxes,
  PackageX,
  Receipt,
  RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { brl, pct } from "@/lib/format";

type Dashboard = {
  totalProdutos: number;
  produtosComEstoque: number;
  semEstoque: number;
  baixoEstoque: number;
  totalCategorias: number;
  valorEstoque: number;
  estoque: {
    unidades: number;
    custo: number;
    receita: number;
    lucro: number;
    margem: number;
    margemMedia: number;
    precoMin: number;
    precoMax: number;
  };
  porCategoria: {
    categoria: string;
    produtos: number;
    unidades: number;
    custo: number;
    receita: number;
    lucro: number;
  }[];
  geral: { vendas: number; receita: number; lucro: number };
  hoje: { v: number; n: number };
  mes: { v: number; l: number; n: number; ticket: number };
  ultimos7: { dia: string; total: number; lucro: number }[];
  topProdutos: { nome: string; qtd: number; total: number }[];
};

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  color = "brand",
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  color?: "brand" | "green" | "amber" | "red" | "slate";
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="card flex items-center gap-3 md:gap-4 !p-3 md:!p-5">
      <div
        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl grid place-items-center shrink-0 ${colors[color]}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] md:text-xs text-slate-500 truncate">{label}</div>
        <div className="text-base md:text-xl font-bold text-slate-900 truncate">
          {value}
        </div>
        {hint && (
          <div className="text-[10px] md:text-xs text-slate-400 truncate">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: "green" | "amber" | "brand";
}) {
  const colors: Record<string, string> = {
    green: "text-emerald-700",
    amber: "text-amber-700",
    brand: "text-brand-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={`text-lg font-bold ${
          highlight ? colors[highlight] : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      const d = await r.json();
      setData(d);
      setAtualizadoEm(new Date());
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", carregar);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", carregar);
    };
  }, [carregar]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da sua loja"
        right={
          <button
            className="btn-ghost"
            onClick={carregar}
            disabled={carregando}
            title={
              atualizadoEm
                ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR")}`
                : "Atualizar"
            }
          >
            <RefreshCw
              size={16}
              className={carregando ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {carregando ? "Atualizando..." : "Atualizar"}
            </span>
          </button>
        }
      />

      {/* Vendas */}
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">
        Vendas
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Stat
          icon={TrendingUp}
          color="green"
          label="Vendas hoje"
          value={brl(data?.hoje.v ?? 0)}
          hint={`${data?.hoje.n ?? 0} venda(s)`}
        />
        <Stat
          icon={DollarSign}
          color="brand"
          label="Vendas no mês"
          value={brl(data?.mes.v ?? 0)}
          hint={`${data?.mes.n ?? 0} venda(s)`}
        />
        <Stat
          icon={Receipt}
          color="brand"
          label="Lucro do mês"
          value={brl(data?.mes.l ?? 0)}
          hint={`Ticket médio ${brl(data?.mes.ticket ?? 0)}`}
        />
        <Stat
          icon={ShoppingBag}
          color="slate"
          label="Total acumulado"
          value={brl(data?.geral.receita ?? 0)}
          hint={`${data?.geral.vendas ?? 0} venda(s) · lucro ${brl(
            data?.geral.lucro ?? 0
          )}`}
        />
      </div>

      {/* Estoque resumo */}
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Estoque
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Stat
          icon={Package}
          color="brand"
          label="Produtos cadastrados"
          value={String(data?.totalProdutos ?? 0)}
          hint={`${data?.produtosComEstoque ?? 0} com estoque`}
        />
        <Stat
          icon={Boxes}
          color="brand"
          label="Unidades em estoque"
          value={String(data?.estoque.unidades ?? 0)}
          hint={`${data?.totalCategorias ?? 0} categoria(s)`}
        />
        <Stat
          icon={AlertTriangle}
          color={data && data.baixoEstoque > 0 ? "red" : "amber"}
          label="Baixo estoque"
          value={String(data?.baixoEstoque ?? 0)}
          hint="Abaixo do mínimo"
        />
        <Stat
          icon={PackageX}
          color={data && data.semEstoque > 0 ? "red" : "slate"}
          label="Sem estoque"
          value={String(data?.semEstoque ?? 0)}
          hint="Esgotados"
        />
      </div>

      {/* Potencial do estoque */}
      <div className="card mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold flex items-center gap-2">
            <Target size={18} className="text-brand-600" />
            Potencial do estoque
          </h2>
          <span className="text-xs text-slate-400 hidden sm:block">
            Se você vender 100% do que tem
          </span>
        </div>
        <p className="text-xs text-slate-400 sm:hidden mb-3">
          Se você vender 100% do que tem
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-3">
          <MiniStat
            label="Unidades"
            value={String(data?.estoque.unidades ?? 0)}
            hint={`${data?.totalProdutos ?? 0} produtos`}
          />
          <MiniStat
            label="Custo investido"
            value={brl(data?.estoque.custo ?? 0)}
            hint="Quanto você gastou"
            highlight="amber"
          />
          <MiniStat
            label="Se vender tudo"
            value={brl(data?.estoque.receita ?? 0)}
            hint="Receita potencial"
            highlight="brand"
          />
          <MiniStat
            label="Lucro potencial"
            value={brl(data?.estoque.lucro ?? 0)}
            hint={`Margem ${pct(data?.estoque.margem ?? 0)}`}
            highlight="green"
          />
        </div>

        {data && data.estoque.receita > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="text-amber-700 font-medium">
                Custo {brl(data.estoque.custo)}
              </span>
              <span className="text-emerald-700 font-medium">
                Lucro +{brl(data.estoque.lucro)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-400 h-full"
                style={{
                  width: `${Math.min(
                    100,
                    (data.estoque.custo / data.estoque.receita) * 100
                  )}%`,
                }}
              />
              <div className="bg-emerald-500 h-full flex-1" />
            </div>
            <div className="text-right text-xs font-semibold text-brand-700 mt-1.5">
              Total se vender tudo: {brl(data.estoque.receita)}
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">Margem média</div>
              <div className="text-sm font-semibold">
                {pct(data.estoque.margemMedia)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Menor preço</div>
              <div className="text-sm font-semibold">
                {brl(data.estoque.precoMin)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Maior preço</div>
              <div className="text-sm font-semibold">
                {brl(data.estoque.precoMax)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Por categoria */}
      {data && data.porCategoria.length > 0 && (
        <div className="card mb-4 md:mb-6">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Tag size={18} className="text-brand-600" />
            Estoque por categoria
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="pr-3 text-right">Produtos</th>
                  <th className="pr-3 text-right">Unidades</th>
                  <th className="pr-3 text-right">Custo</th>
                  <th className="pr-3 text-right">Se vender tudo</th>
                  <th className="pr-3 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {data.porCategoria.map((c) => (
                  <tr key={c.categoria} className="table-row">
                    <td className="py-2 pr-3 font-medium">{c.categoria}</td>
                    <td className="pr-3 text-right">{c.produtos}</td>
                    <td className="pr-3 text-right">{c.unidades}</td>
                    <td className="pr-3 text-right text-slate-500">
                      {brl(c.custo)}
                    </td>
                    <td className="pr-3 text-right font-semibold text-brand-700">
                      {brl(c.receita)}
                    </td>
                    <td className="pr-3 text-right text-emerald-700">
                      {brl(c.lucro)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-sm font-semibold border-t-2 border-slate-200">
                  <td className="py-2 pr-3">Total</td>
                  <td className="pr-3 text-right">{data.totalProdutos}</td>
                  <td className="pr-3 text-right">{data.estoque.unidades}</td>
                  <td className="pr-3 text-right text-amber-700">
                    {brl(data.estoque.custo)}
                  </td>
                  <td className="pr-3 text-right text-brand-700">
                    {brl(data.estoque.receita)}
                  </td>
                  <td className="pr-3 text-right text-emerald-700">
                    {brl(data.estoque.lucro)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Vendas dos últimos 7 dias</h2>
            <span className="text-xs text-slate-400">Receita x Lucro</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.ultimos7 ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis
                  dataKey="dia"
                  tickFormatter={(d) => d.slice(5)}
                  fontSize={11}
                />
                <YAxis fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(v: number) => brl(v)}
                  labelFormatter={(d) => `Dia ${d}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Receita"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Lucro"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={18} className="text-brand-600" />
            <h2 className="font-semibold">Top produtos</h2>
          </div>
          {data?.topProdutos?.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProdutos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={100}
                    fontSize={11}
                  />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-12 text-center">
              Nenhuma venda registrada ainda.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
