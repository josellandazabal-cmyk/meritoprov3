// ============================================================
// MéritoPro V4 — Shim de compatibilidad
//
// El módulo canónico de Tavily vive en `@/lib/rag/tavily`.
// Este archivo se mantiene únicamente para no romper imports legacy
// y debe considerarse DEPRECADO: todo código nuevo importa desde
// `@/lib/rag/tavily`.
// ============================================================

export {
  buscarWebVerificado,
  formatearTavilyParaContexto,
  type TavilyHit,
} from '@/lib/rag/tavily';
