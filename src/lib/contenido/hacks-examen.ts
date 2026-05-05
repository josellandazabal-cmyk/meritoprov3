// ============================================================
// Biblioteca curada de Hacks de Examen — concurso PGN 2026
//
// Conjunto de técnicas concretas y aplicables que ayudan al
// aspirante a resolver más preguntas correctamente y en menos
// tiempo. Construida a partir de:
//   · Metodología CNSC para pruebas escritas (Acuerdo 6176/2018)
//   · Práctica forense LSAT/Pearson VUE (process of elimination)
//   · Recomendaciones de ConvocatoriaCNSC + Sooypro + GrupoGeard
//   · Estructura oficial de ítems Tipo I/II/III/Comportamental
//
// Categorías:
//   - estructura_examen: cómo abordar la prueba en general (tiempo, orden)
//   - tipo_I, tipo_II, tipo_III, comportamental: hacks por tipo de ítem
//   - lectura: comprensión de enunciados largos
//   - tematico: hacks específicos del corpus normativo PGN
// ============================================================

export type CategoriaHack =
  | 'estructura_examen'
  | 'tipo_I'
  | 'tipo_II'
  | 'tipo_III'
  | 'comportamental'
  | 'lectura'
  | 'tematico';

export interface HackExamen {
  id: string;
  categoria: CategoriaHack;
  titulo: string;
  /** Cuerpo del hack — formato Markdown ligero, ≤ 220 caracteres ideal. */
  cuerpo: string;
  /** Ejemplo concreto corto — visible en variante inline. */
  ejemplo?: string;
  /** Caso práctico desarrollado — visible al expandir "Ver más". */
  casoPractico?: {
    titulo: string;
    enunciado: string;
    desarrollo: string[];
    conclusion: string;
  };
  /** Modulos donde aplica (para filtrado contextual en /entrenar). */
  modulos?: string[];
}

