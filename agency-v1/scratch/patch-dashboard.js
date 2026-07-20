const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../apps/coffee-web/components/sections/UserDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replacement 1: Imports
const importTarget = `import { getSubscriptionAction, updateSubscriptionAction } from "@/actions/subscription";`;
const importReplacement = `import { getSubscriptionAction, updateSubscriptionAction } from "@/actions/subscription";\nimport { getQuestsAction, completeQuestAction } from "@/actions/quests";`;
content = content.replace(importTarget, importReplacement);

// Replacement 2: States
const stateTarget = `  // Global User Info\n  const [user, setUser] = useState<{ id: string; name: string; email: string; points: number; registeredAt: string } | null>(null);\n  const [sub, setSub] = useState<{ beans: string; frequency: string; status: string; nextDelivery: string } | null>(null);\n  const [ordersList, setOrdersList] = useState<any[]>([]);`;
const stateReplacement = `  // Global User Info\n  const [user, setUser] = useState<{ id: string; name: string; email: string; points: number; registeredAt: string } | null>(null);\n  const [sub, setSub] = useState<{ beans: string; frequency: string; status: string; nextDelivery: string } | null>(null);\n  const [ordersList, setOrdersList] = useState<any[]>([]);\n\n  // Quests & Gamification State\n  const [questsList, setQuestsList] = useState<any[]>([]);\n  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);\n\n  // Extraction Timer State\n  const [timerActive, setTimerActive] = useState(false);\n  const [timerStep, setTimerStep] = useState(0); // 0: Idle, 1: Bloom, 2: Pour 1, 3: Pour 2, 4: Finished\n  const [secondsLeft, setSecondsLeft] = useState(30);\n  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);\n\n  // Subscription delivery calendar simulation\n  const [calendarDeliveries, setCalendarDeliveries] = useState<any[]>([\n    { id: 1, date: "15/Jun/2026", status: "scheduled" },\n    { id: 2, date: "15/Jul/2026", status: "scheduled" },\n    { id: 3, date: "15/Ago/2026", status: "scheduled" },\n  ]);`;
content = content.replace(stateTarget, stateReplacement);

// Replacement 3: useEffect Load Data
const loadTarget = `      // Consumo\n      getMonthlyConsumptionAction().then(setMonthlyStats);\n\n      // Catalogo de Premios real\n      getRewardsCatalogAction().then(setRewardsCatalog);`;
const loadReplacement = `      // Consumo\n      getMonthlyConsumptionAction().then(setMonthlyStats);\n\n      // Catalogo de Premios real\n      getRewardsCatalogAction().then(setRewardsCatalog);\n\n      // Cargar misiones\n      getQuestsAction().then(setQuestsList);`;
content = content.replace(loadTarget, loadReplacement);

