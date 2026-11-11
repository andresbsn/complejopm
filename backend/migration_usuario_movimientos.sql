-- Etapa 1: trazabilidad de operaciones por usuario.
--
-- Esta migración es aditiva e idempotente:
-- - No elimina ni modifica registros existentes.
-- - Los registros históricos quedan con usuario NULL.
-- - Las columnas son nullable para conservar compatibilidad histórica.
--
-- Ejecutar desde psql sobre el esquema de la aplicación, por ejemplo:
--   psql "$DATABASE_URL" -f backend/migration_usuario_movimientos.sql
--
BEGIN;

-- El backend utiliza este esquema mediante DB_SCHEMA.
SET LOCAL search_path TO complejo_deportivo, public;

ALTER TABLE ventas_cantina
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

ALTER TABLE pagos_ventas
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

ALTER TABLE pagos_inscripcion
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

ALTER TABLE inscripciones
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

ALTER TABLE turnos
    ADD COLUMN IF NOT EXISTS usuario_creacion_id INTEGER REFERENCES usuarios(id);

CREATE INDEX IF NOT EXISTS idx_ventas_cantina_usuario_id
    ON ventas_cantina(usuario_id);

CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id
    ON pagos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_pagos_ventas_usuario_id
    ON pagos_ventas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_pagos_inscripcion_usuario_id
    ON pagos_inscripcion(usuario_id);

CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario_id
    ON inscripciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_turnos_usuario_creacion_id
    ON turnos(usuario_creacion_id);

COMMIT;

-- Verificación rápida posterior a la migración:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN (
--     'ventas_cantina', 'pagos', 'pagos_ventas',
--     'pagos_inscripcion', 'inscripciones', 'turnos'
-- )
-- AND column_name IN ('usuario_id', 'usuario_creacion_id')
-- ORDER BY table_name, column_name;
