-- Create categories table
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL UNIQUE
);

-- Seed categories
INSERT INTO categorias (descripcion) VALUES 
('Primera'), ('Segunda'), ('Tercera'), ('Cuarta'),
('Quinta'), ('Sexta'), ('Septima'), ('Octava');

-- Update jugadores table
-- First, remove the old string column if it exists
ALTER TABLE jugadores DROP COLUMN IF EXISTS categoria;
-- Add the foreign key column
ALTER TABLE jugadores
  ADD COLUMN IF NOT EXISTS categoria_id INT REFERENCES categorias(id);

-- Create torneos table (if not exists)
CREATE TABLE IF NOT EXISTS torneos (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    costo_inscripcion DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inscripciones table (if not exists)
CREATE TABLE IF NOT EXISTS inscripciones (
    id SERIAL PRIMARY KEY,
    torneo_id INT NOT NULL REFERENCES torneos(id),
    jugador_id INT NOT NULL REFERENCES jugadores(id),
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pagado BOOLEAN DEFAULT FALSE,
    monto_abonado DECIMAL(10, 2) DEFAULT 0,
    fecha_pago TIMESTAMP,
    metodo_pago VARCHAR(50),
    UNIQUE(torneo_id, jugador_id)
);
