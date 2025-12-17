import React, { useState } from 'react';
import api, { TurnoService } from '../services/api';

const PagoModal = ({ turno, onClose, onPagoSuccess }) => {
    const saldoPendiente = parseFloat(turno.monto_total) - parseFloat(turno.monto_pagado || 0);
    const [monto, setMonto] = useState(saldoPendiente);
    const [metodo, setMetodo] = useState('efectivo');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/turnos/${turno.id}/pagos`, { monto, metodo });
            onPagoSuccess();
            onClose();
        } catch (error) {
            console.error('Error al registrar pago:', error);
            alert('Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('¿Está seguro de que desea cancelar este turno?')) return;
        
        setLoading(true);
        try {
            if (turno.es_fijo) {
                // Si es fijo, creamos un turno real con estado 'cancelado' para esta fecha
                await TurnoService.create({
                    cancha_id: turno.cancha_id,
                    fecha: turno.fecha,
                    hora_inicio: turno.hora_inicio,
                    hora_fin: turno.hora_fin,
                    cliente_nombre: turno.cliente_nombre,
                    cliente_telefono: turno.cliente_telefono,
                    monto_total: turno.monto_total,
                    estado: 'cancelado'
                });
            } else {
                await TurnoService.updateStatus(turno.id, 'cancelado');
            }
            onPagoSuccess(); // Refresca la lista
            onClose();
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            alert('Error al cancelar el turno');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Registrar Pago</h3>
                    <p className="text-sm text-gray-500 mb-2">
                        Turno: {turno.cancha_nombre} - {turno.hora_inicio}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Turno:</span>
                            <span className="font-semibold">${turno.monto_total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Abonado:</span>
                            <span className="text-green-600 font-semibold">${turno.monto_pagado || 0}</span>
                        </div>
                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                            <span className="font-bold text-gray-800">Restante:</span>
                            <span className="font-bold text-red-600">${saldoPendiente}</span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Monto a Pagar</label>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                max={saldoPendiente}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
                            <select
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value)}
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="debito">Débito</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={loading}
                            >
                                Cancelar Turno
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Pagar'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PagoModal;
