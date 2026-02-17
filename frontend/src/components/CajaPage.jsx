import React, { useState, useEffect } from 'react';
import { CajaService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const CajaPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';
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
                        <div className="space-y-6">
                            {/* Resumen Totales por Método */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(() => {
                                    // Calcular totales
                                    const totales = {
                                        efectivo: { nombre: 'EFECTIVO', icon: '💰', ingresos: 0, egresos: 0, count: 0, inicial: parseFloat(caja.saldo_inicial) || 0 },
                                        qr: { nombre: 'QR', icon: '💳', ingresos: 0, egresos: 0, count: 0, inicial: 0 },
                                        transferencia: { nombre: 'TRANSFERENCIA', icon: '🔄', ingresos: 0, egresos: 0, count: 0, inicial: 0 },
                                        otros: { nombre: 'OTROS', icon: '📝', ingresos: 0, egresos: 0, count: 0, inicial: 0 }
                                    };

                                    movimientos.forEach(m => {
                                        const metodoRaw = (m.metodo_pago || '').toLowerCase();
                                        let key = 'otros';
                                        if (metodoRaw.includes('efectivo')) key = 'efectivo';
                                        else if (metodoRaw.includes('qr') || metodoRaw.includes('debito') || metodoRaw.includes('credito')) key = 'qr';
                                        else if (metodoRaw.includes('transferencia')) key = 'transferencia';
                                        
                                        // Si es una venta 'gastos_generales', a veces viene con monto 0 o no suma a caja,
                                        // pero si tiene monto, lo sumamos.
                                        
                                        const monto = parseFloat(m.monto);
                                        if (monto >= 0) {
                                            totales[key].ingresos += monto;
                                        } else {
                                            totales[key].egresos += Math.abs(monto);
                                        }
                                        totales[key].count += 1;
                                    });
                                    
                                    // Filtrar métodos que tengan movimiento o saldo inicial > 0, o mostrar siempre los principales?
                                    // Mostraremos los principales siempre para consistencia visual
                                    let methodsToShow = ['efectivo', 'qr', 'transferencia'];
                                    
                                    // Si no es admin, mostrar solo efectivo
                                    if (!isAdmin) {
                                        methodsToShow = ['efectivo'];
                                    }

                                    // Si hay 'otros' con datos, lo agregamos y es admin
                                    if (totales.otros.count > 0 && isAdmin) methodsToShow.push('otros');

                                    return methodsToShow.map(key => {
                                        const t = totales[key];
                                        const balance = t.inicial + t.ingresos - t.egresos;
                                        return (
                                            <div key={key} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-3 border-b pb-2">
                                                    <span className="text-xl">{t.icon}</span>
                                                    <h4 className="font-bold text-gray-700">{t.nombre}</h4>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {key === 'efectivo' && (
                                                        <div className="flex justify-between text-gray-600">
                                                            <span>Inicio de caja:</span>
                                                            <span>${formatCurrency(t.inicial)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Ingresos:</span>
                                                        <span className="text-green-600 font-medium">${formatCurrency(t.ingresos)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Egresos:</span>
                                                        <span className="text-red-600 font-medium">${formatCurrency(t.egresos)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-indigo-50 mt-2 p-2 rounded text-indigo-900 font-bold">
                                                        <span>Balance Actual:</span>
                                                        <span className="text-lg">${formatCurrency(balance)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-400 pt-1">
                                                        <span>Movimientos:</span>
                                                        <span>{t.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

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
                                            <span className="font-medium">${formatCurrency(caja.saldo_inicial)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                                            <span className="text-gray-800">Saldo Calculado:</span>
                                            <span className="text-green-600">${formatCurrency(calcularSaldoActual())}</span>
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
                                                placeholder={formatCurrency(calcularSaldoActual())}
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
                                    {/* Mobile Cards for Movements */}
                                    <div className="md:hidden space-y-4 p-4">
                                        {movimientos.length === 0 ? (
                                            <div className="text-center text-sm text-gray-500">No hay movimientos registrados</div>
                                        ) : (
                                            movimientos.map((mov, index) => (
                                                <div key={index} className="bg-white border rounded-lg shadow-sm p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            mov.tipo_movimiento === 'VENTA' ? 'bg-green-100 text-green-800' : 
                                                            mov.tipo_movimiento === 'PAGO_TURNO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {mov.tipo_movimiento}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900 mb-1">{mov.descripcion}</p>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">{mov.metodo_pago}</span>
                                                        <span className="font-bold text-gray-900">${formatCurrency(mov.monto)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Desktop Table for Movements */}
                                    <div className="hidden md:block overflow-x-auto">
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
                                                                ${formatCurrency(mov.monto)}
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
                    </div>
                )}
                </>
            )}

            {tab === 'historial' && (
                <>
                    {/* Mobile Cards for History */}
                    <div className="md:hidden space-y-4">
                        {historial.map((cajas) => (
                            <div key={cajas.id} className="bg-white border rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900">Caja #{cajas.id}</span>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        cajas.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {cajas.estado}
                                    </span>
                                </div>
                                <div className="text-sm space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Apertura:</span>
                                        <span className="text-gray-900">{new Date(cajas.fecha_apertura).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Cierre:</span>
                                        <span className="text-gray-900">{cajas.fecha_cierre ? new Date(cajas.fecha_cierre).toLocaleString() : '-'}</span>
                                    </div>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Inicial</span>
                                        <span className="font-semibold">${formatCurrency(cajas.saldo_inicial)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 block text-xs">Final</span>
                                        <span className="font-semibold">{cajas.saldo_final ? `$${formatCurrency(cajas.saldo_final)}` : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table for History */}
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
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
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">${formatCurrency(cajas.saldo_inicial)}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">{cajas.saldo_final ? `$${formatCurrency(cajas.saldo_final)}` : '-'}</td>
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
                </>
            )}
        </div>
    );
};

export default CajaPage;
