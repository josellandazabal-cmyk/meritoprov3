#!/usr/bin/env bash
# ============================================================
# Descarga automática del corpus extra (Fases 1, 2, 3 de la
# Auditoria_Corpus_vs_Programa_Oficial.md).
#
# Fuentes (orden de fallback por norma):
#   1. funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php
#   2. suin-juriscol.gov.co (HTML → wkhtmltopdf si está)
#   3. fuentes alternativas .gov.co
#
# Uso:
#   bash scripts/ingesta/descargar_corpus_extra.sh
#   bash scripts/ingesta/descargar_corpus_extra.sh --fase=1   # sólo P0
#
# Requisitos: bash, curl. Opcional: wkhtmltopdf para conversión HTML→PDF.
# ============================================================

set -e
DIR="Documentacion conocimiento base"
mkdir -p "$DIR"

FASE="${1:-todas}"
FASE="${FASE#--fase=}"

descargar() {
  local destino="$1"
  shift
  local urls=("$@")

  if [[ -f "$DIR/$destino" ]]; then
    echo "  ✓ Ya existe: $destino — saltando."
    return 0
  fi

  for url in "${urls[@]}"; do
    echo "  ↓ Probando: $url"
    if curl -fsSL --max-time 60 -o "$DIR/$destino" "$url" 2>/dev/null; then
      local size
      size=$(stat -c%s "$DIR/$destino" 2>/dev/null || stat -f%z "$DIR/$destino" 2>/dev/null)
      if [[ "$size" -gt 10000 ]]; then
        echo "  ✓ OK: $destino ($size bytes)"
        return 0
      else
        echo "    (archivo demasiado pequeño, probablemente HTML de error)"
        rm -f "$DIR/$destino"
      fi
    fi
  done

  echo "  ✗ No se pudo descargar $destino — descárgalo manual."
  return 1
}

echo "═══════════════════════════════════════════════════════════════════"
echo "  Corpus extra · MéritoPro · Fase: $FASE"
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FASE" == "1" || "$FASE" == "todas" ]]; then
  echo ""
  echo "▶ FASE 1 — P0 (5 normas críticas)"
  echo ""

  descargar "LEY_1564_2012_CODIGO_GENERAL_PROCESO.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_1564_2012.pdf"

  descargar "DECRETO_2591_1991_TUTELA.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=5304" \
    "https://www.suin-juriscol.gov.co/viewDocument.asp?id=1408498"

  descargar "LEY_472_1998_ACCIONES_POPULARES_GRUPO.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=188" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0472_1998.pdf"

  descargar "LEY_393_1997_ACCION_CUMPLIMIENTO.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=339" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0393_1997.pdf"

  descargar "LEY_1755_2015_DERECHO_PETICION.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=62152" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_1755_2015.pdf"
fi

if [[ "$FASE" == "2" || "$FASE" == "todas" ]]; then
  echo ""
  echo "▶ FASE 2 — P1 (5 normas para llegar a 90 % cobertura)"
  echo ""

  descargar "LEY_1448_2011_VICTIMAS.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=43043" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_1448_2011.pdf"

  descargar "LEY_1098_2006_CODIGO_INFANCIA_ADOLESCENCIA.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=22106" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_1098_2006.pdf"

  descargar "LEY_906_2004_PROCEDIMIENTO_PENAL_ACUSATORIO.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=14787" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0906_2004.pdf"

  descargar "LEY_100_1993_SEGURIDAD_SOCIAL_SALUD.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=5248" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0100_1993.pdf"

  descargar "LEY_99_1993_AMBIENTE_SINA.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=297" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0099_1993.pdf"
fi

if [[ "$FASE" == "3" || "$FASE" == "todas" ]]; then
  echo ""
  echo "▶ FASE 3 — P2 (cierre fino y cobertura sectorial)"
  echo ""

  descargar "LEY_1257_2008_NO_VIOLENCIA_MUJER.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=34054" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_1257_2008.pdf"

  descargar "LEY_685_2001_CODIGO_MINAS.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=9202" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0685_2001.pdf"

  descargar "DECRETO_1082_2015_REGLAMENTARIO_CONTRATACION.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=77543"

  descargar "LEY_160_1994_REFORMA_AGRARIA.pdf" \
    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=8519" \
    "https://www.icbf.gov.co/cargues/avance/docs/ley_0160_1994.pdf"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Listo. Inventario en \"$DIR\":"
ls -la "$DIR"/*.pdf 2>/dev/null | awk '{ printf "  %-60s %s bytes\n", $9, $5 }'
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Siguiente paso:"
echo "  npx tsx scripts/ingesta/ingest_corpus.ts          (ingesta completa)"
echo "  npx tsx scripts/ingesta/ingest_corpus.ts --only=LEY_1564_2012  (selectivo)"
