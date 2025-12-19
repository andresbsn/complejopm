--
-- PostgreSQL database dump
--

\restrict dh42OdGSbcIlqR9DW6SuqQkVG9AecB45pZ1A0Q6SmHCs14XLif2c0ZdGhWxz6cu

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: complejo_deportivo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA complejo_deportivo;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: canchas; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.canchas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL
);


--
-- Name: canchas_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.canchas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: canchas_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.canchas_id_seq OWNED BY complejo_deportivo.canchas.id;


--
-- Name: configuracion; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.configuracion (
    clave character varying(50) NOT NULL,
    valor character varying(255) NOT NULL
);


--
-- Name: detalle_venta_cantina; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.detalle_venta_cantina (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


--
-- Name: detalle_venta_cantina_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.detalle_venta_cantina_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_venta_cantina_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.detalle_venta_cantina_id_seq OWNED BY complejo_deportivo.detalle_venta_cantina.id;


--
-- Name: detalle_ventas; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.detalle_ventas (
    id integer NOT NULL,
    venta_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);


--
-- Name: detalle_ventas_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.detalle_ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.detalle_ventas_id_seq OWNED BY complejo_deportivo.detalle_ventas.id;


--
-- Name: jugadores; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.jugadores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(50),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: jugadores_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.jugadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jugadores_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.jugadores_id_seq OWNED BY complejo_deportivo.jugadores.id;


--
-- Name: movimientos_cuenta; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.movimientos_cuenta (
    id integer NOT NULL,
    jugador_id integer,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text,
    referencia_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_cuenta_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['DEBE'::character varying, 'HABER'::character varying])::text[])))
);


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.movimientos_cuenta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.movimientos_cuenta_id_seq OWNED BY complejo_deportivo.movimientos_cuenta.id;


--
-- Name: movimientos_proveedor; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.movimientos_proveedor (
    id integer NOT NULL,
    proveedor_id integer,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_proveedor_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['DEBE'::character varying, 'HABER'::character varying])::text[])))
);


--
-- Name: movimientos_proveedor_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.movimientos_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.movimientos_proveedor_id_seq OWNED BY complejo_deportivo.movimientos_proveedor.id;


--
-- Name: pagos; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.pagos (
    id integer NOT NULL,
    turno_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo character varying(50) NOT NULL,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.pagos_id_seq OWNED BY complejo_deportivo.pagos.id;


--
-- Name: productos; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria character varying(50),
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    stock_minimo integer DEFAULT 0,
    precio_venta numeric(10,2),
    costo numeric(10,2),
    proveedor_id integer,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    codigo_barra character varying(100)
);


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.productos_id_seq OWNED BY complejo_deportivo.productos.id;


--
-- Name: proveedores; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.proveedores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    contacto character varying(100),
    telefono character varying(50),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.proveedores_id_seq OWNED BY complejo_deportivo.proveedores.id;


