import React, { useState, useEffect } from 'react';
import { ReporteService, CategoriaService, CajaService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const ReportesPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const [activeTab, setActiveTab] = useState(isAdmin ? 'ventas' : 'deudores');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    // Filters for Ventas
    const getToday = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [fechaDesde, setFechaDesde] = useState(getToday());
    const [fechaHasta, setFechaHasta] = useState(getToday());
    const [tipo, setTipo] = useState('');
    const [categoriaVenta, setCategoriaVenta] = useState(''); // 'futbol', 'padel', 'cantina'
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
        if (!isAdmin && (activeTab === 'ventas' || activeTab === 'jugadores')) {
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
                const filters = filtersOverride || { fechaDesde, fechaHasta, tipo, metodoPago, categoriaVenta };
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
            } else if (activeTab === 'caja') {
                if (selectedCaja) {
                    const movs = await CajaService.getMovimientos(selectedCaja.id);
                    // Filter cash movements only for regular users
                    const filteredMovs = isAdmin ? movs : movs.filter(m => 
                        m.metodo_pago?.toLowerCase() === 'efectivo' || 
                        m.tipo_movimiento === 'GASTO' || 
                        m.tipo_movimiento === 'INGRESO_CUENTA'
                    );
                    setCajaMovimientos(filteredMovs);
                    calculateStats(filteredMovs, selectedCaja);
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

    const calculateStats = (data, context = null) => { // context can be 'caja' object or null
        if (!data) return;

        // Special handling for Caja view
        if (activeTab === 'caja' && context) {

             let total = 0;
            const byMethod = {};

            data.forEach(item => {
                const monto = parseFloat(item.monto);
                total += monto;
                const method = item.metodo_pago || 'Otros';
                if (!byMethod[method]) byMethod[method] = 0;
                byMethod[method] += monto;
            });
            
             setStats({ total, totalGanancia: 0, byMethod });
             return;
        }

        // For Venta/Jugadores/Deudores
        let total = 0;
        let totalGanancia = 0;
        const byMethod = {};

        data.forEach(item => {
            const monto = parseFloat(item.monto || item.saldo || 0); // Handle 'saldo' for deudores
            const ganancia = parseFloat(item.ganancia || 0);
            
            // For Ventas tab, only sum Ganancia if positive/present? 
            // Query returns 0 for non-sale items.
            totalGanancia += ganancia;

            total += monto;
            const method = item.metodo || 'Otros';
            if (!byMethod[method]) byMethod[method] = 0;
            byMethod[method] += monto;
        });

        setStats({ total, totalGanancia, byMethod });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const handleLimpiarFiltros = () => {
        if (activeTab === 'ventas') {
            setFechaDesde('');
            setFechaHasta('');
            setFechaHasta('');
            setTipo('');
            setCategoriaVenta('');
            setMetodoPago('');
            fetchReport({ fechaDesde: '', fechaHasta: '', tipo: '', categoriaVenta: '', metodoPago: '' });
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
                const filteredMovs = isAdmin ? movs : movs.filter(m => 
                    m.metodo_pago?.toLowerCase() === 'efectivo' || 
                    m.tipo_movimiento === 'GASTO' || 
                    m.tipo_movimiento === 'INGRESO_CUENTA'
                );
                setCajaMovimientos(filteredMovs);
                calculateStats(filteredMovs, caja); // Pass caja explicitly to avoid stale state
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
            doc.text(`Total Ingresos: $${formatCurrency(stats.total)}`, 14, 36);
            if (isAdmin) {
                doc.text(`Ganancia Estimada: $${formatCurrency(stats.totalGanancia)}`, 100, 36);
            }
            
            const tableColumn = ["Fecha", "Descripción", "Obs.", "Tipo", "Método", "Monto"];
            if (isAdmin) tableColumn.push("Ganancia");

            const tableRows = reportData.map(item => {
                const row = [
                    new Date(item.fecha).toLocaleString(),
                    item.descripcion,
                    item.observaciones || '-',
                    item.tipo,
                    item.metodo || '-',
                    `$${formatCurrency(item.monto)}`
                ];
                if (isAdmin) row.push((item.tipo === 'VENTA' || item.tipo === 'RESERVA') ? `$${formatCurrency(item.ganancia)}` : '-');
                return row;
            });
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'jugadores') {
            doc.text(`Total Jugadores: ${reportData.length}`, 14, 36);
            const tableColumn = ["Categoría", "Nombre", "Teléfono", "Email", "Saldo"];
            const tableRows = reportData.map(item => [
                item.categoria_descripcion || '-',
                item.nombre,
                item.telefono || '-',
                item.email || '-',
                `$${formatCurrency(item.saldo)}`
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'deudores') {
            doc.text(`Total Deuda: $${formatCurrency(stats.total)}`, 14, 36);
            const tableColumn = ["Nombre", "Teléfono", "Email", "Deuda"];
            const tableRows = reportData.map(item => [
                item.nombre,
                item.telefono || '-',
                item.email || '-',
                `$${formatCurrency(item.saldo)}`
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
        } else if (activeTab === 'caja') {
             if (selectedCaja) {
                doc.text(isAdmin ? `Balance Total: $${formatCurrency(stats.total)}` : `Total Efectivo: $${formatCurrency(stats.total)}`, 14, 36);
                const tableColumn = ["Fecha", "Tipo", "Descripción", "Método", "Monto"];
                const tableRows = cajaMovimientos.map(mov => [
                    new Date(mov.fecha).toLocaleString(),
                    mov.tipo_movimiento,
                    mov.descripcion,
                    mov.metodo_pago,
                    `$${formatCurrency(mov.monto)}`
                ]);
                autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos + 6 });
             } else {
                 const tableColumn = isAdmin 
                    ? ["ID", "Apertura", "Cierre", "Inicial", "Final", "Usuario", "Estado"]
                    : ["ID", "Apertura", "Cierre", "Estado"];
                 
                 const tableRows = cajasHistory.map(caja => {
                     const common = [
                        caja.id,
                        new Date(caja.fecha_apertura).toLocaleString(),
                        caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : '-',
                     ];
                     if (isAdmin) {
                         return [
                             ...common,
                             `$${formatCurrency(caja.saldo_inicial)}`,
                             caja.saldo_final ? `$${formatCurrency(caja.saldo_final)}` : '-',
                             `ID: ${caja.usuario_apertura_id}`,
                             caja.estado
                         ];
                     } else {
                         return [...common, caja.estado];
                     }
                 });
                 autoTable(doc, { head: [tableColumn], body: tableRows, startY: yPos });
             }
        }

        doc.save(`reporte_${activeTab}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    // Updated tabs list
    const tabs = isAdmin ? ['ventas', 'jugadores', 'deudores', 'caja'] : ['deudores', 'caja'];

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
                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                            <select 
                                value={categoriaVenta} onChange={(e) => setCategoriaVenta(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">Todas</option>
                                <option value="futbol">Fútbol</option>
                                <option value="padel">Padel</option>
                                <option value="cantina">Cantina</option>
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
                                <option value="gastos_generales">Gastos Generales / Cortesía</option>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">
                            {activeTab === 'ventas' ? 'Total Ingresos' : 
                             activeTab === 'jugadores' ? 'Total Jugadores' : 
                             activeTab === 'caja' ? (isAdmin ? 'Balance Caja' : 'Total Efectivo') : 'Deuda Total'}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${activeTab === 'caja' ? (stats.total >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-800'}`}>
                            {activeTab === 'jugadores' ? stats.total : `$${formatCurrency(stats.total)}`}
                        </p>
                        {activeTab === 'ventas' && (
                             <p className="text-xs text-gray-400 mt-1">Ingresos brutos</p>
                        )}
                    </div>
                    
                    {activeTab === 'ventas' && isAdmin && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Ganancia Neta Est.</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">${formatCurrency(stats.totalGanancia)}</p>
                            <p className="text-xs text-gray-400 mt-1">Ventas - Costos (Excluye Turnos)</p>
                        </div>
                    )}

                    {Object.entries(stats.byMethod).map(([method, amount]) => (
                        <div key={method} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 capitalize">{method}</p>
                            <p className="text-lg font-semibold text-gray-800">${formatCurrency(amount)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando datos...</div>
                ) : (
                    <>
                        {/* Ventas Mobile */}
                        {activeTab === 'ventas' && (
                            reportData.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No se encontraron ventas.</div>
                            ) : (
                                reportData.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                item.tipo === 'VENTA' ? 'bg-blue-100 text-blue-800' : 
                                                item.tipo === 'RESERVA' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {item.tipo}
                                            </span>
                                            <span className="text-xs text-gray-500">{new Date(item.fecha).toLocaleString()}</span>
                                        </div>
                                        <p className="font-medium text-gray-900 mb-1">{item.descripcion}</p>
                                        {item.observaciones && <p className="text-xs text-gray-500 mb-2 italic">{item.observaciones}</p>}
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                                            <span className="text-gray-500 capitalize">{item.metodo || '-'}</span>
                                            <div>
                                                <span className="font-bold text-gray-900">${formatCurrency(item.monto)}</span>
                                                {isAdmin && (item.tipo === 'VENTA' || item.tipo === 'RESERVA') && (
                                                    <span className={`block text-xs text-right ${parseFloat(item.ganancia) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        G: ${formatCurrency(item.ganancia)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {/* Jugadores Mobile */}
                        {activeTab === 'jugadores' && (
                             reportData.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No se encontraron jugadores.</div>
                            ) : (
                                reportData.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                                    {item.categoria_descripcion || 'Sin Categoría'}
                                                </span>
                                            </div>
                                            <span className={`font-bold text-sm ${parseFloat(item.saldo) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${parseFloat(item.saldo || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1 mt-2">
                                            {item.telefono && <p>📞 {item.telefono}</p>}
                                            {item.email && <p>✉️ {item.email}</p>}
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {/* Deudores Mobile */}
                        {activeTab === 'deudores' && (
                             reportData.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No se encontraron deudores.</div>
                            ) : (
                                reportData.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-red-500">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                                                <p className="text-xs text-gray-500">{item.categoria_descripcion || '-'}</p>
                                            </div>
                                            <span className="font-bold text-red-600">
                                                ${parseFloat(item.saldo || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        {item.telefono && <p className="text-xs text-gray-500 mt-1">📞 {item.telefono}</p>}
                                    </div>
                                ))
                            )
                        )}

                        {/* Caja List Mobile */}
                        {activeTab === 'caja' && !selectedCaja && (
                            cajasHistory.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No se encontraron registros.</div>
                            ) : (
                                cajasHistory.map((caja) => (
                                    <div key={caja.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-900">Caja #{caja.id}</span>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {caja.estado}
                                            </span>
                                        </div>
                                        <div className="text-sm space-y-1 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Apertura:</span>
                                                <span className="text-gray-900">{new Date(caja.fecha_apertura).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Cierre:</span>
                                                <span className="text-gray-900">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : '-'}</span>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="border-t pt-2 flex justify-between items-center text-sm mb-3">
                                                <div>
                                                    <span className="text-gray-500 block text-xs">Inicial</span>
                                                    <span className="font-semibold">${formatCurrency(caja.saldo_inicial)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500 block text-xs">Final</span>
                                                    <span className="font-semibold">{caja.saldo_final ? `$${formatCurrency(caja.saldo_final)}` : '-'}</span>
                                                </div>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleSelectCaja(caja)} 
                                            className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-md text-sm font-medium hover:bg-indigo-100"
                                        >
                                            Ver Movimientos
                                        </button>
                                    </div>
                                ))
                            )
                        )}

                        {/* Caja Movements Mobile */}
                        {activeTab === 'caja' && selectedCaja && (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                                    <h3 className="font-bold text-indigo-900">Caja #{selectedCaja.id}</h3>
                                    <p className="text-xs text-indigo-700 mt-1">Apertura: {new Date(selectedCaja.fecha_apertura).toLocaleString()}</p>
                                </div>
                                {cajaMovimientos.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">No hay movimientos.</div>
                                ) : (
                                    cajaMovimientos.map((mov, idx) => (
                                        <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    mov.tipo_movimiento === 'GASTO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {mov.tipo_movimiento}
                                                </span>
                                                <span className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="font-medium text-gray-900 mb-1">{mov.descripcion}</p>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 capitalize">{mov.metodo_pago}</span>
                                                <span className={`font-bold ${parseFloat(mov.monto) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ${formatCurrency(mov.monto)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Desktop Data Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'caja' && selectedCaja && (
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center bg-indigo-50 border-indigo-100">
                             <div>
                                <h3 className="font-bold text-indigo-900">Movimientos Caja #{selectedCaja.id}</h3>
                                <p className="text-xs text-indigo-700 mt-1">
                                    Apertura: {new Date(selectedCaja.fecha_apertura).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {activeTab === 'ventas' && (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obs.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>}
                                </tr>
                            )}
                            {activeTab === 'jugadores' && (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                </tr>
                            )}
                            {activeTab === 'deudores' && (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda Total</th>
                                </tr>
                            )}
                            {activeTab === 'caja' && selectedCaja && (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            )}
                            {activeTab === 'caja' && !selectedCaja && (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apertura</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cierre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeTab === 'ventas' && reportData.map(item => (
                                <tr key={`${item.tipo}-${item.id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(item.fecha).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.descripcion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                                        {item.observaciones || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            item.tipo === 'VENTA' ? 'bg-green-100 text-green-800' : 
                                            item.tipo === 'RESERVA' ? 'bg-blue-100 text-blue-800' : 
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {item.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {item.metodo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                        ${formatCurrency(item.monto)}
                                    </td>
                                    {isAdmin && (
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${parseFloat(item.ganancia) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(item.tipo === 'VENTA' || item.tipo === 'RESERVA') ? `$${formatCurrency(item.ganancia)}` : '-'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {activeTab === 'jugadores' && reportData.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.categoria_descripcion || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.telefono || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">${formatCurrency(item.saldo)}</td>
                                </tr>
                            ))}
                             {activeTab === 'deudores' && reportData.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.categoria_descripcion || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.telefono || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">${formatCurrency(item.saldo)}</td>
                                </tr>
                            ))}
                            {activeTab === 'caja' && selectedCaja && cajaMovimientos.map((mov, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(mov.fecha).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.tipo_movimiento}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mov.descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{mov.metodo_pago}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${mov.monto < 0 ? 'text-red-600' : 'text-green-600'}`}>${formatCurrency(mov.monto)}</td>
                                </tr>
                            ))}
                             {activeTab === 'caja' && !selectedCaja && cajasHistory.map(caja => (
                                <tr key={caja.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectCaja(caja)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{caja.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(caja.fecha_apertura).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {caja.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={(e) => { e.stopPropagation(); handleSelectCaja(caja); }} className="text-indigo-600 hover:text-indigo-900">Ver Movimientos</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


export default ReportesPage;
