import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upgrade PC — Conheça suas peças. Planeje seu próximo passo.",
  description: "Explore peças AMD e Intel, compare especificações e cuide da sua configuração no Meu PC, com diagnóstico, simulações e histórico pessoal.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
