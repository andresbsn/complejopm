BEGIN;

-- El proyecto mantiene sus tablas en este esquema. SET LOCAL limita el cambio
-- a esta transacción y evita aplicar objetos accidentalmente sobre public.
SET LOCAL search_path TO complejo_deportivo, public;

-- Etapa mínima de integridad financiera.
-- Esta migración es aditiva: no realiza backfill y deja metodo_pago en NULL
-- para los gastos históricos (y para los flujos actuales que aún no lo envían).
ALTER TABLE gastos
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50);

-- Costos y referencias tipadas para que los nuevos reportes y anulaciones no
-- dependan del costo actual del producto ni de textos descriptivos.
ALTER TABLE detalle_venta_cantina
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(12, 2);

ALTER TABLE gastos
ADD COLUMN IF NOT EXISTS venta_id INTEGER REFERENCES ventas_cantina(id);

ALTER TABLE movimientos_cuenta
ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(30);

-- Los CHECK se crean NOT VALID deliberadamente: se aplican a escrituras nuevas,
-- pero no se validan ni modifican filas históricas en esta etapa.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'gastos'::regclass
          AND conname = 'gastos_monto_no_cero_chk'
    ) THEN
        ALTER TABLE gastos
        ADD CONSTRAINT gastos_monto_no_cero_chk
        CHECK (monto <> 0) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos'::regclass
          AND conname = 'pagos_monto_positivo_chk'
    ) THEN
        ALTER TABLE pagos
        ADD CONSTRAINT pagos_monto_positivo_chk
        CHECK (monto > 0) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos_inscripcion'::regclass
          AND conname = 'pagos_inscripcion_monto_positivo_chk'
    ) THEN
        ALTER TABLE pagos_inscripcion
        ADD CONSTRAINT pagos_inscripcion_monto_positivo_chk
        CHECK (monto > 0) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos_ventas'::regclass
          AND conname = 'pagos_ventas_monto_no_cero_chk'
    ) THEN
        ALTER TABLE pagos_ventas
        ADD CONSTRAINT pagos_ventas_monto_no_cero_chk
        CHECK (monto <> 0) NOT VALID;
    END IF;
END;
$$;

-- Métodos de gasto: NULL sigue permitido para preservar históricos y
-- compatibilidad con el flujo actual de alta de gastos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'gastos'::regclass
          AND conname = 'gastos_metodo_pago_permitido_chk'
    ) THEN
        ALTER TABLE gastos
        ADD CONSTRAINT gastos_metodo_pago_permitido_chk
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'gastos_generales'
            )
        ) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos'::regclass
          AND conname = 'pagos_metodo_permitido_chk'
    ) THEN
        ALTER TABLE pagos
        ADD CONSTRAINT pagos_metodo_permitido_chk
        CHECK (
            metodo IS NULL
            OR metodo IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'cuenta_corriente', 'gastos_generales'
            )
        ) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos_inscripcion'::regclass
          AND conname = 'pagos_inscripcion_metodo_permitido_chk'
    ) THEN
        ALTER TABLE pagos_inscripcion
        ADD CONSTRAINT pagos_inscripcion_metodo_permitido_chk
        CHECK (
            metodo IS NULL
            OR metodo IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'cuenta_corriente'
            )
        ) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pagos_ventas'::regclass
          AND conname = 'pagos_ventas_metodo_permitido_chk'
    ) THEN
        ALTER TABLE pagos_ventas
        ADD CONSTRAINT pagos_ventas_metodo_permitido_chk
        CHECK (
            metodo IS NULL
            OR metodo IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'cuenta_corriente', 'gastos_generales'
            )
        ) NOT VALID;
    END IF;
END;
$$;

-- Los valores agregados de pago múltiple sólo corresponden a las cabeceras:
-- ventas_cantina usa "multiple" e inscripciones usa "Múltiple" actualmente.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'ventas_cantina'::regclass
          AND conname = 'ventas_cantina_metodo_pago_permitido_chk'
    ) THEN
        ALTER TABLE ventas_cantina
        ADD CONSTRAINT ventas_cantina_metodo_pago_permitido_chk
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'cuenta_corriente', 'gastos_generales', 'multiple'
            )
        ) NOT VALID;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'inscripciones'::regclass
          AND conname = 'inscripciones_metodo_pago_permitido_chk'
    ) THEN
        ALTER TABLE inscripciones
        ADD CONSTRAINT inscripciones_metodo_pago_permitido_chk
        CHECK (
            metodo_pago IS NULL
            OR metodo_pago IN (
                'efectivo', 'transferencia', 'qr', 'debito', 'credito',
                'cuenta_corriente', 'Múltiple'
            )
        ) NOT VALID;
    END IF;
END;
$$;

-- Evita una carrera entre la precondición y la creación del índice. No corrige
-- datos: si ya hay varias cajas abiertas, aborta toda la migración con detalle.
LOCK TABLE cajas IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    cajas_abiertas INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO cajas_abiertas
    FROM cajas
    WHERE estado = 'abierta';

    IF cajas_abiertas > 1 THEN
        RAISE EXCEPTION
            'No se puede garantizar una única caja abierta: existen % cajas con estado=''abierta''. Cierre o regularice las cajas duplicadas antes de reintentar; esta migración no modifica datos.',
            cajas_abiertas;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS cajas_una_sola_abierta_uidx
ON cajas ((1))
WHERE estado = 'abierta';

-- Un gasto histórico sin caja asociada (caja_id NULL) continúa siendo mutable.
-- Un gasto ligado a una caja cerrada no puede editarse ni eliminarse.
CREATE OR REPLACE FUNCTION impedir_mutacion_gasto_caja_cerrada()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.caja_id IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM cajas
           WHERE id = OLD.caja_id
             AND estado = 'cerrada'
       ) THEN
        RAISE EXCEPTION
            'No se puede % el gasto % porque pertenece a la caja cerrada %.',
            lower(TG_OP), OLD.id, OLD.caja_id
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'gastos'::regclass
          AND tgname = 'gastos_bloquear_caja_cerrada_trg'
          AND NOT tgisinternal
    ) THEN
        CREATE TRIGGER gastos_bloquear_caja_cerrada_trg
        BEFORE UPDATE OR DELETE ON gastos
        FOR EACH ROW
        EXECUTE FUNCTION impedir_mutacion_gasto_caja_cerrada();
    END IF;
END;
$$;

-- No se ejecuta VALIDATE CONSTRAINT en esta etapa. La validación de históricos
-- debe hacerse en una migración posterior, luego de auditar y sanear los datos.
COMMIT;