// Replacement 4: Helper functions
const helperTarget = `  const updateSubFrequency = async (freq: string) => {\n    if (!sub) return;\n    const res = await updateSubscriptionAction(sub.beans, freq, sub.status);\n    if (res && res.subscription) {\n      setSub(res.subscription);\n    } else if (res && res.error) {\n      alert(res.error);\n    }\n  };`;
const helperReplacement = `  const updateSubFrequency = async (freq: string) => {\n    if (!sub) return;\n    const res = await updateSubscriptionAction(sub.beans, freq, sub.status);\n    if (res && res.subscription) {\n      setSub(res.subscription);\n    } else if (res && res.error) {\n      alert(res.error);\n    }\n  };\n\n  // Quests & Gamification Claim handler\n  const handleClaimQuest = async (questId: string) => {\n    setClaimingQuest(questId);\n    const res = await completeQuestAction(questId);\n    setClaimingQuest(null);\n    if (res.error) {\n      alert(res.error);\n    } else {\n      alert("¡Misión completada con éxito y puntos sumados!");\n      getQuestsAction().then(setQuestsList);\n      \n      // Actualizar balance de puntos en la UI\n      const me = await getMeAction();\n      if (me && user) {\n        setUser(prev => prev ? { ...prev, points: me.points } : null);\n      }\n      \n      const ptsData = await getPointsHistoryAction();\n      if (ptsData) {\n        setPointsTier(ptsData.tier);\n        setPointsHistory(ptsData.history);\n      }\n    }\n  };\n\n  // Web Audio API beep sound generator\n  const playBeep = (freq = 800, duration = 0.15) => {\n    try {\n      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n      const osc = audioCtx.createOscillator();\n      const gain = audioCtx.createGain();\n      osc.type = "sine";\n      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);\n      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);\n      osc.connect(gain);\n      gain.connect(audioCtx.destination);\n      osc.start();\n      osc.stop(audioCtx.currentTime + duration);\n    } catch (e) {\n      console.warn("Web Audio API error:", e);\n    }\n  };\n\n  // Timer logic handlers\n  useEffect(() => {\n    if (timerActive) {\n      timerIntervalRef.current = setInterval(() => {\n        setSecondsLeft((prev) => {\n          if (prev <= 1) {\n            playBeep(900, 0.45); // Alert sound on step complete\n            // Next step transition\n            if (timerStep < 3) {\n              setTimerStep(timerStep + 1);\n              // reset time for next step\n              return 60; // 60s for pour 1 & pour 2\n            } else {\n              // Timer finished\n              setTimerActive(false);\n              setTimerStep(4); // completed\n              // Trigger Quest complete!\n              completeQuestAction("perfect-cup").then((res) => {\n                if (res.success) {\n                  alert("¡Misión 'La Taza Perfecta' completada! Ganaste 100 Golden Points.");\n                  // Reload quests and points\n                  getQuestsAction().then(setQuestsList);\n                  getMeAction().then((me) => {\n                    if (me && user) setUser(prev => prev ? { ...prev, points: me.points } : null);\n                  });\n                  getPointsHistoryAction().then((ptsData) => {\n                    if (ptsData) {\n                      setPointsTier(ptsData.tier);\n                      setPointsHistory(ptsData.history);\n                    }\n                  });\n                }\n              });\n              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);\n              return 0;\n            }account\n          }\n          if (prev <= 4) {\n            playBeep(650, 0.1); // Warning beep on last 3 seconds\n          }\n          return prev - 1;\n        });\n      }, 1000);\n    } else {\n      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);\n    }\n\n    return () => {\n      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);\n    };\n  }, [timerActive, timerStep]);\n\n  const handleStartTimer = () => {\n    setTimerStep(1);\n    setSecondsLeft(30); // 30s bloom\n    setTimerActive(true);\n    playBeep(800, 0.2);\n  };\n\n  const handlePauseTimer = () => {\n    setTimerActive(false);\n    playBeep(600, 0.1);\n  };\n\n  const handleResumeTimer = () => {\n    setTimerActive(true);\n    playBeep(800, 0.2);\n  };\n\n  const handleResetTimer = () => {\n    setTimerActive(false);\n    setTimerStep(0);\n    setSecondsLeft(30);\n    playBeep(500, 0.15);\n  };\n\n  // Calendar action helpers\n  const handleToggleDeliveryStatus = (deliveryId: number) => {\n    setCalendarDeliveries(prev => prev.map(d => {\n      if (d.id === deliveryId) {\n        const newStatus = d.status === "scheduled" ? "paused" : "scheduled";\n        return { ...d, status: newStatus };\n      }\n      return d;\n    }));\n  };\n\n  const handleSpeedUpDelivery = (deliveryId: number, date: string) => {\n    alert(\`¡Envío del \${date} adelantado con éxito! Se despachará mañana mismo.\`);\n    setCalendarDeliveries(prev => prev.map(d => {\n      if (d.id === deliveryId) {\n        return { ...d, date: "Mañana mismo", status: "scheduled" };\n      }\n      return d;\n    }));\n  };`;

// Clean up typo: 'return 0; }account'
const fixedHelperReplacement = helperReplacement.replace('return 0; }account', 'return 0;');
content = content.replace(helperTarget, fixedHelperReplacement);

