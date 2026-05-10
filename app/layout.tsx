import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Louve Manage",
  description: "Gestão de loja: estoque, vendas e nota fiscal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="md:flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
