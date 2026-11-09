// Single source of truth for all portfolio content.
// Edit this file to update text across the whole site.

export const profile = {
  name: "Ahmad",
  role: "Software Engineer & Web Developer",
  location: "Jakarta, Indonesia",
  timezone: "Asia/Jakarta",
  email: "ahmadmat1634@gmail.com",
  // TODO: replace with your real profile URLs (they are not readable from the CV PDF).
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-handle" },
    { label: "GitHub", href: "https://github.com/your-handle" },
  ],
  education: {
    school: "Universitas Negeri Jakarta",
    degree: "Bachelor of Computer Science",
    period: "2024 — Now",
    gpa: "3.67 / 4.00",
  },
  interests: ["AI", "Software Development", "Web Development", "Mathematics"],
  languages: ["Indonesian — Fluent", "English — Professional reading & listening"],
};

export const stats = [
  { value: 4, suffix: "", pad: 2, label: "Institutional websites shipped for FMIPA UNJ" },
  { value: 3, suffix: "rd", pad: 0, label: "Place — EXASTI 2.0 Web App Competition" },
  { value: 120, suffix: "+", pad: 0, label: "Automated tests written across projects" },
  { value: 3.67, suffix: "", pad: 0, decimals: 2, label: "GPA — Computer Science, UNJ" },
];

export type Project = {
  slug: string;
  title: string;
  year: string;
  category: string;
  tagline: string;
  context: string;
  team: string;
  award?: string;
  stack: string[];
  overview: string;
  highlights: { title: string; body: string }[];
  metrics: { value: string; label: string }[];
  /** [primary, secondary, deep] — drives the WebGL shader for this project */
  colors: [string, string, string];
};

