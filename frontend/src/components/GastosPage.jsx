import React, { useState, useEffect } from 'react';
import { GastoService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';
import PageHeader from './PageHeader';

const GastosPage = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    useEffect(() => {
        fetchGastos();
    }, []);

    const fetchGastos = async () => {
        setLoading(true);
        try {
            const data = await GastoService.getAll();
            setGastos(data);
        } catch (error) {
            console.error('Error fetching gastos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const montoNumerico = parseFloat(monto);
        if (!descripcion || !metodoPago || !Number.isFinite(montoNumerico) || montoNumerico < 0.01) {
            alerts.warning('Datos incompletos', 'Debes completar la descripción, el método de pago y un monto mayor a 0.');
            return;
        }

        try {
            await GastoService.create({ descripcion, monto: montoNumerico, metodo_pago: metodoPago });
            alerts.toast('success', 'Gasto registrado correctamente');
            setDescripcion('');
            setMonto('');
            setMetodoPago('');
            fetchGastos();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'Error al registrar el gasto');
        }
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar gasto?', '¿Estás seguro de que deseas eliminar este registro de gasto?');
        if (!result.isConfirmed) return;
        try {
            await GastoService.delete(id);
            alerts.toast('success', 'Gasto eliminado');
            fetchGastos();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'No se pudo eliminar el gasto');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Gastos generales" description="Registrá y consultá los egresos del complejo." />
            
            <div className="ui-card p-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Registrar nuevo gasto</h3>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="ui-input"
                            placeholder="Ej: Limpieza, Luz, etc."
                        />
                         </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            className="ui-input pl-7"
                                placeholder="0.00"
                                step="0.01"
                                 min="0.01"
                             />
                         </div>
                     </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                        <select
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value)}
                            className="ui-input"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="qr">QR</option>
                            <option value="debito">Débito</option>
                            <option value="credito">Crédito</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="ui-primary-button whitespace-nowrap bg-rose-600 hover:bg-rose-700"
                    >
                        Registrar Gasto
                    </button>
                </form>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando gastos...</div>
                ) : gastos.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No hay gastos registrados.</div>
                ) : (
                    gastos.map((gasto) => (
                        <div key={gasto.id} className="ui-card p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900">{gasto.descripcion}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(gasto.fecha).toLocaleDateString()}</p>
                                </div>
                                <span className="text-red-600 font-bold text-sm">
                                    -${formatCurrency(gasto.monto)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                <span className="text-gray-400 text-xs">Registrado por:</span> {gasto.usuario_nombre || '-'}
                                <br /><span className="text-gray-400 text-xs">Método:</span> {gasto.metodo_pago || '-'}
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleDelete(gasto.id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                                >
                                    <span>🗑</span> Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="ui-table-shell hidden md:block">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registrado Por</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8">Cargando gastos...</td></tr>
                        ) : gastos.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay gastos registrados.</td></tr>
                        ) : (
                            gastos.map((gasto) => (
                                <tr key={gasto.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(gasto.fecha).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {gasto.descripcion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                        {gasto.usuario_nombre || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {gasto.metodo_pago || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">
                                        -${formatCurrency(gasto.monto)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell">
                                        <button 
                                            onClick={() => handleDelete(gasto.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GastosPage;
