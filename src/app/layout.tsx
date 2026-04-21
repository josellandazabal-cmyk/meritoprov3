import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