// ============================================================
// HACKS — listado canónico
// ============================================================
export const HACKS_EXAMEN: HackExamen[] = [
  // ----------------------------------------------------------
  // ESTRUCTURA DEL EXAMEN
  // ----------------------------------------------------------
  {
    id: 'est-001',
    categoria: 'estructura_examen',
    titulo: 'Regla del minuto y medio',
    cuerpo:
      'Una pregunta promedio debe tomarte 90 segundos. Si pasaste de 2 minutos, marca tu mejor opción y avanza — el reloj no perdona. Vuelves al final si te queda tiempo.',
  },
  {
    id: 'est-002',
    categoria: 'estructura_examen',
    titulo: 'Primero las que dominas',
    cuerpo:
      'Da una primera pasada respondiendo solo lo que te queda obvio. En la segunda atacas las dudosas con la cabeza despejada. Esta táctica suele subir 5-8 puntos vs. responder en orden lineal.',
  },
  {
    id: 'est-003',
    categoria: 'estructura_examen',
    titulo: 'Marca y descarta sobre el papel',
    cuerpo:
      'Usa el papel de borrador entregado: tacha visualmente las opciones que descartaste. Disminuye el agotamiento mental y evita relecturas innecesarias.',
  },
  {
    id: 'est-004',
    categoria: 'estructura_examen',
    titulo: 'Confía en tu primera lectura',
    cuerpo:
      'Cambiar la respuesta sin nueva información tiende a empeorar el puntaje. Solo cambia si encuentras un error objetivo en tu razonamiento original — no por simple duda.',
  },

  // ----------------------------------------------------------
  // TIPO I — Selección múltiple única respuesta
  // ----------------------------------------------------------
  {
    id: 'ti-001',
    categoria: 'tipo_I',
    titulo: 'Descarte por absolutos',
    cuerpo:
      'Las opciones con palabras como "siempre", "nunca", "todos sin excepción" suelen ser falsas en derecho. La normativa casi siempre admite excepciones. Marca esas opciones como sospechosas.',
    ejemplo:
      'Si dos opciones dicen "siempre" o "nunca" y la tercera dice "salvo que" o "cuando aplique", la tercera tiene ventaja estadística.',
    casoPractico: {
      titulo: 'Caso práctico — Acción de tutela',
      enunciado:
        'Según el Decreto 2591/1991, la acción de tutela:\n\nA. Procede SIEMPRE que se invoque un derecho fundamental.\nB. NUNCA procede contra particulares.\nC. Procede contra particulares cuando el accionante esté en estado de subordinación o indefensión, entre otros supuestos.\nD. Procede TODAS las veces que falle la jurisdicción ordinaria.',
      desarrollo: [
        'Identifico absolutos: A dice "SIEMPRE", B dice "NUNCA", D dice "TODAS las veces". Tres opciones tienen palabras absolutas — sospechosas.',
        'C usa "cuando" + "entre otros supuestos" — admite condiciones y excepciones. Coincide con el lenguaje típico de la norma.',
        'Verifico C contra el Art. 42 del Decreto 2591: efectivamente la tutela contra particulares procede en casos específicos (subordinación, indefensión, prestación servicio público, etc.).',
      ],
      conclusion:
        'Respuesta: C. Sin haberme aprendido el Art. 42 al pie de la letra, el descarte por absolutos te lleva al 75% de probabilidad de acierto. Combinado con conocimiento básico, te garantiza el punto.',
    },
  },
  {
    id: 'ti-002',
    categoria: 'tipo_I',
    titulo: 'Opción más completa gana',
    cuerpo:
      'Cuando dos opciones son válidas pero una es subconjunto de la otra (más amplia y precisa), la PGN suele tomar la más completa. Compara qué opción cubre más supuestos sin contradecir el enunciado.',
  },
  {
    id: 'ti-003',
    categoria: 'tipo_I',
    titulo: 'Lee el enunciado dos veces',
    cuerpo:
      'Enunciados largos esconden conectores: "no", "salvo", "excepto", "siempre que". Subraya esas palabras antes de mirar las opciones — invierten completamente el sentido.',
  },
  {
    id: 'ti-004',
    categoria: 'tipo_I',
    titulo: 'Identifica el verbo de la pregunta',
    cuerpo:
      '"Indique", "señale", "identifique" piden hechos. "Concluya", "deduzca", "infiera" piden razonamiento. La estrategia de respuesta cambia según el verbo.',
  },

  // ----------------------------------------------------------
  // TIPO II — Combinaciones (1 y 2 / 1 y 3 / 2 y 4 / 1, 2 y 3)
  // ----------------------------------------------------------
  {
    id: 'tii-001',
    categoria: 'tipo_II',
    titulo: 'Descarte por una sola afirmación',
    cuerpo:
      'Si confirmas que una afirmación específica (ej. la 2) es FALSA, eliminas todas las opciones que la contienen. Con una sola seguridad reduces a una o dos opciones posibles.',
    ejemplo:
      'Opciones: A (1y2), B (1y3), C (2y4), D (1,2,3). Si la 2 es falsa, descartas A, C y D — la respuesta es B.',
    casoPractico: {
      titulo: 'Caso práctico — Faltas gravísimas (Ley 1952/2019)',
      enunciado:
        'Indique cuáles de las siguientes son faltas gravísimas según el Art. 52 del Código General Disciplinario:\n\n1. Aceptar dádivas para ejecutar un acto propio del cargo.\n2. Llegar 10 minutos tarde sin justificación.\n3. Adoptar decisiones por motivos distintos al interés general.\n4. Olvidar firmar un acta de reunión.\n\nA. 1 y 2  ·  B. 1 y 3  ·  C. 2 y 4  ·  D. 1, 2 y 3',
      desarrollo: [
        'Analizo afirmación 2: llegar tarde 10 min sin justificación es una falta LEVE, no gravísima. → 2 es FALSA.',
        'Aplico la regla: descarto toda opción que contenga la 2. Eliminadas A (1y2), C (2y4) y D (1,2,3).',
        'Solo queda B (1 y 3). Verifico afirmación 1 (Art. 52 N° 1 — recibir dádivas) y afirmación 3 (Art. 52 N° 28 — decisiones por motivos distintos al interés general). Ambas son gravísimas.',
      ],
      conclusion:
        'Respuesta: B (1 y 3). Con una sola seguridad (que la 2 es leve y no gravísima) descarté 3 de las 4 opciones sin necesidad de evaluar las demás. Tiempo invertido: ~40 segundos vs los 90 promedio.',
    },
  },
  {
    id: 'tii-002',
    categoria: 'tipo_II',
    titulo: 'Si dos afirmaciones son verdaderas, busca la combinación',
    cuerpo:
      'Confirmaste que 1 y 3 son verdaderas. Busca la opción que contenga exactamente esas — es B (1 y 3). Solo si encuentras una opción más amplia que también las incluya y otra adicional verdadera, sube.',
  },
  {
    id: 'tii-003',
    categoria: 'tipo_II',
    titulo: 'Atención al "y" excluyente',
    cuerpo:
      'Las opciones del Tipo II solo dan combinaciones cerradas (1y2, 1y3, 2y4, 1,2,3). Si crees que la respuesta es solo "la 4", revisa: probablemente confundiste algo — no existe esa opción.',
  },

  // ----------------------------------------------------------
  // TIPO III — Afirmación PORQUE Razón
  // ----------------------------------------------------------
  {
    id: 'tiii-001',
    categoria: 'tipo_III',
    titulo: 'Evalúa por separado, primero',
    cuerpo:
      'Antes de mirar las opciones, decide: ¿la afirmación es V o F? ¿La razón es V o F? Sin contaminarte con la opción A. Después conectas — el orden importa.',
  },
  {
    id: 'tiii-002',
    categoria: 'tipo_III',
    titulo: 'El conector PORQUE exige causalidad',
    cuerpo:
      'Para marcar A (la respuesta más fuerte), la razón debe EXPLICAR la afirmación, no solo ser verdadera al lado. Si la razón es V pero el "porque" no funciona como nexo causal, la respuesta es B.',
    ejemplo:
      'Afirmación: el Procurador puede sancionar. Razón: la PGN está en Bogotá. Ambas V, pero la razón NO explica la afirmación → opción B.',
    casoPractico: {
      titulo: 'Caso práctico — Tipo III sobre carrera administrativa',
      enunciado:
        '*Afirmación:* El ingreso a empleos de carrera administrativa se hace exclusivamente con base en el mérito, PORQUE *Razón:* la Comisión Nacional del Servicio Civil tiene su sede en Bogotá.\n\nA. Ambas V + razón explica · B. Ambas V sin nexo · C. V + F · D. F + V · E. Ambas F',
      desarrollo: [
        'Evalúo afirmación: el Art. 27 de la Ley 909/2004 establece que el ingreso es EXCLUSIVAMENTE por mérito. → Afirmación VERDADERA.',
        'Evalúo razón: la CNSC efectivamente tiene su sede principal en Bogotá. → Razón VERDADERA.',
        'Pregunta clave: ¿que la CNSC esté en Bogotá EXPLICA que el ingreso sea por mérito? NO. Una cosa es geográfica/administrativa, la otra es un principio constitucional (Art. 125 CP). No hay nexo causal.',
      ],
      conclusion:
        'Respuesta: B (ambas V pero la razón no explica la afirmación). La trampa común es marcar A porque ambas son verdaderas. La pregunta es si una EXPLICA a la otra.',
    },
  },
  {
    id: 'tiii-003',
    categoria: 'tipo_III',
    titulo: 'Memoriza la tabla de respuestas',
    cuerpo:
      'A = ambas V + razón explica. B = ambas V sin nexo. C = afirmación V, razón F. D = afirmación F, razón V. E = ambas F. Llegar al examen sin esto memorizado es perder puntos seguros.',
  },

  // ----------------------------------------------------------
  // COMPORTAMENTAL — Likert situacional (Decreto 815/2018)
  // ----------------------------------------------------------
  {
    id: 'comp-001',
    categoria: 'comportamental',
    titulo: 'Identifica la competencia evaluada',
    cuerpo:
      'El enunciado siempre apunta a UNA competencia (Trabajo en equipo, Orientación al ciudadano, etc.). Léelo y nómbrala antes de responder — eso te orienta hacia la conducta deseada.',
  },
  {
    id: 'comp-002',
    categoria: 'comportamental',
    titulo: 'La respuesta extrema rara vez es la correcta',
    cuerpo:
      'En Likert 1-5, las opciones 1 (nunca) y 5 (siempre) son tentadoras pero suelen reflejar conductas extremas. La PGN valora servidores equilibrados — usualmente la opción correcta está en 4 cuando la conducta es deseable.',
  },
  {
    id: 'comp-003',
    categoria: 'comportamental',
    titulo: 'Conducta deseable = puntuación alta',
    cuerpo:
      'Si el enunciado describe una conducta alineada con los valores del Código de Integridad (honestidad, respeto, compromiso, diligencia, justicia), responde 4-5. Si describe una conducta desalineada, responde 1-2.',
  },
  {
    id: 'comp-004',
    categoria: 'comportamental',
    titulo: 'No respondas como "tú harías" — responde como debe ser',
    cuerpo:
      'La prueba comportamental no mide tu personalidad real, mide si conoces el comportamiento esperado del servidor público. Responde según el Decreto 815, no según tu instinto.',
  },

  // ----------------------------------------------------------
  // LECTURA / COMPRENSIÓN
  // ----------------------------------------------------------
  {
    id: 'lec-001',
    categoria: 'lectura',
    titulo: 'Lee primero la pregunta, después el texto',
    cuerpo:
      'En ítems con texto base extenso (típico de aptitud verbal), lee primero qué te preguntan. Después lees el texto BUSCANDO la respuesta — ahorra hasta 40 segundos por ítem.',
  },
  {
    id: 'lec-002',
    categoria: 'lectura',
    titulo: 'Distingue idea principal de detalle',
    cuerpo:
      'Una opción puede ser cierta según el texto pero NO ser la idea principal. La idea principal es lo que hila TODO el párrafo, no lo que aparece en una sola frase. Si dudas, pregúntate: ¿el resto del texto sostendría esto?',
  },
  {
    id: 'lec-003',
    categoria: 'lectura',
    titulo: 'Distractor con coincidencia léxica',
    cuerpo:
      'Las opciones que repiten palabras del texto no necesariamente son correctas — pueden contradecir un detalle clave. Lee TODAS las opciones antes de marcar; el primer match léxico suele ser trampa.',
  },
  {
    id: 'lec-004',
    categoria: 'lectura',
    titulo: 'Inferir solo lo que el texto sostiene',
    cuerpo:
      'La respuesta correcta debe poder defenderse SOLO con lo que dice el texto, no con tu conocimiento previo. Si necesitas información de afuera para que la opción sea verdadera, esa opción está mal.',
    casoPractico: {
      titulo: 'Caso práctico — Inferencia sobre fragmento normativo',
      enunciado:
        'Texto: "El servidor público debe cumplir con diligencia, eficiencia e imparcialidad el servicio que le sea encomendado y abstenerse de toda conducta contraria a su rectitud."\n\n¿Cuál de las siguientes inferencias se sostiene SOLO con el texto?\n\nA. El servidor que actúa con diligencia recibirá un ascenso.\nB. La rectitud es un valor que la norma exige al servidor.\nC. La imparcialidad solo aplica en procesos judiciales.\nD. El servidor puede negarse a tareas si las considera injustas.',
      desarrollo: [
        'A: el texto NO menciona ascensos. Aunque suene plausible, requiere conocimiento de afuera (Ley 909). → Descartada.',
        'C: el texto dice "imparcialidad" sin restringirla a lo judicial. Limitarla así contradice el texto. → Descartada.',
        'D: el texto dice "abstenerse de conductas contrarias a su rectitud", NO autoriza a negarse a tareas. → Descartada.',
        'B: el texto literalmente dice "abstenerse de toda conducta contraria a su rectitud", lo que confirma que la rectitud es un valor exigido. → Se sostiene SOLO con el texto.',
      ],
      conclusion:
        'Respuesta: B. La pregunta clave de comprensión lectora siempre es: ¿esto sale del texto, o lo estoy completando con lo que ya sé? Si necesitas conocimiento previo, esa opción está mal — aunque suene cierta.',
    },
  },

  // ----------------------------------------------------------
  // TEMÁTICOS (corpus normativo PGN)
  // ----------------------------------------------------------
  {
    id: 'tem-001',
    categoria: 'tematico',
    titulo: 'Faltas: Art. 38 vs Art. 39 vs Art. 52 (Ley 1952)',
    cuerpo:
      'Memoriza los números: Art. 38 = DEBERES. Art. 39 = faltas LEVES. Art. 52 = faltas GRAVÍSIMAS (taxativas). Es la trampa más frecuente del módulo disciplinario.',
    modulos: ['disciplinario'],
  },
  {
    id: 'tem-002',
    categoria: 'tematico',
    titulo: 'Tutela: 10 días de procedencia',
    cuerpo:
      'Acción de tutela (Decreto 2591/1991): el juez tiene 10 días para fallar. Lo confunden con los 6 meses de prescripción de la falta disciplinaria — son cosas distintas.',
    modulos: ['derechos_fundamentales'],
  },
  {
    id: 'tem-003',
    categoria: 'tematico',
    titulo: 'PGN: Procurador Delegado vs Procurador Judicial',
    cuerpo:
      'Procurador Delegado = funciones de control y vigilancia (Art. 24 Decreto 262). Procurador Judicial = intervención en procesos (Art. 38). Confundirlos es perder pregunta segura.',
    modulos: ['estructura_estado', 'disciplinario'],
  },
  {
    id: 'tem-004',
    categoria: 'tematico',
    titulo: 'Carrera administrativa: el mérito es exclusivo',
    cuerpo:
      'Art. 27 Ley 909/2004: el ingreso y permanencia en empleos de carrera SE HARÁ EXCLUSIVAMENTE con base en el mérito. La palabra "exclusivamente" es la trampa frecuente — no admite excepción.',
    modulos: ['carrera_admin'],
  },
  {
    id: 'tem-005',
    categoria: 'tematico',
    titulo: 'Código de Integridad: 5 valores oficiales',
    cuerpo:
      'Honestidad, Respeto, Compromiso, Diligencia, Justicia (orden mnemotécnico HRCDJ). No son 4 ni 6 — son exactamente 5, adoptados por +25.000 servidores en el Decreto 1499/2017.',
    modulos: ['etica'],
  },
  {
    id: 'tem-006',
    categoria: 'tematico',
    titulo: 'Ponderación PGN por nivel',
    cuerpo:
      'Profesional/Asesor/Ejecutivo: 70% conocimientos + 20% comportamentales + 10% antecedentes. Técnico/Admin/Operativo: 60% + 20% + 20%. El mínimo eliminatorio (65%) aplica solo a conocimientos.',
  },
];

