import { 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Network, 
  Workflow, 
  Users2,
  ArrowUpRight 
} from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: BarChart3,
      title: "Consultoría Estratégica",
      description: "Diagnóstico profundo y formulación de planes directivos para acelerar el crecimiento, expandir mercados y maximizar la rentabilidad.",
    },
    {
      icon: Cpu,
      title: "Transformación Digital & Cloud",
      description: "Modernización integral de infraestructuras, migración a la nube e implementación de arquitecturas escalables y resilientes.",
    },
    {
      icon: Network,
      title: "Inteligencia de Datos & BI",
      description: "Consolidación de activos de información, analítica avanzada y dashboards ejecutivos para la toma de decisiones basada en evidencia.",
    },
    {
      icon: ShieldCheck,
      title: "Ciberseguridad & Compliance",
      description: "Protección rigurosa de activos críticos, gestión de riesgos corporativos y alineación con estándares internacionales (ISO, GDPR, SOC2).",
    },
    {
      icon: Workflow,
      title: "Automatización de Procesos",
      description: "Rediseño de flujos operativos y adopción de tecnologías de automatización para reducir costos y tiempos de respuesta.",
    },
    {
      icon: Users2,
      title: "Desarrollo del Talento & Liderazgo",
      description: "Capacitación directiva, gestión del cambio y programas a medida para alinear la cultura organizacional con los objetivos estratégicos.",
    },
  ];

  return (
    <section id="servicios" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            Nuestras Capacidades
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Soluciones Diseñadas para el Impacto Corporativo
          </p>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Acompañamos a su organización en cada fase de evolución con un enfoque multidisciplinario y orientado a resultados sostenibles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Conocer detalles</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