export const projects: Project[] = [
  {
    slug: "nadi",
    title: "Nadi",
    year: "2026",
    category: "AI · Business Intelligence",
    tagline: "AI-powered business monitoring platform for SMEs.",
    context: "EXASTI 2.0 Web App Competition",
    team: "Competition team",
    award: "3rd Place — EXASTI 2.0 Web App Competition",
    stack: ["Laravel", "PHP", "Groq API", "LLM Routing"],
    overview:
      "Small business owners sell on TikTok Shop, Shopee and offline at the same time — and their numbers end up scattered across three places. Nadi pulls everything into a single owner dashboard and lets them simply ask how the business is doing.",
    highlights: [
      {
        title: "One dashboard, every channel",
        body: "Consolidates TikTok Seller CSV exports, Shopee XLSX reports and offline entries into one Laravel application with sales, product and employee-performance statistics.",
      },
      {
        title: "Ask your business anything",
        body: "Owners ask about sales, products and staff in natural language. A Groq-hosted LLM routes each question to validated, allow-listed reports built from their own data — useful answers without free-form queries.",
      },
      {
        title: "Built for the team, too",
        body: "Employee task assignment lives next to the numbers, so owners can act on what they see without leaving the platform.",
      },
    ],
    metrics: [
      { value: "3", label: "Sales channels unified" },
      { value: "3rd", label: "Place at EXASTI 2.0" },
    ],
    colors: ["#ff5a1f", "#ffc38a", "#1c0802"],
  },
  {
    slug: "rujukcepat",
    title: "RujukCepat",
    year: "2026",
    category: "AI · HealthTech · PWA",
    tagline: "Pre-hospital emergency referral coordination.",
    context: "INCEPTION 2026 Hackathon",
    team: "Hackathon team",
    stack: ["Next.js", "Gemini API", "Zod", "OSRM", "PostgreSQL", "PWA"],
    overview:
      "In an emergency, every minute spent finding the right hospital matters. RujukCepat turns a paramedic's voice or text report into a structured clinical summary and recommends the emergency room that can actually take the patient.",
    highlights: [
      {
        title: "From voice to SOAP",
        body: "Voice and text patient reports become structured SOAP summaries using the Gemini API, with every response validated by Zod before it reaches the UI.",
      },
      {
        title: "Routing across 200 hospitals",
        body: "Emergency-room recommendations across 200 hospitals in Jakarta and East Java (simulated capacity data), combined with real road routing through OSRM.",
      },
      {
        title: "Readiness, kept in sync",
        body: "Hospital readiness syncs between the referral portal and the staff dashboard through PostgreSQL — covered by 87 automated tests.",
      },
    ],
    metrics: [
      { value: "200", label: "Hospitals in the network" },
      { value: "87", label: "Automated tests" },
    ],
    colors: ["#ff2d55", "#7fe7ff", "#05121a"],
  },
  {
    slug: "taskflow",
    title: "TaskFlow",
    year: "2026",
    category: "AI · Productivity",
    tagline: "AI-assisted Kanban platform for teams.",
    context: "Personal project",
    team: "Solo build",
    stack: ["React", "PHP", "MySQL", "Gemini Function Calling", "Playwright"],
    overview:
      "A Kanban board you can talk to. Instead of clicking through forms, teams describe what needs to happen and TaskFlow turns a single chat message into a batch of real, validated tasks.",
    highlights: [
      {
        title: "Twenty tasks, one message",
        body: "Gemini function calling lets teams create, edit and delete up to 20 tasks per chat message directly on the board.",
      },
      {
        title: "Safe by design",
        body: "The PHP backend validates every AI-generated batch and saves it in a single database transaction — it all lands, or nothing does.",
      },
      {
        title: "Everything a team needs",
        body: "Login, invite-code workspaces, deadlines and team statistics built with React, PHP and MySQL, verified by 37 Playwright end-to-end tests.",
      },
    ],
    metrics: [
      { value: "20", label: "Tasks per chat message" },
      { value: "37", label: "Playwright E2E tests" },
    ],
    colors: ["#7b5cff", "#d4c6ff", "#0a0618"],
  },
  {
    slug: "fmipa-unj",
    title: "FMIPA UNJ",
    year: "2026",
    category: "Institutional Web · Client Work",
    tagline: "Four institutional websites for a university faculty.",
    context: "Universitas Negeri Jakarta — Development Team",
    team: "Development team member",
    stack: ["WordPress", "PHP", "UI/UX", "Content Migration", "Server Ops"],
    overview:
      "As part of the faculty's development team, I built and managed the official websites for FMIPA UNJ and three of its study programs — real sites, used daily by students, lecturers and prospective applicants.",
    highlights: [
      {
        title: "Four sites, one system",
        body: "Developed and managed websites for FMIPA UNJ and the Biology, Mathematics Education and Biology Education study programs.",
      },
      {
        title: "Design to delivery",
        body: "WordPress customization, UI/UX implementation, content migration and responsive design across every institutional site.",
      },
      {
        title: "Keeping it online",
        body: "Helped maintain the FMIPA UNJ server — troubleshooting errors and supporting website deployments and migrations.",
      },
    ],
    metrics: [
      { value: "4", label: "Institutional websites" },
      { value: "3", label: "Study programs served" },
    ],
    colors: ["#2f7bff", "#a8d8ff", "#020a1c"],
  },
  {
    slug: "e-ruang",
    title: "e-Ruang",
    year: "2025—26",
    category: "Web App · Campus Systems",
    tagline: "Campus room booking, digitized.",
    context: "University project",
    team: "3-person team",
    stack: ["Node.js", "Express", "EJS", "MySQL"],
    overview:
      "Booking a campus room used to mean paperwork and guesswork. e-Ruang moves the whole flow online — from browsing rooms to approving requests.",
    highlights: [
      {
        title: "The full booking flow",
        body: "Built room pages, user booking history and a calendar system so students can see availability and book in a few clicks.",
      },
      {
        title: "Admin in control",
        body: "An admin dashboard to manage rooms and requests, with responsive layouts that work on any device.",
      },
      {
        title: "Solid foundations",
        body: "Node.js, Express and EJS on top of a 12-table MySQL database, delivered within a 3-person team.",
      },
    ],
    metrics: [
      { value: "12", label: "Table relational schema" },
      { value: "3", label: "Person team" },
    ],
    colors: ["#3dff9a", "#e0ff7a", "#03140b"],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const capabilities = [
  {
    title: "Full-stack web applications",
    body: "End-to-end products with Laravel, Next.js, React and Node — from relational schemas to responsive interfaces and admin dashboards.",
    tags: ["Laravel", "Next.js", "React", "Node.js", "PostgreSQL", "MySQL"],
  },
  {
    title: "AI integration",
    body: "LLM features that stay reliable: function calling, structured outputs validated with Zod, and natural-language questions routed to allow-listed reports.",
    tags: ["Gemini API", "Groq API", "Function calling", "Zod"],
  },
  {
    title: "Institutional & CMS websites",
    body: "WordPress customization, UI/UX implementation, content migration and responsive design for real organizations — plus the server work to keep them online.",
    tags: ["WordPress", "UI/UX", "Migration", "Deployment"],
  },
  {
    title: "Testing & quality",
    body: "Automated tests as part of the build: Playwright end-to-end suites, PHPUnit and Vitest, and transactional backends that fail safely.",
    tags: ["Playwright", "PHPUnit", "Vitest", "Git"],
  },
];

export const experience = {
  work: [
    {
      period: "Apr — Oct 2026",
      role: "Development Team Member",
      org: "Universitas Negeri Jakarta",
      body: "Built and managed 4 institutional websites for FMIPA UNJ and three study programs; WordPress customization, UI/UX, content migration and server maintenance.",
    },
    {
      period: "2024 — Now",
      role: "B.Sc. Computer Science — GPA 3.67",
      org: "Universitas Negeri Jakarta",
      body: "Academic interests in AI, software development, web development and mathematics.",
    },
  ],
  community: [
    {
      period: "May 2025 — Now",
      role: "Staff, ADKESMA Department",
      org: "BEMP Ilmu Komputer UNJ",
      body: "Student advocacy and welfare — tuition (UKT), lecturer and administration issues; manages new-student and alumni data.",
    },
    { period: "Nov 2025", role: "Logistics Staff", org: "Dialog Civitas Academica FMIPA UNJ" },
    { period: "Aug 2025", role: "Event Staff", org: "PKKMB Computer Science UNJ" },
    { period: "Jul 2025", role: "Event Staff", org: "Workshop UI/UX Design" },
    { period: "Jun 2025", role: "PR, Publication & Documentation", org: "Webinar IT COMPARE 2025" },
  ],
};

export const stack = [
  ["TypeScript", "Next.js", "React", "Laravel", "Node.js", "Tailwind CSS", "PHP", "JavaScript", "Express", "WordPress"],
  ["PostgreSQL", "MySQL", "Supabase", "Gemini API", "Groq API", "Socket.IO", "Leaflet", "Playwright", "Vitest", "PHPUnit", "Git"],
];

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" },
];