// Replacement 5: Subscription Tab
const subTabTarget = `        {/* 3. SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("sub_title")}
            </h3>

            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Preferred Beans selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-2 font-medium">
                    {t("sub_beans")}
                  </span>
                  <select
                    value={sub.beans}
                    onChange={(e) => updateSubBeans(e.target.value)}
                    className="w-full bg-black border border-aluminum/10 focus:border-amber/50 rounded-xl px-4 py-3 text-sm font-quattrocento text-aluminum focus:outline-none cursor-pointer transition-all"
                  >
                    <option value="signature-blend">Goldneez Signature Blend</option>
                    <option value="ethiopia-yirgacheffe">Ethiopia Yirgacheffe</option>
                    <option value="colombia-huila">Colombia Huila Supremo</option>
                    <option value="brasil-cerrado">Brasil Cerrado Mineiro</option>
                    <option value="panama-geisha">Panama Geisha Reserve</option>
                  </select>
                </div>

                {/* Frequency selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-2 font-medium">
                    {t("sub_frequency")}
                  </span>
                  <div className="flex gap-2">
                    {[
                      { val: "15", label: t("sub_frequency_15") },
                      { val: "30", label: t("sub_frequency_30") }
                    ].map((freq) => (
                      <button
                        key={freq.val}
                        onClick={() => updateSubFrequency(freq.val)}
                        className={\`flex-1 py-3 px-4 rounded-xl text-xs font-quattrocento border transition-all cursor-pointer \${
                          sub.frequency === freq.val
                            ? "bg-amber border-amber text-black font-bold shadow-md"
                            : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                        }\`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Status and dates display */}
              <div className="border-t border-aluminum/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                    {t("sub_next_delivery")}
                  </span>
                  <span className="font-cinzel text-aluminum text-sm font-bold">
                    {sub.nextDelivery}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                      {t("sub_status")}
                    </span>
                    <span className={\`font-cinzel text-xs font-bold uppercase \${
                      sub.status === "active" ? "text-green-500" : "text-red-400"
                    }\`}>
                      {sub.status === "active" ? t("sub_status_active") : t("sub_status_paused")}
                    </span>
                  </div>

                  <button
                    onClick={toggleSubscription}
                    className={\`px-4 py-2.5 rounded-xl text-xs font-quattrocento uppercase tracking-wider font-bold transition-all cursor-pointer border \${
                      sub.status === "active"
                        ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500"
                        : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500"
                    }\`}
                  >
                    {sub.status === "active" ? t("sub_btn_pause") : t("sub_btn_resume")}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}`;

