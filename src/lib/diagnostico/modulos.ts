// ============================================================
// Mapeo: descripción textual del módulo (que genera el orquestador)
// → slug corto y estable usado para agrupar respuestas en el dashboard.
//
// El orquestador en `src/app/api/orquestador/route.ts` genera strings
// descriptivos largos como:
//   "Ley 1952 de 2019 Código General Disciplinario principios"
//   "Decreto Ley 262 de 2000 estructura funciones PGN"
// Esta función los normaliza a 9 slugs estables que `MODULOS_DEFAULT`
// del dashboard usa para hacer el join sin necesidad de migración SQL
// (el slug se codifica dentro de `pregunta_id` con separador "::").
// ============================================================

export function inferirSlugModulo(textoModulo: string | undefined): string {
  if (!textoModulo) return 'general';
  const t = textoModulo.toLowerCase();
  if (t.includes('comportamental')) return 'comportamental';
  if (t.includes('disciplin') || t.includes('1952') || t.includes('falta'))
    return 'disciplinario';
  if (
    t.includes('estructura') ||
    t.includes('procuraduría') ||
    t.includes('procuraduria') ||
    t.includes('262') ||
    t.includes('constitución') ||
    t.includes('constitucion')
  )
    return 'estructura_estado';
  if (t.includes('tutela') || t.includes('fundamental') || t.includes('derecho'))
    return 'derechos_fundamentales';
  if (t.includes('documental') || t.includes('archivo') || t.includes('594'))
    return 'gestion_documental';
  if (
    t.includes('carrera') ||
    t.includes('909') ||
    t.includes('función pública') ||
    t.includes('funcion publica')
  )
    return 'carrera_admin';
  if (t.includes('ética') || t.includes('etica') || t.includes('integridad'))
    return 'etica';
  if (t.includes('verbal') || t.includes('lectura') || t.includes('aptitud'))
    return 'aptitud_verbal';
  if (t.includes('ofimática') || t.includes('ofimatica') || t.includes('excel'))
    return 'ofimatica';
  return 'general';
}
