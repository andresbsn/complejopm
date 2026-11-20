import React from 'react';
import { formatCurrency } from '../utils/formatters';

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
        <>
            {/* Mobile View - Schedule matrix */}
            <div className="ui-table-shell overflow-x-auto lg:hidden">
                <div className="min-w-max">
                    <div
                        className="grid border-b border-gray-200 bg-gray-50"
                        style={{ gridTemplateColumns: `76px repeat(${canchas.length}, minmax(112px, 1fr))` }}
                    >
                        <div className="sticky left-0 z-10 flex items-center justify-center border-r border-gray-200 bg-gray-50 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Hora
                        </div>
                        {canchas.map(cancha => (
                            <div key={cancha.id} className="flex min-w-[112px] items-center justify-center border-r border-gray-200 px-2 py-3 text-center last:border-r-0">
                                <div>
                                    <div className="truncate text-xs font-bold text-gray-800">{cancha.nombre}</div>
                                    <div className="text-[10px] text-gray-400">{cancha.tipo}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {timeSlots.map((slot, index) => {
                        const slotDateTime = new Date(`${selectedDate}T${slot.start}:00`);
                        const isPast = slotDateTime < new Date();

                        return (
                            <div
                                key={index}
                                className="grid min-h-[78px] border-b border-gray-200 last:border-b-0"
                                style={{ gridTemplateColumns: `76px repeat(${canchas.length}, minmax(112px, 1fr))` }}
                            >
                                <div className="sticky left-0 z-10 flex flex-col items-center justify-center border-r border-gray-200 bg-white px-1 text-center">
                                    <span className="text-sm font-bold text-gray-900">{slot.start}</span>
                                    <span className="text-[10px] text-gray-400">{slot.end}</span>
                                </div>
                                {canchas.map(cancha => {
                                    const reserva = getReservaForSlot(cancha.id, slot.start);
                                    const isReserved = reserva && reserva.estado !== 'cancelado';

                                    return (
                                        <div key={`${cancha.id}-${slot.start}`} className="min-w-[112px] border-r border-gray-200 p-1.5 last:border-r-0">
                                            {isReserved ? (
                                                <button
                                                    onClick={() => onSlotClick(cancha, slot, reserva)}
                                                     className="flex h-full min-h-[64px] w-full flex-col items-center justify-center rounded-md border-2 border-red-500 bg-red-100 px-1 text-center font-semibold text-red-800 shadow-sm ring-1 ring-red-200 transition-colors hover:border-red-600 hover:bg-red-200"
                                                    title={`Reservado: ${reserva.cliente_nombre}`}
                                                >
                                                    <span className="w-full truncate text-[11px] font-bold">Reservado</span>
                                                    <span className="w-full truncate text-[10px]">{reserva.cliente_nombre}</span>
                                                </button>
                                            ) : isPast ? (
                                                <button
                                                    onClick={() => onSlotClick(cancha, slot)}
                                                     className="relative flex h-full min-h-[64px] w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-100 px-1 text-center text-[10px] text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-200"
                                                    title="Cargar reserva de un horario pasado"
                                                >
                                                    <span className="font-semibold">Horario pasado</span>
                                                     <span className="text-[9px] uppercase tracking-wide text-gray-500">Cargar igual</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onSlotClick(cancha, slot)}
                                                     className="flex h-full min-h-[64px] w-full items-center justify-center rounded-md border-2 border-green-500 bg-green-100 px-1 text-center text-xs font-bold text-green-800 shadow-sm ring-1 ring-green-200 transition-colors hover:border-green-600 hover:bg-green-200"
                                                >
                                                    Libre
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Desktop View - Table */}
            <div className="ui-table-shell hidden lg:block">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">Disponibilidad por cancha</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                             <span className="h-2.5 w-2.5 rounded-full bg-green-600 ring-2 ring-green-200" />
                            Libre
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                             <span className="h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-red-200" />
                            Reservado
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                             <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                            Horario pasado
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="sticky left-0 z-10 w-32 border-r bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Horario
                            </th>
                            {canchas.map(cancha => (
                                <th key={cancha.id} scope="col" className="group relative min-w-[200px] border-r px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 last:border-r-0">
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
                                <td className="sticky left-0 z-10 border-r bg-white px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                    <div className="font-bold">{slot.start}</div>
                                    <div className="text-xs text-gray-400">hasta {slot.end}</div>
                                </td>
                                {canchas.map(cancha => {
                                    const reserva = getReservaForSlot(cancha.id, slot.start);
                                    
                                    const isCancelled = reserva && reserva.estado === 'cancelado';
                                    const shouldShowReserva = reserva && !isCancelled;
                                    
                                    const slotDateTime = new Date(`${selectedDate}T${slot.start}:00`);
                                    const now = new Date();
                                    const isPast = slotDateTime < now;

                                    return (
                                        <td key={`${cancha.id}-${slot.start}`} className="relative h-20 border-r px-2 py-2 last:border-r-0">
                                            {shouldShowReserva ? (
                                                <button
                                                    onClick={() => onSlotClick(cancha, slot, reserva)}
                                                      className="flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-red-500 bg-red-100 p-2 text-xs font-semibold text-red-800 shadow-sm ring-1 ring-red-200 transition-colors hover:border-red-600 hover:bg-red-200">
                                                     <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wide">Reservado</span>
                                                     <span className="truncate w-full text-center font-bold">{reserva.cliente_nombre}</span>
                                                      <span className="truncate w-full text-center text-[10px] text-red-700">
                                                        {reserva.estado === 'fijo' ? 'FIJO' : `$${formatCurrency(reserva.monto_pagado || 0)} / $${formatCurrency(reserva.monto_total)}`}
                                                    </span>
                                                </button>
                                             ) : isPast ? (
                                                  <button
                                                      onClick={() => onSlotClick(cancha, slot)}
                                                       className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-100 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-200"
                                                      title="Cargar reserva de un horario pasado"
                                                  >
                                                      <span className="text-xs font-semibold">Horario pasado</span>
                                                       <span className="text-[10px] uppercase tracking-wide text-gray-500">Cargar igual</span>
                                                  </button>
                                            ) : (
                                                <button
                                                    onClick={() => onSlotClick(cancha, slot)}
                                                      className="flex h-full w-full items-center justify-center rounded-md border-2 border-green-500 bg-green-100 text-sm font-bold text-green-800 shadow-sm ring-1 ring-green-200 transition-colors hover:border-green-600 hover:bg-green-200"
                                                 >
                                                     Libre
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
            </div>
        </>
    );
};

export default ReservaGrid;
