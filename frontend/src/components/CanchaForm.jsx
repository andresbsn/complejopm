import React, { useState, useEffect } from 'react';
import { CanchaService } from '../services/api';
import { alerts } from '../utils/alerts';

const CanchaForm = ({ onCanchaAdded, defaultType = 'PADEL', onClose }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState(defaultType.toLowerCase());
    const [loading, setLoading] = useState(false);

    // Update tipo if defaultType changes
    useEffect(() => {
        if (defaultType) {
            setTipo(defaultType.toLowerCase());
        }
    }, [defaultType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await CanchaService.create({ 
                nombre, 
                tipo: tipo.toUpperCase()
            });

            setNombre('');
            alerts.toast('success', `Cancha "${nombre}" creada exitosamente`);
            if (onCanchaAdded) onCanchaAdded();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'No se pudo crear la cancha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-1">
            <h3 className="mb-6 text-xl font-extrabold tracking-tight text-slate-900">Agregar nueva cancha</h3>
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
                        className="ui-input"
                        placeholder="Ej: Cancha 1"
                        required
                        autoComplete="off"
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
                        className="ui-input"
                    >
                        <option value="padel">Padel</option>
                        <option value="futbol">Fútbol</option>
                    </select>
                </div>
                <div className="flex items-center justify-end space-x-3">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="ui-secondary-button"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="ui-primary-button"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cancha'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CanchaForm;
