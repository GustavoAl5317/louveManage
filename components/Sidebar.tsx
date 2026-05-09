"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Calculator,
  ShoppingCart,
  ScanLine,
  Store,
} from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/nota-fiscal", label: "Nota Fiscal", icon: ScanLine },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center">
          <Store size={18} />
        </div>
        <div>
          <div className="font-bold leading-tight">Louve</div>
          <div className="text-xs text-slate-500 leading-tight">Manage</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="text-xs text-slate-400 px-2 pt-4 border-t border-slate-100">
        v0.1 · Louve Manage
      </div>
    </aside>
  );
}