const subTabReplacement = `        {/* 3. SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("sub_title")}
            </h3>

            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Preferred Beans selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-3 font-medium">
                    Granos Seleccionados (Multi-selección)
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-aluminum/10 p-3 rounded-2xl max-h-[160px] overflow-y-auto">
                    {[
                      { id: "signature-blend", name: "Signature Blend" },
                      { id: "ethiopia-yirgacheffe", name: "Ethiopia Yirgacheffe" },
                      { id: "colombia-huila", name: "Colombia Huila" },
                      { id: "brasil-cerrado", name: "Brasil Cerrado" },
                      { id: "panama-geisha", name: "Panama Geisha" },
                      { id: "kenya-aa", name: "Kenya AA" },
                      { id: "costa-rica", name: "Costa Rica Honey" },
                      { id: "sumatra-mandheling", name: "Sumatra Mandheling" }
                    ].map((coffee) => {
                      const selectedBeansList = sub.beans.split(",");
                      const isSelected = selectedBeansList.includes(coffee.id);
                      
                      const handleToggleBean = () => {
                        let newList;
                        if (isSelected) {
                          newList = selectedBeansList.filter(id => id !== coffee.id);
                        } else {
                          newList = [...selectedBeansList, coffee.id];
                        }
                        if (newList.length === 0) newList = ["signature-blend"]; // fallback
                        updateSubBeans(newList.join(","));
                      };

                      return (
                        <button
                          key={coffee.id}
                          onClick={handleToggleBean}
                          className={\`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-quattrocento border transition-all cursor-pointer text-left \${
                            isSelected 
                              ? "bg-amber/15 border-amber text-amber font-bold" 
                              : "border-aluminum/5 bg-black/20 text-aluminum-dark hover:border-aluminum/20"
                          }\`}
                        >
                          <div className={\`w-3.5 h-3.5 rounded border flex items-center justify-center \${
                            isSelected ? "bg-amber border-amber text-black" : "border-aluminum/30"
                          }\`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="truncate">{coffee.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frequency selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-2 font-medium">
                    {t("sub_frequency")}
                  </span>
                  <div className="flex gap-2">
                    {[
                      { val: "15", label: t("sub_frequency_15") },
                      { val: "30", label: t("sub_frequency_30") }
                    ].map((freq) => (
                      <button
                        key={freq.val}
                        onClick={() => updateSubFrequency(freq.val)}
                        className={\`flex-1 py-3 px-4 rounded-xl text-xs font-quattrocento border transition-all cursor-pointer \${
                          sub.frequency === freq.val
                            ? "bg-amber border-amber text-black font-bold shadow-md"
                            : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                        }\`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Status and dates display */}
              <div className="border-t border-aluminum/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                    {t("sub_next_delivery")}
                  </span>
                  <span className="font-cinzel text-aluminum text-sm font-bold">
                    {sub.nextDelivery}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                      {t("sub_status")}
                    </span>
                    <span className={\`font-cinzel text-xs font-bold uppercase \${
                      sub.status === "active" ? "text-green-500" : "text-red-400"
                    }\`}>
                      {sub.status === "active" ? t("sub_status_active") : t("sub_status_paused")}
                    </span>
                  </div>

                  <button
                    onClick={toggleSubscription}
                    className={\`px-4 py-2.5 rounded-xl text-xs font-quattrocento uppercase tracking-wider font-bold transition-all cursor-pointer border \${
                      sub.status === "active"
                        ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500"
                        : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500"
                    }\`}
                  >
                    {sub.status === "active" ? t("sub_btn_pause") : t("sub_btn_resume")}
                  </button>
                </div>
              </div>

              {/* Delivery Calendar Module */}
              <div className="border-t border-aluminum/10 pt-6 mt-6">
                <h4 className="font-cinzel text-aluminum text-sm font-bold mb-4 tracking-wide uppercase">
                  Calendario de Despachos Programados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {calendarDeliveries.map((del) => (
                    <div 
                      key={del.id}
                      className={\`border border-aluminum/10 bg-black/40 rounded-2xl p-4 flex flex-col justify-between gap-3 \${
                        del.status === "paused" ? "opacity-60" : ""
                      }\`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-cinzel text-xs text-aluminum font-bold">
                          Envío #\${del.id}
                        </span>
                        <span className={\`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded uppercase \${
                          del.status === "scheduled" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }\`}>
                          \${del.status === "scheduled" ? "Programado" : "Pausado"}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark block">Fecha estimada</span>
                        <span className="font-cinzel text-amber text-sm font-bold block mt-0.5">
                          \${del.date}
                        </span>
                      </div>

                      <div className="flex gap-2 border-t border-aluminum/5 pt-3">
                        <button
                          onClick={() => handleToggleDeliveryStatus(del.id)}
                          className="flex-1 py-1.5 border border-aluminum/10 hover:border-amber/20 hover:text-amber font-quattrocento text-[10px] rounded-lg cursor-pointer transition-all"
                        >
                          \${del.status === "scheduled" ? "Pausar" : "Reactivar"}
                        </button>
                        {\`\${del.status === "scheduled" && del.date !== "Mañana mismo" ? \`
                          <button
                            onClick={() => handleSpeedUpDelivery(del.id, del.date)}
                            className="flex-1 py-1.5 bg-amber/10 border border-amber/20 hover:bg-amber hover:text-black font-quattrocento text-[10px] text-amber rounded-lg cursor-pointer transition-all"
                          >
                            Adelantar
                          </button>
                        \` : ''}\`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}`;
content = content.replace(subTabTarget, subTabReplacement);

