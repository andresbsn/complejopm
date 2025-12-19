import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    // baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`, { tokenExists: !!token });
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const TurnoService = {
    getAll: async (fecha, canchaId) => {
        const params = { fecha };
        if (canchaId) params.cancha_id = canchaId;
        const response = await api.get('/turnos', { params });
        return response.data;
    },

    create: async (turnoData) => {
        const response = await api.post('/turnos', turnoData);
        return response.data;
    },

    updateStatus: async (id, estado) => {
        const response = await api.patch(`/turnos/${id}/status`, { estado });
        return response.data;
    }
};

export const ProductoService = {
    getAll: async () => {
        const response = await api.get('/productos');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/productos', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/productos/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/productos/${id}`);
        return response.data;
    }
};

export const VentaService = {
    create: async (ventaData) => {
        const response = await api.post('/ventas', ventaData);
        return response.data;
    },
    getAll: async (params) => {
        const response = await api.get('/ventas', { params });
        return response.data;
    },
    getDetalles: async (id) => {
        const response = await api.get(`/ventas/${id}/detalles`);
        return response.data;
    }
};

export const CanchaService = {
    getAll: async (params) => {
        const response = await api.get('/canchas', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/canchas', data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/canchas/${id}`);
        return response.data;
    }
};

export const ConfiguracionService = {
    getAll: async () => {
        const response = await api.get('/configuracion');
        return response.data;
    },
    update: async (clave, valor) => {
        const response = await api.put(`/configuracion/${clave}`, { valor });
        return response.data;
    }
};

export const JugadorService = {
    getAll: async (search = '') => {
        const params = search ? { search } : {};
        const response = await api.get('/jugadores', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/jugadores', data);
        return response.data;
    }
};

export const CuentaService = {
    getMovimientos: async (jugadorId) => {
        const response = await api.get(`/cuenta/${jugadorId}`);
        return response.data;
    },
    addMovimiento: async (data) => {
        const response = await api.post('/cuenta', data);
        return response.data;
    }
};

export const ProveedorService = {
    async getAll() {
        const response = await api.get('/proveedores');
        return response.data;
    },
    async create(data) {
        const response = await api.post('/proveedores', data);
        return response.data;
    },
    async update(id, data) {
        const response = await api.put(`/proveedores/${id}`, data);
        return response.data;
    },
    async delete(id) {
        const response = await api.delete(`/proveedores/${id}`);
        return response.data;
    },
    async getMovimientos(id) {
        const response = await api.get(`/proveedores/${id}/cuenta`);
        return response.data;
    },
    async addMovimiento(data) {
        const response = await api.post('/proveedores/movimiento', data);
        return response.data;
    }
};

export const ReporteService = {
    async getVentas(filters) {
        // filters: { fechaDesde, fechaHasta, tipo, metodoPago }
        const params = new URLSearchParams();
        if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
        if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.metodoPago) params.append('metodoPago', filters.metodoPago);

        const response = await api.get(`/reportes/ventas?${params.toString()}`);
        return response.data;
    }
};

export default api;
