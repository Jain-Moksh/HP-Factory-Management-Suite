/**
 * Installs the database trigger that records every change to items.stock in stock_movements.
 *
 * It lives here instead of db.md because the schema healer splits db.md on semicolons,
 * which a PL/pgSQL function body contains. Safe to run repeatedly (CREATE OR REPLACE).
 * Runs after every schema heal: at server start and after each restore, so a backup
 * taken before this feature existed still ends up with the trigger.
 */

// Tables are schema-qualified and search_path is pinned: pg_dump scripts clear search_path,
// and the trigger must find stock_movements whatever the session's settings are.
const FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION public.log_stock_movement() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $fn$
DECLARE
  raw_ctx TEXT;
  ctx JSONB;
  v_id INT;
  v_name TEXT;
  v_unit TEXT;
  v_old NUMERIC;
  v_new NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stock IS NOT DISTINCT FROM NEW.stock THEN
    RETURN NULL;
  END IF;

  -- Context set by the app with set_config('app.stock_ctx', json, true); absent for changes made outside the app
  raw_ctx := current_setting('app.stock_ctx', true);
  IF raw_ctx IS NOT NULL AND raw_ctx <> '' THEN
    BEGIN
      ctx := raw_ctx::jsonb;
    EXCEPTION WHEN others THEN
      ctx := NULL;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id; v_name := OLD.name; v_unit := OLD.unit; v_old := OLD.stock; v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_id := NEW.id; v_name := NEW.name; v_unit := NEW.unit; v_old := NULL; v_new := NEW.stock;
  ELSE
    v_id := NEW.id; v_name := NEW.name; v_unit := NEW.unit; v_old := OLD.stock; v_new := NEW.stock;
  END IF;

  INSERT INTO public.stock_movements (
    item_id, item_name, unit, old_stock, new_stock, change,
    source, action, reference_id, reference, note,
    device_name, hostname, ip_address,
    db_user, db_client_addr, application_name, txid
  ) VALUES (
    v_id, v_name, v_unit, v_old, v_new, COALESCE(v_new, 0) - COALESCE(v_old, 0),
    COALESCE(NULLIF(ctx->>'source', ''), 'DIRECT_DB'),
    COALESCE(NULLIF(ctx->>'action', ''), TG_OP),
    CASE WHEN ctx->>'reference_id' ~ '^[0-9]+$' THEN (ctx->>'reference_id')::INT END,
    ctx->>'reference',
    ctx->>'note',
    ctx->>'device_name',
    ctx->>'hostname',
    ctx->>'ip_address',
    session_user,
    host(inet_client_addr()),
    NULLIF(current_setting('application_name', true), ''),
    txid_current()
  );

  RETURN NULL;
END
$fn$
`;

const TRIGGER_SQL = `
DROP TRIGGER IF EXISTS trg_items_stock_movement ON public.items;
CREATE TRIGGER trg_items_stock_movement
  AFTER INSERT OR DELETE OR UPDATE OF stock ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.log_stock_movement();
`;

/**
 * @param {import('pg').Pool|import('pg').PoolClient} executor
 */
const installStockMovementTrigger = async (executor) => {
  await executor.query(FUNCTION_SQL);
  await executor.query(TRIGGER_SQL);
};

module.exports = { installStockMovementTrigger };
