"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Calendar, Search, Filter, AlertTriangle } from "lucide-react";

const mockTimesheets = [
  {
    id: "ts-1",
    employeeName: "Diego Alvarez",
    role: "Full Stack Developer",
    period: "Mar 10 - Mar 16, 2026",
    totalHours: 42.5,
    status: "SUBMITTED",
    avatar: "D"
  },
  {
    id: "ts-2",
    employeeName: "Andrea Gómez",
    role: "UX Designer",
    period: "Mar 10 - Mar 16, 2026",
    totalHours: 38.0,
    status: "SUBMITTED",
    avatar: "A"
  },
  {
    id: "ts-3",
    employeeName: "Carlos Ruiz",
    role: "Project Manager",
    period: "Mar 10 - Mar 16, 2026",
    totalHours: 45.0,
    status: "APPROVED",
    avatar: "C"
  }
];

export default function TimesheetsPage() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            Timesheet Verification
          </h1>
          <p className="text-slate-400 mt-1">
            Review and approve weekly hours for payroll processing
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 w-64"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            Filters
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-bold text-slate-100">12</span>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Total Hours (Pending)</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-3xl font-bold text-slate-100">485.5</span>
        </div>
        <div className="p-6 rounded-xl border border-red-900/20 bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-200/70">Overtime Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-3xl font-bold text-red-100">3</span>
          <p className="text-xs text-red-400 mt-2 mt-4 flex gap-1"><AlertTriangle className="w-3 h-3" /> Exceeds 45h limit</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "pending" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
        >
          Requires Attention
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "approved" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
        >
          Approved
        </button>
      </div>

      {/* Timesheet List */}
      <div className="space-y-4">
        {mockTimesheets.filter(t => activeTab === 'pending' ? t.status === 'SUBMITTED' : t.status === 'APPROVED').map((sheet, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={sheet.id}
            className="flex items-center justify-between p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                {sheet.avatar}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">{sheet.employeeName}</h3>
                <span className="text-xs text-slate-500 block">{sheet.role}</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
               <span className="text-sm font-medium text-slate-300">{sheet.period}</span>
               <div className="flex items-center gap-2 mt-1">
                 <span className={`text-lg font-bold ${sheet.totalHours > 40 ? 'text-amber-400' : 'text-teal-400'}`}>
                   {sheet.totalHours}h
                 </span>
                 <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{sheet.status}</span>
               </div>
            </div>

            {sheet.status === "SUBMITTED" && (
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            
            {sheet.status === "APPROVED" && (
               <div className="px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                 <span className="text-sm font-semibold text-teal-400 flex items-center gap-1">
                   <CheckCircle2 className="w-4 h-4" /> Ready for Payroll
                 </span>
               </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
