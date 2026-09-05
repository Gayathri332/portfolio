// -----------------------------------------------------------
// Shared project data (fallback + slug helper)
// Real data still comes live from /api/projects (MongoDB) —
// this is only the offline fallback + the slugify used to
// build project.html?slug=... links on both pages.
// -----------------------------------------------------------
window.FALLBACK_PROJECTS = [
  {
    title: 'RAG Based Profile matching',
    description:
      "A hybrid RAG-based profile matching engine that matches candidate resumes against job descriptions using semantic retrieval with Sentence Transformers and lexical retrieval with BM25. It extracts candidate metadata such as skills, experience, education, and name, applies strict filtering, and ranks candidates with explainable match scores and relevant resume excerpts.",
    tech: ['Python','RAG','ChromaDB','Sentence Transformers','BM25','Streamlit'],
    tags: ['AI/LLM'],
    githubUrl: 'https://github.com/Gayathri332/RAG-Based-Profile-matching',
    status: 'live',
    images: ['assets/projects/rag1.png', 'assets/projects/rag2.png'],
  },
  {
    title: 'LLM File Assistant',
    description:
      "A tool-calling agent that lets an LLM (Cohere Command) read, list, search, and write files on request, with a Streamlit chat UI on top. The model decides which tool to call; the backend executes it and returns the result.",
    tech: ['Python', 'Cohere API', 'Streamlit'],
    tags: ['AI/LLM'],
    githubUrl: 'https://github.com/Gayathri332',
    status: 'in-progress',
    images: ['assets/projects/llm-file-assistant.png'],
  },
  {
    title: 'Smart Speed Breaker',
    description:
      'An IoT speed breaker using ultrasonic sensors and Arduino to detect pedestrians and vehicles at zebra crossings and respond in real time — officially approved and patented.',
    tech: ['Arduino', 'Ultrasonic Sensors', 'Embedded C'],
    tags: ['IoT'],
    status: 'live',
    badge: 'Patented',
    images: ['assets/projects/smart-speed-breaker-1.png', 'assets/projects/smart-speed-breaker-2.png'],
  },
  {
    title: 'Real-Time Health Monitoring System',
    description:
      'Pulse, temperature, and flex sensors plus a GSM module, simulating an IoT-based safety-critical embedded system that raises alerts when vitals cross a threshold.',
    tech: ['Arduino', 'GSM Module', 'C'],
    tags: ['IoT'],
    status: 'live',
    images: ['assets/projects/health-monitoring.png'],
  },
  {
    title: 'Shopnest',
    description:
      'A mobile e-commerce app built in Java with Firebase for real-time data sync and authentication — cart, checkout, and order history on a live backend.',
    tech: ['Java', 'Firebase', 'Android'],
    tags: ['Mobile'],
    status: 'live',
    images: ['assets/projects/shopnest.png'],
  },
];

window.slugify = function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
