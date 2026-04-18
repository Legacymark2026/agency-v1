"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Mail, MessageSquare, Clock } from "lucide-react";

export function ContactSection() {
    return (
        <section className="bg-white py-24 border-t border-gray-100" id="contacto">
            <div className="mx-auto max-w-7xl px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* Left Column: Form */}
                    <div>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl mb-4">¿Listo para escalar?</h2>
                            <p className="text-lg text-gray-500">
                                Agenda una auditoría gratuita o cuéntanos sobre tu proyecto. Respondemos en &lt; 2 horas.
                            </p>
                        </div>

                        <form className="space-y-6 bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-100">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-gray-900">Nombre</label>
                                    <Input id="name" placeholder="John Doe" className="bg-white border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-sm font-medium text-gray-900">Empresa</label>
                                    <Input id="company" placeholder="Acme Inc." className="bg-white border-gray-200" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-900">Email Corporativo</label>
                                <Input id="email" type="email" placeholder="john@company.com" className="bg-white border-gray-200" />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-gray-900">¿Cómo podemos ayudarte?</label>
                                <Textarea id="message" placeholder="Estamos buscando escalar nuestras campañas de PPC..." className="bg-white border-gray-200 min-h-[120px]" />
                            </div>

                            <Button size="lg" className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg">
                                Enviar Solicitud
                            </Button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                Al enviar este formulario aceptas nuestras Políticas de Privacidad.
                            </p>
                        </form>
                    </div>

                    {/* Right Column: Context */}
                    <div className="lg:pl-12 flex flex-col justify-center">
                        <div className="bg-blue-50 border border-blue-100 p-8 rounded-2xl mb-8">
                            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                                <MessageSquare className="mr-3" /> Chat Directo
                            </h3>
                            <p className="text-blue-800 mb-6">
                                ¿Prefieres hablar ahora mismo? Nuestro equipo de ventas está disponible.
                            </p>
                            <Button variant="outline" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                                Iniciar Chat en Vivo
                            </Button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h4 className="flex items-center text-lg font-bold text-gray-900 mb-2">
                                    <Clock className="mr-3 text-gray-400" size={20} /> Horario de Atención
                                </h4>
                                <p className="text-gray-600 pl-8">Lunes a Viernes: 9:00 AM - 6:00 PM EST</p>
                            </div>

                            <div>
                                <h4 className="flex items-center text-lg font-bold text-gray-900 mb-2">
                                    <Mail className="mr-3 text-gray-400" size={20} /> Email Directo
                                </h4>
                                <p className="text-gray-600">
                                    <a href="mailto:legacymarkcolombia@legacymarksas.com" aria-label="Enviar email a legacymarkcolombia@legacymarksas.com" className="hover:text-black transition-colors">
                                        legacymarkcolombia@legacymarksas.com
                                    </a>
                                </p>
                            </div>

                            <div>
                                <h4 className="flex items-center text-lg font-bold text-gray-900 mb-2">
                                    <MapPin className="mr-3 text-gray-400" size={20} /> Oficinas
                                </h4>
                                <p className="text-gray-600 pl-8">
                                    123 Innovation Drive,<br />Tech City, TC 94000
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
