import React, { useState } from 'react';
import { CanchaService } from '../services/api';

const CanchaForm = ({ onCanchaAdded }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('padel');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await CanchaService.create({ 
                nombre, 
                tipo: tipo.toUpperCase() // Ensure uppercase for consistency with ReservaPage
            });

            setNombre('');
            setTipo('padel'); // Reset to default state (internal value can remain lowercase for select)
            if (onCanchaAdded) onCanchaAdded();
            alert('Cancha creada exitosamente');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Agregar Nueva Cancha</h3>
            {error && <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nombre">
                        Nombre de la Cancha
                    </label>
                    <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                        placeholder="Ej: Cancha 1"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="tipo">
                        Tipo
                    </label>
                    <select
                        id="tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                    >
                        <option value="padel">Padel</option>
                        <option value="futbol">Fútbol</option>
                    </select>
                </div>
                <div className="flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cancha'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CanchaForm;
