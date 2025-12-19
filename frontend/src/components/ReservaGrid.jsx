import React from 'react';

const ReservaGrid = ({ 
    timeSlots, 
    canchas, 
    reservas, 
    onSlotClick, 
    isSlotOccupied,
    getReservaForSlot,
    selectedDate,
    isAdmin,
    onDeleteCancha 
}) => {
    return (
        <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-32 border-r">
                            Horario
                        </th>
                        {canchas.map(cancha => (
                            <th key={cancha.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0 min-w-[200px] group relative">
                                <div className="flex items-center justify-center gap-2">
                                    <span>{cancha.nombre}</span>
                                    {isAdmin && (
                                        <button
                                            onClick={() => onDeleteCancha(cancha.id)}
                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Eliminar Cancha"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-normal">{cancha.tipo}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {timeSlots.map((slot, index) => (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium sticky left-0 bg-white z-10 border-r">
                                {slot.start} a {slot.end}
                            </td>
                            {canchas.map(cancha => {
                                const occupied = isSlotOccupied(cancha.id, slot.start);
                                const reserva = getReservaForSlot(cancha.id, slot.start);
                                
                                const slotDateTime = new Date(`${selectedDate}T${slot.start}:00`);
                                const now = new Date();
                                const isPast = slotDateTime < now;

                                return (
                                    <td key={`${cancha.id}-${slot.start}`} className="px-2 py-2 border-r last:border-r-0 relative h-16">
                                        {occupied && reserva ? (
                                            <button
                                                onClick={() => onSlotClick(cancha, slot, reserva)} // Pass reserva
                                                className={`
                                                w-full h-full rounded-md p-2 flex flex-col justify-center items-center text-xs font-medium transition-transform hover:scale-95
                                                ${reserva.estado === 'confirmado' ? 'bg-blue-100 text-blue-800' : 
                                                  reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                  reserva.estado === 'fijo' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}
                                            `}>
                                                <span className="truncate w-full text-center font-bold">{reserva.cliente_nombre}</span>
                                                <span className="truncate w-full text-center text-[10px]">
                                                    {reserva.estado === 'fijo' ? 'FIJO' : `$${reserva.monto_pagado || 0} / $${reserva.monto_total}`}
                                                </span>
                                            </button>
                                        ) : isPast ? (
                                             <div className="w-full h-full bg-gray-50 rounded-md flex items-center justify-center cursor-not-allowed opacity-50">
                                                <span className="text-gray-300 text-xs">⛔</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onSlotClick(cancha, slot)}
                                                className="w-full h-full flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReservaGrid;
