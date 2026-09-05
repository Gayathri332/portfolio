// Run with: npm run seed
// Populates the projects collection with starter data.
// Safe to re-run — it clears and re-inserts the seed projects.
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Profile = require('./models/Profile');
const Certificate = require('./models/Certificate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

// This is what the "Ask about Gayathri" widget draws on. Edit this freely —
// the more detail you paste in here (straight from your resume is fine),
// the better the assistant's answers, both with and without an LLM key.
const profileContext = `
Gayathri Shettigar — Backend Engineer, based in Hiriadka, Udupi, Karnataka, India.
Email: gayathri3.offical@gmail.com. LinkedIn: linkedin.com/in/gayathri3213.
GitHub: github.com/Gayathri332. LeetCode: leetcode.com/u/Gaya3thri333.

PROFILE
Entry-level software engineer with a strong foundation in object-oriented programming, data
structures, distributed systems, and backend development. Hands-on experience building
scalable backend services, REST APIs, automation workflows, and secure systems. Currently
building toward a career in AI engineering — training via Airtribe's backend engineering
course and building LLM-agent side projects — while working full-time as a backend/automation
engineer.

EXPERIENCE
Automation Developer, Avery Dennison (Oct 2025 – present): designs and builds automation that
removes manual steps from enterprise workflows, investigates and root-causes production
issues, and ships reliability improvements every sprint in an Agile team.
Backend Developer Intern, Exelon Circuits Private Limited (Jan 2025 – May 2025): built and
maintained REST services in Node.js, Express, MongoDB, and TypeScript; implemented JWT and
OAuth authentication; wrote and automated tests that reduced deployment defects.
Cyber Security Tools for Ethical Hacking (research project), MIT Manipal (Feb–Mar 2023):
vulnerability scanning and penetration testing with Nmap, Metasploit, and Veil; practiced
system hardening and intrusion detection.

EDUCATION
Bachelor of Engineering, Computer and Communication Engineering, NMAM Institute of Technology
(2021–2025), CGPA 8.75.
Pre-University Course, Mahatma Gandhi Memorial College, Udupi (2019–2021), 88.67%.
SSLC, G.P.U High School (2016–2019), 92.32%.

SKILLS
Languages: Java, C++, Python, JavaScript, TypeScript, SQL.
Backend & systems: Node.js, Express, REST APIs, MongoDB, Firebase, JWT, OAuth, WebSockets.
DevOps & tools: Git, CI/CD basics, Postman, Swagger, AWS (EC2, S3).
Core CS: Data Structures & Algorithms, Object-Oriented Design, Multithreading, Networking, OS, DBMS.
Currently learning (AI engineering track): LLM tool use / agents, the Cohere API,
retrieval-augmented generation (RAG), vector search with FAISS, sentence embeddings.

PROJECTS
LLM File Assistant (in progress): a tool-calling agent where an LLM (Cohere Command) reads,
lists, searches, and writes files on request, with a Streamlit chat UI on top — the model
decides which tool to call and the backend executes it.
Smart Speed Breaker (patented): an IoT speed breaker using ultrasonic sensors and Arduino to
detect pedestrians and vehicles at zebra crossings and respond in real time.
Real-Time Health Monitoring System: pulse, temperature, and flex sensors plus a GSM module,
simulating an IoT-based safety-critical embedded system that raises alerts.
Shopnest: a mobile e-commerce app in Java with Firebase for real-time data and authentication,
including ordering and profile-management features.

CERTIFICATIONS
The Data Science Course — Adverk. Foundations of Cybersecurity — Coursera.
AWS Cloud Practitioner Essentials — Amazon Web Services.

ACHIEVEMENTS
Holds a patent for the "Smart Speed Breaker" IoT project — a smart speed breaker using
ultrasonic sensors to detect people and vehicles at zebra crossings, officially approved and
patented.

AVAILABILITY
Open to AI engineering roles, backend engineering roles, and interesting collaborations.
Best reached by email or the contact form on this site.
`.trim();

const profileFacts = [
  {
    keywords: ['who', 'name', 'about her', 'introduce'],
    answer:
      "Gayathri Shettigar is a backend engineer from Udupi, Karnataka, currently working as an Automation Developer at Avery Dennison, and training toward becoming an AI engineer.",
  },
  {
    keywords: ['job', 'work', 'role', 'current', 'doing now', 'company'],
    answer:
      'She currently works as an Automation Developer at Avery Dennison (since Oct 2025), building automation for enterprise workflows and debugging production issues.',
  },
  {
    keywords: ['intern', 'internship', 'exelon', 'previous job', 'past experience'],
    answer:
      'Before her current role, she was a Backend Developer Intern at Exelon Circuits Pvt. Ltd. (Jan–May 2025), building REST services with Node.js, Express, MongoDB, and TypeScript, and implementing JWT/OAuth auth.',
  },
  {
    keywords: ['education', 'degree', 'college', 'cgpa', 'university', 'study'],
    answer:
      'She holds a BE in Computer and Communication Engineering from NMAM Institute of Technology (2021–2025) with a CGPA of 8.75.',
  },
  {
    keywords: ['skill', 'tech', 'stack', 'language', 'know', 'technologies'],
    answer:
      'Her core stack is Java, Python, JavaScript/TypeScript, Node.js, Express, MongoDB, and REST APIs, plus AWS and DSA fundamentals. She is currently adding LLM tool use, RAG, and vector search (FAISS) on top of that.',
  },
  {
    keywords: ['project', 'projects', 'built', 'build', 'portfolio'],
    answer:
      "Her projects include an LLM File Assistant (a Cohere tool-calling agent), a patented Smart Speed Breaker IoT system, a Real-Time Health Monitoring System, and Shopnest, an e-commerce app. See the Projects section for details.",
  },
  {
    keywords: ['ai', 'goal', 'future', 'career', 'learning', 'airtribe', 'become'],
    answer:
      "She's actively working toward becoming an AI engineer — taking Airtribe's backend engineering course and building LLM-agent projects (tool use, RAG, embeddings) alongside her full-time backend role.",
  },
  {
    keywords: ['contact', 'email', 'reach', 'hire', 'get in touch'],
    answer:
      'The best way to reach her is the contact form on this site, or by email at gayathri3.offical@gmail.com.',
  },
  {
    keywords: ['patent', 'achievement', 'award', 'recognition'],
    answer:
      'She holds a patent for the "Smart Speed Breaker" — an IoT device using ultrasonic sensors to detect pedestrians and vehicles at zebra crossings.',
  },
  {
    keywords: ['leetcode', 'dsa', 'coding', 'competitive', 'algorithm'],
    answer:
      'She solves DSA problems on LeetCode regularly — her live profile is linked in the hero section and footer of this site.',
  },
  {
    keywords: ['certificat', 'course'],
    answer:
      'Her certifications include The Data Science Course (Adverk), Foundations of Cybersecurity (Coursera), and AWS Cloud Practitioner Essentials.',
  },
  {
    keywords: ['location', 'where', 'based', 'live', 'city'],
    answer: 'She is based in Hiriadka, Udupi, Karnataka, India.',
  },
];

const projects = [
  {
    title: 'RAG Based Profile matching',
    description:
      "A hybrid RAG-based profile matching engine that matches candidate resumes against job descriptions using semantic retrieval with Sentence Transformers and lexical retrieval with BM25. It extracts candidate metadata such as skills, experience, education, and name, applies strict filtering, and ranks candidates with explainable match scores and relevant resume excerpts.",
    tech: ['Python','RAG','ChromaDB','Sentence Transformers','BM25','Streamlit'],
    tags: ['AI/LLM'],
    githubUrl: 'https://github.com/Gayathri332/RAG-Based-Profile-matching',
    status: 'live',
    images: ['assets/projects/rag1.png', 'assets/projects/rag2.png'],
    order: 0,
  },
  {
    title: 'LLM File Assistant',
    description:
      'A tool-calling agent that lets an LLM (Cohere Command) read, list, search, and write files on request. Built the file-system tools, the Cohere v2 tool-use loop, and a Streamlit chat UI on top so the model decides which tool to call and the backend executes it.',
    tech: ['Python', 'Cohere API', 'Streamlit', 'Tool Use / Function Calling'],
    tags: ['AI/LLM', 'Agents'],
    githubUrl: 'https://github.com/Gayathri332',
    status: 'live',
    images: ['/assets/projects/llm-file-assistant.png'],
    order: 1,
  },
  {
    title: 'Smart Speed Breaker (Patented)',
    description:
      'An IoT speed breaker that uses ultrasonic sensors and Arduino to detect pedestrians and vehicles at zebra crossings and respond in real time, improving crossing safety without slowing every vehicle by default.',
    tech: ['Arduino', 'Ultrasonic Sensors', 'Embedded C'],
    tags: ['IoT'],
    status: 'live',
    badge: 'Patented',
    images: ['/assets/projects/smart-speed-breaker-1.png', '/assets/projects/smart-speed-breaker-2.png'],
    order: 2,
  },
  {
    title: 'Real-Time Health Monitoring System',
    description:
      'A wearable-style safety system combining pulse, temperature, and flex sensors with a GSM module, simulating an IoT-based embedded system that raises alerts when vitals move outside safe ranges.',
    tech: ['Arduino', 'GSM Module', 'Sensor Integration'],
    tags: ['IoT', 'Embedded'],
    status: 'live',
    images: ['/assets/projects/health-monitoring.png'],
    order: 3,
  },
  {
    title: 'Shopnest',
    description:
      'A mobile e-commerce app with real-time product data and authentication, plus ordering and profile-management flows built for everyday shopping use.',
    tech: ['Java', 'OOP', 'Firebase'],
    tags: ['Mobile', 'Web'],
    githubUrl: 'https://github.com/Gayathri332',
    status: 'live',
    images: ['/assets/projects/shopnest.png'],
    order: 4,
  },
];

// Same slugify logic as public/js/projects-data.js (kept separate since
// this file runs in Node, not the browser) — used to predict the
// image/fileUrl paths below so they match what public/js expects.
function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Drop matching files into public/assets/certificates/ and they'll show
// up automatically — see README "Adding your real certificate files".
// `image` tries <slug>.jpg/.jpeg/.png/.webp automatically on the frontend.
// `hasPdf: true` below just controls whether we also seed a fileUrl link
// to a same-named .pdf — set based on which of your files looked like
// PDFs vs. photos/screenshots in your certificate folder. Fix any of
// this that's wrong for a given file — see README.
// `image` is what the site actually displays in the small grid card AND on
// the /certificates.html row — for PDFs that has to be a rendered thumbnail
// (browsers can't show a .pdf inside an <img>), so it points at the
// `*-thumb.jpg` files generated from page 1 of each PDF. `fileUrl` is the
// original file, used for the "View original file" link / full embed.
// These are real, verified paths — not guessed from the title.
const certificateSeedData = [
  { title: 'AWS Cloud Practitioner Essentials', issuer: 'AWS Training and Certification', badge: 'Course',
    image: '/assets/certificates/aws.jpeg', fileUrl: '/assets/certificates/aws.jpeg' },
  { title: 'Foundations of Cybersecurity', issuer: 'Coursera', badge: 'Course',
    image: '/assets/certificates/CourseraFoundationsofCybersecurity-thumb.jpg', fileUrl: '/assets/certificates/CourseraFoundationsofCybersecurity.pdf' },
  { title: 'Play It Safe: Manage Security Risks', issuer: 'Coursera', badge: 'Course',
    image: '/assets/certificates/CourseraPlatItSafe-thumb.jpg', fileUrl: '/assets/certificates/CourseraPlatItSafe.pdf' },
  { title: 'Connect and Protect: Networks and Network Security', issuer: 'Coursera', badge: 'Course',
    image: '/assets/certificates/CourseraConnectAndProtect-thumb.jpg', fileUrl: '/assets/certificates/CourseraConnectAndProtect.pdf' },
  { title: 'Tools of the Trade: Linux and SQL', issuer: 'Coursera', badge: 'Course',
    image: '/assets/certificates/CourseraToolsofTheTrade-thumb.jpg', fileUrl: '/assets/certificates/CourseraToolsofTheTrade.pdf' },
  { title: 'Assets, Threats, and Vulnerabilities', issuer: 'Coursera', badge: 'Course',
    image: '/assets/certificates/CourseraAssetsThreatsAndVulnerabilities-thumb.jpg', fileUrl: '/assets/certificates/CourseraAssetsThreatsAndVulnerabilities.pdf' },
  { title: 'The Data Science Course', issuer: 'Adverk', badge: 'Course',
    image: '/assets/certificates/adverkdatascience-thumb.jpg', fileUrl: '/assets/certificates/adverkdatascience.pdf' },
  { title: 'Getting Started with Networking', issuer: 'Cisco Networking Academy', badge: 'Course',
    image: '/assets/certificates/gettingstartedwithNetworking-thumb.jpg', fileUrl: '/assets/certificates/gettingstartedwithNetworking.pdf' },
  { title: 'JNCIA-Junos: Junos, Associate', issuer: 'Juniper Networks', badge: 'Certification',
    image: '/assets/certificates/JNCAAJunosAssociate(JNCIA_Junos)-thumb.jpg', fileUrl: '/assets/certificates/JNCAAJunosAssociate(JNCIA_Junos).pdf' },
  { title: 'Blockchain Applications Workshop', issuer: 'NMAM Institute of Technology, NITTE', badge: 'Workshop',
    image: '/assets/certificates/blockchain.jpeg', fileUrl: '/assets/certificates/blockchain.jpeg' },
  { title: 'IoT Idea Challenge — Winner', issuer: 'Increaidea', badge: 'Award',
    image: '/assets/certificates/iotIncreaidea.jpeg', fileUrl: '/assets/certificates/iotIncreaidea.jpeg' },
  { title: 'Smart Speed Breaker (IoT)', issuer: 'Patent', badge: 'Patent' }, // no file — placeholder seal is intentional
];
const certificates = certificateSeedData.map((c, i) => ({ ...c, order: i }));

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Seeding projects...');
  await Project.deleteMany({});
  await Project.insertMany(projects);
  console.log(`Inserted ${projects.length} projects.`);

  console.log('Seeding profile (powers the "Ask about Gayathri" widget)...');
  await Profile.deleteMany({});
  await Profile.create({ context: profileContext, facts: profileFacts });
  console.log('Profile seeded.');

  console.log('Seeding certificates...');
  await Certificate.deleteMany({});
  await Certificate.insertMany(certificates);
  console.log(`Inserted ${certificates.length} certificates.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
