/**
 * apps/web/lib/inbox/chatbot-flow-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Chatbot por Máquina de Estados (Bot Flow Execution Engine).
 *
 * Ejecuta árboles de decisión conversacionales 24/7 para calificar prospectos,
 * capturar información de contacto y enrutar hilos al agente correspondiente.
 */

export type FlowNodeId = 'START' | 'ASK_SERVICE' | 'ASK_EMAIL' | 'QUALIFIED_END' | 'FALLBACK_HUMAN';

export interface ChatbotState {
    currentStep: FlowNodeId;
    collectedData: {
        selectedService?: string;
        contactEmail?: string;
        prospectName?: string;
    };
    isCompleted: boolean;
}

export interface BotResponse {
    replyText: string;
    quickReplies?: string[];
    nextState: ChatbotState;
}

export function processChatbotStep(userMessage: string, currentState?: ChatbotState): BotResponse {
    const text = (userMessage || '').trim().toLowerCase();
    const state: ChatbotState = currentState || {
        currentStep: 'START',
        collectedData: {},
        isCompleted: false,
    };

    switch (state.currentStep) {
        case 'START':
            return {
                replyText: '¡Hola! Bienvenido a LegacyMark. ¿Qué servicio te interesa explorar hoy?',
                quickReplies: ['Desarrollo Web / App', 'Marketing & Ads', 'Consultoría CRM'],
                nextState: {
                    ...state,
                    currentStep: 'ASK_SERVICE',
                },
            };

        case 'ASK_SERVICE':
            return {
                replyText: `Excelente elección. Para enviarte la propuesta de ${userMessage}, por favor compártenos tu correo electrónico:`,
                nextState: {
                    ...state,
                    currentStep: 'ASK_EMAIL',
                    collectedData: { ...state.collectedData, selectedService: userMessage },
                },
            };

        case 'ASK_EMAIL':
            if (text.includes('@')) {
                return {
                    replyText: '¡Perfecto! Hemos registrado tus datos y un especialista asignado se pondrá en contacto contigo de inmediato.',
                    nextState: {
                        ...state,
                        currentStep: 'QUALIFIED_END',
                        collectedData: { ...state.collectedData, contactEmail: userMessage },
                        isCompleted: true,
                    },
                };
            } else {
                return {
                    replyText: 'Por favor ingresa un correo electrónico válido (ejemplo: nombre@empresa.com):',
                    nextState: state,
                };
            }

        case 'QUALIFIED_END':
        default:
            return {
                replyText: 'Un agente humano continuará la conversación contigo.',
                nextState: {
                    ...state,
                    currentStep: 'FALLBACK_HUMAN',
                    isCompleted: true,
                },
            };
    }
}
