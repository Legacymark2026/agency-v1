'use client';

import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Users, 
  Plus, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  PhoneCall,
  CalendarCheck,
  UserCheck,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  meetLink?: string;
}

export default function CalendarAppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState('2026-08-24');
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'apt_1',
      clientName: 'Carlos Mendoza',
      clientEmail: 'carlos.m@techcorp.co',
      serviceType: 'Consultoría Estratégica & Performance',
      date: '2026-08-24',
      time: '09:00 AM - 10:00 AM',
      status: 'CONFIRMED',
      meetLink: 'https://meet.google.com/leg-mark-crm',
    },
    {
      id: 'apt_2',
      clientName: 'Diana Restrepo',
      clientEmail: 'diana.r@inversiones.com',
      serviceType: 'Demostración de Plataforma & POS',
      date: '2026-08-24',
      time: '11:30 AM - 12:15 PM',
      status: 'CONFIRMED',
      meetLink: 'https://meet.google.com/leg-pos-demo',
    },
    {
      id: 'apt_3',
      clientName: 'Roberto Gómez',
      clientEmail: 'roberto@distribuidora.co',
      serviceType: 'Revisión de Facturación Electrónica DIAN',
      date: '2026-08-24',
      time: '03:00 PM - 03:45 PM',
      status: 'PENDING',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newService, setNewService] = useState('Consultoría Estratégica');
  const [newTime, setNewTime] = useState('10:00 AM');

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient || !newEmail) return;

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      clientName: newClient,
      clientEmail: newEmail,
      serviceType: newService,
      date: selectedDate,
      time: `${newTime} - ${newTime.replace(':00', ':45')}`,
      status: 'CONFIRMED',
      meetLink: `https://meet.google.com/lm-${Math.random().toString(36).substring(2, 6)}`,
    };

    setAppointments([newApt, ...appointments]);
    setShowModal(false);
    setNewClient('');
    setNewEmail('');
    toast.success(`Cita agendada exitosamente con ${newClient}`);
  };

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-4">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              CRM_OPS · CALENDARIO & CITAS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="ds-icon-box w-12 h-12">
              <CalendarCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="ds-heading-page">Agendación de Citas & Videollamadas</h1>
              <p className="ds-subtext mt-1">Sincronización con Google Calendar & Outlook · Enlaces de Reunión · Gestión de Disponibilidad</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest text-white bg-teal-900/40 border border-teal-600/50 hover:bg-teal-800/40 transition-all shadow-[0_0_20px_-8px_rgba(13,148,136,0.5)]">
            <Plus className="w-4 h-4" /> Agendar Nueva Cita
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ds-kpi">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Citas Hoy</span>
            <CalendarIcon className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{appointments.length}</div>
          <span className="text-[10px] text-teal-400 font-mono">100% Confirmadas</span>
        </div>

        <div className="ds-kpi">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Videollamadas Activas</span>
            <Video className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">2</div>
          <span className="text-[10px] text-teal-400 font-mono">Google Meet Link Activo</span>
        </div>

        <div className="ds-kpi">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tasa de Asistencia</span>
            <UserCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">94.8%</div>
          <span className="text-[10px] text-teal-400 font-mono">+2.4% vs mes anterior</span>
        </div>

        <div className="ds-kpi">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Zona Horaria</span>
            <Globe className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-sm font-bold text-white mt-3">America/Bogota (GMT-5)</div>
          <span className="text-[10px] text-slate-400 font-mono">Auto-detectada</span>
        </div>
      </div>

      {/* Main Agenda Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Appointment List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" /> Citas Programadas para Hoy
            </h2>
            <span className="text-xs text-slate-400 font-mono">{selectedDate}</span>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="ds-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{apt.clientName}</span>
                    <span className="text-xs text-slate-400">({apt.clientEmail})</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${apt.status === 'CONFIRMED' ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'bg-yellow-950 text-yellow-300 border border-yellow-700'}`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{apt.serviceType}</p>
                  <p className="text-xs font-mono text-teal-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {apt.time}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {apt.meetLink && (
                    <a
                      href={apt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-950/60 hover:bg-teal-900 border border-teal-700 text-teal-300 text-xs font-mono rounded transition-all"
                    >
                      <Video className="w-3.5 h-3.5" /> Unirse a Meet
                    </a>
                  )}
                  <button 
                    onClick={() => toast.success(`Recordatorio por WhatsApp enviado a ${apt.clientName}`)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition-all">
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 col: Availability & Quick Links */}
        <div className="space-y-6">
          <div className="ds-card space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Enlace Público de Agendamiento
            </h3>
            <p className="text-xs text-slate-400">Comparte tu enlace público tipo Calendly para que tus clientes agenden automáticamente:</p>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-xs font-mono text-teal-300">
              <span className="truncate">https://legacymarksas.com/agenda/citas</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('https://legacymarksas.com/agenda/citas');
                  toast.success('Enlace copiado al portapapeles');
                }}
                className="text-xs text-slate-400 hover:text-white shrink-0 ml-2">
                Copiar
              </button>
            </div>
          </div>

          <div className="ds-card space-y-4">
            <h3 className="text-sm font-bold text-white">Horarios de Atención</h3>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Lunes a Viernes:</span>
                <span className="text-teal-400">08:00 AM - 06:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Sábados:</span>
                <span className="text-teal-400">09:00 AM - 01:00 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Domingos y Festivos:</span>
                <span className="text-slate-500">Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="ds-card max-w-md w-full p-6 space-y-4 border border-teal-800/80">
            <h3 className="text-base font-bold text-white">Agendar Cita Directa</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="ds-mono-label">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-white rounded focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="ds-mono-label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-white rounded focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="ds-mono-label">Servicio</label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-white rounded focus:border-teal-600 focus:outline-none"
                >
                  <option>Consultoría Estratégica & Performance</option>
                  <option>Demostración de Plataforma & POS</option>
                  <option>Facturación DIAN & RADIAN</option>
                  <option>Asesoría en Pauta Digital (Meta/Google)</option>
                </select>
              </div>

              <div>
                <label className="ds-mono-label">Hora</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-white rounded focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-mono uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-500 rounded font-bold"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