// Replacement 6: Rewards Tab
const rewardsTabTarget = `            {/* Points balance display */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-amber/15 bg-amber/5 rounded-3xl gap-4">
              <div>
                <span className="font-quattrocento text-[10px] uppercase text-aluminum-dark tracking-widest font-bold">Balance de Puntos</span>
                <span className="font-cinzel text-amber text-3xl font-bold block mt-1">{user.points} Puntos</span>
              </div>
              <div className="flex gap-2">
                <span className="font-quattrocento text-xs text-aluminum-dark font-medium">Categoría actual:</span>
                <span className="font-cinzel text-amber text-xs font-bold uppercase">{pointsTier}</span>
              </div>
            </div>

            {/* Rewards grid */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Catálogo de Premios</h4>`;

const rewardsTabReplacement = `            {/* Points balance display */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-amber/15 bg-amber/5 rounded-3xl gap-4">
              <div>
                <span className="font-quattrocento text-[10px] uppercase text-aluminum-dark tracking-widest font-bold">Balance de Puntos</span>
                <span className="font-cinzel text-amber text-3xl font-bold block mt-1">{user.points} Puntos</span>
              </div>
              <div className="flex gap-2">
                <span className="font-quattrocento text-xs text-aluminum-dark font-medium">Categoría actual:</span>
                <span className="font-cinzel text-amber text-xs font-bold uppercase">{pointsTier}</span>
              </div>
            </div>

            {/* Barista Quests System */}
            <div className="border-b border-aluminum/5 pb-8">
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase flex items-center gap-2">
                <Sparkles size={18} className="text-amber animate-spin-slow" />
                Misiones de Barista
              </h4>
              <p className="font-quattrocento text-xs text-aluminum-dark mb-4">
                Realiza actividades especiales para ganar Golden Points extra y mejorar tu rango.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questsList.map((quest) => (
                  <div 
                    key={quest.id}
                    className={\`border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 \${
                      quest.completed 
                        ? "bg-green-500/5 border-green-500/20" 
                        : quest.isClaimable
                        ? "bg-amber/5 border-amber/30 animate-pulse-slow"
                        : "bg-black/20 border-aluminum/10"
                    }\`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h5 className="font-cinzel text-xs font-bold text-aluminum flex items-center gap-1.5 font-bold">
                          {quest.completed && <CheckCircle size={14} className="text-green-500" />}
                          {quest.title}
                        </h5>
                        <span className={\`font-cinzel text-[10px] font-bold px-2 py-0.5 rounded \${
                          quest.completed ? "bg-green-500/10 text-green-400" : "bg-amber/10 text-amber"
                        }\`}>
                          +{quest.points} Pts
                        </span>
                      </div>
                      <p className="font-quattrocento text-[11px] text-aluminum-dark mt-1.5 leading-relaxed">
                        {quest.description}
                      </p>
                      {quest.progressText && (
                        <span className="font-quattrocento text-[10px] text-amber/80 font-bold block mt-2">
                          Progreso: {quest.progressText}
                        </span>
                      )}
                    </div>

                    <div>
                      {quest.completed ? (
                        <span className="w-full py-2 bg-green-500/10 text-green-400 font-quattrocento text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1">
                          Completada ✓
                        </span>
                      ) : quest.isClaimable ? (
                        <button
                          onClick={() => handleClaimQuest(quest.id)}
                          disabled={claimingQuest === quest.id}
                          className="w-full py-2 bg-amber text-black hover:bg-amber-light font-quattrocento text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md font-bold"
                        >
                          <Award size={12} />
                          {claimingQuest === quest.id ? "Reclamando..." : "Reclamar Recompensa"}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (quest.id === "perfect-cup") {
                              setActiveTab("education");
                            } else if (quest.id === "coffee-critic") {
                              setActiveTab("orders");
                            } else if (quest.id === "social-barista") {
                              setActiveTab("referrals");
                            } else {
                              router.push("/productos");
                            }
                          }}
                          className="w-full py-2 border border-aluminum/10 bg-black/40 hover:border-amber/20 hover:text-amber font-quattrocento text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                        >
                          {quest.id === "perfect-cup" ? "Ir al Temporizador" : quest.id === "coffee-critic" ? "Ir a mis Pedidos" : quest.id === "social-barista" ? "Ver código" : "Ir a la tienda"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards grid */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Catálogo de Premios</h4>`;
