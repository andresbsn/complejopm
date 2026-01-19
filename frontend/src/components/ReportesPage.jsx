import React, { useState, useEffect } from 'react';
import { ReporteService, CategoriaService, CajaService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

const ReportesPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const [activeTab, setActiveTab] = useState(isAdmin ? 'ventas' : 'deudores');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    // Filters for Ventas
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipo, setTipo] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    // Filters for Jugadores
    const [jugadorSearch, setJugadorSearch] = useState('');
    const [jugadorCategoria, setJugadorCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);

    // Stats
    const [stats, setStats] = useState({ total: 0, byMethod: {} });

    // Caja Tab State
    const [cajasHistory, setCajasHistory] = useState([]);
    const [selectedCaja, setSelectedCaja] = useState(null);
    const [cajaMovimientos, setCajaMovimientos] = useState([]);

    useEffect(() => {
        if (isAdmin) {
            fetchCategorias();
        }
    }, [isAdmin]);

    useEffect(() => {
        // Prevent non-admins from fetching unauthorized reports
        if (!isAdmin && (activeTab === 'ventas' || activeTab === 'jugadores' || activeTab === 'caja')) {
            setActiveTab('deudores');
            return;
        }
        
        // Reset specific states when switching tabs
        if (activeTab !== 'caja') {
            setSelectedCaja(null);
            setCajaMovimientos([]);
        }

        fetchReport();
    }, [activeTab]);

    const fetchCategorias = async () => {
        try {
            const data = await CategoriaService.getAll();
            setCategorias(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchReport = async (filtersOverride = null) => {
        setLoading(true);
        setReportData([]);
        try {
            let data = [];
            if (activeTab === 'ventas' && isAdmin) {
                const filters = filtersOverride || { fechaDesde, fechaHasta, tipo, metodoPago };
                data = await ReporteService.getVentas(filters);
                calculateStats(data);
                setReportData(data);
            } else if (activeTab === 'jugadores' && isAdmin) {
                const filters = filtersOverride || { search: jugadorSearch, categoria_id: jugadorCategoria };
                data = await ReporteService.getJugadoresPorCategoria(filters);
                setStats({ total: data.length, byMethod: {} });
                setReportData(data);
            } else if (activeTab === 'deudores') {
                data = await ReporteService.getDeudores();
                const totalDebt = data.reduce((acc, curr) => acc + parseFloat(curr.saldo || 0), 0);
                setStats({ total: totalDebt, byMethod: {} });
                setReportData(data);
            } else if (activeTab === 'caja' && isAdmin) {
                if (selectedCaja) {
                    const movs = await CajaService.getMovimientos(selectedCaja.id);
                    setCajaMovimientos(movs);
                    // Calculates net balance of movements just for display info if needed
                } else {
                    const history = await CajaService.getHistorial();
                    setCajasHistory(history);
                }
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data, contextCaja = selectedCaja) => {
        if (activeTab === 'ventas') {
            let total = 0;
            let byMethod = {};
            data.forEach(item => {
                const monto = parseFloat(item.monto);
                total += monto;
                const method = item.metodo || 'Otros';
                if (!byMethod[method]) byMethod[method] = 0;
                byMethod[method] += monto;
            });
            setStats({ total, byMethod });
        } else if (activeTab === 'caja' && contextCaja) { 
            // Calculate balance for selected Caja
            let totalBalance = 0;
            let byMethod = {};
            data.forEach(mov => {
                const monto = parseFloat(mov.monto);
                totalBalance += monto;

                const method = mov.metodo_pago || 'Otros';
                if (!byMethod[method]) byMethod[method] = 0;
                byMethod[method] += monto;
            });
            setStats({ total: totalBalance, byMethod });
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const handleLimpiarFiltros = () => {
        if (activeTab === 'ventas') {
            setFechaDesde('');
            setFechaHasta('');
            setTipo('');
            setMetodoPago('');
            fetchReport({ fechaDesde: '', fechaHasta: '', tipo: '', metodoPago: '' });
        } else if (activeTab === 'jugadores') {
            setJugadorSearch('');
            setJugadorCategoria('');
            fetchReport({ search: '', categoria_id: '' });
        }
    };

    const handleSelectCaja = (caja) => {
        setSelectedCaja(caja);
        setLoading(true);
        CajaService.getMovimientos(caja.id)
            .then(movs => {
                setCajaMovimientos(movs);
                calculateStats(movs, caja); // Pass caja explicitly to avoid stale state
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleBackToCajas = () => {
        setSelectedCaja(null);
        setCajaMovimientos([]);
        fetchReport(); 
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        const title = activeTab === 'ventas' ? 'Reporte de Ingresos' : 
                      activeTab === 'jugadores' ? 'Reporte de Jugadores por Categoría' : 
                      activeTab === 'deudores' ? 'Reporte de Deudores' :
                      selectedCaja ? `Movimientos Caja #${selectedCaja.id}` : 'Historial de Cajas';
        doc.text(title, 14, 22);

        doc.setFontSize(11);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 30);

        let yPos = 40;

        if (activeTab === 'ventas') {
            doc.text(`Total Ingresos: $${stats.total.toFixed(2)}`, 14, 36);
            const tableColumn = ["Fecha", "Descripción", "Tipo", "Método", "Monto"];
            const tableRows = reportData.map(item => [
                new Date(item.fecha).toLocaleString(),
                item.descripcion,
                item.tipo,
                item.metodo || '-',
                `$${parseFloat(item.monto).toFixed(2)}`
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'jugadores') {
            doc.text(`Total Jugadores: ${reportData.length}`, 14, 36);
            const tableColumn = ["Categoría", "Nombre", "Teléfono", "Email", "Saldo"];
            const tableRows = reportData.map(item => [
                item.categoria_descripcion || 'Sin Categoría',
                item.nombre,
                item.telefono || '-',
                item.email || '-',
                `$${parseFloat(item.saldo || 0).toFixed(2)}`
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'deudores') {
            doc.text(`Deuda Total: $${stats.total.toFixed(2)}`, 14, 36);
            const tableColumn = ["Nombre", "Categoría", "Teléfono", "Deuda"];
            const tableRows = reportData.map(item => [
                item.nombre,
                item.categoria_descripcion || '-',
                item.telefono || '-',
                `$${parseFloat(item.saldo || 0).toFixed(2)}`
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'caja') {
             if (selectedCaja) {
                const tableColumn = ["Fecha", "Tipo", "Descripción", "Método", "Monto"];
                const tableRows = cajaMovimientos.map(mov => [
                    new Date(mov.fecha).toLocaleString(),
                    mov.tipo_movimiento,
                    mov.descripcion,
                    mov.metodo_pago,
                    `$${parseFloat(mov.monto).toFixed(2)}`
                ]);
                autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
             } else {
                 const tableColumn = ["ID", "Apertura", "Cierre", "Saldo Inicial", "Saldo Final"];
                 const tableRows = cajasHistory.map(caja => [
                     caja.id,
                     new Date(caja.fecha_apertura).toLocaleString(),
                     caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : 'Abierta',
                     `$${caja.saldo_inicial}`,
                     caja.saldo_final ? `$${caja.saldo_final}` : '-'
                 ]);
                 autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
             }
        }

        doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Updated tabs list
    const tabs = isAdmin ? ['ventas', 'jugadores', 'deudores', 'caja'] : ['deudores'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Reportes del Sistema</h2>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'ventas' ? 'Ingresos' : 
                             tab === 'jugadores' ? 'Jugadores' : 
                             tab === 'caja' ? 'Caja' : 'Deudores'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={exportPDF}
                    disabled={reportData.length === 0}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span>📄</span> Exportar PDF
                </button>
            </div>

            {/* Filters for Ventas */}
            {activeTab === 'ventas' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Desde</label>
                            <input 
                                type="date" 
                                value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Hasta</label>
                            <input 
                                type="date" 
                                value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                            <select 
                                value={tipo} onChange={(e) => setTipo(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">Todos</option>
                                <option value="VENTA">Venta Cantina</option>
                                <option value="RESERVA">Reserva Cancha</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Método Pago</label>
                            <select 
                                value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">Todos</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="qr">QR</option>
                                <option value="cuenta_corriente">Cuenta Corriente</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                             <button
                                type="button"
                                onClick={handleLimpiarFiltros}
                                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
                            >
                                Limpiar
                            </button>
                            <button 
                                type="submit"
                                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                            >
                                Filtrar
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Filters for Jugadores */}
            {activeTab === 'jugadores' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar Jugador</label>
                            <input 
                                type="text"
                                placeholder="Nombre..."
                                value={jugadorSearch} onChange={(e) => setJugadorSearch(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                            <select 
                                value={jugadorCategoria} onChange={(e) => setJugadorCategoria(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">Todas</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 col-span-2 justify-end">
                            <button
                                type="button"
                                onClick={handleLimpiarFiltros}
                                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
                            >
                                Limpiar
                            </button>
                            <button 
                                type="submit"
                                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                            >
                                Filtrar
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Filters for Caja */}
            {activeTab === 'caja' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="w-full md:w-1/2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar Caja por Fecha/ID</label>
                        <select
                            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={selectedCaja ? selectedCaja.id : ''}
                            onChange={(e) => {
                                const cajaId = e.target.value;
                                if (cajaId) {
                                    const caja = cajasHistory.find(c => c.id.toString() === cajaId);
                                    handleSelectCaja(caja);
                                } else {
                                    handleBackToCajas();
                                }
                            }}
                        >
                            <option value="">-- Ver Historial de Cajas --</option>
                            {cajasHistory.map(caja => (
                                <option key={caja.id} value={caja.id}>
                                    Caja #{caja.id} - {new Date(caja.fecha_apertura).toLocaleDateString()} ({caja.estado})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
            
            {/* Stats Cards */}
            {(activeTab !== 'caja' || selectedCaja) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
                        <p className="text-sm font-medium text-gray-500">
                            {activeTab === 'ventas' ? 'Ingresos Totales' : 
                             activeTab === 'jugadores' ? 'Total Jugadores' : 
                             activeTab === 'caja' ? 'Balance Caja' : 'Deuda Total'}
                        </p>
                        <p className={`text-3xl font-bold mt-2 ${activeTab === 'caja' ? (stats.total >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
                            {activeTab === 'jugadores' ? stats.total : `$${stats.total.toFixed(2)}`}
                        </p>
                        
                        {activeTab === 'caja' && selectedCaja && (
                             <div className="mt-4 pt-3 border-t border-gray-100">
                                 <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Detalle por medio de pago</p>
                                 <div className="space-y-1">
                                     {Object.entries(stats.byMethod).map(([method, amount]) => (
                                         <div key={method} className="flex justify-between items-center text-sm">
                                             <span className="text-gray-600 capitalize">{method}</span>
                                             <span className={`font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                 ${amount.toFixed(2)}
                                             </span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        )}
                    </div>
                    {activeTab === 'ventas' && Object.entries(stats.byMethod).map(([method, amount]) => (
                        <div key={method} className="bg-white p-6 rounded-lg shadow-sm border-gray-200 border">
                            <p className="text-sm font-medium text-gray-500 capitalize">{method}</p>
                            <p className="text-2xl font-semibold text-gray-700 mt-2">${amount.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'caja' && selectedCaja && (
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center bg-indigo-50 border-indigo-100">
                             <div>
                                <h3 className="font-bold text-indigo-900">Movimientos Caja #{selectedCaja.id}</h3>
                                <p className="text-xs text-indigo-700 mt-1">
                                    Apertura: {new Date(selectedCaja.fecha_apertura).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {activeTab === 'ventas' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    </>
                                )}
                                {activeTab === 'jugadores' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                    </>
                                )}
                                {activeTab === 'deudores' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda</th>
                                    </>
                                )}
                                {activeTab === 'caja' && !selectedCaja && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apertura</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cierre</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inicial</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </>
                                )}
                                {activeTab === 'caja' && selectedCaja && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Cargando datos...</td></tr>
                            ) : (activeTab === 'caja' && !selectedCaja && cajasHistory.length === 0) || 
                                (activeTab === 'caja' && selectedCaja && cajaMovimientos.length === 0) ||
                                (activeTab !== 'caja' && reportData.length === 0) ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
                            ) : (
                                <>
                                    {activeTab === 'caja' && !selectedCaja && cajasHistory.map((caja) => (
                                        <tr key={caja.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{caja.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(caja.fecha_apertura).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : <span className="text-green-600 font-semibold">Abierta</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${caja.saldo_inicial}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                                                {caja.saldo_final ? `$${caja.saldo_final}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleSelectCaja(caja)} className="text-indigo-600 hover:text-indigo-900">
                                                    Ver Movimientos
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'caja' && selectedCaja && cajaMovimientos.map((mov, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{new Date(mov.fecha).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    mov.tipo_movimiento === 'GASTO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {mov.tipo_movimiento}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mov.descripcion}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{mov.metodo_pago}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                                                parseFloat(mov.monto) < 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                ${parseFloat(mov.monto).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab !== 'caja' && reportData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            {activeTab === 'ventas' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(item.fecha).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.descripcion}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            item.tipo === 'VENTA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {item.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {item.metodo || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                        ${parseFloat(item.monto).toFixed(2)}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'jugadores' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {item.categoria_descripcion || 'Sin Categoría'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.nombre}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.telefono || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.email || '-'}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                                                        parseFloat(item.saldo) > 0 ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                        ${parseFloat(item.saldo || 0).toFixed(2)}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'deudores' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.nombre}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                                        {item.categoria_descripcion || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                                        {item.telefono || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-semibold">
                                                        ${parseFloat(item.saldo || 0).toFixed(2)}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportesPage;
