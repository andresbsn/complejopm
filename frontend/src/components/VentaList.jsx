import React, { useState, useEffect } from 'react';
import { VentaService } from '../services/api';

const VentaList = ({ refreshTrigger }) => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [detalles, setDetalles] = useState([]);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        cargarVentas();
    }, [fechaDesde, fechaHasta, refreshTrigger]);

    const cargarVentas = async () => {
        try {
            // Si seleccionamos fecha hasta, queremos que incluya todo ese día.
            // Una forma simple es agregar la hora 23:59:59 si es una fecha YYYY-MM-DD
            let hasta = fechaHasta;
            if (hasta) {
                hasta = `${hasta} 23:59:59`;
            }

            const data = await VentaService.getAll({ 
                fechaDesde, 
                fechaHasta: hasta 
            });
            setVentas(data);
        } catch (error) {
            console.error('Error al cargar ventas:', error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalles = async (ventaId) => {
        try {
            const data = await VentaService.getDetalles(ventaId);
            setDetalles(data);
            setVentaSeleccionada(ventaId);
        } catch (error) {
            console.error('Error al cargar detalles:', error);
        }
    };

    if (loading) return <div>Cargando ventas...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input 
                        type="date" 
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input 
                        type="date" 
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <button 
                    onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline mb-2"
                >
                    Limpiar Filtros
                </button>
            </div>

            <div className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ventas.map(venta => (
                                <tr key={venta.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(venta.fecha).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{venta.metodo_pago || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${venta.total}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => verDetalles(venta.id)}
                                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                                        >
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {ventaSeleccionada && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Detalles de Venta #{ventaSeleccionada}</h3>
                            <button 
                                onClick={() => setVentaSeleccionada(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {detalles.map(detalle => (
                                        <tr key={detalle.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detalle.producto_nombre}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detalle.cantidad}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${detalle.precio_unitario}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-4 text-right">
                            <button 
                                onClick={() => setVentaSeleccionada(null)}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VentaList;
