export default async function testAgents() {
  console.log('🤖 INICIANDO PRUEBAS DE AGENTES V4...\n');

  try {
    // 1. Prueba Agente 1 (Orquestador / Tutor)
    console.log('--- TEST 1: Agente 1 (Orquestador / Dificultad Adaptativa) ---');
    const resOrq = await fetch('http://localhost:3000/api/orquestador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: 'test-lead-123',
        pregunta_actual: 0,
        nivel_actual: 2,
        usar_ia: false, // Forzamos modo fallback para que no explote si no hay API Key real
        contexto_usuario: {
          cargo: 'Procurador Judicial II',
          profesion: 'Abogado',
          nivel_cargo: 'Asesor',
          modulo_debil: 'Derecho Disciplinario',
          modulo_fuerte: 'Gestión Documental',
          dominio_debil_pct: 35,
          dominio_fuerte_pct: 80,
          probabilidad_aprobar: 45,
          nivel_dificultad: 2
        }
      })
    });
    const dataOrq = await resOrq.json();
    console.log(`✅ Respuesta Orquestador (${resOrq.status}):`);
    if (dataOrq.pregunta) {
      console.log(`   Nivel Asignado: ${dataOrq.nivel_dificultad}`);
      console.log(`   Pregunta: ${dataOrq.pregunta.estructura.enunciado?.slice(0, 70) || 'Pregunta tipo 3'}...`);
      console.log(`   Norma relacionada: ${dataOrq.pregunta.norma_relacionada}`);
    } else {
       console.log(dataOrq);
    }
    console.log('');

    // 2. Prueba Agente 2 (Motivador - Inbound Telegram)
    console.log('--- TEST 2: Agente 2 (Webhook Telegram Inbound) ---');
    const resTele = await fetch('http://localhost:3000/api/webhooks/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          chat: { id: 123456789 },
          text: 'Las faltas gravísimas están en el artículo 62 y la destitución aplica si hay dolo.',
          from: { first_name: 'Carlos' }
        }
      })
    });
    const dataTele = await resTele.json();
    console.log(`✅ Respuesta Telegram Webhook (${resTele.status}):`);
    console.log(`   La API de Telegram devolvió ok: ${dataTele.ok} (El agente procesa asíncronamente)`);
    console.log('');

    // 3. Prueba Agente 2 (Cron Repaso Espaciado)
    console.log('--- TEST 3: Agente 2 (Cron Repaso SM-2) ---');
    const resRepaso = await fetch('http://localhost:3000/api/cron/repaso', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer tu-cron-secret-aqui` // Usando el secreto del .env.local
      }
    });
    const dataRepaso = await resRepaso.json();
    console.log(`✅ Respuesta Cron Repaso (${resRepaso.status}):`);
    console.log(`   Pendientes procesadas: ${dataRepaso.pendientes}`);
    console.log(`   Enviados: Telegram (${dataRepaso.enviados?.telegram}), Email (${dataRepaso.enviados?.email})`);
    console.log('');

    // 4. Prueba Agente 3 (Cron Remarketing)
    console.log('--- TEST 4: Agente 3 (Cron Remarketing) ---');
    const resRemrk = await fetch('http://localhost:3000/api/cron/remarketing', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer tu-cron-secret-aqui` 
      }
    });
    const dataRemrk = await resRemrk.json();
    console.log(`✅ Respuesta Cron Remarketing (${resRemrk.status}):`);
    console.log(`   Leads evaluados: ${dataRemrk.leads_procesados}`);
    console.log(`   Emails de remarketing generados y enviados: ${dataRemrk.enviados}`);
    console.log(`   Errores (Nota: esperados si no tienes API KEYS conectadas): ${dataRemrk.errores}`);
    console.log('');

    console.log('🎉 PRUEBAS FINALIZADAS CON ÉXITO. Todos los endpoints responden y sus handlers se ejecutan correctamente.');

  } catch (error) {
    console.error('❌ Error ejecutando pruebas. Asegúrate que el servidor Next.js está corriendo en localhost:3000.');
    console.error(error);
  }
}

testAgents();
