import type { Translations } from './es'

export const en: Translations = {
  nav: {
    home: 'Home',
    services: 'Services',
    plans: 'Plans',
    process: 'Process',
    tech: 'Technology',
    faq: 'FAQ',
    contact: 'Contact',
    cta: 'Request diagnosis',
  },
  hero: {
    badge: 'End-to-end digital solutions for businesses',
    title1: 'Complete digital ',
    titleHighlight: 'solutions',
    title2: ' for businesses and companies',
    subtitle:
      'We build websites, custom software, managed VPS hosting, AWS infrastructure, SEO and social media management so your business has a ',
    subtitleBold: 'professional, secure and scalable digital presence.',
    ctaPrimary: 'Request free diagnosis',
    ctaSecondary: 'View services',
    badges: [
      'Fast & responsive websites',
      'Managed VPS hosting',
      'AWS infrastructure',
      'SEO & digital growth',
      'Ongoing support',
    ],
    dashboardLabel: 'inspyra.cloud — control panel',
    metrics: [
      { label: 'Websites launched', value: '100+' },
      { label: 'Average uptime', value: '99.9%' },
      { label: 'Active clients', value: '50+' },
    ],
    statusItems: [
      { label: 'Control Plane', status: 'Online' },
      { label: 'VPS Hosting', status: 'Online' },
      { label: 'AWS CDN', status: 'Online' },
      { label: 'SEO Monitor', status: 'Online' },
    ],
  },
  problem: {
    eyebrow: 'Why choose us?',
    title1: 'Your business needs more than ',
    titleHighlight: 'a pretty page',
    subtitle:
      'Many businesses have a website that doesn\'t sell, doesn\'t rank, loads slowly and has no maintenance. Disconnected vendors create chaos.',
    problemsLabel: 'The usual problem',
    solutionsLabel: 'What we do instead',
    problems: [
      'A website that doesn\'t sell or rank on Google',
      'Slow load times and poor mobile experience',
      'No maintenance or updates',
      'Depends on multiple disconnected vendors',
      'No security, no backups, no monitoring',
    ],
    solutions: [
      'Design and development focused on conversion',
      'Optimized and fast VPS hosting',
      'Security, backups and monitoring included',
      'Technical SEO and Google ranking',
      'Professionally managed social media',
      'Maintenance, support and continuous improvements',
    ],
    statement1: 'One single solution to ',
    statementBold: 'build, host, protect and grow',
    statement2: ' your digital presence.',
  },
  services: {
    eyebrow: 'Services',
    title1: 'Everything your business ',
    titleHighlight: 'needs online',
    subtitle:
      'From design to infrastructure. We develop, publish, protect and grow your digital presence.',
    bottomText: 'Can\'t find what you need? Tell us about your project and we\'ll solve it.',
    cta: 'Request free diagnosis',
    items: [
      {
        title: 'Web Development',
        description:
          'Institutional sites, landing pages, online stores and commercial pages optimized to attract clients.',
        features: [
          'Landing pages',
          'Institutional websites',
          'Online stores',
          'Responsive design',
          'Contact forms',
          'WhatsApp integration',
          'Basic SEO',
        ],
      },
      {
        title: 'Custom Software',
        description:
          'Web systems, admin panels, dashboards and integrations to digitize processes and reduce manual work.',
        features: [
          'Internal systems',
          'Admin panels',
          'Dashboards',
          'REST APIs',
          'Automations',
          'Client portals',
        ],
      },
      {
        title: 'Managed VPS Hosting',
        description:
          'Professional hosting with configuration, security, SSL, backups, monitoring and technical support included.',
        features: [
          'Managed VPS',
          'Free SSL',
          'Automatic backups',
          'Corporate emails',
          'Migrations',
          '24/7 monitoring',
        ],
      },
      {
        title: 'AWS Infrastructure',
        description:
          'Cloud solutions for companies that need scalability, stability and professional deployments.',
        features: [
          'EC2 / ECS Fargate',
          'S3 & CloudFront',
          'RDS PostgreSQL',
          'S3 backups',
          'Automated CI/CD',
          'High availability',
          'Cloud security',
        ],
      },
      {
        title: 'SEO',
        description:
          'Technical optimization, content and structure to improve your business visibility on Google.',
        features: [
          'Technical SEO',
          'Keyword research',
          'Search Console',
          'Google Analytics',
          'Speed optimization',
          'Local SEO',
        ],
      },
      {
        title: 'Social Media',
        description:
          'Content management, post design and strategy to maintain an active and professional digital presence.',
        features: [
          'Instagram & Facebook',
          'LinkedIn',
          'Monthly calendar',
          'Graphic design',
          'Copywriting',
          'Reach reports',
        ],
      },
    ],
  },
  differentiator: {
    eyebrow: 'Our difference',
    title1: 'All your digital needs, ',
    titleHighlight: 'one team',
    subtitle:
      'We\'re not an agency that delivers and disappears. We\'re the permanent technical team for your digital business.',
    traditionalLabel: 'Traditional agency',
    inspyraLabel: 'INSPYRA Digital',
    traditional: [
      'Only designs the website',
      'Doesn\'t manage servers',
      'Doesn\'t maintain infrastructure',
      'Doesn\'t do technical SEO',
      'No ongoing support',
      'Delivers and disappears',
    ],
    inspyra: [
      'We design and develop',
      'We manage VPS hosting',
      'We implement AWS infrastructure',
      'We optimize technical SEO',
      'We manage social media',
      'We maintain, protect and improve',
      'We support your growth',
    ],
    quote:
      '"We don\'t just build your website: we publish it, protect it, maintain it and help it grow."',
  },
  plans: {
    eyebrow: 'Plans',
    title1: 'Choose the plan that ',
    titleHighlight: 'fits your business',
    subtitle: 'From entrepreneurs to enterprises. Prices upon request depending on project scope.',
    disclaimer:
      'Prices vary depending on the scope and specific needs of each project. Contact us with no commitment.',
    items: [
      {
        name: 'Digital Entrepreneur',
        price: 'From',
        badge: null,
        description: 'For those who need a quick and effective online presence.',
        features: [
          'Landing page or simple website',
          'Mobile-first responsive design',
          'Basic hosting or starter VPS',
          'SSL certificate',
          'WhatsApp button',
          'Contact form',
          'Basic on-page SEO',
          'Online publishing',
        ],
        cta: 'Inquire about plan',
        highlight: false,
      },
      {
        name: 'Online Business',
        price: 'From',
        badge: 'Most popular',
        description: 'For shops, professionals and SMEs who want to sell online.',
        features: [
          'Complete institutional website',
          'Services & blog sections',
          'Product catalog',
          'Managed VPS hosting',
          'Corporate emails',
          'Google Analytics + Search Console',
          'Full initial SEO',
          'Monthly support included',
        ],
        cta: 'I want this plan',
        highlight: true,
      },
      {
        name: 'Digital Enterprise',
        price: 'From',
        badge: null,
        description: 'For companies that need stability, scalability and custom software.',
        features: [
          'Full corporate website',
          'Custom software or admin panel',
          'VPS or AWS infrastructure',
          'Automatic backups',
          'Advanced security',
          'Monitoring & alerts',
          'Professional technical SEO',
          'Priority support',
        ],
        cta: 'Request proposal',
        highlight: false,
      },
      {
        name: 'Monthly Growth',
        price: 'Monthly',
        badge: null,
        description: 'Continuous support to keep your business updated and growing.',
        features: [
          'Monthly web maintenance',
          'Backups & security',
          'Ongoing monthly SEO',
          'Social media management',
          'Improvements & updates',
          'Performance reports',
          'Technical support included',
        ],
        cta: 'I want maintenance',
        highlight: false,
      },
    ],
  },
  process: {
    eyebrow: 'Process',
    title1: 'How we work ',
    titleHighlight: 'with you',
    subtitle:
      'A clear, organized and transparent process from first contact to continuous growth.',
    steps: [
      {
        title: 'Diagnosis',
        description:
          'We analyze what you need, your goals, your audience and the current state of your digital presence.',
      },
      {
        title: 'Proposal',
        description:
          'We define scope, structure, technologies, timelines and services needed for your project.',
      },
      {
        title: 'Design & development',
        description:
          'We build the website, system or digital solution focused on performance, experience and conversion.',
      },
      {
        title: 'Launch & infrastructure',
        description:
          'We set up hosting, VPS, AWS, domain, SSL, backups and security for a solid launch.',
      },
      {
        title: 'Growth & support',
        description:
          'We accompany with maintenance, SEO, social media, continuous improvements and technical support.',
      },
    ],
  },
  tech: {
    eyebrow: 'Technology',
    title1: 'Modern stack for ',
    titleHighlight: 'real results',
    subtitle:
      'We choose technology based on the project goal: speed, scalability, ease of management and long-term stability.',
    solutionsEyebrow: 'Solutions',
    solutionsTitle1: 'What we can ',
    solutionsHighlight: 'build for you',
    solutionsSubtitle: 'Examples of projects we develop based on each need.',
    solutions: [
      {
        title: 'Website for professionals',
        description: 'Portfolio, services website or personal page with modern design and contact form.',
      },
      {
        title: 'Corporate website',
        description: 'Institutional presence for companies with multiple sections, team and success stories.',
      },
      {
        title: 'Online store',
        description: 'E-commerce with catalog, shopping cart, payments and order management panel.',
      },
      {
        title: 'Management system',
        description: 'Internal ERP or CRM to manage clients, inventory, billing and reports.',
      },
      {
        title: 'Admin dashboard',
        description: 'Dashboard with metrics, users, permissions and centralized operations management.',
      },
      {
        title: 'Campaign landing page',
        description: 'High-conversion page for paid advertising, focused on a single response action.',
      },
      {
        title: 'Client portal',
        description: 'Private access for clients with documents, history, tickets and direct communication.',
      },
      {
        title: 'Cloud infrastructure',
        description: 'Scalable AWS architecture with CI/CD, redundancy, automatic backups and monitoring.',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title1: 'Frequently asked ',
    titleHighlight: 'questions',
    subtitle: 'Everything you need to know before getting started.',
    items: [
      {
        question: 'Can I hire just the website?',
        answer:
          'Yes. You can also hire hosting, SEO, social media or maintenance separately depending on what you need.',
      },
      {
        question: 'Does it include hosting?',
        answer:
          'Yes. We host your website on managed VPS hosting or AWS infrastructure depending on the project type.',
      },
      {
        question: 'Do you work with companies?',
        answer:
          'Yes. We develop solutions for entrepreneurs, SMEs and companies that need infrastructure, software or more advanced support.',
      },
      {
        question: 'Will the website be ready for Google?',
        answer:
          'Yes. We apply technical SEO best practices, semantic structure, speed, responsive design and initial setup of Analytics and Search Console.',
      },
      {
        question: 'Can I request changes after it\'s published?',
        answer:
          'Yes. We can work with a monthly maintenance plan, one-time technical support or continuous improvements.',
      },
      {
        question: 'Do you also manage social media?',
        answer:
          'Yes. We create content, design posts, organize monthly editorial calendars and support strategy on Instagram, Facebook and LinkedIn.',
      },
      {
        question: 'Do you develop custom software?',
        answer:
          'Yes. We build web systems, admin panels, dashboards, automations and API integrations to fit your business needs.',
      },
      {
        question: 'What\'s the difference between VPS hosting and AWS?',
        answer:
          'VPS is ideal for medium-sized sites and systems with great cost-benefit ratio. AWS is recommended for companies that need greater scalability or more advanced architectures.',
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title1: 'Let\'s talk about ',
    titleHighlight: 'your project',
    subtitle: 'Tell us what you need and we\'ll respond with a concrete proposal. No commitment.',
    directTitle: 'Prefer to contact us directly?',
    directSubtitle: 'You can reach us via WhatsApp or email. We respond within 24 business hours.',
    diagnosisTitle: 'What you get in the diagnosis:',
    diagnosisItems: [
      'Analysis of your current digital situation',
      'Service and technology recommendations',
      'Timeline and cost estimation',
      'No cost, no commitment',
    ],
    fields: {
      name: 'Name *',
      namePlaceholder: 'Your name',
      company: 'Company',
      companyPlaceholder: 'Your company name',
      email: 'Email *',
      emailPlaceholder: 'you@email.com',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '+1 555 000 0000',
      service: 'Service of interest',
      servicePlaceholder: 'Select a service...',
      budget: 'Approximate budget',
      budgetPlaceholder: 'Select a range...',
      message: 'Message *',
      messagePlaceholder: 'Briefly tell us what you need or what your project is about...',
    },
    serviceOptions: [
      'Web development',
      'Online store',
      'Custom software',
      'VPS hosting',
      'AWS infrastructure',
      'SEO',
      'Social media',
      'Monthly maintenance',
      'Not sure, I need advice',
    ],
    budgetOptions: [
      'Less than $500 USD',
      '$500 – $1,500 USD',
      '$1,500 – $5,000 USD',
      '$5,000 USD or more',
      'To be defined / Inquire',
    ],
    submit: 'Request free diagnosis',
    sending: 'Sending...',
    successTitle: 'Message sent!',
    successText: 'We received your inquiry. We\'ll contact you within 24 business hours.',
    successBack: 'Send another inquiry',
  },
  footer: {
    description:
      'Web development, software, hosting, infrastructure, SEO and social media for businesses that want to grow online.',
    navTitle: 'Navigation',
    servicesTitle: 'Services',
    contactTitle: 'Contact',
    ctaTitle: 'Ready to take the next step?',
    ctaSubtitle: 'Request a free diagnosis and receive a concrete proposal in less than 24 hours.',
    ctaButton: 'Request free diagnosis',
    copyright: 'All rights reserved.',
    services: [
      'Web Development',
      'Custom Software',
      'VPS Hosting',
      'AWS Infrastructure',
      'SEO',
      'Social Media',
      'Maintenance',
    ],
  },
}
