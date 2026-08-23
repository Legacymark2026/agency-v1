'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon, Clock, Video, User, Mail, Phone,
  Plus, CheckCircle2, XCircle, ExternalLink, Sparkles, Copy,
  ChevronRight, Settings, Users, ShieldCheck, Filter, Sliders,
  Save, Edit2, Trash2, X, MessageSquare, AlertCircle, ToggleLeft, ToggleRight,
  TrendingUp, RefreshCw, Smartphone, Play, Check, AlertTriangle, Globe
} from 'lucide-react';
import {
  getAppointmentsAction,
  createAppointmentAction,
  updateAppointmentStatusAction,
  getBookingTypesAction,
  getWeeklyScheduleAction,
  getBookingRulesAction,
  getBookingMetricsAction,
  generateWhatsAppReminderAction,
} from '@/modules/booking/actions/booking';
import type {
  AppointmentRecord,
  BookingTypeConfig,
  WeeklyScheduleDay,
  BookingRulesConfig,
  BookingMetricsReport,
} from '@/modules/booking/types';
import { toast } from 'sonner';

export default function BookingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'types' | 'schedule' | 'rules' | 'preview'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [bookingTypes, setBookingTypes] = useState<BookingTypeConfig[]>([]);
  const [schedule, setSchedule] = useState<WeeklyScheduleDay[]>([]);
  const [rules, setRules] = useState<BookingRulesConfig | null>(null);
  const [metrics, setMetrics] = useState<BookingMetricsReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Appointment Modal State
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+57 ');
  const [newTypeName, setNewTypeName] = useState('Demostración de Plataforma SaaS ERP');
  const [newDuration, setNewDuration] = useState(45);
  const [newStartDate, setNewStartDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [newMeetingType, setNewMeetingType] = useState<'GOOGLE_MEET' | 'ZOOM' | 'PHONE'>('GOOGLE_MEET');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Booking Type Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState(30);
  const [newTypeBuffer, setNewTypeBuffer] = useState(10);
  const [newTypePrice, setNewTypePrice] = useState(0);
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const publicUrl = "https://legacymarksas.com/book/legacymark";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, typeRes, schRes, rulRes, metRes] = await Promise.all([
        getAppointmentsAction(),
        getBookingTypesAction(),
        getWeeklyScheduleAction(),
        getBookingRulesAction(),
        getBookingMetricsAction(),
      ]);

      if (aptRes.success) setAppointments(aptRes.appointments);
      setBookingTypes(typeRes);
      setSchedule(schRes);
      setRules(rulRes);
      setMetrics(metRes);
    } catch (e) {
      console.error("Error loading booking data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Enlace público de agendamiento copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAppointmentAction({
        customerName: newCustName,
        customerEmail: newCustEmail,
        customerPhone: newCustPhone,
        typeName: newTypeName,
        durationMinutes: newDuration,
        startDate: new Date(newStartDate).toISOString(),
        meetingType: newMeetingType,
        notes: newNotes,
      });

      if (res.success && res.appointment) {
        setAppointments([res.appointment, ...appointments]);
        setShowNewAptModal(false);
        setNewCustName('');
        setNewCustEmail('');
        setNewCustPhone('+57 ');
        setNewNotes('');
        toast.success(`¡Cita agendada exitosamente con ${res.appointment.customerName}! Enlace de Google Meet generado.`);
      } else {
        toast.error(res.error || "Error al crear la cita.");
      }
    } catch (err) {
      toast.error("Ocurrió un error al agendar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW") => {
    await updateAppointmentStatusAction({ id, status });
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Estado de la cita actualizado a ${status}.`);
  };

  const handleSendWhatsAppReminder = async (appointment: AppointmentRecord) => {
    const res = await generateWhatsAppReminderAction(appointment);
    window.open(res.whatsappUrl, '_blank');
    toast.success(`Abriendo WhatsApp para enviar recordatorio a ${appointment.customerName}...`);
  };

  const handleToggleDay = (idx: number) => {
    const updated = [...schedule];
    updated[idx].enabled = !updated[idx].enabled;
    setSchedule(updated);
    toast.success(`Disponibilidad del día ${updated[idx].day} actualizada.`);
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-3">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <Sparkles size={10} className="text-teal-400" /> Enterprise Booking System · Cal.com / Calendly Grade
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Gestor de Citas, Agendamiento & Salas Virtuales
          </h1>
          <p className="ds-subtext mt-1">
            Sistema de reservas automatizado con generación instantánea de Google Meet/Zoom, recordatorios de WhatsApp y sincronización PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-teal-400 font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "¡Enlace Copiado!" : "Copiar Enlace de Reserva"}</span>
          </button>
          <button
            onClick={() => setShowNewAptModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Agendar Cita Manual
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ds-card p-5 border-teal-500/30 bg-teal-950/15">
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">Citas Agendadas Totales</span>
            <p className="text-3xl font-black text-white mt-2 font-mono">{metrics.totalAppointments}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-semibold">{metrics.confirmedCount} confirmadas activas</span>
            </div>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Citas Completadas con Éxito</span>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{metrics.completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Reuniones llevadas a cabo satisfactoriamente.</p>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tasa de Asistencia (Show-Up Rate)</span>
            <p className="text-3xl font-black text-teal-400 mt-2 font-mono">{metrics.attendanceRate}%</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${metrics.attendanceRate}%` }} />
            </div>
          </div>

          <div className="ds-card p-5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Citas Programadas para Hoy</span>
            <p className="text-3xl font-black text-amber-400 mt-2 font-mono">{metrics.upcomingTodayCount}</p>
            <p className="text-xs text-slate-400 mt-1">Recordatorios automáticos de WhatsApp activos.</p>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-teal-400" /> Agenda de Citas
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'types'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-teal-400" /> Tipos de Cita & Servicios
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-teal-400" /> Horarios & Disponibilidad
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" /> Políticas & Recordatorios WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-teal-400" /> Simulador Público de Reserva
        </button>
      </div>

      {/* ── TAB 1: APPOINTMENTS AGENDA ── */}
      {activeTab === 'appointments' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-400" />
                Listado Cronológico de Citas Agendadas
              </h3>
              <p className="text-xs text-slate-400">Reuniones sincronizadas en tiempo real desde la base de datos PostgreSQL.</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="SCHEDULED">Programadas</option>
                <option value="COMPLETED">Completadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
              <button
                onClick={loadData}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Actualizar agenda"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        apt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        apt.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        apt.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {apt.status}
                      </span>
                      <h4 className="text-sm font-bold text-white">{apt.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        {apt.customerName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {apt.customerEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {apt.customerPhone}
                      </span>
                      <span className="flex items-center gap-1.5 text-teal-300">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        {new Date(apt.startDate).toLocaleDateString("es-CO", { weekday: 'short', month: 'short', day: 'numeric' })} a las {new Date(apt.startDate).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })} ({apt.durationMinutes} min)
                      </span>
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono">
                        📝 {apt.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <a
                      href={apt.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" /> Unirse a Google Meet
                    </a>

                    <button
                      onClick={() => handleSendWhatsAppReminder(apt)}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Enviar recordatorio de WhatsApp"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                    </button>

                    {apt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                        title="Marcar como Completada"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {apt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                        title="Cancelar Cita"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No hay citas agendadas con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: BOOKING TYPES ── */}
      {activeTab === 'types' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                Catálogo de Tipos de Cita & Servicios
              </h3>
              <p className="text-xs text-slate-400">Configura duraciones, precios, salas virtuales y estrategias de asignación.</p>
            </div>
            <button
              onClick={() => setShowTypeModal(true)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear Tipo de Cita
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookingTypes.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded bg-teal-950 text-teal-400 font-bold text-xs border border-teal-800/40 font-mono">
                      {t.durationMinutes} minutos · {t.meetingType.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {t.price > 0 ? `$${t.price} ${t.currency}` : 'Gratuito'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-3">{t.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span>Buffer: {t.bufferMinutes} min</span>
                  <span className="text-teal-400 font-bold">Asignación: {t.assignmentStrategy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: WEEKLY SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div className="ds-card p-6 space-y-6 max-w-3xl">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-400" />
              Disponibilidad Horaria Semanal
            </h3>
            <p className="text-xs text-slate-400">Define los días y franjas horarias en que los clientes pueden agendar reuniones.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {schedule.map((day, idx) => (
              <div
                key={day.day}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-32">
                  <button
                    onClick={() => handleToggleDay(idx)}
                    className="cursor-pointer text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {day.enabled ? (
                      <ToggleRight className="w-6 h-6 text-teal-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                  <span className={`font-bold ${day.enabled ? 'text-white' : 'text-slate-500'}`}>
                    {day.day}
                  </span>
                </div>

                {day.enabled ? (
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-teal-400 font-bold">
                      {day.startTime}
                    </span>
                    <span>a</span>
                    <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-teal-400 font-bold">
                      {day.endTime}
                    </span>
                    {day.lunchBreakStart && (
                      <span className="text-slate-500 text-[11px] ml-2">
                        (Pausa almuerzo: {day.lunchBreakStart} - {day.lunchBreakEnd})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-600 font-bold">No disponible</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: RULES & WHATSAPP REMINDERS ── */}
      {activeTab === 'rules' && rules && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Políticas de Agendamiento & Cancelación
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 uppercase block">Preaviso Mínimo de Reserva</label>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white mt-1">
                  {rules.minNoticeHours} horas de anticipación mínima
                </div>
              </div>

              <div>
                <label className="text-slate-400 uppercase block">Límite Máximo de Reserva a Futuro</label>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white mt-1">
                  Hasta {rules.maxAdvanceDays} días calendario
                </div>
              </div>

              <div className="p-4 bg-teal-950/20 border border-teal-500/30 rounded-xl text-teal-300 text-xs">
                ✓ Reagendamiento y cancelación permitidos con 1-clic por el cliente.
              </div>
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Plantilla de Recordatorio Automático por WhatsApp
            </h3>

            <textarea
              rows={6}
              value={rules.whatsappReminderTemplate}
              onChange={(e) => setRules({ ...rules, whatsappReminderTemplate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-teal-500"
            />

            <div className="text-[11px] text-slate-500 font-mono space-y-1">
              <p>Etiquetas dinámicas admitidas: <code className="text-teal-400">{`{{nombre}}`}</code>, <code className="text-teal-400">{`{{tipo_cita}}`}</code>, <code className="text-teal-400">{`{{fecha}}`}</code>, <code className="text-teal-400">{`{{hora}}`}</code>, <code className="text-teal-400">{`{{link_reunion}}`}</code></p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PUBLIC BOOKING PREVIEW WIDGET ── */}
      {activeTab === 'preview' && (
        <div className="ds-card p-8 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-slate-800">
            <span className="ds-badge ds-badge-teal">Vista Previa de Reserva</span>
            <h2 className="text-2xl font-black text-white">Reserva tu Sesión con el Equipo LegacyMark</h2>
            <p className="text-xs text-slate-400">Selecciona el tipo de servicio y horario que mejor se adapte a tu agenda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase">1. Selecciona el Servicio</span>
              {bookingTypes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setNewTypeName(t.title);
                    setNewDuration(t.durationMinutes);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    newTypeName === t.title
                      ? 'bg-teal-500/15 border-teal-500 text-white shadow-md shadow-teal-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{t.title}</span>
                    <span className="text-xs text-teal-400 font-mono">{t.durationMinutes} min</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-400 uppercase">2. Completa tus Datos de Contacto</span>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tu Nombre Completo *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                />
                <input
                  type="email"
                  placeholder="Tu Correo Electrónico *"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                />
                <input
                  type="tel"
                  placeholder="Teléfono / WhatsApp (+57...)"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-teal-500"
                />
                <div>
                  <label className="text-[11px] font-mono text-slate-500 uppercase">Fecha y Hora Deseada</label>
                  <input
                    type="datetime-local"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-teal-400 font-mono mt-1 outline-none"
                  />
                </div>
                <button
                  onClick={handleCreateAppointment}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirmar Reserva en PostgreSQL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MANUAL APPOINTMENT CREATION ── */}
      {showNewAptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-400" />
                Agendar Nueva Cita en Vivo
              </h3>
              <button
                onClick={() => setShowNewAptModal(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 uppercase">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 uppercase">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 uppercase">Tipo de Cita</label>
                  <select
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-400 mt-1 outline-none"
                  >
                    {bookingTypes.map(t => (
                      <option key={t.id} value={t.title}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 uppercase">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Notas Adicionales</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Guardar en PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
