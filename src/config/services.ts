import {
  Globe,
  Code2,
  Server,
  Cloud,
  Search,
  Share2,
} from 'lucide-react'

export const SERVICES = [
  {
    icon: Globe,
    title: 'Desarrollo Web',
    description:
      'Sitios institucionales, landing pages, tiendas online y páginas comerciales optimizadas para captar clientes.',
    features: [
      'Landing pages',
      'Webs institucionales',
      'Tiendas online',
      'Diseño responsive',
      'Formularios',
      'WhatsApp integrado',
      'SEO inicial',
    ],
    color: 'from-brand-500 to-brand-600',
    glow: 'shadow-brand-500/20',
  },
  {
    icon: Code2,
    title: 'Software a Medida',
    description:
      'Sistemas web, paneles administrativos, dashboards e integraciones para digitalizar procesos y reducir trabajo manual.',
    features: [
      'Sistemas internos',
      'Paneles administrativos',
      'Dashboards',
      'APIs REST',
      'Automatizaciones',
      'Portales de clientes',
    ],
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/20',
  },
  {
    icon: Server,
    title: 'Hosting VPS Administrado',
    description:
      'Alojamiento profesional con configuración, seguridad, SSL, backups, monitoreo y soporte técnico incluido.',
    features: [
      'VPS administrado',
      'SSL gratuito',
      'Backups automáticos',
      'Correos corporativos',
      'Migraciones',
      'Monitoreo 24/7',
    ],
    color: 'from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: Cloud,
    title: 'Infraestructura AWS',
    description:
      'Soluciones cloud para empresas que necesitan escalabilidad, estabilidad y despliegues profesionales.',
    features: [
      'EC2 / ECS Fargate',
      'S3 y CloudFront',
      'RDS PostgreSQL',
      'Backups S3',
      'CI/CD automático',
      'Alta disponibilidad',
      'Seguridad cloud',
    ],
    color: 'from-orange-500 to-orange-600',
    glow: 'shadow-orange-500/20',
  },
  {
    icon: Search,
    title: 'SEO',
    description:
      'Optimización técnica, contenido y estructura para mejorar la visibilidad de tu negocio en Google.',
    features: [
      'SEO técnico',
      'Investigación de keywords',
      'Search Console',
      'Google Analytics',
      'Optimización de velocidad',
      'SEO local',
    ],
    color: 'from-accent-500 to-accent-600',
    glow: 'shadow-accent-500/20',
  },
  {
    icon: Share2,
    title: 'Redes Sociales',
    description:
      'Gestión de contenido, diseño de publicaciones y estrategia para mantener una presencia digital activa y profesional.',
    features: [
      'Instagram y Facebook',
      'LinkedIn',
      'Calendario mensual',
      'Diseño de piezas',
      'Copywriting',
      'Reportes de alcance',
    ],
    color: 'from-pink-500 to-pink-600',
    glow: 'shadow-pink-500/20',
  },
]
