import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aurora Arena | NFT Play-to-Earn",
  description: "Experimente um mundo play-to-earn com economia GOLD, farm NFT e anúncios recompensados."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={cn(inter.className, "bg-slate-950 text-slate-100")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