content = content.replace(rewardsTabTarget, rewardsTabReplacement);

// Replacement 7: Education Tab
const eduTabTarget = `              {selectedGuide === "chemex" && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-cinzel text-aluminum font-bold text-base">Elegancia y Claridad con Chemex</h4>
                  <div className="grid grid-cols-3 gap-4 border-y border-aluminum/5 py-4 my-2">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Proporción (Ratio)</span>
                      <span className="font-cinzel text-amber text-sm font-bold">1:15 (30g café por 450g agua)</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Temperatura</span>
                      <span className="font-cinzel text-amber text-sm font-bold">92°C - 94°C</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Molienda</span>
                      <span className="font-cinzel text-amber text-sm font-bold">Media-Gruesa (Arena gruesa)</span>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside font-quattrocento text-xs text-aluminum-dark flex flex-col gap-2.5 mt-2 leading-relaxed">
                    <li>Coloca el filtro Chemex de triple capa de forma que el pliegue triple quede del lado de la boquilla de vertido. Enjuaga con agua caliente.</li>
                    <li>Agrega el café molido medio-grueso (30g) y nivela.</li>
                    <li>**Preinfusión:** Agrega 60g de agua y espera 45 segundos para liberar los gases atrapados.</li>
                    <li>Vierte en círculos concéntricos lentos. Realiza vertidos de 100g progresivos hasta llegar a 450g de agua.</li>
                    <li>Deja gotear completamente. La molienda gruesa y el papel grueso darán una taza limpia de aceites.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Coffee Articles */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Artículos del Barista</h4>`;

