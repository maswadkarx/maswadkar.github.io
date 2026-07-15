export type SocialLink = {
  label: string;
  href: string;
  icon: string;
  description: string;
};

export type Interest = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type Experience = {
  role: string;
  organisation: string;
  period: string;
  description: string;
};

export type Credential = {
  title: string;
  issuer: string;
  year?: string;
  href?: string;
};

export const profile = {
  name: 'Vivek Maswadkar',
  shortName: 'Vivek',
  siteUrl: 'https://resume.maswadkar.com',
  title: 'AI/ML engineer, product builder, and educator',
  location: 'Zürich, Switzerland',
  description:
    'Vivek Maswadkar builds reliable AI systems, agentic products, and practical technology—including Krishi AI for farmers in India.',
  hero: {
    eyebrow: 'Engineering with a human purpose',
    lead: 'There is one thread through everything I do:',
    accent: 'technology',
    close: 'made useful.',
    introduction:
      'I build and evaluate AI systems, turn ideas into working products, and share what I learn—from compliance NLP to Krishi AI for farmers.',
  },
  updatedAt: '2026-07-15',
  email: undefined as string | undefined,
  bookingUrl: undefined as string | undefined,
  resumePdf: undefined as string | undefined,
  professionalSummary:
    'I am a Zürich-based AI/ML engineer and product builder focused on reliable, evaluated machine-learning systems. My path spans software testing, release and programme leadership, cloud engineering, NLP classification, LLM and RAG systems, and hands-on product development.',
  originStory:
    'I grew up in a farming family in Vidarbha, Maharashtra, with a teacher for a father. Agriculture, education, and technology have stayed connected throughout my life. Krishi AI brings those threads together: practical, local-language AI support for farmers, built as an independent, bootstrapped product.',
  currentFocus: [
    'Building and growing Krishi AI across AI chat, plant diagnosis, live mandi prices, agricultural knowledge, and multilingual voice experiences.',
    'Designing agentic and evaluated AI systems where evidence, human review, security, and production reliability are part of the product—not afterthoughts.',
    'Teaching practical generative AI through open-source projects, writing, talks, and the Generative AI for the Beginner’s Mind YouTube channel.',
  ],
  aspirations: [
    'Make useful agricultural knowledge easier for farmers to access in their own language and context.',
    'Build trustworthy AI products that survive the journey from proof of concept to production.',
    'Help more people become confident builders by sharing practical, honest lessons from the work.',
  ],
  principles: [
    'Show up consistently.',
    'Ask when the path is unclear.',
    'Keep the human in control of consequential automation.',
    'Measure the system, not only the demo.',
  ],
  skills: [
    { group: 'AI & ML', items: ['LLM and RAG systems', 'NLP classification', 'Evaluation and experimentation', 'Prompt engineering', 'PyTorch', 'TensorFlow'] },
    { group: 'Engineering', items: ['Python', 'FastAPI', 'Kotlin', 'TypeScript', 'SQL', 'API design', 'Automated testing'] },
    { group: 'Platforms', items: ['Azure', 'Google Cloud', 'AWS', 'Firebase', 'Snowflake', 'Docker', 'Kubernetes'] },
    { group: 'Delivery', items: ['Product development', 'MLOps', 'Agile delivery', 'Programme and release management', 'Quality engineering'] },
  ],
  experience: [
    {
      role: 'AI/ML Engineer — Compliance eComms Classification Models',
      organisation: 'UBS',
      period: 'Sep 2025 — Present',
      description: 'Applied AI/ML engineering focused on reliable classification systems in a regulated environment.',
    },
    {
      role: 'Scrum Master',
      organisation: 'UBS',
      period: 'Aug 2024 — Present',
      description: 'Supporting delivery, team effectiveness, and continuous improvement alongside hands-on AI/ML work.',
    },
    {
      role: 'Independent AI Developer & Content Creator',
      organisation: 'Independent',
      period: 'Jan 2020 — Present',
      description: 'Building open-source AI systems, Krishi AI, technical experiments, tutorials, and practical learning material.',
    },
    {
      role: 'Programme Release Manager & QA Manager',
      organisation: 'Credit Suisse',
      period: 'Feb 2016 — Jul 2024',
      description: 'Led release, quality, service, and programme responsibilities across large banking-technology environments.',
    },
    {
      role: 'UAT Test Manager',
      organisation: 'Cognizant',
      period: 'Jan 2008 — Jun 2015',
      description: 'Managed user-acceptance testing and quality delivery across enterprise programmes.',
    },
  ] satisfies Experience[],
  education: [
    {
      qualification: 'Bachelor of Computer Science',
      institution: 'Savitribai Phule Pune University',
      period: '1999 — 2002',
    },
  ],
  credentials: [
    {
      title: 'TensorFlow in Practice Specialization',
      issuer: 'Coursera',
      year: '2020',
      href: 'https://www.coursera.org/account/accomplishments/specialization/7NNW7U7R5FLF',
    },
    {
      title: 'Architecting with Google Cloud Platform Specialization',
      issuer: 'Coursera',
      href: 'https://www.coursera.org/account/accomplishments/specialization/X4MN56KTF34P',
    },
    {
      title: 'Certified ScrumMaster® (CSM)',
      issuer: 'Scrum Alliance',
      year: '2015',
    },
    {
      title: 'Certified Associate in Project Management (CAPM)®',
      issuer: 'Project Management Institute',
      year: '2013',
    },
    {
      title: 'ISTQB Advanced Level — Test Manager',
      issuer: 'ISTQB',
      year: '2012',
    },
  ] satisfies Credential[],
  languages: ['English — native or bilingual proficiency', 'German — professional working proficiency'],
  interests: [
    {
      title: 'Agriculture and rural technology',
      description: 'Farming roots continue to shape the problems I choose to work on and the people I want technology to serve.',
      image: '/images/dossier/project-blocks.webp',
      imageAlt: 'Abstract black and ultramarine geometric print on textured ivory paper',
    },
    {
      title: 'Teaching with a beginner’s mind',
      description: 'I share practical experiments, tutorials, and honest build notes so complex AI ideas become more approachable.',
      image: '/images/dossier/reading-ideas.webp',
      imageAlt: 'Expressive black brush marks on warm ivory paper',
    },
  ] satisfies Interest[],
  social: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/maswadkar/',
      icon: 'ph:linkedin-logo',
      description: 'Work, writing, and build notes',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/lumensparkxy',
      icon: 'ph:github-logo',
      description: 'Open-source projects and experiments',
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/@mxplusbcurious',
      icon: 'ph:youtube-logo',
      description: 'Generative AI for the Beginner’s Mind',
    },
    {
      label: 'X',
      href: 'https://x.com/maswadkar',
      icon: 'ph:x-logo',
      description: 'Short notes and conversation',
    },
  ] satisfies SocialLink[],
};

export const chapters = [
  { number: '01', name: 'Making', conventional: 'Work', href: '/work/', summary: 'Products, systems, and lessons.' },
  { number: '02', name: 'Thinking', conventional: 'Writing', href: '/writing/', summary: 'Essays, talks, and working ideas.' },
  { number: '03', name: 'Becoming', conventional: 'Now', href: '/now/', summary: "What's receiving attention now." },
  { number: '04', name: 'Living', conventional: 'About', href: '/about/', summary: 'Roots, values, and the person beyond work.' },
  { number: '05', name: 'Connecting', conventional: 'Contact', href: '/contact/', summary: 'Ways to start a conversation.' },
] as const;
