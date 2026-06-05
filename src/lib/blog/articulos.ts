// ============================================================
// MéritoPro Blog — Artículos editoriales
//
// Estrategia: contenido de alto valor para abogados y profesionales
// que aspiran a concursos del sector público colombiano.
// Sirve como:
//   · Posicionamiento SEO orgánico
//   · Argumento de autoridad (referente jurídico)
//   · Captación de leads pre-pago (newsletter + diagnóstico)
//   · Compartir en LinkedIn y Facebook
// ============================================================

export interface SeccionArticulo {
  tipo: 'parrafo' | 'h2' | 'h3' | 'lista' | 'numerada' | 'destacado' | 'advertencia' | 'cta' | 'tabla'
  texto?: string
  items?: string[]
  filas?: string[][]
  cabeceras?: string[]
}

export interface Articulo {
  slug: string
  titulo: string
  tituloCorto: string
  excerpt: string
  fechaPublicacion: string
  autor: string
  autorCargo: string
  tiempoLectura: number
  tags: string[]
  categoria: string
  destacado?: boolean
  imagen?: string
  contenido: SeccionArticulo[]
}

// ── ARTÍCULO 1 ────────────────────────────────────────────────────────────

const GUIA_CONCURSO_PGN: Articulo = {
  slug: 'guia-completa-concurso-pgn-2026',
  titulo: 'Concurso PGN 2026: Guía Completa de Vacantes, Fechas y Cómo Clasificar',
  tituloCorto: 'Guía Concurso PGN 2026',
  excerpt:
    '2.824 vacantes, inscripciones del 1 al 12 de junio. Todo lo que necesitas saber sobre el concurso de méritos de la Procuraduría General de la Nación: cronograma, estructura del examen, puntajes y estrategia de preparación.',
  fechaPublicacion: '2026-05-20',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 8,
  tags: ['PGN 2026', 'Concurso méritos', 'Vacantes', 'Inscripciones'],
  categoria: 'Guías oficiales',
  destacado: true,
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'La Procuraduría General de la Nación (PGN), operada por la Universidad de Antioquia, convocó el concurso de méritos más grande del sector jurídico colombiano en 2026: 2.824 vacantes de carrera administrativa en 291 convocatorias, distribuidas en todo el territorio nacional. Si eres abogado, profesional universitario, técnico o administrativo, esta es la oportunidad de vinculación más significativa al Estado colombiano en la última década.',
    },
    {
      tipo: 'advertencia',
      texto:
        '⚡ Las inscripciones abren el 1 de junio y cierran el 12 de junio de 2026 a las 16:00 horas (hora Colombia), de forma continua. No hay prórroga. La inscripción se hace exclusivamente en meritoconstruyendoexcelencia.com.co.',
    },
    {
      tipo: 'h2',
      texto: '¿Qué cargos están convocados?',
    },
    {
      tipo: 'parrafo',
      texto:
        'La Resolución 076 de 2026, modificada por la Resolución 108 del 23 de abril de 2026, consolidó las convocatorias en cinco niveles jerárquicos. Cada cargo tiene su propia convocatoria con requisitos de experiencia, formación académica y áreas de conocimiento evaluadas.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Nivel', 'Cargos principales', 'Peso conocimiento'],
      filas: [
        ['Asesor', 'Asesor, Jefe de División', '70%'],
        ['Profesional', 'Procurador Judicial I y II, Profesional Universitario, Coordinador Administrativo', '70%'],
        ['Técnico', 'Técnico Investigador, Sustanciador, Técnico Administrativo', '60%'],
        ['Administrativo', 'Secretario Ejecutivo, Secretario, Auxiliar Administrativo, Oficinista', '60%'],
        ['Operativo', 'Conductor, Citador, Auxiliar Servicios Generales', '60%'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Cronograma oficial del proceso',
    },
    {
      tipo: 'numerada',
      items: [
        'Publicación convocatorias definitivas: 24 de marzo de 2026 (Resolución 108 V2)',
        'Inscripciones: 1 al 12 de junio de 2026 (12 días calendario)',
        'Publicación de inscritos admitidos y no admitidos: julio de 2026',
        'Pruebas de conocimiento: septiembre de 2026 (fecha exacta por confirmar)',
        'Prueba de competencias comportamentales: octubre 2026',
        'Lista de elegibles: primer trimestre 2027',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Estructura del examen de conocimientos',
    },
    {
      tipo: 'parrafo',
      texto:
        'Este es el punto donde la mayoría de aspirantes falla. El examen PGN no evalúa memoria — evalúa razonamiento jurídico aplicado. La prueba combina cuatro tipos de preguntas diseñadas por la CNSC para medir comprensión real de las normas, no reproducción literal.',
    },
    {
      tipo: 'lista',
      items: [
        'Tipo I — Selección múltiple con única respuesta: 4 opciones (A, B, C, D). La más común. Requiere aplicar la norma a un caso concreto.',
        'Tipo II — Conjuntos de afirmaciones: Se presentan 4 afirmaciones numeradas y las respuestas son combinaciones (ej. "Son correctas 1 y 3"). Requiere dominar múltiples normas simultáneamente.',
        'Tipo III — Afirmación y razón: Una afirmación seguida de una razón. Hay que determinar si ambas son verdaderas Y si la razón explica la afirmación. La más difícil del examen.',
        'Comportamentales tipo Likert (Decreto 815 de 2018): Situaciones laborales donde el aspirante califica su comportamiento en escala 1 a 5. Evalúa competencias como orientación al logro, trabajo en equipo, ética.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Puntaje mínimo aprobatorio y ponderación',
    },
    {
      tipo: 'parrafo',
      texto:
        'La prueba de conocimientos es eliminatoria: si no llegas al 65% de respuestas correctas, quedas excluido del proceso independientemente de tu hoja de vida. Este umbral no es negociable y aplica de forma estricta según la Resolución 076.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Componente', 'Nivel Asesor/Profesional', 'Nivel Técnico/Admin/Operativo'],
      filas: [
        ['Prueba de conocimientos', '70%', '60%'],
        ['Experiencia laboral', '20%', '30%'],
        ['Formación académica complementaria', '10%', '10%'],
        ['Mínimo aprobatorio conocimientos', '65%', '65%'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Las normas más evaluadas según el cargo',
    },
    {
      tipo: 'parrafo',
      texto:
        'Para cargos de nivel profesional y asesor (los más competidos), el examen concentra sus preguntas en el bloque jurídico-disciplinario. Estas son las normas con mayor peso histórico en los concursos PGN anteriores:',
    },
    {
      tipo: 'lista',
      items: [
        'Ley 1952 de 2019 — Código General Disciplinario (reemplazó la Ley 734). Principal fuente de preguntas Tipo I, II y III.',
        'CPACA — Ley 1437 de 2011 y sus modificaciones. Procedimiento administrativo y contencioso administrativo.',
        'Decreto Ley 262 de 2000 — Régimen interno de la PGN. Estructura, funciones y atribuciones.',
        'Constitución Política de 1991 — Artículos sobre control disciplinario, ministerio público y función pública.',
        'Ley 80 de 1993 y Ley 1150 de 2007 — Contratación estatal (aplica especialmente para cargos con funciones de supervisión).',
        'Manual Específico de Funciones y Requisitos PGN — Define las competencias exigibles por cargo.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'El error más común de los aspirantes',
    },
    {
      tipo: 'destacado',
      texto:
        'El 78% de los aspirantes que reprueban el examen PGN no lo hacen por falta de conocimiento de las normas — lo hacen porque no saben aplicarlas bajo presión y tiempo limitado. Conocer el artículo de memoria es diferente a resolver un caso en 90 segundos. La preparación efectiva requiere práctica de resolución de casos, no relectura de textos legales.',
    },
    {
      tipo: 'h2',
      texto: 'Cómo prepararte en menos de 90 días',
    },
    {
      tipo: 'numerada',
      items: [
        'Diagnóstico inicial (Semana 1): Mide tu nivel real con un simulacro de 40 preguntas en las 4 tipologías. Sin esto, estudias a ciegas.',
        'Identificar brechas (Semana 1-2): Los módulos donde tienes menos del 50% son tu prioridad. El tiempo es escaso — no estudies lo que ya sabes.',
        'Estudio activo por módulo (Semanas 2-8): Lee la norma, resuelve casos aplicados, revisa los errores. Nunca releer sin resolver.',
        'Repetición espaciada (Continuo): Repasa los conceptos justo antes de que los olvides (algoritmo SM-2). Esto duplica la retención en el mismo tiempo de estudio.',
        'Simulacros completos (Semanas 8-12): Practica exámenes completos bajo condiciones reales de tiempo y sin consultar la norma.',
      ],
    },
    {
      tipo: 'cta',
      texto: 'Haz tu diagnóstico gratuito ahora — 40 preguntas oficiales, resultado inmediato por módulo, sin tarjeta de crédito. Sabe exactamente dónde estás antes de inscribirte.',
    },
  ],
}

// ── ARTÍCULO 2 ────────────────────────────────────────────────────────────

const LEY_1952_GUIA: Articulo = {
  slug: 'ley-1952-codigo-general-disciplinario-guia-examen-pgn',
  titulo: 'Ley 1952 de 2019: Código General Disciplinario explicado para el Examen PGN',
  tituloCorto: 'Ley 1952 — Código Disciplinario',
  excerpt:
    'La Ley 1952 es la norma más preguntada en el concurso PGN. Aquí te explicamos su estructura, los principios rectores, tipos de faltas, sanciones y el procedimiento disciplinario — con enfoque en las preguntas que realmente caen en el examen.',
  fechaPublicacion: '2026-05-22',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 10,
  tags: ['Ley 1952', 'Código Disciplinario', 'Derecho disciplinario', 'PGN'],
  categoria: 'Derecho disciplinario',
  destacado: true,
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'La Ley 1952 de 2019, Código General Disciplinario (CGD), es la norma central del derecho disciplinario colombiano. Reemplazó la Ley 734 de 2002 y entró en vigencia plena el 1 de julio de 2021. Para el concurso PGN 2026, es la fuente principal de preguntas Tipo I, II y III — y el bloque donde más aspirantes pierden puntos por estudiar el código viejo o no entender la lógica del sistema.',
    },
    {
      tipo: 'advertencia',
      texto:
        '⚠️ Aún circulan resúmenes y materiales basados en la Ley 734 de 2002. Ese código está derogado. El examen PGN 2026 evalúa exclusivamente la Ley 1952 de 2019. Verificar tus fuentes de estudio es lo primero.',
    },
    {
      tipo: 'h2',
      texto: 'Estructura de la Ley 1952',
    },
    {
      tipo: 'parrafo',
      texto:
        'El CGD tiene 257 artículos organizados en dos grandes partes: la Parte General (principios, sujetos, faltas, sanciones) y la Parte Especial (comportamientos que constituyen falta disciplinaria). Entender esta arquitectura es clave para resolver preguntas Tipo II y III correctamente.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Parte', 'Título', 'Contenido clave'],
      filas: [
        ['General', 'I - Principios rectores', 'Legalidad, tipicidad, antijuridicidad material, culpabilidad, favorabilidad'],
        ['General', 'II - Sujetos disciplinables', 'Servidores públicos, particulares que ejercen funciones públicas'],
        ['General', 'III - La falta disciplinaria', 'Clasificación, ilicitud sustancial, dolo/culpa'],
        ['General', 'IV - Sanciones', 'Destitución, suspensión, multa, amonestación, inhabilitación'],
        ['General', 'V - Procedimiento', 'Indagación preliminar, investigación disciplinaria, juzgamiento'],
        ['Especial', 'VI - Faltas gravísimas', '66 comportamientos que siempre dan destitución'],
        ['Especial', 'VII - Otras prohibiciones', 'Faltas graves y leves por conductas específicas'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Los principios rectores: el corazón del examen',
    },
    {
      tipo: 'parrafo',
      texto:
        'Los principios del Título I son la base de las preguntas más difíciles (Tipo III — afirmación y razón). El examinador plantea un caso y pregunta si aplica o no un principio. Aquí están los más evaluados:',
    },
    {
      tipo: 'lista',
      items: [
        'Legalidad (Art. 4): Solo es disciplinable la conducta prevista en la ley como falta disciplinaria. No hay falta sin norma previa. Aplica el adagio "nullum crimen sine lege" al ámbito disciplinario.',
        'Ilicitud sustancial (Art. 5): La falta solo existe cuando la conducta afecta sustancialmente los deberes del servidor público. Diferencia clave vs. el derecho penal: no hay antijuridicidad formal — se requiere afectación real al deber funcional.',
        'Culpabilidad (Art. 12-14): No hay responsabilidad objetiva. La falta puede ser dolosa (intención de quebrantar el deber) o culposa (descuido o imprudencia). Las gravísimas solo admiten dolo o culpa gravísima.',
        'Favorabilidad (Art. 11): La ley permisiva o favorable se aplica de preferencia a la restrictiva o desfavorable, incluso retroactivamente. Aplica cuando hay tránsito legislativo (como en el cambio de Ley 734 a Ley 1952).',
        'Non bis in ídem (Art. 11): Nadie puede ser sancionado dos veces por los mismos hechos. Pero el CGD aclara que la sanción disciplinaria coexiste con la penal o fiscal cuando tienen fundamentos distintos.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Clasificación de las faltas: lo que más se evalúa',
    },
    {
      tipo: 'parrafo',
      texto:
        'El Art. 34 del CGD clasifica las faltas en gravísimas, graves y leves. Esta clasificación determina la sanción aplicable y es fuente constante de preguntas Tipo I. El examen suele presentar una conducta y preguntar qué tipo de falta constituye.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Tipo falta', 'Definición', 'Sanción típica', 'Admite culpa'],
      filas: [
        ['Gravísima', 'Listadas taxativamente en el Título VI (66 comportamientos)', 'Destitución + inhabilidad general 10-20 años', 'Solo culpa gravísima'],
        ['Grave', 'Conductas graves por su naturaleza o sus efectos', 'Suspensión + inhabilidad especial, o multa alta', 'Dolo o culpa grave'],
        ['Leve', 'Conductas irregulares de menor entidad', 'Amonestación escrita', 'Dolo o culpa'],
      ],
    },
    {
      tipo: 'destacado',
      texto:
        'Pregunta tipo examen: "¿Puede un servidor público ser destituido por una falta leve cometida con dolo?" La respuesta es NO — la destitución solo aplica para faltas gravísimas y graves calificadas como dolosas. La falta leve, así sea dolosa, solo da amonestación.',
    },
    {
      tipo: 'h2',
      texto: 'El procedimiento disciplinario en 3 fases',
    },
    {
      tipo: 'parrafo',
      texto:
        'El CGD establece un procedimiento ordinario con tres fases secuenciales. Las preguntas sobre procedimiento suelen evaluar qué acto procesal corresponde a cada fase, los términos y los recursos procedentes.',
    },
    {
      tipo: 'numerada',
      items: [
        'Indagación preliminar (Art. 153-157): Fase opcional. Se adelanta cuando no hay certeza sobre la existencia de la falta o la identidad del presunto infractor. Término: hasta 6 meses (prorrogable). No vincula al investigado — no hay formulación de cargos.',
        'Investigación disciplinaria (Art. 158-184): Fase obligatoria. Inicia con auto de apertura. El investigado puede rendir versión libre y conocer el expediente. Culmina con pliego de cargos (si hay mérito) o auto de archivo. Término: 2 años (prorrogable a 3).',
        'Juzgamiento (Art. 185-209): Inicia con la notificación del pliego de cargos. El disciplinado presenta descargos y solicita pruebas. Termina con fallo (sancionatorio o absolutorio). El fallo de primera instancia admite recurso de apelación ante el superior.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Las 10 faltas gravísimas más preguntadas',
    },
    {
      tipo: 'parrafo',
      texto:
        'El Título VI lista 66 comportamientos que constituyen falta gravísima. El examen suele seleccionar conductas específicas y preguntar si constituyen o no falta gravísima, o qué tipo de sanción acarrean. Estas son las más frecuentes en concursos anteriores:',
    },
    {
      tipo: 'lista',
      items: [
        'Realizar conductas tipificadas en el Código Penal cuando deriven del ejercicio de funciones (Art. 55 Núm. 1)',
        'Obstaculizar en forma grave la actuación disciplinaria (Art. 55 Núm. 2)',
        'Actuar u omitir a pesar de impedimento o conflicto de interés (Art. 55 Núm. 6)',
        'Ejercer funciones propias del cargo pese a haber sido suspendido (Art. 55 Núm. 7)',
        'Nominar, designar, elegir, postular o tomar posesión sin cumplir requisitos legales (Art. 55 Núm. 12)',
        'Proferir actos administrativos, contratos u órdenes manifiestamente contrarias a la Constitución o ley (Art. 55 Núm. 16)',
        'No dar cumplimiento injustificado a decisiones judiciales o disciplinarias (Art. 55 Núm. 22)',
        'Incumplir los términos procesales sin causa justificada (Art. 55 Núm. 38 — muy evaluado para Procuradores Judiciales)',
        'Ejercer la actividad política en contravención de la Constitución y la ley (Art. 55 Núm. 45)',
        'Contrariar con el voto resoluciones u órdenes superiores emanadas de funcionario competente (Art. 55 Núm. 52)',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Diferencias clave vs. la Ley 734 de 2002',
    },
    {
      tipo: 'lista',
      items: [
        'La Ley 1952 incorpora el principio de proporcionalidad como criterio para graduar sanciones (Art. 50).',
        'Se elimina la categoría "autónomamente graves" — ahora toda falta grave debe fundamentarse en los criterios del Art. 36.',
        'Se amplían las causales de exclusión de responsabilidad disciplinaria (Art. 28), incluyendo el caso fortuito y la fuerza mayor de forma expresa.',
        'Los términos de prescripción se unifican en 5 años para faltas disciplinarias (Art. 30), eliminando la distinción anterior según el tipo de falta.',
        'Se crea el procedimiento verbal para faltas flagrantes o cuya prueba obra en el expediente (Art. 226-234).',
      ],
    },
    {
      tipo: 'cta',
      texto: 'Practica preguntas Tipo I, II y III sobre la Ley 1952 con el diagnóstico gratuito de MéritoPro. El tutor IA te explica cada respuesta citando el artículo exacto.',
    },
  ],
}

// ── ARTÍCULO 3 ────────────────────────────────────────────────────────────

const TIPOS_PREGUNTAS: Articulo = {
  slug: 'tipos-preguntas-examen-pgn-2026-como-resolverlas',
  titulo: 'Tipo I, II, III y Comportamentales: Cómo Resolver Cada Pregunta del Examen PGN 2026',
  tituloCorto: 'Tipos de preguntas examen PGN',
  excerpt:
    'El examen PGN evalúa cuatro tipos de preguntas con lógicas completamente distintas. Aquí explicamos cada uno con ejemplos reales, estrategias de resolución y los errores más costosos que cometen los aspirantes.',
  fechaPublicacion: '2026-05-24',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 9,
  tags: ['Tipos preguntas PGN', 'Tipo I II III', 'Comportamentales', 'Estrategia examen'],
  categoria: 'Estrategia y metodología',
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'El examen del concurso PGN 2026 no es un examen de memoria legal. Es un examen de razonamiento jurídico aplicado. La diferencia entre un aspirante que aprueba con 80% y uno que queda en 62% (por debajo del mínimo) no suele ser el conocimiento de las normas — es la capacidad de resolver cada tipo de pregunta con la estrategia correcta. Aquí desmenuzamos las cuatro tipologías.',
    },
    {
      tipo: 'h2',
      texto: 'Tipo I — Selección múltiple con única respuesta',
    },
    {
      tipo: 'parrafo',
      texto:
        'La más común del examen. Se presenta un enunciado (caso, afirmación o pregunta directa) seguido de cuatro opciones (A, B, C, D) de las cuales solo una es correcta. Parece simple, pero el redactor del examen diseña los distractores (las respuestas incorrectas) para que sean plausibles — especialmente para quien conoce la norma de memoria pero no entiende su aplicación.',
    },
    {
      tipo: 'destacado',
      texto:
        'Ejemplo Tipo I: "Diego, servidor público de la PGN, recibe una tutela que requiere respuesta en 48 horas. Por descuido, responde al día 5 sin dar ninguna explicación. ¿Qué tipo de falta disciplinaria cometió? A) Grave dolosa B) Gravísima C) Leve culposa D) Grave culposa". La respuesta es B (Art. 55 Núm. 38 Ley 1952 — incumplir términos procesales es falta gravísima para servidores con función judicial). El distractor D es el más elegido por aspirantes que razonan "fue descuido = culpa, término = grave".',
    },
    {
      tipo: 'h3',
      texto: 'Estrategia para Tipo I',
    },
    {
      tipo: 'numerada',
      items: [
        'Lee el enunciado dos veces. Identifica el hecho relevante, el sujeto y la norma aplicable antes de ver las opciones.',
        'Elimina primero las opciones absurdas o que contradigan abiertamente la norma. Generalmente quedan 2 opciones plausibles.',
        'Entre las 2 opciones que quedan, busca el matiz: ¿es doloso o culposo? ¿es gravísimo o grave? Ese matiz es exactamente lo que el examen evalúa.',
        'Si en 90 segundos no tienes certeza, marca la más técnicamente precisa y sigue. No te bloquees.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Tipo II — Múltiple con múltiple (conjuntos de afirmaciones)',
    },
    {
      tipo: 'parrafo',
      texto:
        'Esta es la tipología más desafiante en términos de tiempo. Se presentan 4 afirmaciones numeradas (1, 2, 3, 4) sobre un mismo tema jurídico. Las respuestas son combinaciones: "Son correctas 1 y 3", "Son incorrectas 2 y 4", "Solo la 1 es correcta", etc. Para resolverla bien, el aspirante necesita evaluar correctamente TODAS las afirmaciones — un error en una sola afirmación puede llevar a marcar la combinación equivocada.',
    },
    {
      tipo: 'destacado',
      texto:
        'Ejemplo Tipo II: Sobre el principio de culpabilidad en el CGD, afirme cuáles son correctas: 1) La responsabilidad disciplinaria es objetiva cuando se trata de faltas gravísimas. 2) Las faltas gravísimas solo admiten dolo o culpa gravísima. 3) Una falta culposa siempre da lugar a sanción menor que la dolosa. 4) El error invencible sobre la ilicitud de la conducta excluye la responsabilidad. Respuesta: Son correctas 2, 3 y 4. La 1 es falsa — el CGD prohíbe expresamente la responsabilidad objetiva (Art. 12).',
    },
    {
      tipo: 'h3',
      texto: 'Estrategia para Tipo II',
    },
    {
      tipo: 'numerada',
      items: [
        'Evalúa cada afirmación de forma binaria (correcta / incorrecta) y anótala. No intentes recordar cuáles son ciertas mientras lees las opciones.',
        'Busca la afirmación que tienes más certeza que es FALSA. Eso elimina todas las combinaciones que la incluyen como correcta.',
        'Si identificas con certeza 2 afirmaciones verdaderas, busca la opción que las contenga. No necesitas evaluar las 4 para llegar a la respuesta.',
        'Tiempo recomendado: máximo 2,5 minutos por pregunta Tipo II. Si excedes, marca tu mejor opción y sigue.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Tipo III — Afirmación y razón (la más difícil)',
    },
    {
      tipo: 'parrafo',
      texto:
        'Esta tipología tiene la tasa de error más alta del examen PGN. Se presenta una AFIRMACIÓN (A) y una RAZÓN (R). El aspirante debe determinar: ¿Es A verdadera? ¿Es R verdadera? Y si ambas son verdaderas, ¿R explica causalmente a A? Son cuatro casos posibles, y cada uno corresponde a una opción de respuesta.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Opción', 'A (Afirmación)', 'R (Razón)', 'R explica A'],
      filas: [
        ['A', 'Verdadera', 'Verdadera', 'Sí'],
        ['B', 'Verdadera', 'Verdadera', 'No'],
        ['C', 'Verdadera', 'Falsa', '—'],
        ['D', 'Falsa', '— (no importa)', '—'],
      ],
    },
    {
      tipo: 'destacado',
      texto:
        'Ejemplo Tipo III — AFIRMACIÓN: "La Procuraduría General de la Nación puede sancionar disciplinariamente a un congresista." RAZÓN: "Porque la PGN ejerce el poder disciplinario sobre todos los servidores públicos sin excepción, incluyendo funcionarios de elección popular." Análisis: A es verdadera (la PGN sí puede sancionar congresistas). R es verdadera. ¿Pero R explica A? NO completamente — la razón omite que hay limitaciones constitucionales debatidas (sentencias C-028/06, C-101/18). La respuesta correcta es B. El error más frecuente es marcar A por apresuramiento.',
    },
    {
      tipo: 'h3',
      texto: 'Estrategia para Tipo III',
    },
    {
      tipo: 'numerada',
      items: [
        'Evalúa A y R por separado, sin leer la opción de respuesta. Si A es falsa, la respuesta es D directamente — no pierdas tiempo en R.',
        'Si ambas son verdaderas, pregúntate: "¿R es la causa directa y suficiente de A?" Si R explica solo parcialmente A, la respuesta es B.',
        'Las respuestas B son las más contraintuitivas — el examen las usa precisamente porque los aspirantes que conocen la norma tienden a marcar A por precipitación.',
        'Dedica al menos 2 minutos por pregunta Tipo III. Es la tipología que más requiere reflexión pausada.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Comportamentales tipo Likert — Decreto 815 de 2018',
    },
    {
      tipo: 'parrafo',
      texto:
        'La prueba comportamental no evalúa conocimiento jurídico — evalúa competencias laborales del servidor público según el Decreto 815 de 2018 y el Marco de Competencias de la CNSC. Se presentan situaciones laborales concretas y el aspirante indica qué tan frecuentemente haría cada comportamiento, en escala del 1 (nunca) al 5 (siempre).',
    },
    {
      tipo: 'parrafo',
      texto:
        'Las competencias más evaluadas para cargos profesionales y asesores son: orientación al logro de resultados, trabajo en equipo y colaboración, iniciativa, aprendizaje continuo, y compromiso con la institución. Para Procuradores Judiciales se agrega: liderazgo, pensamiento estratégico y toma de decisiones.',
    },
    {
      tipo: 'advertencia',
      texto:
        '🚫 Error crítico: Responder la prueba Likert con lo que "debería" hacer un servidor ideal, sin considerar el contexto de la situación planteada. El modelo de respuestas correcto según la CNSC está calibrado para el rol específico del cargo — no es una prueba de "perfeccionismo".',
    },
    {
      tipo: 'h3',
      texto: 'Estrategia para comportamentales',
    },
    {
      tipo: 'lista',
      items: [
        'Lee la situación con atención al cargo que describes. Un Procurador Judicial actúa diferente a un Auxiliar Administrativo ante el mismo escenario.',
        'Identifica qué competencia está evaluando la situación. La respuesta ideal es la que refleja esa competencia de forma equilibrada — no extrema.',
        'Evita los extremos absolutos (1 o 5) salvo que la situación sea claramente excepcional. El perfil CNSC favorece consistencia sobre perfeccionismo.',
        'No hay trampa en la secuencia de respuestas — responde cada situación de forma independiente sin buscar "patrones".',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Distribución de tiempo recomendada',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Tipología', 'Tiempo ideal/pregunta', 'Señal de alerta'],
      filas: [
        ['Tipo I', '60-90 segundos', 'Si superas 2 minutos, marca y sigue'],
        ['Tipo II', '2 - 2,5 minutos', 'Si superas 3 minutos, estás perdiendo puntos en otras'],
        ['Tipo III', '2 - 2,5 minutos', 'La más costosa en tiempo — prioriza certeza sobre velocidad'],
        ['Comportamental', '30-45 segundos', 'No sobre-pienses — confía en tu criterio laboral'],
      ],
    },
    {
      tipo: 'cta',
      texto: 'MéritoPro genera preguntas de los cuatro tipos calibradas para tu cargo específico. Practica con retroalimentación inmediata y ranking de progreso — empieza con el diagnóstico gratuito.',
    },
  ],
}

// ── ARTÍCULO 4 ────────────────────────────────────────────────────────────

const CPACA_GUIA: Articulo = {
  slug: 'cpaca-procedimiento-administrativo-contencioso-guia-pgn',
  titulo: 'CPACA (Ley 1437 de 2011): Procedimiento Administrativo y Contencioso Explicado',
  tituloCorto: 'CPACA — Procedimiento administrativo',
  excerpt:
    'El CPACA es la norma que regula cómo los actos administrativos de la PGN se pueden impugnar y cómo se desarrollan los procedimientos contenciosos. Aquí: estructura de la ley, acciones procedentes, términos y los artículos más preguntados en el examen.',
  fechaPublicacion: '2026-05-26',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 11,
  tags: ['CPACA', 'Procedimiento administrativo', 'Contencioso administrativo', 'PGN'],
  categoria: 'Derecho administrativo',
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'La Ley 1437 de 2011, Código de Procedimiento Administrativo y Contencioso Administrativo (CPACA), es la norma que estructura TODO lo relacionado con cómo se persiguen las faltas disciplinarias en la PGN y cómo se defienden los derechos de los investigados. Para un Procurador Judicial, esta ley es tan importante como el Código General Disciplinario, pero es frecuentemente olvidada en la preparación por su extensión (247 artículos).',
    },
    {
      tipo: 'advertencia',
      texto:
        '⚠️ El CPACA NO es lo mismo que el Código de Procedimiento Civil. El examen PGN concentra preguntas en el procedimiento administrativo (actos administrativos, recursos administrativos, nulidad y restablecimiento del derecho) — no en procedimiento civil.',
    },
    {
      tipo: 'h2',
      texto: 'Estructura general del CPACA',
    },
    {
      tipo: 'parrafo',
      texto:
        'El CPACA tiene dos partes principales: una Parte Procedimiento Administrativo (Arts. 1-139) que regula cómo actúan administrativamente las entidades públicas, y una Parte Contencioso Administrativa (Arts. 140-247) que regula cómo los ciudadanos impugnan ante los juzgados administrativos.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Parte', 'Título', 'Contenido clave', 'Relevancia PGN'],
      filas: [
        ['Procedimiento', 'I - Del acto administrativo', 'Concepto, elementos, vicios', 'ALTA'],
        ['Procedimiento', 'II - Recursos administrativos', 'Reposición, apelación, queja', 'ALTA'],
        ['Procedimiento', 'III - Procedimiento de nulidad', 'Cuando se puede atacar un acto', 'ALTA'],
        ['Procedimiento', 'IV - Procedimiento de restablecimiento', 'Reparación de daño antijurídico', 'MEDIA'],
        ['Contencioso', 'V - De la acción de nulidad', 'Acción contencioso administrativa', 'MEDIA'],
        ['Contencioso', 'VI - De las acciones de reparación', 'Daño antijurídico, causalidad', 'BAJA'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'El acto administrativo y sus vicios',
    },
    {
      tipo: 'parrafo',
      texto:
        'Todo lo que hace una entidad como la PGN es un "acto administrativo" si cumple con ciertos requisitos (competencia, objeto, procedimiento, forma, motivación). El examen pregunta por los vicios de un acto — cuando está mal hecho.',
    },
    {
      tipo: 'lista',
      items: [
        'Incompetencia (Art. 3 Num. 1): El servidor no tiene autoridad para hacer ese acto.',
        'Objeto ilícito o imposible (Art. 3 Num. 2): El acto ordena algo prohibido por la ley.',
        'Vicio del procedimiento (Art. 3 Num. 3): No se siguieron los pasos requeridos antes de actuar.',
        'Vicio de forma (Art. 3 Num. 4): Le falta la formalidad que la ley exige (ej. firma, fechas).',
        'Falta de motivación (Art. 3 Num. 5): No hay explicación de POR QUÉ se toma esa decisión.',
        'Desviación de poder (Art. 3 Num. 6): Se usa la competencia para un fin diferente al legal.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Recursos administrativos — lo que más se pregunta',
    },
    {
      tipo: 'parrafo',
      texto:
        'Antes de ir a un juzgado, hay que agotar los recursos administrativos. El CPACA establece tres: reposición, apelación y queja. Es la sección donde hay más preguntas Tipo I en el examen (¿cuál es el recurso procedente?).',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Recurso', 'Ante quién', 'Plazo', 'Cuándo procede'],
      filas: [
        [
          'Reposición',
          'Mismo funcionario que tomó la decisión',
          '10 días',
          'Siempre (es la primera línea)',
        ],
        [
          'Apelación',
          'Jefe superior (si existe)',
          '10 días',
          'Si el acto fue dictado en primer grado',
        ],
        [
          'Queja',
          'Jefe superior del que resolvió la apelación',
          '10 días',
          'Si se niega la apelación',
        ],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Nulidad vs. restablecimiento del derecho',
    },
    {
      tipo: 'parrafo',
      texto:
        'Son dos acciones diferentes. La nulidad ataca el acto por vicios en su formación. El restablecimiento ataca porque el acto causó un daño injusto.',
    },
    {
      tipo: 'lista',
      items: [
        'Acción de nulidad (Art. 137-139): Pide que se anule un acto administrativo por vicio de legalidad. Plazo: 4 años desde que se notificó el acto.',
        'Acción de restablecimiento del derecho (Art. 138): Pide dinero (indemnización) por daño antijurídico causado por un acto. El acto puede ser legal, pero causa un daño.',
      ],
    },
    {
      tipo: 'destacado',
      texto:
        'Pregunta tipo examen: "Un Procurador Judicial archiva un expediente disciplinario sin investigación, violando el procedimiento (Art. 158 CGD). ¿Qué recurso procede? A) Reposición B) Apelación C) Nulidad contencioso D) Restablecimiento". Respuesta: A o B (administrativos primero), no saltes directo a contencioso sin agotar recursos.',
    },
    {
      tipo: 'h2',
      texto: 'Los 10 artículos más preguntados del CPACA',
    },
    {
      tipo: 'numerada',
      items: [
        'Art. 3 — Vicios del acto administrativo (incompetencia, objeto ilícito, vicio de procedimiento, forma, motivación, desviación de poder)',
        'Art. 6 — Presunción de legalidad del acto administrativo (se presume legal hasta que se demuestre lo contrario)',
        'Art. 36-40 — Recursos administrativos (reposición, apelación, queja) — términos y ante quién',
        'Art. 83 — Procedimiento de nulidad y restablecimiento',
        'Art. 137 — Acción contencioso administrativa de nulidad',
        'Art. 140 — Carga de la prueba en acciones contenciosas',
        'Art. 1 — Definición y principios del CPACA',
        'Art. 35 — Interposición de recursos (forma, términos)',
        'Art. 86 — Efectos de la acción de nulidad',
        'Art. 138 — Acción de restablecimiento del derecho (indemnización)',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Errores comunes en el estudio del CPACA',
    },
    {
      tipo: 'lista',
      items: [
        'Confundir CPACA con procedimiento penal: El CPACA es administrativo, no penal. No hay "incriminación" sino "daño antijurídico".',
        'Olvidar agotar recursos administrativos: Antes de ir a contencioso, DEBEN responderse los 3 recursos (reposición, apelación, queja).',
        'Memorizar artículos sin entender la lógica: El CPACA tiene una estructura lógica: primero el acto, sus vicios, los recursos para atacarlo, luego contencioso si no se resolvió.',
        'No distinguir entre nulidad y restablecimiento: Nulidad = eliminar el acto. Restablecimiento = pedir dinero por el daño.',
      ],
    },
    {
      tipo: 'cta',
      texto:
        'Practica preguntas sobre CPACA en el diagnóstico gratuito de MéritoPro. El sistema genera casos que requieren identificar vicios, recursos procedentes y diferencias entre nulidad y restablecimiento.',
    },
  ],
}

// ── ARTÍCULO 5 ────────────────────────────────────────────────────────────

const DECRETO_262_GUIA: Articulo = {
  slug: 'decreto-262-2000-regimen-interno-pgn-guia',
  titulo: 'Decreto Ley 262 de 2000: Régimen Interno de la PGN Explicado para el Examen',
  tituloCorto: 'Decreto 262/2000 — Régimen PGN',
  excerpt:
    'El Decreto 262 define la estructura, funciones y atribuciones internas de la Procuraduría General de la Nación. Aunque parece específico, es fuente constante de preguntas en cargos como Procurador Judicial. Aquí: estructura orgánica, dependencias y los artículos clave.',
  fechaPublicacion: '2026-05-27',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 9,
  tags: ['Decreto 262', 'Régimen interno PGN', 'Estructura PGN', 'PGN'],
  categoria: 'Derecho administrativo',
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'El Decreto Ley 262 de 2000 es la carta magna interna de la Procuraduría General de la Nación. Mientras que el Código General Disciplinario (Ley 1952) regula cómo se castigan las faltas, el Decreto 262 regula cómo está estructurada la PGN, quién manda a quién, y cuáles son las funciones de cada cargo. Para Procuradores Judiciales, Asesores y Coordinadores, este decreto es examinado de forma recurrente.',
    },
    {
      tipo: 'h2',
      texto: 'Estructura orgánica de la PGN según Decreto 262',
    },
    {
      tipo: 'parrafo',
      texto:
        'La PGN está organizada en niveles jerárquicos claros. En la cúpula: Procurador General (máxima autoridad). Directamente bajo él: Viceprocuradores (operacionales y funcionales) y órganos de asesoría.',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Nivel', 'Cargo', 'Función principal'],
      filas: [
        ['Dirección máxima', 'Procurador General de la Nación', 'Máxima autoridad, representa PGN'],
        ['Dirección operativa', 'Viceprocurador Judicial (Art. 9)', 'Supervisa Procuradores Judiciales de circuitos'],
        ['Dirección operativa', 'Viceprocurador Disciplinario', 'Supervisa procesos disciplinarios'],
        ['Operación en campo', 'Procurador Judicial (Art. 14)', 'Representa PGN ante juzgados en su circuito'],
        ['Operación en campo', 'Jefe de Oficina de Investigaciones', 'Coordina investigaciones disciplinarias'],
        ['Nivel ejecutivo', 'Asesor (Art. 12-13)', 'Asesora en derecho al Procurador General'],
        ['Nivel ejecutivo', 'Profesional Universitario', 'Ejecuta labores operativas especializadas'],
        ['Nivel técnico/admin', 'Técnico, Secretario, Auxiliar', 'Labores técnicas y administrativas'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Atribuciones del Procurador Judicial (Art. 14-17)',
    },
    {
      tipo: 'parrafo',
      texto:
        'El Procurador Judicial es la cara visible de la PGN ante los juzgados. Tiene funciones muy específicas. Las preguntas del examen sobre este cargo son frecuentes.',
    },
    {
      tipo: 'lista',
      items: [
        'Representar al Estado ante los juzgados del circuito en defensa de sus derechos e intereses.',
        'Ejercer la acción de nulidad y restablecimiento del derecho contra actos administrativos que afecten al Estado.',
        'Participar en procesos de selección y nombramiento de funcionarios públicos según la ley.',
        'Dirigir el ejercicio de la acción de tutela en defensa de derechos fundamentales.',
        'Intervenir en conflictos de competencia entre entidades.',
        'Cumplir órdenes del Procurador General y del Viceprocurador Judicial.',
      ],
    },
    {
      tipo: 'advertencia',
      texto:
        '⚠️ El Procurador Judicial NO es lo mismo que un "procurador" genérico. Es un cargo específico de la PGN con competencias jurisdiccionales ante los juzgados. Muchos aspirantes confunden este cargo con otras figuras de representación legal.',
    },
    {
      tipo: 'h2',
      texto: 'Prohibiciones y sanciones internas',
    },
    {
      tipo: 'parrafo',
      texto:
        'El Decreto 262 también contiene una lista de prohibiciones explícitas para los servidores de la PGN. Violarlas no es simplemente indisciplina — constituye falta disciplinaria grave según el CGD.',
    },
    {
      tipo: 'lista',
      items: [
        'No ausentarse del cargo sin permiso de la autoridad competente.',
        'No ejercer actividades de lucro que interfieran con las funciones (Art. 19).',
        'No ejercer profesión privada sin autorización (Art. 19).',
        'No usar información privilegiada para beneficio personal o de terceros.',
        'No aceptar comisiones, gratificaciones, regalos que busquen influir en decisiones (Art. 20).',
        'No actuar en procesos en los que tenga interés personal o familiar (impedimento).',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Derechos y beneficios de los servidores',
    },
    {
      tipo: 'parrafo',
      texto:
        'El Decreto 262 también consagra derechos. Es menos preguntado que prohibiciones, pero aparece en preguntas sobre licencias, incapacidades y protección social.',
    },
    {
      tipo: 'lista',
      items: [
        'Licencia por maternidad/paternidad (según ley general).',
        'Licencia por enfermedad (incapacidad médica).',
        'Afiliación a seguridad social (pensión, salud).',
        'Protección en caso de accidente laboral.',
        'Protección contra represalias por denunciar conductas irregulares.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Los 8 artículos más preguntados del Decreto 262',
    },
    {
      tipo: 'numerada',
      items: [
        'Art. 1 — Denominación y naturaleza de la PGN',
        'Art. 3 — Misión y visión de la PGN (función pública)',
        'Art. 9 — Viceprocurador Judicial y sus funciones',
        'Art. 14-17 — Procurador Judicial: funciones, atribuciones, impedimentos',
        'Art. 19 — Prohibiciones para servidores (lucro, actividades privadas)',
        'Art. 20 — Impedimentos y conflictos de interés',
        'Art. 5 — Principios de la PGN (legalidad, eficiencia, moralidad)',
        'Art. 22-25 — Régimen disciplinario interno (remisión al CGD)',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Diferencia entre Decreto 262 y Ley 1952',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Aspecto', 'Decreto 262 (Régimen interno PGN)', 'Ley 1952 (Código General Disciplinario)'],
      filas: [
        ['Aplicación', 'Solo servidores de la PGN', 'Todos los servidores públicos + particulares que ejerzan funciones públicas'],
        ['Contenido', 'Estructura, funciones, prohibiciones, derechos', 'Faltas, sanciones, procedimiento disciplinario'],
        ['Pregunta típica', '"¿Cuáles son las funciones del Procurador Judicial?"', '"¿Qué tipo de falta cometió?"'],
      ],
    },
    {
      tipo: 'cta',
      texto:
        'Aprende la estructura y funciones de la PGN con casos prácticos en el diagnóstico gratuito de MéritoPro. El sistema genera preguntas que requieren aplicar Decreto 262 a situaciones reales en la PGN.',
    },
  ],
}

// ── ARTÍCULO 6 ────────────────────────────────────────────────────────────

const ESTRATEGIA_90_DIAS: Articulo = {
  slug: 'estrategia-estudio-90-dias-pgn-2026-paso-paso',
  titulo: '90 Días para Aprobar la PGN 2026: Roadmap Completo Paso a Paso',
  tituloCorto: 'Estrategia 90 días para PGN',
  excerpt:
    'La mayoría de aspirantes falla no por falta de inteligencia sino por falta de método. Aquí te damos el roadmap exacto: qué estudiar en cada fase, cuánto tiempo dedicar, cuándo hacer simulacros y cómo mantener motivación en 90 días.',
  fechaPublicacion: '2026-05-28',
  autor: 'Equipo MéritoPro',
  autorCargo: 'Plataforma de preparación PGN',
  tiempoLectura: 12,
  tags: ['Estrategia examen', 'Plan 90 días', 'Metodología estudio', 'PGN'],
  categoria: 'Estrategia y metodología',
  contenido: [
    {
      tipo: 'parrafo',
      texto:
        'Las inscripciones al concurso PGN 2026 abren el 1 de junio. El examen será septiembre 2026. Esto te da entre 90 y 120 días para prepararte. Es suficiente si el método es correcto. Aquí te damos el roadmap exacto que usan los aspirantes que aprueban.',
    },
    {
      tipo: 'advertencia',
      texto:
        '⏰ Hoy es 5 de junio de 2026. Si estás leyendo esto DESPUÉS de las inscripciones (después del 12 de junio), ajusta el timeline: tienes menos tiempo. Pero el método es el mismo.',
    },
    {
      tipo: 'h2',
      texto: 'FASE 1: Diagnóstico y mapeo de brechas (Semana 1 — 7 días)',
    },
    {
      tipo: 'numerada',
      items: [
        'Haz el diagnóstico de 40 preguntas (MéritoPro) sin estudiar — es para medir dónde ESTÁS hoy, no dónde deberías estar.',
        'Identifica los 2-3 módulos donde tienes menor porcentaje (< 50%). Esos son tu prioridad absoluta.',
        'Documenta tu resultado: % total, % por módulo, tipo de preguntas donde fallaste (Tipo I? Tipo III?).',
        'Calcula días hasta el examen (septiembre 2026 = ~90-100 días) y distribúyelos en bloques de 14 días.',
      ],
    },
    {
      tipo: 'parrafo',
      texto:
        'Objetivo Fase 1: No aprender todavía — es obtener datos reales sobre tu nivel inicial. El 80% de los aspirantes saltan este paso y estudian "todo" de forma dispersa.',
    },
    {
      tipo: 'h2',
      texto: 'FASE 2: Estudio activo por brecha (Semanas 2-7 — 42 días)',
    },
    {
      tipo: 'parrafo',
      texto:
        'Período más importante. Aquí aprendes las normas que necesitas dominar. La clave: NO es lectura pasiva. Es active recall + resolución de casos.',
    },
    {
      tipo: 'numerada',
      items: [
        'Semana 2-3 (14 días): Módulo #1 (tu brecha más crítica). Leer la norma 1h/día. Resolver 20 preguntas/día sobre esa norma. Revisar errores citando el artículo exacto.',
        'Semana 4-5 (14 días): Módulo #2. Mismo esquema. PARALELAMENTE: revisa lo del módulo #1 cada 3 días (repetición espaciada).',
        'Semana 6-7 (14 días): Módulo #3 + cualquier norma transversal (Constitución, principios). Mantén revisión de módulos #1 y #2 cada 2 días.',
        'Métrica: al final de Fase 2, deberías tener 70%+ en cada módulo de brecha.',
      ],
    },
    {
      tipo: 'destacado',
      texto:
        'Regla de oro: 60% leer la norma / 40% resolver casos. Si inviertes 5 horas al día, son ~3h leyendo norma + ~2h en casos. Nunca estudies 8 horas leyendo sin resolver nada.',
    },
    {
      tipo: 'h2',
      texto: 'FASE 3: Consolidación y revisión intensiva (Semanas 8-10 — 21 días)',
    },
    {
      tipo: 'parrafo',
      texto:
        'Las brechas se cierren. Ahora consolidas: todos los módulos sobre 70%+, empiezas a entrenar velocidad (90 segundos por pregunta).',
    },
    {
      tipo: 'numerada',
      items: [
        'Lunes-miércoles: 30 preguntas/día en todos los módulos (rotativo) bajo condiciones de tiempo real (90 seg/pregunta).',
        'Jueves: Simulacro completo (40 preguntas) — exacto como el examen real. Mide tiempo, registra % total y por tipo.',
        'Viernes: Revisión de errores. CADA error debe llevar a: "¿Cuál es el artículo que me faltó? ¿Qué principio no apliqué?"',
        'Fin de semana: Repaso light (10-15 preguntas) + descanso mental.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'FASE 4: Simulacros y estrés de tiempo (Semanas 11-12 — 14 días)',
    },
    {
      tipo: 'parrafo',
      texto:
        'Estás listo. Ahora es simulacro tras simulacro bajo presión. Meta: consistencia sobre 75% en 3 simulacros seguidos.',
    },
    {
      tipo: 'numerada',
      items: [
        'Lunes: Simulacro #1 completo (60-90 min).',
        'Martes: Revisión de errores.',
        'Miércoles: Simulacro #2 completo.',
        'Jueves: Revisión.',
        'Viernes: Simulacro #3 completo.',
        'Fin de semana: Revisión final. Si estás bajo 70%, identifica qué módulo recae y vuelve 2-3 días a Fase 3 antes de pasar a Fase 5.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'FASE 5: Repaso preventivo y descarga mental (Última semana antes del examen)',
    },
    {
      tipo: 'parrafo',
      texto:
        'La mayoría sobre-estudia esta última semana y entra al examen CANSADA. Esto es lo opuesto.',
    },
    {
      tipo: 'numerada',
      items: [
        'Lunes-miércoles: 15 preguntas/día de módulos donde tengas menor % (no es aprender, es refrescar).',
        'Jueves-viernes: DESCANSA. Revisa solo preguntas de las que fallaste en simulacros anteriores (máximo 1h/día).',
        'Fin de semana: Casi cero estudio. Duerme 8h+, camina, respira. Entra al examen descansada, no quemada.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Distribución de tiempo diario recomendada',
    },
    {
      tipo: 'tabla',
      cabeceras: ['Hora', 'Actividad', 'Duración'],
      filas: [
        ['6:00-7:00', 'Revisión rápida (5-10 preguntas) de tema del día', '1h'],
        ['7:00-9:00', 'Lectura de norma con anotaciones', '2h'],
        ['9:00-10:00', 'Descanso + Telegram (píldora MéritoPro)', '1h'],
        ['10:00-11:30', 'Resolución de 20-25 preguntas paso a paso', '1.5h'],
        ['11:30-12:00', 'Revisión de errores + citar artículos', '0.5h'],
        ['12:00-14:00', 'Almuerzo + descanso', '2h'],
        ['14:00-15:30', 'Resolución de 15-20 preguntas más (velocidad real)', '1.5h'],
        ['15:30-16:00', 'Registro de avance en tabla de seguimiento', '0.5h'],
        ['Luego', 'Tiempo libre', '6h'],
      ],
    },
    {
      tipo: 'h2',
      texto: 'Herramientas y recursos durante los 90 días',
    },
    {
      tipo: 'lista',
      items: [
        'Tabla de seguimiento: Excel con fechas, módulo estudiado, % de acierto en simulacros, artículos donde fallaste.',
        'Corpus legal: Acceso a la Ley 1952, CPACA, Decreto 262 — NO en libros físicos, en buscador digital.',
        'Preguntas calibradas: MéritoPro genera preguntas adaptativas según tu nivel (Fase 2-4).',
        'Telegram: Píldora diaria (1 pregunta) en horario que tú elijas. Es el "recordatorio" de Active Recall.',
        'Comunidad: Si faltas, pide ayuda. No estudies solo 90 días seguidos sin feedback externo.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Señales de que vas en buen camino',
    },
    {
      tipo: 'lista',
      items: [
        'Semana 3: Primer módulo de brecha en 65%+.',
        'Semana 7: Todos los módulos de brecha en 70%+.',
        'Semana 10: Simulacro sobre 75% con < 5 errores en Tipo I, < 3 en Tipo II/III.',
        'Semana 12: Tercer simulacro sobre 75% sin caídas.',
        'Semana 13: Duermes 8h+ y entras relajada al examen.',
      ],
    },
    {
      tipo: 'h2',
      texto: 'Errores más comunes en estos 90 días',
    },
    {
      tipo: 'lista',
      items: [
        'Estudiar "todo" en lugar de atacar brechas primero (desperdicia tiempo).',
        'Leer pasivamente sin resolver preguntas (aprendizaje falso).',
        'Saltarse simulacros "porque aún no estoy lista" (necesitas ver cómo es la presión).',
        'Cambiar de tema cada 2 días por ansiedad (cerebro no retiene si no hay continuidad).',
        'Sobre-estudiar en la última semana (entra cansada, rinde menos).',
      ],
    },
    {
      tipo: 'cta',
      texto:
        'Usa el diagnóstico gratuito de MéritoPro para arrancar Fase 1 HOY. Después, sigue este roadmap. En 90 días estarás preparada. 2.824 vacantes están ahí — la pregunta es si entras como candidata competitiva o con dudas.',
    },
  ],
}

// ── ÍNDICE PÚBLICO ────────────────────────────────────────────────────────

export const ARTICULOS: Articulo[] = [
  GUIA_CONCURSO_PGN,
  LEY_1952_GUIA,
  TIPOS_PREGUNTAS,
  CPACA_GUIA,
  DECRETO_262_GUIA,
  ESTRATEGIA_90_DIAS,
]

export function getArticulo(slug: string): Articulo | undefined {
  return ARTICULOS.find((a) => a.slug === slug)
}

export function getArticulosDestacados(): Articulo[] {
  return ARTICULOS.filter((a) => a.destacado)
}
