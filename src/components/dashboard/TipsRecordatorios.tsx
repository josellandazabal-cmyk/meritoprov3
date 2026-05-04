'use client';

// ============================================================
// TipsRecordatorios — Tips contextuales según módulo en entrenamiento
//
// Muestra 3 datos clave (artículos, leyes, mnemotecnias) del módulo
// que el usuario está practicando. Sirve para:
//   1. Reforzar memoria a largo plazo (efecto generación + repetición).
//   2. Dar al aspirante "ganchos" mentales mientras espera la pregunta.
//   3. Cubrir las brechas detectadas con tips específicos.
//
// Los tips son curados (no generados por IA) — todos vienen de la
// normativa oficial PGN 2026.
// ============================================================

interface Tip {
  titulo: string;
  cita: string;
  contenido: string;
}

const TIPS_POR_MODULO: Record<string, Tip[]> = {
  disciplinario: [
    {
      titulo: 'Faltas gravísimas — los 7 grupos clave',
      cita: 'Ley 1952 de 2019, Art. 52',
      contenido:
        'Memoriza por bloques: (1) protección DDHH, (2) probidad, (3) servicio, (4) función pública, (5) régimen de inhabilidades, (6) intervención política indebida, (7) discriminación.',
    },
    {
      titulo: 'Diferencia entre Sanción Principal y Accesoria',
      cita: 'Ley 1952 de 2019, Art. 48-49',
      contenido:
        'Principales: destitución, suspensión, multa, amonestación. Accesoria: la inhabilidad va siempre con destitución (10-20 años) o cuando expresamente se imponga.',
    },
    {
      titulo: 'Caducidad vs. Prescripción',
      cita: 'Ley 1952 de 2019, Art. 33',
      contenido:
        'Caducidad: 5 años desde la conducta (acción para iniciar). Prescripción: 5 años desde apertura formal (para imponer sanción). Truco: caducidad ANTES de iniciar, prescripción DESPUÉS.',
    },
  ],
  estructura_estado: [
    {
      titulo: 'PGN — Órgano de control autónomo',
      cita: 'Constitución Política, Art. 117 y 275',
      contenido:
        'La PGN es órgano de control independiente, NO hace parte de las ramas Ejecutiva, Legislativa ni Judicial. Cabeza: Procurador General (4 años, no reelegible inmediato).',
    },
    {
      titulo: 'Funciones del Ministerio Público',
      cita: 'Constitución Política, Art. 277',
      contenido:
        'Tres ejes: (1) defender el orden jurídico y patrimonio público, (2) proteger DDHH y garantías de los ciudadanos, (3) vigilar conducta oficial de quienes desempeñen funciones públicas.',
    },
    {
      titulo: 'Niveles jerárquicos del Decreto Ley 262',
      cita: 'Decreto Ley 262 de 2000, Art. 21',
      contenido:
        'Procurador General → Viceprocurador → Procuradores Delegados → Procuradores Auxiliares → Procuradurías Regionales/Distritales/Provinciales → Procuradurías Judiciales.',
    },
  ],
  derechos_fundamentales: [
    {
      titulo: 'Tutela: 4 requisitos básicos',
      cita: 'Decreto 2591 de 1991, Art. 1',
      contenido:
        '(1) Vulneración o amenaza de derecho fundamental, (2) acción u omisión de autoridad pública (o particular en casos taxativos), (3) inexistencia de otro medio judicial idóneo, (4) inmediatez razonable.',
    },
    {
      titulo: 'Términos de la tutela',
      cita: 'Decreto 2591 de 1991, Art. 29 y 32',
      contenido:
        'Decisión: 10 días desde solicitud. Impugnación: 3 días desde notificación. Revisión Corte Constitucional: discrecional, plazo razonable.',
    },
    {
      titulo: 'Acción de cumplimiento (no confundir)',
      cita: 'Ley 393 de 1997, Art. 1',
      contenido:
        'Solo procede para hacer cumplir una NORMA con fuerza material de ley o un ACTO ADMINISTRATIVO. No protege derechos fundamentales — para eso es la tutela.',
    },
  ],
  gestion_documental: [
    {
      titulo: 'Ciclo vital del documento',
      cita: 'Ley 594 de 2000, Art. 23',
      contenido:
        'Tres fases: (1) Archivo de Gestión (uso frecuente, oficina), (2) Archivo Central (uso esporádico, entidad), (3) Archivo Histórico (valor permanente).',
    },
    {
      titulo: 'TRD — Tabla de Retención Documental',
      cita: 'Ley 594 de 2000, Art. 24',
      contenido:
        'Documento que define cuánto tiempo permanece cada tipo documental en cada fase del ciclo. Es OBLIGATORIA para todas las entidades públicas. La aprueba el Comité Interno de Archivo.',
    },
    {
      titulo: 'Derecho de petición — términos',
      cita: 'Ley 1755 de 2015, Art. 14',
      contenido:
        'General: 15 días hábiles. Documentos: 10 días. Consultas: 30 días. Si hay imposibilidad: informar antes del vencimiento y ampliar al doble del término inicial.',
    },
  ],
  carrera_admin: [
    {
      titulo: 'Sistema de carrera de la PGN — especialidad',
      cita: 'Decreto Ley 262 de 2000, Art. 183',
      contenido:
        'La PGN tiene SISTEMA ESPECIAL de carrera (no general). Ley 909/2004 aplica solo de forma supletiva ante vacíos. Cabeza administradora: Oficina de Selección y Carrera.',
    },
    {
      titulo: 'Período de prueba',
      cita: 'Decreto Ley 262 de 2000, Art. 219',
      contenido:
        'Duración: 6 meses contados desde la posesión. Calificación final NO inferior a satisfactoria → inscripción en carrera. Insatisfactoria → cese del nombramiento.',
    },
    {
      titulo: 'Listas de elegibles — vigencia',
      cita: 'Decreto Ley 262 de 2000, Art. 217',
      contenido:
        'Vigencia: 2 años desde su firmeza. Se proveen en orden estricto de mérito. Recomposición: cuando alguien renuncia o no acepta el cargo, baja toda la lista.',
    },
  ],
  etica: [
    {
      titulo: 'Código de Integridad — 5 valores',
      cita: 'Función Pública (Decreto 1499 de 2017)',
      contenido:
        'Honestidad, respeto, compromiso, diligencia y justicia. Son los pilares conductuales de TODO servidor público colombiano. La PGN los exige y los califica.',
    },
    {
      titulo: 'Inhabilidades vs. Incompatibilidades',
      cita: 'Ley 734/2002 supletiva — Ley 1952 Art. 38-44',
      contenido:
        'Inhabilidad: imposibilidad LEGAL para acceder al cargo (antes de). Incompatibilidad: prohibición de simultanear funciones o actividades (durante el cargo).',
    },
    {
      titulo: 'Conflicto de intereses',
      cita: 'Ley 1952 de 2019, Art. 44',
      contenido:
        'Aparece cuando el interés del servidor (o sus parientes hasta 4° consanguinidad / 2° afinidad) puede afectar su decisión. Debe declararse y apartarse del trámite.',
    },
  ],
  aptitud_verbal: [
    {
      titulo: 'Comprensión lectora — método 4 pasos',
      cita: 'Guía CNSC',
      contenido:
        '(1) Identifica idea principal del párrafo, (2) detecta conectores (porque/sin embargo/por tanto), (3) descarta opciones extremas o ajenas al texto, (4) responde solo con lo que el texto AFIRMA.',
    },
    {
      titulo: 'Sinónimos y antónimos en contexto',
      cita: 'Guía CNSC',
      contenido:
        'Nunca elijas la palabra que SIEMPRE significa lo mismo — elige la que mejor ENCAJA en la oración del texto. El contexto manda sobre el diccionario.',
    },
    {
      titulo: 'Inferencia vs. Implicación',
      cita: 'Guía CNSC',
      contenido:
        'Inferir: deducir lo que NO está dicho pero se desprende lógicamente. Implicar: lo que el texto DA POR HECHO sin afirmarlo. Ambas se apoyan SOLO en el texto, no en tu opinión.',
    },
  ],
  ofimatica: [
    {
      titulo: 'Excel — funciones más evaluadas',
      cita: 'Manual de Funciones PGN',
      contenido:
        'BUSCARV/CONSULTAV, SI anidados, SUMAR.SI/CONTAR.SI, tablas dinámicas. La PGN evalúa especialmente trazabilidad de fórmulas en hojas con datos disciplinarios.',
    },
    {
      titulo: 'Word — formato institucional',
      cita: 'Manual de Funciones PGN',
      contenido:
        'Estilos, tabla de contenido automática, control de cambios, combinar correspondencia. Documentos oficiales: tipografía Arial 12, interlineado 1.5, márgenes 3-3-3-3 cm.',
    },
    {
      titulo: 'Outlook / Correo institucional',
      cita: 'Política de seguridad PGN',
      contenido:
        'Reglas, firmas, calendarios compartidos. Nunca abrir adjuntos sospechosos: phishing es vector frecuente en entidades de control. Reportar a la mesa de servicio.',
    },
  ],
  comportamental: [
    {
      titulo: 'Competencias del servidor público',
      cita: 'Decreto 1083 de 2015, Art. 2.2.4.6',
      contenido:
        'Comunes (a todos): orientación a resultados, compromiso institucional, transparencia. Por nivel: liderazgo (directivo), análisis (asesor), conocimiento técnico (profesional).',
    },
    {
      titulo: 'Cómo responder Likert estratégicamente',
      cita: 'Guía CNSC',
      contenido:
        'No marques siempre extremos (1 o 5). Sé consistente: si dices que valoras la planeación, no marques bajo en disciplina. Las pruebas detectan deseabilidad social.',
    },
    {
      titulo: 'Resolución de conflictos en equipo',
      cita: 'Modelo de Liderazgo Función Pública',
      contenido:
        'Pasos: (1) escuchar a las partes por separado, (2) identificar el problema real (no las posiciones), (3) buscar intereses comunes, (4) acordar acciones medibles con seguimiento.',
    },
  ],
};

interface Props {
  modulo?: string;
  modulosDebiles?: string[];
}

export default function TipsRecordatorios({ modulo, modulosDebiles = [] }: Props) {
  // Prioridad: (1) módulo específico → (2) módulo más débil → (3) disciplinario default
  let slug = modulo ?? modulosDebiles[0];
  if (!slug || !TIPS_POR_MODULO[slug]) {
    slug = 'disciplinario';
  }
  const tips = TIPS_POR_MODULO[slug];

  return (
    <div
      style={{
        padding: '1.25rem',
        backgroundColor: '#fefce8',
        border: '1px solid #fde68a',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ fontSize: '1.125rem' }}>💡</span>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#854d0e',
          }}
        >
          Tips clave para tu sesión
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tips.map((tip, i) => (
          <div
            key={i}
            style={{
              padding: '0.75rem 0.875rem',
              backgroundColor: 'white',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '0.25rem',
              }}
            >
              {tip.titulo}
            </p>
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#854d0e',
                fontFamily: 'var(--font-serif, serif)',
                marginBottom: '0.375rem',
                fontStyle: 'italic',
              }}
            >
              {tip.cita}
            </p>
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#334155',
                lineHeight: 1.55,
              }}
            >
              {tip.contenido}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
