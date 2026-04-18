"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NewProjectModal } from "@/components/operations/new-project-modal";
import { 
  Briefcase, 
  Users, 
  Clock, 
  Activity, 
  AlertTriangle,
  PlayCircle,
  GripVertical
} from "lucide-react";
import Link from "next/link";

interface OperationsDashboardClientProps {
  data: any; // We'll type this properly based on getOperationsDashboardData
}

export function OperationsDashboardClient({ data }: OperationsDashboardClientProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Destructure real data
  const { kpis, projects, attendance } = data || {};

  const kpiStats = [
    {
      label: "Active Projects",
      value: kpis?.activeProjects || 0,
      icon: Briefcase,
      trend: "Currently tracked",
      trendType: "neutral",
      color: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-400"
    },
    {
      label: "Avg Swimlane Velocity",
      value: kpis?.avgVelocity || 0,
      suffix: " tasks/day",
      icon: Activity,
      trend: "Steady pace",
      trendType: "positive",
      color: "from-teal-500/20 to-teal-500/5",
      iconColor: "text-teal-400"
    },
    {
      label: "Team Utilization",
      value: kpis?.teamUtilization || 0,
      suffix: "%",
      icon: Users,
      trend: "Optimal Range",
      trendType: "neutral",
      color: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-400"
    },
    {
      label: "Projects At Risk",
      value: kpis?.projectsAtRisk || 0,
      icon: AlertTriangle,
      trend: kpis?.projectsAtRisk > 0 ? "Needs Attention" : "All healthy",
      trendType: kpis?.projectsAtRisk > 0 ? "negative" : "positive",
      color: kpis?.projectsAtRisk > 0 ? "from-red-500/20 to-red-500/5" : "from-green-500/20 to-green-500/5",
      iconColor: kpis?.projectsAtRisk > 0 ? "text-red-400" : "text-green-400"
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            Operations Command Center
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time tracking of projects, resources, and velocity
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/admin/operations/kanban">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors text-slate-300">
               <GripVertical className="w-4 h-4 text-teal-400" />
               Go to Kanban
             </button>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            Global Timer
          </button>
          <button 
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-sm font-medium hover:bg-teal-500/20 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Primary KPIs Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-xl border border-slate-800 bg-gradient-to-br ${stat.color} backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium text-sm">{stat.label}</span>
              <span className={`p-2 rounded-lg bg-slate-900/50 ${stat.iconColor}`}>
                <stat.icon className="w-5 h-5" />
              </span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-100">{stat.value}</span>
              {stat.suffix && (
                <span className="text-sm font-medium text-slate-400">{stat.suffix}</span>
              )}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className={`
                ${stat.trendType === 'positive' ? 'text-teal-400' : ''}
                ${stat.trendType === 'negative' ? 'text-red-400' : ''}
                ${stat.trendType === 'neutral' ? 'text-slate-400' : ''}
              `}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Projects & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Active List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-200">Active Pipeline</h2>
            <Link href="/dashboard/admin/operations/kanban">
              <button className="text-sm text-teal-400 hover:text-teal-300 font-medium">View Board</button>
            </Link>
          </div>
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800/50 text-sm font-medium text-slate-400">
              <div className="col-span-5">Project Name</div>
              <div className="col-span-3">Health</div>
              <div className="col-span-2">Progress</div>
              <div className="col-span-2 text-right">Burn Rate</div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {projects && projects.length > 0 ? (
                projects.map((p: any) => (
                  <div key={p.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/20 transition-colors cursor-pointer">
                    <div className="col-span-5">
                      <p className="font-medium text-slate-200 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-1">ID: {p.id.split('-')[0]}</p>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                       <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                         p.healthScore >= 80 ? 'bg-teal-500/10 border-teal-500/20' : 
                         p.healthScore >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 
                         'bg-red-500/10 border-red-500/20'
                       }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${
                           p.healthScore >= 80 ? 'bg-teal-400' : 
                           p.healthScore >= 50 ? 'bg-amber-400' : 
                           'bg-red-400'
                         }`} />
                         <span className={`text-xs font-medium ${
                           p.healthScore >= 80 ? 'text-teal-400' : 
                           p.healthScore >= 50 ? 'text-amber-400' : 
                           'text-red-400'
                         }`}>
                           {p.healthScore >= 80 ? 'On Track' : p.healthScore >= 50 ? 'Monitor Check' : 'At Risk'}
                         </span>
                       </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-400">{p.progress}%</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium text-slate-300">
                      ${p.spentAmount?.toLocaleString() || '0'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                   No active projects found.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* HR / Attendance Quick View */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-200">Live Attendance</h2>
            <Link href="/dashboard/admin/operations/timesheets">
              <button className="text-sm text-teal-400 hover:text-teal-300 font-medium">Manage</button>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5 space-y-6">
            
            <div className={`flex items-center justify-between p-4 rounded-lg border ${attendance?.isClockedIn ? 'bg-teal-500/10 border-teal-500/20' : 'bg-slate-800/30 border-slate-800/50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <PlayCircle className={`w-5 h-5 ${attendance?.isClockedIn ? 'text-teal-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {attendance?.isClockedIn ? 'You are clocked in' : 'You are clocked out'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {attendance?.isClockedIn && attendance?.startTime ? `Started at ${new Date(attendance.startTime).toLocaleTimeString()}` : 'Ready for work'}
                  </p>
                </div>
              </div>
              {attendance?.isClockedIn ? (
                <button className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                  Clock Out
                </button>
              ) : (
                <button className="px-3 py-1.5 rounded-md bg-teal-500/10 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition-colors">
                  Clock In
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team Status</h3>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-slate-300">Active (Clocked In)</span>
                </div>
                <span className="font-medium text-slate-200">{attendance?.activeUsersCount || 0}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-slate-400">Offline</span>
                </div>
                <span className="font-medium text-slate-200">--</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      <NewProjectModal 
        isOpen={isNewProjectOpen} 
        onClose={() => setIsNewProjectOpen(false)} 
        onSuccess={() => {
           // Success logic automatically revalidates Path.
        }}
      />
    </div>
  );
}
