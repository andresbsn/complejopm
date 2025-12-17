-- Tabla de Canchas
CREATE TABLE canchas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('padel', 'futbol'))
);

-- Tabla de Turnos
CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    cancha_id INT NOT NULL REFERENCES canchas(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'reservado' CHECK (estado IN ('reservado', 'confirmado', 'cancelado', 'jugado')),
    pagado BOOLEAN DEFAULT FALSE,
    monto_total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pagos (Asociados a turnos)
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    turno_id INT NOT NULL REFERENCES turnos(id),
    monto DECIMAL(10, 2) NOT NULL,
    metodo VARCHAR(50) NOT NULL, -- efectivo, transferencia, debito, credito
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos de Cantina
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50), -- bebida, snack, comida
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0
);

-- Tabla de Ventas de Cantina (Cabecera)
CREATE TABLE ventas_cantina (
    id SERIAL PRIMARY KEY,
    turno_id INT REFERENCES turnos(id), -- Opcional, si la venta es durante un turno
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50)
);

-- Detalle de Venta de Cantina
CREATE TABLE detalle_venta_cantina (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES ventas_cantina(id),
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Datos semilla (Seed data)
INSERT INTO canchas (nombre, tipo) VALUES 
('Cancha Padel 1', 'padel'),
('Cancha Padel 2', 'padel'),
('Cancha Futbol 5', 'futbol');