// ============================================================
// HELPERS
// ============================================================

/** Selecciona N hacks aleatorios (estables por seed/día opcional). */
export function elegirHacksAleatorios(
  cantidad: number = 3,
  filtros?: { categoria?: CategoriaHack; modulo?: string }
): HackExamen[] {
  let pool = HACKS_EXAMEN;
  if (filtros?.categoria) {
    pool = pool.filter((h) => h.categoria === filtros.categoria);
  }
  if (filtros?.modulo) {
    pool = pool.filter(
      (h) => !h.modulos || h.modulos.includes(filtros.modulo!)
    );
  }
  // Fisher-Yates shuffle, slice
  const copia = [...pool];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, cantidad);
}

/** Hack del día — selección estable basada en la fecha (mismo hack todo el día). */
export function hackDelDia(): HackExamen {
  const hoy = new Date();
  const seed =
    hoy.getFullYear() * 1000 + hoy.getMonth() * 31 + hoy.getDate();
  return HACKS_EXAMEN[seed % HACKS_EXAMEN.length];
}

/** Hack relevante para un tipo de pregunta concreto que el usuario está respondiendo. */
export function hackParaTipo(
  tipo: 'tipo_I' | 'tipo_II' | 'tipo_III' | 'comportamental'
): HackExamen | null {
  const candidatos = HACKS_EXAMEN.filter((h) => h.categoria === tipo);
  if (candidatos.length === 0) return null;
  // Aleatorio dentro del tipo
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

/** Hack relevante para un módulo específico. */
export function hackParaModulo(slug: string): HackExamen | null {
  const candidatos = HACKS_EXAMEN.filter((h) =>
    h.modulos?.includes(slug)
  );
  if (candidatos.length === 0) return null;
  return candidatos[Math.floor(Math.random() * candidatos.length)];
}
