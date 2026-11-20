import React, { useState, useEffect } from 'react';
import { TurnoService, JugadorService } from '../services/api';
import { alerts } from '../utils/alerts';

const ReservaModal = ({ isOpen, onClose, slot, date, config, type, onSuccess }) => {
    const { cancha, slot: timeSlot } = slot;
    const [formData, setFormData] = useState({
        cliente_nombre: '',
        cliente_telefono: '',
        monto_total: '',
        es_fijo: false
    });
    const [loading, setLoading] = useState(false);
    const [jugadoresSuggestions, setJugadoresSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isPast = new Date(`${date}T${timeSlot.start}:00`) < new Date();

    useEffect(() => {
        // Pre-fill price based on config and type
        updatePrice(formData.es_fijo);
    }, [config, type]); // removed formData.es_fijo dependency to avoid loop if I put it here, but I will make a separate handler

    const updatePrice = (isFixed) => {
        if (type === 'PADEL') {
            if (isFixed && config.PRECIO_PADEL_FIJO) {
                setFormData(prev => ({ ...prev, monto_total: config.PRECIO_PADEL_FIJO }));
            } else {
                setFormData(prev => ({ ...prev, monto_total: config.PRECIO_PADEL }));
            }
        } else {
             setFormData(prev => ({ ...prev, monto_total: config.PRECIO_FUTBOL }));
        }
    };

    const handleFixedChange = (e) => {
        const isFixed = e.target.checked;
        setFormData(prev => ({ ...prev, es_fijo: isFixed }));
        updatePrice(isFixed);
    };

    const handleNameChange = async (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, cliente_nombre: value }));

        if (value.length > 1) {
            try {
                const results = await JugadorService.getAll(value);
                setJugadoresSuggestions(results);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error searching players:", error);
            }
        } else {
            setJugadoresSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectJugador = (jugador) => {
        setFormData(prev => ({
            ...prev,
            cliente_nombre: jugador.nombre,
            cliente_telefono: jugador.telefono || ''
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check if player exists, if not create it (optional, but good for keeping DB up to date)
            // For now, we just create the reservation
            
            // If the user selected a known player, we might want to update their info?
            // Or if it's a new name, maybe create a new player? 
            // The user didn't explicitly ask for auto-create on booking, just selection.
            // But let's check if we should create a new player?
            // "dar de alta un turno... seleccionar... filtrando... los jugadores que tengo cargado"
            // Implicitly, if I type a new name, it's just a text field.
            
            await TurnoService.create({
                cancha_id: cancha.id,
                fecha: date,
                hora_inicio: timeSlot.start,
                hora_fin: timeSlot.end,
                cliente_nombre: formData.cliente_nombre,
                cliente_telefono: formData.cliente_telefono,
                monto_total: formData.monto_total,
                es_fijo: formData.es_fijo
            });
            alerts.toast('success', 'Reserva creada exitosamente');
            onSuccess();
        } catch (error) {
            alerts.error('Error', 'No se pudo crear la reserva: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="ui-modal-backdrop"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
                <div className="ui-modal relative z-10 max-w-lg text-left" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleSubmit}>
                        <div className="ui-modal-body">
                            <h3 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900" id="modal-title">
                                Nueva Reserva
                            </h3>
                            
                            <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                                <p><strong>Cancha:</strong> {cancha.nombre}</p>
                                <p><strong>Fecha:</strong> {date}</p>
                                <p><strong>Horario:</strong> {timeSlot.start} - {timeSlot.end}</p>
                            </div>

                            {isPast && (
                                <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    Este horario ya pasó. Podés cargar la reserva igual para registrar el turno y su pago.
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                     <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre del cliente</label>
                                    <input
                                        type="text"
                                        required
                                         className="ui-input"
                                        value={formData.cliente_nombre}
                                        onChange={handleNameChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    />
                                    {showSuggestions && (
                                         <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                                            {jugadoresSuggestions.length > 0 ? (
                                                jugadoresSuggestions.map(jugador => (
                                                    <div
                                                        key={jugador.id}
                                                        className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50"
                                                        onClick={() => selectJugador(jugador)}
                                                    >
                                                        <span className="font-bold">{jugador.nombre}</span>
                                                        {jugador.telefono && <span className="text-gray-500 ml-2 text-xs">({jugador.telefono})</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-sm text-gray-500">No se encontraron jugadores</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200">
                                    <span className="text-xs text-yellow-800">
                                        ¿Nuevo jugador? Crea uno rápidamente.
                                    </span>
                                    {/* Ideally we would have a quick create button here, but for now we rely on the manual input if not found */}
                                </div>
                                <div>
                                     <label className="mb-1.5 block text-sm font-semibold text-slate-700">Teléfono</label>
                                    <input
                                        type="text"
                                         className="ui-input"
                                        value={formData.cliente_telefono}
                                        onChange={e => setFormData({...formData, cliente_telefono: e.target.value})}
                                    />
                                </div>
                                <div>
                                     <label className="mb-1.5 block text-sm font-semibold text-slate-700">Precio total</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                             className="ui-input pl-7"
                                            value={formData.monto_total}
                                            onChange={e => setFormData({...formData, monto_total: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="es_fijo"
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        checked={formData.es_fijo}
                                        onChange={handleFixedChange}
                                    />
                                    <label htmlFor="es_fijo" className="ml-2 block text-sm text-gray-900">
                                        Reserva Fija (Semanal)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="ui-modal-footer sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="ui-primary-button w-full sm:w-auto"
                            >
                                {loading ? 'Reservando...' : 'Confirmar Reserva'}
                            </button>
                            <button
                                type="button"
                                className="ui-secondary-button mt-3 w-full sm:mt-0 sm:w-auto"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
        </div>
    );
};

export default ReservaModal;
