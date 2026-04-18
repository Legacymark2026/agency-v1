"use client";

import dynamic from 'next/dynamic';

const Methodology = dynamic(() => import("@/components/sections/methodology").then(mod => ({ default: mod.Methodology })), { 
    loading: () => <div className="py-32 text-center text-slate-500">Cargando...</div>
});

const TestimonialSlider = dynamic(() => import("@/components/sections/testimonial-slider").then(mod => ({ default: mod.TestimonialSlider })), { 
    loading: () => <div className="py-32 text-center text-slate-500">Cargando...</div>
});

const FaqAccordion = dynamic(() => import("@/components/sections/faq-accordion").then(mod => ({ default: mod.FaqAccordion })), { 
    loading: () => <div className="py-32 text-center text-slate-500">Cargando...</div>
});

const CTA = dynamic(() => import("@/components/sections/cta").then(mod => ({ default: mod.CTA })), { 
    loading: () => <div className="py-32 text-center text-slate-500">Cargando...</div>
});

export function ContentSections() {
    return (
        <>
            <Methodology />
            <TestimonialSlider />
            <FaqAccordion />
            <CTA />
        </>
    );
}