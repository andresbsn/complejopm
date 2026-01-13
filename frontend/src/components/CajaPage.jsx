import React, { useState, useEffect } from 'react';
import { CajaService } from '../services/api';

const CajaPage = () => {
    const [caja, setCaja] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saldoFinalReal, setSaldoFinalReal] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tab, setTab] = useState('actual'); // 'actual', 'historial'
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        fetchEstado();
    }, []);

    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        }
    }, [tab]);

    const fetchEstado = async () => {
        setLoading(true);
        try {
            const data = await CajaService.getEstado();
            setCaja(data);
            if (data) {
                const movs = await CajaService.getMovimientos(data.id);
                setMovimientos(movs);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar estado de la caja');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorial = async () => {
        try {
            const data = await CajaService.getHistorial();
            setHistorial(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar historial');
        }
    };

    const handleAbrir = async (e) => {
        e.preventDefault();
        try {
            await CajaService.abrir(parseFloat(saldoInicial));
            setSuccess('Caja abierta correctamente');
            setSaldoInicial('');
            fetchEstado();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al abrir caja');
        }
    };

    const handleCerrar = async (e) => {
        e.preventDefault();
        if (!caja) return;
        try {
            // Calculate system balance
            const saldoCalculado = calcularSaldoActual();
            // If user didn't input real balance, assume it matches or require it?
            // Let's require it or default to calculated.
             const final = saldoFinalReal ? parseFloat(saldoFinalReal) : saldoCalculado;
            
            await CajaService.cerrar(caja.id, final);
            setSuccess('Caja cerrada correctamente');
            setCaja(null);
            setMovimientos([]);
            setSaldoFinalReal('');
            fetchEstado(); // Will return null
        } catch (err) {
             setError(err.response?.data?.error || 'Error al cerrar caja');
        }
    };

    const calcularSaldoActual = () => {
        if (!caja) return 0;
        let total = parseFloat(caja.saldo_inicial);
        movimientos.forEach(m => {
            // Logic depends on type.
            // Venta: Add
            // Pago Turno: Add
            // Inscripcion: Add
            // Pago Deuda (Haber): Add
            // If we implement Expenses/Retiros later, subtract.
            // For now everything is income except maybe cancelled? 
            // Query returns positive amounts usually.
            // Assuming all movements returned are INCOME for now.
            // Wait, movements don't specify sign in my query?
            // Venta, Pago, Inscripcion are income.
            // Movimiento Cuenta: 'HABER' is income.
            total += parseFloat(m.monto);
        });
        return total;
    };

    if (loading && !caja) return <div className="p-4">Cargando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Control de Caja</h2>
                <div className="space-x-2">
                    <button 
                        className={`px-4 py-2 rounded ${tab === 'actual' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                        onClick={() => setTab('actual')}
                    >
                        Caja Actual
                    </button>
                    <button 
                        className={`px-4 py-2 rounded ${tab === 'historial' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                        onClick={() => setTab('historial')}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">{success}</div>}

            {tab === 'actual' && (
                <>
                    {!caja ? (
                        <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto mt-10">
                            <h3 className="text-lg font-semibold mb-4">Apertura de Caja</h3>
                            <form onSubmit={handleAbrir}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Saldo Inicial</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={saldoInicial} 
                                        onChange={(e) => setSaldoInicial(e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                                    Abrir Caja
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Info Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-indigo-700">Resumen</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha Apertura:</span>
                                            <span className="font-medium">{new Date(caja.fecha_apertura).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Saldo Inicial:</span>
                                            <span className="font-medium">${parseFloat(caja.saldo_inicial).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                                            <span className="text-gray-800">Saldo Calculado:</span>
                                            <span className="text-green-600">${calcularSaldoActual().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-red-600">Cierre de Caja</h3>
                                    <form onSubmit={handleCerrar}>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Saldo Final Real (En Caja)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={saldoFinalReal} 
                                                onChange={(e) => setSaldoFinalReal(e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                placeholder={calcularSaldoActual().toFixed(2)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Si se deja vacío, se usará el saldo calculado.</p>
                                        </div>
                                        <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                                            Cerrar Caja
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Movements Table */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                     <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Movimientos de la Sesión</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full leading-normal">
                                            <thead>
                                                <tr>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hora</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Método</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movimientos.length === 0 ? (
                                                     <tr>
                                                        <td colSpan="5" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No hay movimientos registrados</td>
                                                    </tr>
                                                ) : (
                                                    movimientos.map((mov, index) => (
                                                        <tr key={index}>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                {new Date(mov.fecha).toLocaleTimeString()}
                                                            </td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    mov.tipo_movimiento === 'VENTA' ? 'bg-green-100 text-green-800' : 
                                                                    mov.tipo_movimiento === 'PAGO_TURNO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {mov.tipo_movimiento}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{mov.descripcion}</td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{mov.metodo_pago}</td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-medium">
                                                                ${parseFloat(mov.monto).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === 'historial' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Apertura</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cierre</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Inicial</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Final</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map((cajas) => (
                                <tr key={cajas.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">#{cajas.id}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(cajas.fecha_apertura).toLocaleString()}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{cajas.fecha_cierre ? new Date(cajas.fecha_cierre).toLocaleString() : '-'}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">${parseFloat(cajas.saldo_inicial).toFixed(2)}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">{cajas.saldo_final ? `$${parseFloat(cajas.saldo_final).toFixed(2)}` : '-'}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            cajas.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {cajas.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CajaPage;
