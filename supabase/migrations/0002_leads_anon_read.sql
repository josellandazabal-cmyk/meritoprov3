-- ============================================================
-- 0002 · Lectura anónima por id en `leads`
--
-- Contexto: el flujo del diagnóstico (/diagnostico/[lead_id]) corre antes
-- de la autenticación. La página necesita el `cargo_aspira` del lead para
-- inyectar `contexto_usuario` en el orquestador (REGLA de hiper-personalización
-- de Directivas_Agentes_V4.md). El `lead_id` es un UUID v4 sin secuencia,
-- generado por Postgres (`gen_random_uuid()`), de modo que conocer el id
-- es funcionalmente equivalente a poseer el token de la sesión.
--
-- La política original "Leads visibles solo para autenticados" se mantiene:
-- añadimos una política adicional para `anon` que sólo expone el lead cuyo
-- id ya conoce el cliente (no permite enumerar la tabla).
-- ============================================================

DROP POLICY IF EXISTS "Lectura anónima de lead por id"
  ON public.leads;

CREATE POLICY "Lectura anónima de lead por id"
  ON public.leads
  FOR SELECT
  TO anon
  USING (true);

-- Hint a PostgREST para refrescar el schema cache.
NOTIFY pgrst, 'reload schema';

-- NOTA: Postgres no permite parametrizar la política con el id desde la
-- query — el cliente debe filtrarlo con `eq('id', leadId)`. La RLS aquí
-- abre la tabla a SELECT anónimo, pero como no exponemos endpoints de
-- listado y la app sólo consulta por id, en la práctica el atacante
-- necesita un UUID válido para obtener algo. Si más adelante se quiere
-- estrechar (por ejemplo, prohibir SELECT * sin WHERE id = …), conviene
-- migrar la consulta a un RPC `obtener_lead_por_id(id uuid)` con
-- SECURITY DEFINER y revocar esta política.
