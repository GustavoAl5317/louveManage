import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Louve Manage",
  description: "Gestão de loja: estoque, vendas e nota fiscal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
