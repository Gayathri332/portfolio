// -----------------------------------------------------------
// Shared certificate data (fallback + placeholder art)
// Real data comes live from /api/certificates (MongoDB) — this
// is only the offline fallback used if that request fails.
//
// Titles/issuers below were read off your certificate filenames —
// double check them and fix anything I guessed wrong. Easiest way:
// edit `certificates` in seed.js and re-run `npm run seed`, or PUT
// to /api/certificates/:id with your admin key. See README.
// -----------------------------------------------------------
window.FALLBACK_CERTIFICATES = [
  { 
    title: 'AWS Cloud Practitioner Essentials', 
    issuer: 'AWS Training and Certification', 
    badge: 'Course',
    file: 'assets/certificates/aws.jpeg',
    thumb: 'assets/certificates/aws.jpeg'
  },
  { 
    title: 'Foundations of Cybersecurity', 
    issuer: 'Coursera', 
    badge: 'Course',
    file: 'assets/certificates/CourseraFoundationsofCybersecurity.pdf',
    thumb: 'assets/certificates/CourseraFoundationsofCybersecurity-thumb.jpg'
  },
  { 
    title: 'Play It Safe: Manage Security Risks', 
    issuer: 'Coursera', 
    badge: 'Course',
    file: 'assets/certificates/CourseraPlatItSafe.pdf',
    thumb: 'assets/certificates/CourseraPlatItSafe-thumb.jpg'
  },
  { 
    title: 'Connect and Protect: Networks and Network Security', 
    issuer: 'Coursera', 
    badge: 'Course',
    file: 'assets/certificates/CourseraConnectAndProtect.pdf',
    thumb: 'assets/certificates/CourseraConnectAndProtect-thumb.jpg'
  },
  { 
    title: 'Tools of the Trade: Linux and SQL', 
    issuer: 'Coursera', 
    badge: 'Course',
    file: 'assets/certificates/CourseraToolsofTheTrade.pdf',
    thumb: 'assets/certificates/CourseraToolsofTheTrade-thumb.jpg'
  },
  { 
    title: 'Assets, Threats, and Vulnerabilities', 
    issuer: 'Coursera', 
    badge: 'Course',
    file: 'assets/certificates/CourseraAssetsThreatsAndVulnerabilities.pdf',
    thumb: 'assets/certificates/CourseraAssetsThreatsAndVulnerabilities-thumb.jpg'
  },
  { 
    title: 'The Data Science Course', 
    issuer: 'Adverk', 
    badge: 'Course',
    file: 'assets/certificates/adverkdatascience.pdf',
    thumb: 'assets/certificates/adverkdatascience-thumb.jpg'
  },
  { 
    title: 'Getting Started with Networking', 
    issuer: 'Cisco Networking Academy', 
    badge: 'Course',
    file: 'assets/certificates/gettingstartedwithNetworking.pdf',
    thumb: 'assets/certificates/gettingstartedwithNetworking-thumb.jpg'
  },
  { 
    title: 'JNCIA-Junos: Junos, Associate', 
    issuer: 'Juniper Networks', 
    badge: 'Certification',
    file: 'assets/certificates/JNCAAJunosAssociate(JNCIA_Junos).pdf',
    thumb: 'assets/certificates/JNCAAJunosAssociate(JNCIA_Junos)-thumb.jpg'
  },
  { 
    title: 'Blockchain Applications Workshop', 
    issuer: 'NMAM Institute of Technology, NITTE', 
    badge: 'Workshop',
    file: 'assets/certificates/blockchain.jpeg',
    thumb: 'assets/certificates/blockchain.jpeg'
  },
  { 
    title: 'IoT Idea Challenge — Winner', 
    issuer: 'Increaidea', 
    badge: 'Award',
    file: 'assets/certificates/iotIncreaidea.jpeg',
    thumb: 'assets/certificates/iotIncreaidea.jpeg'
  },
  { 
    title: 'Smart Speed Breaker (IoT)', 
    issuer: 'Patent', 
    badge: 'Patent',
    file: '', // Kept empty to trigger your fallback placeholder SVG
    thumb: ''
  }
];

// A small monoline "seal" used as placeholder art until a real
// certificate image is added — keeps the card looking intentional
// instead of broken.
window.certificatePlaceholderSVG = function certificatePlaceholderSVG() {
  return `
  <svg class="cert-seal" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="100" cy="82" r="52" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="100" cy="82" r="40" stroke="currentColor" stroke-width="1"/>
    <path d="M78 118 L64 168 L100 150 L136 168 L122 118" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M84 82 L96 94 L118 68" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
};