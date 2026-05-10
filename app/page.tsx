"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { brl } from "@/lib/format";

type Dashboard = {
  totalProdutos: number;
  baixoEstoque: number;
  valorEstoque: number;
  hoje: { v: number; n: number };
  mes: { v: number; l: number; n: number };
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
  color?: "brand" | "green" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
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

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da sua loja"
      />

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
          hint={`Lucro: ${brl(data?.mes.l ?? 0)}`}
        />
        <Stat
          icon={Package}
          color="brand"
          label="Produtos cadastrados"
          value={String(data?.totalProdutos ?? 0)}
          hint={`Estoque vale ${brl(data?.valorEstoque ?? 0)}`}
        />
        <Stat
          icon={AlertTriangle}
          color={data && data.baixoEstoque > 0 ? "red" : "amber"}
          label="Baixo estoque"
          value={String(data?.baixoEstoque ?? 0)}
          hint="Produtos abaixo do mínimo"
        />
      </div>

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
