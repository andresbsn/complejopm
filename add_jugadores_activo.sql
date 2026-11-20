-- Ejecutar una sola vez en la base existente.
ALTER TABLE jugadores
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS jugadores_activo_nombre_idx
    ON jugadores (activo, nombre);
