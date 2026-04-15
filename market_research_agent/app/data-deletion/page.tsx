import React from 'react';
import { Metadata } from 'next';
import { Shield, Trash2, Mail, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Solicitud de Eliminación de Datos | LegacyMark',
    description: 'Instrucciones oficiales para solicitar la eliminación de datos personales de la plataforma LegacyMark.',
};

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-20 text-center">
                    <div className="inline-flex items-center justify-center p-3 mb-6 bg-red-50 rounded-2xl">
                        <Shield className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                        Control de Privacidad y Datos
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        En cumplimiento con las normativas de Meta y GDPR, te proporcionamos el control total sobre tu información personal. Sigue los pasos a continuación para ejercer tu derecho al olvido.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="grid gap-12">

                    {/* Instruction Steps */}
                    <div className="space-y-8">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-gray-900">Proceso de Eliminación</h2>
                            <p className="text-gray-500">Completa estos pasos para eliminar tu cuenta y datos asociados.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow bg-white">
                                <CardContent className="p-8 text-center space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 font-bold text-xl">1</div>
                                    <h3 className="font-bold text-lg">Inicia la Solicitud</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Envía un correo electrónico oficial a nuestro equipo de privacidad y soporte técnico.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow bg-white">
                                <CardContent className="p-8 text-center space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 font-bold text-xl">2</div>
                                    <h3 className="font-bold text-lg">Validación</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Verificaremos tu identidad para asegurar que nadie más pueda borrar tus datos.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow bg-white">
                                <CardContent className="p-8 text-center space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 font-bold text-xl">3</div>
                                    <h3 className="font-bold text-lg">Borrado Seguro</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Tus datos serán eliminados permanentemente de todos nuestros servidores en 30 días.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                                <Mail className="w-5 h-5 text-gray-400" />
                                legacymarkcolombia@legacymarksas.com
                            </h3>
                            <p className="text-gray-500 text-sm max-w-md">
                                Haz clic en el botón para abrir tu cliente de correo con la plantilla de solicitud ya preparada.
                            </p>
                        </div>
                        <a
                            href="mailto:legacymarkcolombia@legacymarksas.com?subject=Solicitud de Eliminación de Datos de Usuario&body=Hola equipo de LegacyMark,%0D%0A%0D%0ASolicito formalmente la eliminación de mis datos personales y cuenta asociada a este correo electrónico.%0D%0A%0D%0AIdentificación de Usuario (si conoce): %0D%0A%0D%0AGracias."
                            className="w-full md:w-auto"
                        >
                            <Button size="lg" className="w-full bg-black hover:bg-gray-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all h-12 px-8 rounded-full">
                                <Trash2 className="w-4 h-4" />
                                Solicitar Eliminación
                            </Button>
                        </a>
                    </div>

                    {/* FAQ / Details */}
                    <div className="max-w-2xl mx-auto space-y-6 text-sm text-gray-500 border-t pt-10">
                        <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                            <Lock className="w-4 h-4" />
                            ¿Qué datos se eliminan?
                        </h4>
                        <ul className="space-y-2 list-disc pl-5">
                            <li>Información de perfil público (Nombre, Avatar).</li>
                            <li>Identificadores de usuario (IDs de Facebook/Instagram).</li>
                            <li>Historial de conversaciones y mensajes almacenados.</li>
                            <li>Tokens de acceso y credenciales de integración.</li>
                        </ul>
                        <p className="pt-4">
                            Recibirás un <strong>código de confirmación</strong> (Ticket ID) una vez que tu solicitud sea procesada para que puedas dar seguimiento al estado de la eliminación.
                        </p>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 bg-white">
                <p>© {new Date().getFullYear()} LegacyMark SAS. Cumplimiento normativo GDPR & Meta Platforms.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link href="/politica-privacidad" className="hover:text-gray-600 transition-colors">Política de Privacidad</Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-gray-600 transition-colors">Términos de Servicio</Link>
                </div>
            </footer>
        </div>
    );
}
