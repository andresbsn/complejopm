import React, { useState, useEffect } from 'react';
import api, { TurnoService, JugadorService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import SearchableSelect from './SearchableSelect';
import { alerts } from '../utils/alerts';

const PagoModal = ({ turno, onClose, onPagoSuccess }) => {
    const saldoPendiente = parseFloat(turno.monto_total) - parseFloat(turno.monto_pagado || 0);
    const [monto, setMonto] = useState(saldoPendiente);
    const [metodo, setMetodo] = useState('efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCancelOptions, setShowCancelOptions] = useState(false);
    const [jugadores, setJugadores] = useState([]);
    const [selectedJugadorId, setSelectedJugadorId] = useState(null);

    useEffect(() => {
        const fetchJugadores = async () => {
            try {
                const data = await JugadorService.getAll();
                // Map data to format expected by SearchableSelect if needed, 
                // but SearchableSelect expects objects and uses labelKey/valueKey. 
                // Player objects have 'nombre' and 'id', so it works directly.
                setJugadores(data);
            } catch (error) {
                console.error("Error al cargar jugadores", error);
            }
        };
        fetchJugadores();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const montoNumerico = Number(monto);
        if (!Number.isFinite(montoNumerico) || montoNumerico <= 0 || montoNumerico > saldoPendiente) {
            alerts.warning('Monto inválido', 'El monto debe ser mayor a 0 y no superar el saldo pendiente.');
            return;
        }
        
        if (metodo === 'cuenta_corriente' && !selectedJugadorId) {
            alerts.warning('Faltan datos', 'Debe seleccionar un jugador para cargar a cuenta corriente.');
            return;
        }

        setLoading(true);
        try {
            let turnoId = turno.id;

            // Si es un turno fijo, primero lo materializamos como un turno real para esta fecha
            if (turno.id.toString().startsWith('fijo_') || turno.es_fijo) {
                const nuevoTurno = await TurnoService.create({
                    cancha_id: turno.cancha_id,
                    fecha: turno.fecha,
                    hora_inicio: turno.hora_inicio,
                    hora_fin: turno.hora_fin,
                    cliente_nombre: turno.cliente_nombre,
                    cliente_telefono: turno.cliente_telefono,
                    monto_total: turno.monto_total,
                    reserva_fija_id: turno.reserva_fija_id || turno.id.toString().replace('fijo_', ''),
                    es_fijo: false // Importante: crearlo como turno normal
                });
                turnoId = nuevoTurno.id;
            }
            
            await api.post(`/turnos/${turnoId}/pagos`, { 
                monto: montoNumerico,
                metodo,
                observaciones: metodo === 'gastos_generales' ? observaciones : null,
                jugador_id: metodo === 'cuenta_corriente' ? selectedJugadorId : null
            });
            onPagoSuccess();
            alerts.toast('success', 'Pago registrado exitosamente');
            onClose();
        } catch (error) {
            console.error('Error al registrar pago:', error);
            alerts.error('Error', 'No se pudo registrar el pago: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        // For fixed turnos, show options
        if (turno.es_fijo || turno.estado === 'fijo') {
            setShowCancelOptions(true);
            return;
        }
        
        // For regular turnos, cancel directly
        const result = await alerts.confirm('¿Cancelar turno?', '¿Está seguro de que desea cancelar este turno?');
        if (!result.isConfirmed) return;
        
        setLoading(true);
        try {
            await TurnoService.updateStatus(turno.id, 'cancelado');
            onPagoSuccess(); // Refresca la lista
            alerts.toast('success', 'Turno cancelado');
            onClose();
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            alerts.error('Error', 'No se pudo cancelar el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelToday = async () => {
        setLoading(true);
        try {
            // Create a cancelled turno for this specific date
            await TurnoService.create({
                cancha_id: turno.cancha_id,
                fecha: turno.fecha,
                hora_inicio: turno.hora_inicio,
                hora_fin: turno.hora_fin,
                cliente_nombre: turno.cliente_nombre,
                cliente_telefono: turno.cliente_telefono,
                monto_total: turno.monto_total,
                reserva_fija_id: turno.reserva_fija_id || turno.id.toString().replace('fijo_', ''),
                estado: 'cancelado'
            });
            setShowCancelOptions(false);
            onPagoSuccess();
            alerts.toast('success', 'Turno cancelado por hoy');
            onClose();
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            alerts.error('Error', 'No se pudo cancelar el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPermanently = async () => {
        const result = await alerts.confirm('¿Eliminar definitivamente?', '¿Está seguro de eliminar este turno fijo permanentemente? Esta acción no se puede deshacer.');
        if (!result.isConfirmed) return;
        
        setLoading(true);
        try {
            // Extract the real ID from the virtual ID (format: fijo_123)
            const fijoId = turno.id.toString().replace('fijo_', '');
            await api.delete(`/turnos/fijos/${fijoId}`);
            setShowCancelOptions(false);
            onPagoSuccess();
            alerts.toast('success', 'Turno fijo eliminado');
            onClose();
        } catch (error) {
            console.error('Error al eliminar turno fijo:', error);
            alerts.error('Error', 'No se pudo eliminar el turno fijo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ui-modal-backdrop">
            <div className="ui-modal max-w-md">
                <div className="ui-modal-body">
                    <h3 className="mb-1 text-xl font-extrabold tracking-tight text-slate-900">Registrar pago</h3>
                    <p className="text-sm text-gray-500 mb-2">
                        Turno: {turno.cancha_nombre} - {turno.hora_inicio}
                    </p>
                    <div className="mb-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Turno:</span>
                            <span className="font-semibold">${formatCurrency(turno.monto_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Abonado:</span>
                            <span className="text-green-600 font-semibold">${formatCurrency(turno.monto_pagado || 0)}</span>
                        </div>
                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                            <span className="font-bold text-gray-800">Restante:</span>
                            <span className="font-bold text-red-600">${formatCurrency(saldoPendiente)}</span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Monto a Pagar</label>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="ui-input"
                                required
                                max={saldoPendiente}
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
                            <select
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value)}
                                className="ui-input"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="qr">QR</option>
                                <option value="cuenta_corriente">Cuenta Corriente</option>
                                <option value="gastos_generales">Gastos Generales / Cortesía</option>
                            </select>
                        </div>

                        {metodo === 'cuenta_corriente' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Seleccionar Jugador</label>
                                <SearchableSelect
                                    options={jugadores}
                                    value={selectedJugadorId}
                                    onChange={(option) => setSelectedJugadorId(option.id)}
                                    labelKey="nombre"
                                    valueKey="id"
                                    placeholder="Buscar jugador..."
                                />
                                <p className="text-xs text-gray-500 mt-1">El monto se cargará como deuda a este jugador.</p>
                            </div>
                        )}

                        {metodo === 'gastos_generales' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Motivo / Observación</label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className="ui-input"
                                    rows="2"
                                    placeholder="Ej: Ausencia rival, cortesía, etc."
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ui-secondary-button flex-1"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="ui-primary-button flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Pagar'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="ui-primary-button w-full bg-rose-600 hover:bg-rose-700"
                                disabled={loading}
                            >
                                Cancelar Turno
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Cancel Options Modal for Fixed Turnos */}
            {showCancelOptions && (
                <div className="ui-modal-backdrop">
                    <div className="ui-modal max-w-md p-6">
                        <h3 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900">Cancelar turno fijo</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Este es un turno fijo que se repite semanalmente. ¿Cómo deseas cancelarlo?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleCancelToday}
                                disabled={loading}
                                className="ui-primary-button w-full bg-amber-600 hover:bg-amber-700"
                            >
                                Cancelar solo por hoy
                            </button>
                            <button
                                onClick={handleCancelPermanently}
                                disabled={loading}
                                className="ui-primary-button w-full bg-rose-600 hover:bg-rose-700"
                            >
                                Cancelar definitivamente
                            </button>
                            <button
                                onClick={() => setShowCancelOptions(false)}
                                disabled={loading}
                                className="ui-secondary-button w-full"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PagoModal;
