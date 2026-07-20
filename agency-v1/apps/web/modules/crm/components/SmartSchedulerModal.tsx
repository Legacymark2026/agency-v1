'use client';

import { useState } from 'react';
import {
    Calendar, Clock, UserCheck, CheckCircle, Video, X, Sparkles, AlertCircle
} from 'lucide-react';
import {
    generateAvailableSlots, scheduleSmartMeeting, SalesRepAvailability, BookingSlot, BookingResult
} from '@/lib/crm/smart-scheduler';

const MOCK_SALES_REPS: SalesRepAvailability[] = [
    { id: 'rep-1', name: 'Carlos Mendoza', email: 'carlos@agency.com', activeDealsCount: 4, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
    { id: 'rep-2', name: 'Ana María Gómez', email: 'ana@agency.com', activeDealsCount: 7, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
    { id: 'rep-3', name: 'David Silva', email: 'david@agency.com', activeDealsCount: 12, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
];

interface SmartSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    prospectEmail?: string;
}

export function SmartSchedulerModal({ isOpen, onClose, prospectEmail = 'cliente@prospecto.com' }: SmartSchedulerModalProps) {
    const [selectedDate, setSelectedDate] = useState('2026-02-01');
    const [selectedTime, setSelectedTime] = useState('10:00');
    const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

    if (!isOpen) return null;

    const availableSlots = generateAvailableSlots(selectedDate, MOCK_SALES_REPS);

    const handleConfirmBooking = () => {
        const slot: BookingSlot = {
            date: selectedDate,
            time: selectedTime,
            availableReps: MOCK_SALES_REPS,
        };

        const result = scheduleSmartMeeting(prospectEmail, slot, MOCK_SALES_REPS);
        setBookingResult(result);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">Agendador Inteligente de Citas</h3>
                            <p className="font-mono text-[11px] text-slate-500">Asignación automática Round-Robin por carga</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {!bookingResult ? (
                    <div className="space-y-4 font-mono text-xs">
                        {/* Date Input */}
                        <div>
                            <label className="text-slate-400 block mb-1">Fecha de la Cita:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-teal-500"
                            />
                        </div>

                        {/* Slot Selector */}
                        <div>
                            <label className="text-slate-400 block mb-1">Horarios Disponibles:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot.time}
                                        onClick={() => setSelectedTime(slot.time)}
                                        className={`p-2 rounded-lg border text-center font-bold transition-all ${
                                            selectedTime === slot.time
                                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/50'
                                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                                        }`}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prospect info */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-slate-500">Prospecto:</span>
                            <p className="font-bold text-white">{prospectEmail}</p>
                        </div>

                        <button
                            onClick={handleConfirmBooking}
                            className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                        >
                            <UserCheck size={14} />
                            <span>Confirmar Agendamiento Inteligente</span>
                        </button>
                    </div>
                ) : (
                    /* Booking Success Result */
                    <div className="space-y-4 font-mono text-xs text-center py-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">¡Cita Agendada Exitosamente!</h4>
                            <p className="text-slate-400 mt-1">Se asignó automáticamente el agente óptimo con menor carga.</p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-left">
                            <p className="text-slate-400">Agente Asignado: <strong className="text-teal-400">{bookingResult.assignedRep?.name}</strong></p>
                            <p className="text-slate-400">Fecha y Hora: <strong className="text-white">{bookingResult.scheduledAt}</strong></p>
                            <div className="pt-2 flex items-center gap-2">
                                <Video size={14} className="text-cyan-400" />
                                <a href={bookingResult.meetingUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold truncate">
                                    {bookingResult.meetingUrl}
                                </a>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
