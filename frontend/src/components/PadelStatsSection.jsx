import React, { useEffect, useState } from 'react';
import { ReporteService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const getToday = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getYearAgo = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const NumberCard = ({ label, value, detail }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {detail && <p className="text-xs text-gray-400 mt-1">{detail}</p>}
    </div>
);

const Ranking = ({ title, items, labelKey, valueKey, emptyText, formatValue = value => value }) => {
    const max = Math.max(...items.map(item => Number(item[valueKey]) || 0), 1);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
            {items.length === 0 ? (
                <p className="text-sm text-gray-500">{emptyText}</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => {
                        const value = Number(item[valueKey]) || 0;
                        return (
                            <div key={`${item[labelKey]}-${index}`}>
                                <div className="flex justify-between gap-3 text-sm mb-1">
                                    <span className="text-gray-700 truncate">{item[labelKey]}</span>
                                    <span className="font-bold text-gray-900 whitespace-nowrap">{formatValue(value)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(value / max) * 100}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const PadelStatsSection = () => {
    const [fechaDesde, setFechaDesde] = useState(getYearAgo());
    const [fechaHasta, setFechaHasta] = useState(getToday());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadStats = async (filters = { fechaDesde, fechaHasta }) => {
        setLoading(true);
        try {
            setData(await ReporteService.getPadelStats(filters));
        } catch (error) {
            console.error('Error fetching padel statistics:', error);
            alerts.error('Error', 'No se pudieron cargar las estadísticas de pádel');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const summary = data?.resumen || {};
    const daily = data?.porDia || [];
    const courts = data?.porCancha || [];
    const hours = data?.porFranja || [];
    const weekdays = (data?.porDiaSemana || []).map(item => ({
        ...item,
        nombre: dayNames[Number(item.dia) - 1] || `Día ${item.dia}`
    }));
    const statuses = data?.porEstado || [];
    const peakCourt = courts[0];
    const peakHour = hours[0];
    const peakDay = [...weekdays].sort((a, b) => Number(b.cantidad) - Number(a.cantidad))[0];
    const maxDaily = Math.max(...daily.map(item => Number(item.cantidad) || 0), 1);

    const handleSubmit = event => {
        event.preventDefault();
        loadStats();
    };

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-indigo-950">Estadísticas de Pádel</h3>
                        <p className="text-sm text-indigo-700 mt-1">Turnos no cancelados. Los números permiten detectar demanda alta y baja.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-end">
                        <label className="text-xs font-medium text-indigo-900">Desde
                            <input type="date" value={fechaDesde} onChange={event => setFechaDesde(event.target.value)} className="block mt-1 border-gray-300 rounded-md text-sm" />
                        </label>
                        <label className="text-xs font-medium text-indigo-900">Hasta
                            <input type="date" value={fechaHasta} onChange={event => setFechaHasta(event.target.value)} className="block mt-1 border-gray-300 rounded-md text-sm" />
                        </label>
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberCard label="Turnos hoy" value={summary.hoy || 0} detail="Día actual" />
                <NumberCard label="Turnos esta semana" value={summary.semana || 0} detail="Desde el lunes" />
                <NumberCard label="Turnos este mes" value={summary.mes || 0} detail="Mes calendario actual" />
                <NumberCard label="Turnos del período" value={summary.total_periodo || 0} detail={`${data?.fechaDesde || fechaDesde} al ${data?.fechaHasta || fechaHasta}`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberCard label="Ingresos del período" value={`$${formatCurrency(summary.ingresos_periodo || 0)}`} detail="Según monto de cada turno" />
                <NumberCard label="Ticket promedio" value={`$${formatCurrency(summary.ticket_promedio || 0)}`} detail="Ingreso promedio por turno" />
                <NumberCard label="Clientes identificados" value={summary.clientes_unicos || 0} detail="Por teléfono registrado" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-1">Demanda por día</h3>
                    <p className="text-xs text-gray-500 mb-4">Cantidad de turnos en el período seleccionado</p>
                    {daily.length === 0 ? <p className="text-sm text-gray-500">No hay turnos para este período.</p> : (
                        <div className="space-y-3">
                            {daily.map(item => {
                                const count = Number(item.cantidad) || 0;
                                return <div key={item.fecha} className="flex items-center gap-3 text-sm">
                                    <span className="w-24 text-gray-600">{new Date(`${String(item.fecha).split('T')[0]}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${(count / maxDaily) * 100}%` }} /></div>
                                    <strong className="w-8 text-right">{count}</strong>
                                </div>;
                            })}
                        </div>
                    )}
                </div>
                <Ranking title="Uso por cancha" items={courts} labelKey="nombre" valueKey="cantidad" emptyText="No hay datos de canchas." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Ranking title="Franjas horarias con más demanda" items={hours} labelKey="franja" valueKey="cantidad" emptyText="No hay horarios registrados." />
                <Ranking title="Días de la semana" items={weekdays} labelKey="nombre" valueKey="cantidad" emptyText="No hay días registrados." />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Lectura rápida</h3>
                    <div className="space-y-3 text-sm">
                        <p><span className="text-gray-500">Cancha más alquilada:</span> <strong>{peakCourt ? `${peakCourt.nombre} (${peakCourt.cantidad})` : 'Sin datos'}</strong></p>
                        <p><span className="text-gray-500">Franja más solicitada:</span> <strong>{peakHour ? `${peakHour.franja} (${peakHour.cantidad})` : 'Sin datos'}</strong></p>
                        <p><span className="text-gray-500">Día más fuerte:</span> <strong>{peakDay ? `${peakDay.nombre} (${peakDay.cantidad})` : 'Sin datos'}</strong></p>
                        <p><span className="text-gray-500">Estados registrados:</span> <strong>{statuses.map(item => `${item.estado}: ${item.cantidad}`).join(' | ') || 'Sin datos'}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PadelStatsSection;
