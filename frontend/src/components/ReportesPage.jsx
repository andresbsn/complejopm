import React, { useState, useEffect } from 'react';
import { ReporteService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportesPage = () => {
    // Filter State
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipo, setTipo] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    // Data State
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({ total: 0, byMethod: {} });

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const filters = { fechaDesde, fechaHasta, tipo, metodoPago };
            const data = await ReporteService.getVentas(filters);
            setReportData(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
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
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Reporte de Ingresos', 14, 22);
        doc.setFontSize(11);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Filters info
        let filterText = 'Filtros: ';
        if (fechaDesde) filterText += `Desde ${fechaDesde} `;
        if (fechaHasta) filterText += `Hasta ${fechaHasta} `;
        if (tipo) filterText += `Tipo: ${tipo} `;
        if (metodoPago) filterText += `Método: ${metodoPago} `;
        doc.text(filterText, 14, 36);

        // Stats Summary
        doc.setFontSize(14);
        doc.text('Resumen', 14, 45);
        doc.setFontSize(11);
        doc.text(`Total Ingresos: $${stats.total.toFixed(2)}`, 14, 52);
        
        let yPos = 58;
        Object.entries(stats.byMethod).forEach(([method, amount]) => {
            doc.text(`${method}: $${amount.toFixed(2)}`, 14, yPos);
            yPos += 6;
        });

        // Table
        const tableColumn = ["Fecha", "Descripción", "Tipo", "Método", "Monto"];
        const tableRows = [];

        reportData.forEach(item => {
            const reportData = [
                new Date(item.fecha).toLocaleString(),
                item.descripcion,
                item.tipo,
                item.metodo || '-',
                `$${parseFloat(item.monto).toFixed(2)}`
            ];
            tableRows.push(reportData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos + 5,
        });

        doc.save(`reporte_ingresos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Reportes de Ingresos</h2>
                <button
                    onClick={exportPDF}
                    disabled={reportData.length === 0}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span>📄</span> Exportar PDF
                </button>
            </div>

            {/* Filters */}
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
                    <button 
                        type="submit"
                        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                        Filtrar
                    </button>
                </form>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
                    <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">${stats.total.toFixed(2)}</p>
                </div>
                {Object.entries(stats.byMethod).map(([method, amount]) => (
                    <div key={method} className="bg-white p-6 rounded-lg shadow-sm border-gray-200 border">
                        <p className="text-sm font-medium text-gray-500 capitalize">{method}</p>
                        <p className="text-2xl font-semibold text-gray-700 mt-2">${amount.toFixed(2)}</p>
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Cargando datos...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
                            ) : (
                                reportData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportesPage;
