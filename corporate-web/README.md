# VanguardiaCorp - Sitio Web Corporativo

Proyecto web corporativo totalmente independiente, desarrollado con [Next.js](https://nextjs.org/) (App Router), TypeScript y [Tailwind CSS](https://tailwindcss.com/).

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18.17+ o superior (recomendado 20+ o 22+)
- npm / pnpm / yarn

### Instalación de dependencias
```bash
npm install
```

### Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

### Compilación para Producción
```bash
npm run build
```

### Ejecutar en Producción
```bash
npm run start
```

### Linting y Verificación de Código
```bash
npm run lint
```

---

## 📁 Estructura del Proyecto

```text
corporate-web/
├── public/                # Archivos estáticos (imágenes, logos, favicons)
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css    # Estilos globales y Tailwind CSS v4
│   │   ├── layout.tsx     # Shell principal con SEO y metadatos corporativos
│   │   └── page.tsx       # Landing page corporativa modular
│   └── components/
│       ├── Navbar.tsx     # Menú superior y navegación responsive
│       ├── Hero.tsx       # Sección de impacto con propuesta de valor y CTAs
│       ├── Services.tsx   # Cuadrícula de capacidades y servicios corporativos
│       ├── About.tsx      # Identidad corporativa, pilares y métricas clave
│       ├── Contact.tsx    # Formulario interactivo e información de contacto
│       └── Footer.tsx     # Pie de página, avisos legales y enlaces
├── .env.example           # Plantilla de variables de entorno
├── next.config.ts         # Configuración de Next.js
├── package.json           # Dependencias y scripts independientes
├── tsconfig.json          # Configuración de TypeScript con alias @/*
└── README.md              # Documentación del proyecto
```

---

## 🛠️ Tecnologías Empleadas
- **Next.js 16** (App Router & Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (Iconografía moderna y optimizada)
