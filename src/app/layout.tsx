import type { Metadata } from "next";
import "./globals.css";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import GTM, { GTMNoScript } from "@/components/analytics/GTM";

export const metadata: Metadata = {
  title: "MéritoPro — Prepárate para el Concurso PGN 2026",
  description:
    "Plataforma de preparación inteligente para el Concurso de Méritos de la Procuraduría General de la Nación 2026. Diagnóstico gratuito, Repetición Espaciada y Recuperación Activa con IA.",
  keywords: [
    "PGN",
    "Procuraduría General de la Nación",
    "concurso de méritos 2026",
    "preparación concurso",
    "servicio público Colombia",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {/* Stack de analytics — los tres componentes hacen el guard de
            consentimiento de cookies internamente. Si no hay consent o
            la env var está vacía, no montan nada. */}
        <MetaPixel />
        <GoogleAnalytics />
        <GTM />
        <GTMNoScript />
        {children}
      </body>
    </html>
  );
}