const eduTabReplacement = `              {selectedGuide === "chemex" && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-cinzel text-aluminum font-bold text-base">Elegancia y Claridad con Chemex</h4>
                  <div className="grid grid-cols-3 gap-4 border-y border-aluminum/5 py-4 my-2">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Proporción (Ratio)</span>
                      <span className="font-cinzel text-amber text-sm font-bold">1:15 (30g café por 450g agua)</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Temperatura</span>
                      <span className="font-cinzel text-amber text-sm font-bold">92°C - 94°C</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Molienda</span>
                      <span className="font-cinzel text-amber text-sm font-bold">Media-Gruesa (Arena gruesa)</span>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside font-quattrocento text-xs text-aluminum-dark flex flex-col gap-2.5 mt-2 leading-relaxed">
                    <li>Coloca el filtro Chemex de triple capa de forma que el pliegue triple quede del lado de la boquilla de vertido. Enjuaga con agua caliente.</li>
                    <li>Agrega el café molido medio-grueso (30g) and nivela.</li>
                    <li>**Preinfusión:** Agrega 60g de agua y espera 45 segundos para liberar los gases atrapados.</li>
                    <li>Vierte en círculos concéntricos lentos. Realiza vertidos de 100g progresivos hasta llegar a 450g de agua.</li>
                    <li>Deja gotear completamente. La molienda gruesa y el papel grueso darán una taza limpia de aceites.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Extraction Timer Module */}
            <div className="border border-amber/15 bg-gradient-to-r from-amber/5 to-transparent rounded-2xl p-6 flex flex-col gap-5 mt-6">
              <div>
                <h4 className="font-cinzel text-amber text-base font-bold tracking-wide flex items-center gap-2">
                  <Clock size={18} className={timerActive ? "animate-pulse text-amber" : "text-amber"} />
                  Asistente de Extracción Interactivo
                </h4>
                <p className="font-quattrocento text-xs text-aluminum-dark mt-0.5">
                  Completa tu preparación usando el temporizador paso a paso para extraer los mejores sabores y completar tu misión.
                </p>
              </div>

              {timerStep === 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 border border-aluminum/10 p-4 rounded-xl">
                  <div>
                    <span className="font-cinzel text-xs text-aluminum font-bold uppercase block">Receta: {selectedGuide === "v60" ? "Filtro V60" : selectedGuide === "french" ? "Prensa Francesa" : "Chemex"}</span>
                    <span className="font-quattrocento text-[10px] text-aluminum-dark mt-0.5 block">Tiempo total: {selectedGuide === "french" ? "4:00 min" : "2:30 min"}</span>
                  </div>
                  <button
                    onClick={handleStartTimer}
                    className="bg-amber hover:bg-amber-light text-black font-quattrocento text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md font-bold"
                  >
                    Iniciar Extracción
                  </button>
                </div>
              ) : (
                <div className="bg-black/40 border border-aluminum/10 rounded-xl p-5 flex flex-col gap-4 animate-fadeIn">
                  
                  {/* Step Indicators */}
                  <div className="flex justify-between items-center pb-3 border-b border-aluminum/5">
                    <span className="font-cinzel text-[10px] text-amber tracking-widest uppercase font-bold">
                      {timerStep === 4 ? "¡Extracción Finalizada!" : \`Paso \${timerStep} de \${selectedGuide === "french" ? 1 : 3}\`}
                    </span>
                    {timerStep < 4 && (
                      <span className="font-mono text-lg text-amber font-bold">
                        {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="min-h-[60px] flex flex-col gap-1">
                    <h5 className="font-cinzel text-sm text-aluminum font-bold font-bold">
                      {selectedGuide === "french" ? (
                        timerStep === 1 ? "Infusión Total" : "¡Listo!"
                      ) : (
                        timerStep === 1 ? "Pre-infusión (Bloom)" : timerStep === 2 ? "Primer Vertido" : timerStep === 3 ? "Segundo Vertido" : "¡Listo!"
                      )}
                    </h5>
                    <p className="font-quattrocento text-xs text-aluminum-dark leading-relaxed">
                      {selectedGuide === "french" ? (
                        timerStep === 1 ? "Vierte los 320g de agua caliente, coloca la tapa y deja reposar 4 minutos." : "Rompe la costra superficial, baja el émbolo lentamente y sirve."
                      ) : (
                        timerStep === 1 ? "Vierte 40-50g de agua caliente y deja reposar para liberar gases (floración)." : timerStep === 2 ? "Vierte suavemente en espiral concéntrica hasta llegar a 150g de agua." : timerStep === 3 ? "Vierte de manera constante hasta llegar a los 225-250g finales." : "Filtro completado. Sirve en tu taza favorita y disfruta de tus recuerdos dorados."
                      )}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {timerStep < 4 && (
                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-aluminum/5 relative">
                      <div 
                        className="bg-amber h-full transition-all duration-1000"
                        style={{ 
                          width: \`\${((timerStep === 1 ? 30 - secondsLeft : 60 - secondsLeft) / (timerStep === 1 ? 30 : 60)) * 100}%\` 
                        }}
                      />
                    </div>
                  )}

                  {/* Timer Controls */}
                  <div className="flex gap-3 justify-end pt-2 border-t border-aluminum/5">
                    {timerStep < 4 ? (
                      <>
                        <button
                          onClick={handleResetTimer}
                          className="px-4 py-2 border border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500 font-quattrocento text-xs rounded-xl cursor-pointer transition-all"
                        >
                          Cancelar
                        </button>
                        {timerActive ? (
                          <button
                            onClick={handlePauseTimer}
                            className="px-4 py-2 border border-aluminum/15 hover:border-amber/20 text-aluminum hover:text-amber font-quattrocento text-xs rounded-xl cursor-pointer transition-all"
                          >
                            Pausar
                          </button>
                        ) : (
                          <button
                            onClick={handleResumeTimer}
                            className="px-4 py-2 bg-amber text-black font-quattrocento text-xs font-bold rounded-xl cursor-pointer transition-all font-bold"
                          >
                            Continuar
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleResetTimer}
                        className="px-5 py-2.5 bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all font-bold"
                      >
                        Preparar Otro Café
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Coffee Articles */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Artículos del Barista</h4>`;
content = content.replace(eduTabTarget, eduTabReplacement);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('UserDashboard.tsx patched successfully!');
