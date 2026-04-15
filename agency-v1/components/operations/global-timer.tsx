"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Clock, X, Briefcase, Plus, Loader2 } from "lucide-react";
import { logTimeEntry } from "@/actions/time-tracking";

export function GlobalTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [activeTask, setActiveTask] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedTime = localStorage.getItem("legacyTimerVal");
    const savedState = localStorage.getItem("legacyTimerState");
    const savedStart = localStorage.getItem("legacyTimerStart");
    
    if (savedTime) setTime(parseInt(savedTime, 10));
    if (savedState === "running" && savedStart) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
      setTime(prev => prev + elapsed);
      setIsRunning(true);
    }
  }, []);

  // Tick the timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => {
          localStorage.setItem("legacyTimerVal", (prev + 1).toString());
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const [isLogging, setIsLogging] = useState(false);

  const toggleTimer = async () => {
    if (isRunning) {
      setIsLogging(true);
      await logTimeEntry(time, activeTask || undefined);
      
      setIsRunning(false);
      setTime(0);
      setIsLogging(false);
      setIsOpen(false);
      
      localStorage.setItem("legacyTimerVal", "0");
      localStorage.setItem("legacyTimerState", "stopped");
      localStorage.removeItem("legacyTimerStart");
    } else {
      setIsRunning(true);
      setIsOpen(true);
      localStorage.setItem("legacyTimerState", "running");
      localStorage.setItem("legacyTimerStart", Date.now().toString());
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-semibold text-slate-200">Time Tracker</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              <div className="text-4xl font-mono font-bold text-slate-100 tracking-wider">
                {formatTime(time)}
              </div>

              {activeTask ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{activeTask}</span>
                  <button onClick={() => setActiveTask(null)} className="ml-1 text-slate-500 hover:text-red-400">
                     <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  Assign to Task
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-800/30 flex gap-2">
              <button
                onClick={toggleTimer}
                disabled={isLogging}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  isRunning 
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" 
                    : "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                } ${isLogging ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLogging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Logging...
                  </>
                ) : isRunning ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> Stop & Log
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Start Timer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl border transition-colors ${
            isRunning 
              ? "bg-slate-900 border-teal-500/50 text-teal-400" 
              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRunning ? (
             <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          ) : (
             <Clock className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-mono font-bold tracking-wider">
            {formatTime(time)}
          </span>
        </motion.button>
      )}
    </div>
  );
}
