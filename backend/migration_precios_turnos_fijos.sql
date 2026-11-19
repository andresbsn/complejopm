-- Precio por vigencia y trazabilidad de ocurrencias de reservas fijas.
-- Esta migración es aditiva e idempotente.
BEGIN;

SET LOCAL search_path TO complejo_deportivo, public;

ALTER TABLE turnos
    ADD COLUMN IF NOT EXISTS reserva_fija_id INTEGER
    REFERENCES reservas_fijas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_turnos_reserva_fija_id
    ON turnos (reserva_fija_id);

CREATE TABLE IF NOT EXISTS reservas_fijas_precios (
    id SERIAL PRIMARY KEY,
    reserva_fija_id INTEGER NOT NULL
        REFERENCES reservas_fijas(id) ON DELETE CASCADE,
    monto_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    vigente_desde TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    vigente_hasta TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reservas_fijas_precios_monto_check CHECK (monto_total >= 0),
    CONSTRAINT reservas_fijas_precios_vigencia_check
        CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde),
    CONSTRAINT reservas_fijas_precios_unica_fecha
        UNIQUE (reserva_fija_id, vigente_desde)
);

CREATE INDEX IF NOT EXISTS idx_reservas_fijas_precios_vigencia
    ON reservas_fijas_precios (reserva_fija_id, vigente_desde, vigente_hasta);

-- Cada serie existente conserva su precio actual como precio inicial.
INSERT INTO reservas_fijas_precios (reserva_fija_id, monto_total, vigente_desde)
SELECT rf.id, COALESCE(rf.monto_total, 0), COALESCE(rf.created_at, CURRENT_TIMESTAMP)
FROM reservas_fijas rf
WHERE NOT EXISTS (
    SELECT 1
    FROM reservas_fijas_precios rfp
    WHERE rfp.reserva_fija_id = rf.id
);

-- Vincular solamente ocurrencias antiguas con una única coincidencia posible.
WITH candidatos AS (
    SELECT t.id AS turno_id, MIN(rf.id) AS reserva_fija_id
    FROM turnos t
    JOIN reservas_fijas rf
      ON rf.cancha_id = t.cancha_id
     AND rf.hora_inicio = t.hora_inicio
     AND rf.hora_fin = t.hora_fin
     AND rf.cliente_nombre = t.cliente_nombre
     AND COALESCE(rf.cliente_telefono, '') = COALESCE(t.cliente_telefono, '')
     AND t.fecha >= rf.created_at::date
     AND EXTRACT(DOW FROM t.fecha) = rf.dia_semana
    WHERE t.reserva_fija_id IS NULL
    GROUP BY t.id
    HAVING COUNT(DISTINCT rf.id) = 1
)
UPDATE turnos t
SET reserva_fija_id = c.reserva_fija_id
FROM candidatos c
WHERE t.id = c.turno_id;

COMMIT;
