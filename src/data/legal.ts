// Legal docs — same texts as lildesigner.link/privacy and /terms.
export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDoc {
  icon: string;
  title: string;
  updated: string;
  sections: LegalSection[];
  footer: string;
}

export const privacy: LegalDoc = {
  icon: "ph-fill ph-shield-check",
  title: "Privacy Policy",
  updated: "May 27, 2026",
  sections: [
    {
      heading: "1. Information We Collect",
      body: "This website is designed as a direct link list and digital showcase. We do not run databases, tracking cookies, user accounts, or active telemetry. You can browse all link nodes anonymously.",
    },
    {
      heading: "2. External Links",
      body: "This space contains outward links to other platforms (including GitHub, Instagram, and Spotify). We hold no oversight or liability for the data models, cookie policies, or privacy protocols implemented by these external domains.",
    },
    {
      heading: "3. Local Storage",
      body: "We utilize standard browser localStorage solely to store and persist your preferred visual theme and volume settings (Dark or Light Mode). This data is completely local to your browser and is never uploaded or transmitted off-device.",
    },
    {
      heading: "4. Updates to This Policy",
      body: "This document may be revised periodically. Any updates will be reflected directly on this page with an updated modification date.",
    },
  ],
  footer: "© 2026 Lila. All rights reserved.",
};

export const terms: LegalDoc = {
  icon: "ph-fill ph-scroll",
  title: "Terms of Service",
  updated: "May 27, 2026",
  sections: [
    {
      heading: "1. Acceptance of Terms",
      body: "This space is provided on an \u201Cas-is\u201D basis for personal, creative, and informational purposes. By browsing these links, you acknowledge and agree that your usage is voluntary and subject to these terms.",
    },
    {
      heading: "2. Intellectual Property",
      body: "All custom graphics, source styling systems, configurations, layouts, and textual content are the intellectual property of Lila unless otherwise noted. You may not copy, replicate, or re-distribute files from this repository for commercial use without express permission.",
    },
    {
      heading: "3. Disclaimer of Liability",
      body: "Lila provides outgoing links to third-party domains (e.g. GitHub, Instagram) for convenience only. We do not endorse, control, or assume liability for any actions, products, content, or practices of external platforms.",
    },
    {
      heading: "4. Modifications",
      body: "Lila reserves the right to modify, suspend, or update these terms and any link configurations presented herein at any time without prior notice.",
    },
  ],
  footer: "© 2026 Lila. All rights reserved.",
};
