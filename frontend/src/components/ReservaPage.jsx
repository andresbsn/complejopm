import React, { useState, useEffect } from 'react';
import { ConfiguracionService, CanchaService, TurnoService } from '../services/api';
import ReservaGrid from './ReservaGrid';
import TurnoForm from './TurnoForm'; // Reusing or wrapping existing form logic? Ideally a specific modal.
// Using a simple modal implementation here for speed and integration
import PagoModal from './PagoModal';
import ReservaModal from './ReservaModal';

const ReservaPage = ({ type }) => {
    // type: 'PADEL' or 'FUTBOL' (or whatever matches database 'tipo' and config keys)
    
    const [config, setConfig] = useState(null);
    const [canchas, setCanchas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalOpen, setModalOpen] = useState(false);
    const [pagoModalOpen, setPagoModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedReserva, setSelectedReserva] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configData, canchasData] = await Promise.all([
                    ConfiguracionService.getAll(),
                    CanchaService.getAll({ type }) // Filter by type
                ]);
                setConfig(configData);
                setCanchas(canchasData);
            } catch (error) {
                console.error("Error fetching initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type]);

    // Reservation Fetch on Date or Canchas change
    useEffect(() => {
        if (!canchas.length) return;
        fetchReservas();
    }, [selectedDate, canchas, type]);

    const fetchReservas = async () => {
        try {
            // Fetch for all canchas of this type
            const allTurnos = await TurnoService.getAll(selectedDate);
            
            // Filter turnos that belong to our current set of canchas
            const canchaIds = canchas.map(c => c.id);
            const filteredTurnos = allTurnos.filter(t => canchaIds.includes(t.cancha_id));
            
            setReservas(filteredTurnos);
        } catch (error) {
            console.error("Error fetching reservas", error);
        }
    };

    const generateTimeSlots = () => {
        if (!config) return [];
        
        const start = config.HORARIO_APERTURA || '14:00';
        const end = config.HORARIO_CIERRE || '24:00';
        const duration = parseInt(type === 'PADEL' ? config.DURACION_PADEL : config.DURACION_FUTBOL) || 60;

        const slots = [];
        let currentTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        // Handle case where end time is smaller than start time (e.g. 02:00 next day)
        if (endTime < currentTime) {
            endTime.setDate(endTime.getDate() + 1);
        }

        while (currentTime < endTime) {
            const slotStart = currentTime.toTimeString().slice(0, 5);
            currentTime.setMinutes(currentTime.getMinutes() + duration);
            const slotEnd = currentTime.toTimeString().slice(0, 5);
            slots.push({ start: slotStart, end: slotEnd });
        }

        return slots;
    };

    const handleSlotClick = (cancha, slot, reserva = null) => {
        if (reserva) {
            // If slot is occupied (has reserva), open PagoModal
            // We need to enrich reserva with cancha_nombre for display if needed
            const reservaWithCancha = { ...reserva, cancha_nombre: cancha.nombre };
            setSelectedReserva(reservaWithCancha);
            setPagoModalOpen(true);
        } else {
            // If empty, open booking modal
            setSelectedSlot({ cancha, slot });
            setModalOpen(true);
        }
    };

    const handleReservaSuccess = () => {
        fetchReservas();
        setModalOpen(false);
        setPagoModalOpen(false);
        setSelectedSlot(null);
        setSelectedReserva(null);
    };

    const isSlotOccupied = (canchaId, startTime) => {
        return reservas.some(r => r.cancha_id === canchaId && r.hora_inicio.slice(0,5) === startTime);
    };

    const getReservaForSlot = (canchaId, startTime) => {
        return reservas.find(r => r.cancha_id === canchaId && r.hora_inicio.slice(0,5) === startTime);
    };

    if (loading && !config) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

    const timeSlots = generateTimeSlots();

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Reservas de {type === 'PADEL' ? 'Padel 🎾' : 'Fútbol ⚽'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Duración de turno: {type === 'PADEL' ? config?.DURACION_PADEL : config?.DURACION_FUTBOL} min
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Fecha:</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {config && (
                <ReservaGrid 
                    timeSlots={timeSlots}
                    canchas={canchas}
                    reservas={reservas}
                    onSlotClick={handleSlotClick}
                    isSlotOccupied={isSlotOccupied}
                    getReservaForSlot={getReservaForSlot}
                    selectedDate={selectedDate}
                />
            )}

            {modalOpen && selectedSlot && (
                <ReservaModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    slot={selectedSlot}
                    date={selectedDate}
                    config={config}
                    type={type}
                    onSuccess={handleReservaSuccess}
                />
            )}

            {pagoModalOpen && selectedReserva && (
                <PagoModal
                    turno={selectedReserva}
                    onClose={() => setPagoModalOpen(false)}
                    onPagoSuccess={handleReservaSuccess}
                />
            )}
        </div>
    );
};

export default ReservaPage;