--
-- Name: reservas_fijas; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.reservas_fijas (
    id integer NOT NULL,
    cancha_id integer NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    cliente_nombre character varying(100) NOT NULL,
    cliente_telefono character varying(50),
    monto_total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reservas_fijas_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: reservas_fijas_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.reservas_fijas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_fijas_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.reservas_fijas_id_seq OWNED BY complejo_deportivo.reservas_fijas.id;


--
-- Name: turnos; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.turnos (
    id integer NOT NULL,
    cancha_id integer NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    cliente_nombre character varying(100) NOT NULL,
    cliente_telefono character varying(50),
    estado character varying(20) DEFAULT 'reservado'::character varying,
    pagado boolean DEFAULT false,
    monto_total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT turnos_estado_check CHECK (((estado)::text = ANY ((ARRAY['reservado'::character varying, 'confirmado'::character varying, 'cancelado'::character varying, 'jugado'::character varying])::text[])))
);


--
-- Name: turnos_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.turnos_id_seq OWNED BY complejo_deportivo.turnos.id;


--
-- Name: usuarios; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.usuarios (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    rol character varying(20) DEFAULT 'user'::character varying
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.usuarios_id_seq OWNED BY complejo_deportivo.usuarios.id;


--
-- Name: ventas; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.ventas (
    id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL
);


--
-- Name: ventas_cantina; Type: TABLE; Schema: complejo_deportivo; Owner: -
--

CREATE TABLE complejo_deportivo.ventas_cantina (
    id integer NOT NULL,
    turno_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(50)
);


--
-- Name: ventas_cantina_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.ventas_cantina_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ventas_cantina_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.ventas_cantina_id_seq OWNED BY complejo_deportivo.ventas_cantina.id;


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: complejo_deportivo; Owner: -
--

CREATE SEQUENCE complejo_deportivo.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: complejo_deportivo; Owner: -
--

ALTER SEQUENCE complejo_deportivo.ventas_id_seq OWNED BY complejo_deportivo.ventas.id;


--
-- Name: canchas id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.canchas ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.canchas_id_seq'::regclass);


--
-- Name: detalle_venta_cantina id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_venta_cantina ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.detalle_venta_cantina_id_seq'::regclass);


--
-- Name: detalle_ventas id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_ventas ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.detalle_ventas_id_seq'::regclass);


--
-- Name: jugadores id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.jugadores ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.jugadores_id_seq'::regclass);


--
-- Name: movimientos_cuenta id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_cuenta ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.movimientos_cuenta_id_seq'::regclass);


--
-- Name: movimientos_proveedor id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_proveedor ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.movimientos_proveedor_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.pagos ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.pagos_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.productos ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.productos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.proveedores ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.proveedores_id_seq'::regclass);


--
-- Name: reservas_fijas id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.reservas_fijas ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.reservas_fijas_id_seq'::regclass);


--
-- Name: turnos id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.turnos ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.turnos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.usuarios ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.usuarios_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.ventas ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.ventas_id_seq'::regclass);


--
-- Name: ventas_cantina id; Type: DEFAULT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.ventas_cantina ALTER COLUMN id SET DEFAULT nextval('complejo_deportivo.ventas_cantina_id_seq'::regclass);


--
-- Data for Name: canchas; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.canchas (id, nombre, tipo) FROM stdin;
1	Cancha Padel 1	PADEL
2	Cancha Padel 2	PADEL
3	Cancha Futbol 5	FUTBOL
\.


--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.configuracion (clave, valor) FROM stdin;
PRECIO_PADEL	24000
PRECIO_FUTBOL	25000
DURACION_PADEL	90
DURACION_FUTBOL	60
HORARIO_APERTURA	13:00
HORARIO_CIERRE	00:00
\.


--
-- Data for Name: detalle_venta_cantina; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.detalle_venta_cantina (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	1	1	3500.00	3500.00
2	2	2	1	100.00	100.00
3	2	1	2	3500.00	7000.00
4	3	2	2	100.00	200.00
5	3	1	1	3500.00	3500.00
6	4	1	2	3500.00	7000.00
7	5	6	1	2000.00	2000.00
8	5	7	1	6000.00	6000.00
9	6	6	1	2000.00	2000.00
10	6	3	1	1500.00	1500.00
11	7	11	1	800.00	800.00
12	7	6	1	2000.00	2000.00
13	8	8	1	4500.00	4500.00
14	8	1	1	3500.00	3500.00
15	9	9	1	2500.00	2500.00
16	9	12	1	2200.00	2200.00
\.


--
-- Data for Name: detalle_ventas; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario) FROM stdin;
1	1	2	5	100.00
2	2	1	2	3500.00
3	3	2	3	100.00
4	4	1	1	3500.00
5	4	2	1	100.00
\.


--
-- Data for Name: jugadores; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.jugadores (id, nombre, telefono, email, created_at) FROM stdin;
1	andres burgues	34707406154		2025-12-17 14:57:50.690508
2	santiago	347955		2025-12-17 14:58:02.593363
3	maxi	354499		2025-12-17 14:58:14.242132
4	andres burgues	344444		2025-12-19 09:05:00.132778
\.


--
-- Data for Name: movimientos_cuenta; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.movimientos_cuenta (id, jugador_id, tipo, monto, descripcion, referencia_id, fecha) FROM stdin;
1	3	DEBE	2500.00	turno padel	\N	2025-12-19 09:11:06.203518
2	3	DEBE	2800.00	Compra en Cantina (Venta #7)	7	2025-12-19 09:11:24.920274
3	3	HABER	2500.00	efectivo	\N	2025-12-19 09:11:58.674825
4	2	DEBE	4700.00	Compra en Cantina (Venta #9)	9	2025-12-19 10:35:38.423975
\.


--
-- Data for Name: movimientos_proveedor; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.movimientos_proveedor (id, proveedor_id, tipo, monto, descripcion, fecha) FROM stdin;
1	1	DEBE	750000.00	factura n°5423	2025-12-19 10:35:17.039304
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.pagos (id, turno_id, monto, metodo, fecha_pago) FROM stdin;
1	1	120000.00	efectivo	2025-11-30 20:31:54.850213
2	2	12000.00	efectivo	2025-12-01 17:49:37.696359
3	2	6000.00	transferencia	2025-12-01 17:49:49.468829
4	2	6000.00	efectivo	2025-12-01 17:49:55.927251
5	2	0.00	efectivo	2025-12-01 17:50:00.260998
6	13	12000.00	efectivo	2025-12-16 17:18:35.686591
7	14	6000.00	transferencia	2025-12-17 11:02:48.536235
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.productos (id, nombre, categoria, precio, stock, stock_minimo, precio_venta, costo, proveedor_id, estado, codigo_barra) FROM stdin;
2	Producto Test 1764364979743	Test	100.00	38	0	100.00	\N	\N	ACTIVO	\N
5	Gatorade 500ml	bebida	1800.00	30	0	1800.00	\N	\N	ACTIVO	\N
10	Tostado Jamón y Queso	comida	3500.00	15	0	3500.00	\N	\N	ACTIVO	\N
13	Chocolate Block 38g	snack	1200.00	25	0	1200.00	\N	\N	ACTIVO	\N
7	Pizza Muzzarella	comida	6000.00	9	0	6000.00	\N	\N	ACTIVO	\N
3	Coca Cola 500ml	bebida	1500.00	49	0	1500.00	\N	\N	ACTIVO	\N
6	Cerveza Quilmes 473ml	bebida	2000.00	37	\N	2000.00	\N	\N	ACTIVO	\N
11	Alfajor Chocolate	snack	800.00	39	\N	800.00	\N	\N	ACTIVO	\N
4	Agua Mineral 500ml	bebida	1000.00	50	100	1000.00	500.00	\N	ACTIVO	\N
8	Hamburguesa Completa	comida	4500.00	19	0	4500.00	\N	\N	ACTIVO	\N
1	coca cola 1.5	bebida	3500.00	4	0	3500.00	2500.00	\N	ACTIVO	\N
9	Super Pancho	comida	2500.00	29	0	2500.00	\N	\N	ACTIVO	\N
12	Papas Lays 145g	snack	2200.00	19	0	2200.00	\N	\N	ACTIVO	\N
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.proveedores (id, nombre, contacto, telefono, email, created_at) FROM stdin;
1	un proveedor				2025-12-19 10:09:23.745312
\.


--
-- Data for Name: reservas_fijas; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.reservas_fijas (id, cancha_id, dia_semana, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total, created_at) FROM stdin;
1	3	2	17:00:00	18:00:00	andres	2222	25000.00	2025-12-01 18:13:37.435465
2	1	4	16:00:00	17:30:00	pedro	1111	24000.00	2025-12-10 21:38:23.197097
3	1	6	17:00:00	18:00:00	maxi		24000.00	2025-12-12 20:47:02.472013
4	2	2	14:30:00	16:00:00	un fijo	555	24000.00	2025-12-16 16:59:41.496791
\.


--
-- Data for Name: turnos; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.turnos (id, cancha_id, fecha, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, estado, pagado, monto_total, created_at) FROM stdin;
1	1	2025-12-01	19:00:00	20:30:00	andres	3407406148	reservado	t	24000.00	2025-11-30 20:31:10.773919
2	2	2025-12-01	20:00:00	21:30:00	andres burgues	345555	reservado	t	24000.00	2025-12-01 17:49:23.760608
4	1	2025-12-02	17:30:00	19:00:00	andres	35555	reservado	f	24000.00	2025-12-01 17:53:13.098619
6	2	2025-12-02	20:00:00	21:30:00	pedro	3555	reservado	f	24000.00	2025-12-01 17:57:18.995808
7	3	2025-12-16	17:00:00	18:00:00	andres	2222	reservado	f	25000.00	2025-12-01 18:14:06.90321
3	1	2025-12-02	16:00:00	17:30:00	maxi	34444	cancelado	f	240000.00	2025-12-01 17:52:56.098858
8	1	2025-12-02	16:00:00	17:30:00	soledad	35555	reservado	f	23999.00	2025-12-01 18:43:04.283861
9	1	2025-12-03	20:00:00	21:30:00	marcelo	3444	reservado	f	24000.00	2025-12-02 18:54:51.286707
5	2	2025-12-02	16:00:00	17:30:00	juan	3555	cancelado	f	24000.00	2025-12-01 17:56:27.035469
10	1	2025-12-03	14:00:00	15:30:00	lucio	3332555	reservado	f	20000.00	2025-12-02 23:31:35.837671
11	1	2025-12-11	19:00:00	20:30:00	andres burgues	34075555	reservado	f	24000.00	2025-12-10 21:37:14.966479
12	2	2025-12-11	20:30:00	22:00:00	maxi	555555	reservado	f	24000.00	2025-12-10 21:37:47.734194
13	1	2025-12-16	13:00:00	14:30:00	andres	3407406148	reservado	f	24000.00	2025-12-16 16:49:31.424771
14	1	2025-12-16	20:30:00	22:00:00	juan	34071655	reservado	f	24000.00	2025-12-16 16:49:46.917309
15	2	2025-12-16	13:00:00	14:30:00	maxi	33322	reservado	f	24000.00	2025-12-16 16:59:32.159085
16	1	2025-12-17	16:00:00	17:30:00	andres burgues	34707406154	reservado	f	24000.00	2025-12-17 14:58:22.93232
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.usuarios (id, username, password, nombre, rol) FROM stdin;
1	admin	$2b$10$JzTSfO2RM6kZo7QrACnUqOoaShDa1HrC9NzUGVoTzhHaf17c1ywwi	Administrador	admin
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.ventas (id, fecha, total) FROM stdin;
1	2025-11-28 18:22:59.820135	500.00
2	2025-11-30 19:52:56.949635	7000.00
3	2025-11-30 20:09:33.482224	300.00
4	2025-11-30 20:09:46.182185	3600.00
\.


--
-- Data for Name: ventas_cantina; Type: TABLE DATA; Schema: complejo_deportivo; Owner: -
--

COPY complejo_deportivo.ventas_cantina (id, turno_id, fecha, total, metodo_pago) FROM stdin;
1	\N	2025-11-30 20:13:29.981611	3500.00	\N
2	\N	2025-12-02 18:22:07.446324	7100.00	\N
3	\N	2025-12-02 18:31:14.320929	3700.00	efectivo
4	\N	2025-12-02 18:37:11.458778	7000.00	transferencia
5	\N	2025-12-02 19:00:14.496521	8000.00	transferencia
6	\N	2025-12-18 11:52:07.22532	3500.00	efectivo
7	\N	2025-12-19 09:11:24.920274	2800.00	cuenta_corriente
8	\N	2025-12-19 10:35:31.201031	8000.00	qr
9	\N	2025-12-19 10:35:38.423975	4700.00	cuenta_corriente
\.


--
-- Name: canchas_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.canchas_id_seq', 3, true);


--
-- Name: detalle_venta_cantina_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.detalle_venta_cantina_id_seq', 16, true);


--
-- Name: detalle_ventas_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.detalle_ventas_id_seq', 5, true);


--
-- Name: jugadores_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.jugadores_id_seq', 4, true);


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.movimientos_cuenta_id_seq', 4, true);


--
-- Name: movimientos_proveedor_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.movimientos_proveedor_id_seq', 1, true);


--
-- Name: pagos_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.pagos_id_seq', 7, true);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.productos_id_seq', 14, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.proveedores_id_seq', 1, true);


--
-- Name: reservas_fijas_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.reservas_fijas_id_seq', 4, true);


--
-- Name: turnos_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.turnos_id_seq', 16, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.usuarios_id_seq', 1, true);


--
-- Name: ventas_cantina_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.ventas_cantina_id_seq', 9, true);


--
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: complejo_deportivo; Owner: -
--

SELECT pg_catalog.setval('complejo_deportivo.ventas_id_seq', 4, true);


--
-- Name: canchas canchas_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.canchas
    ADD CONSTRAINT canchas_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_pkey PRIMARY KEY (id);


--
-- Name: detalle_ventas detalle_ventas_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_ventas
    ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);


--
-- Name: jugadores jugadores_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.jugadores
    ADD CONSTRAINT jugadores_pkey PRIMARY KEY (id);


--
-- Name: movimientos_cuenta movimientos_cuenta_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_pkey PRIMARY KEY (id);


--
-- Name: movimientos_proveedor movimientos_proveedor_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_proveedor
    ADD CONSTRAINT movimientos_proveedor_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: reservas_fijas reservas_fijas_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.reservas_fijas
    ADD CONSTRAINT reservas_fijas_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: ventas_cantina ventas_cantina_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.ventas_cantina
    ADD CONSTRAINT ventas_cantina_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_producto_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES complejo_deportivo.productos(id);


--
-- Name: detalle_venta_cantina detalle_venta_cantina_venta_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_venta_cantina
    ADD CONSTRAINT detalle_venta_cantina_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES complejo_deportivo.ventas_cantina(id);


--
-- Name: detalle_ventas detalle_ventas_producto_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_ventas
    ADD CONSTRAINT detalle_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES complejo_deportivo.productos(id);


--
-- Name: detalle_ventas detalle_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.detalle_ventas
    ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES complejo_deportivo.ventas(id) ON DELETE CASCADE;


--
-- Name: movimientos_cuenta movimientos_cuenta_jugador_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_jugador_id_fkey FOREIGN KEY (jugador_id) REFERENCES complejo_deportivo.jugadores(id) ON DELETE CASCADE;


--
-- Name: movimientos_proveedor movimientos_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.movimientos_proveedor
    ADD CONSTRAINT movimientos_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES complejo_deportivo.proveedores(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_turno_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.pagos
    ADD CONSTRAINT pagos_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES complejo_deportivo.turnos(id);


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES complejo_deportivo.proveedores(id) ON DELETE SET NULL;


--
-- Name: reservas_fijas reservas_fijas_cancha_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.reservas_fijas
    ADD CONSTRAINT reservas_fijas_cancha_id_fkey FOREIGN KEY (cancha_id) REFERENCES complejo_deportivo.canchas(id);


--
-- Name: turnos turnos_cancha_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.turnos
    ADD CONSTRAINT turnos_cancha_id_fkey FOREIGN KEY (cancha_id) REFERENCES complejo_deportivo.canchas(id);


--
-- Name: ventas_cantina ventas_cantina_turno_id_fkey; Type: FK CONSTRAINT; Schema: complejo_deportivo; Owner: -
--

ALTER TABLE ONLY complejo_deportivo.ventas_cantina
    ADD CONSTRAINT ventas_cantina_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES complejo_deportivo.turnos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dh42OdGSbcIlqR9DW6SuqQkVG9AecB45pZ1A0Q6SmHCs14XLif2c0ZdGhWxz6cu

