import React, { useState, useEffect } from 'react';
import { CuentaService } from '../services/api';

const CuentaCorrienteModal = ({ jugador, onClose }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [saldo, setSaldo] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('DEBE'); // DEBE (Deuda), HABER (Pago)
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');

    useEffect(() => {
        if (jugador) {
            fetchCuenta();
        }
    }, [jugador]);

    const fetchCuenta = async () => {
        setLoading(true);
        try {
            const data = await CuentaService.getMovimientos(jugador.id);
            setMovimientos(data.movimientos);
            setSaldo(data.saldo);
        } catch (error) {
            console.error('Error fetching cuenta:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            let descFinal = descripcion;
            if (tipoMovimiento === 'HABER') {
                descFinal = descripcion 
                    ? `${descripcion} - ${metodoPago}`
                    : `Pago recibido (${metodoPago})`;
            } else if (!descFinal) {
                descFinal = 'Deuda manual';
            }

            await CuentaService.addMovimiento({
                jugador_id: jugador.id,
                tipo: tipoMovimiento,
                monto: parseFloat(monto),
                descripcion: descFinal
            });
            setShowForm(false);
            setMonto('');
            setDescripcion('');
            fetchCuenta(); 
        } catch (error) {
            alert('Error al registrar movimiento');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        Cuenta Corriente: {jugador.nombre}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 text-2xl">✕</button>
                </div>

                {/* Saldo y Acciones */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
                    <div>
                        <p className="text-sm text-gray-500">Saldo Actual</p>
                        <p className={`text-3xl font-bold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${saldo.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {saldo > 0 ? '(Debe dinero)' : '(A favor/Saldado)'}
                        </p>
                    </div>
                    <div className="space-x-4">
                        <button 
                            onClick={() => { setTipoMovimiento('DEBE'); setShowForm(true); }}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 font-medium"
                        >
                            + Registrar Deuda
                        </button>
                        <button 
                            onClick={() => { setTipoMovimiento('HABER'); setShowForm(true); }}
                            className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 font-medium"
                        >
                            + Registrar Pago
                        </button>
                    </div>
                </div>

                {/* Formulario de Transacción */}
                {showForm && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
                        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                            {tipoMovimiento === 'DEBE' ? 'Registrar Nueva Deuda' : 'Registrar Nuevo Pago'}
                        </h4>
                        <form onSubmit={handleTransaction} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700">Monto</label>
                                <input 
                                    type="number" step="0.01" min="0" required 
                                    value={monto} 
                                    onChange={(e) => setMonto(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                                    placeholder="0.00"
                                />
                            </div>
                            
                            {tipoMovimiento === 'HABER' && (
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700">Método</label>
                                    <select
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="debito">Débito</option>
                                        <option value="credito">Crédito</option>
                                        <option value="qr">QR</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex-[2]">
                                <label className="block text-xs font-medium text-gray-700">Descripción (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={descripcion} 
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                                    placeholder={tipoMovimiento === 'DEBE' ? 'Ej: Compra de gaseosa' : 'Comentarios adicionales...'}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className={`px-4 py-2 rounded-md text-white ${
                                        tipoMovimiento === 'DEBE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabla de Movimientos */}
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-4">Cargando...</td></tr>
                            ) : movimientos.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-4 text-gray-500">Sin movimientos registrados.</td></tr>
                            ) : (
                                movimientos.map((mov) => (
                                    <tr key={mov.id}>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {new Date(mov.fecha).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            {mov.descripcion || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                mov.tipo === 'DEBE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${
                                            mov.tipo === 'DEBE' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            ${parseFloat(mov.monto).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-right">
                    <button 
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CuentaCorrienteModal;
