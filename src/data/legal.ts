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
  updated: "September 16, 2026",
  sections: [
    {
      heading: "1. Information We Collect",
      body: "This website stores anonymous aggregate counts for page views, likes, and outbound-link clicks. It does not create user accounts, store IP addresses, or use tracking cookies.",
    },
    {
      heading: "2. External Links",
      body: "This space contains outward links to other platforms (including GitHub, Instagram, and Spotify). We hold no oversight or liability for the data models, cookie policies, or privacy protocols implemented by these external domains.",
    },
    {
      heading: "3. Local Storage",
      body: "Browser storage keeps your theme and volume preferences, prevents repeat likes from the same browser, and avoids counting repeated views in one tab session. This data stays on your device.",
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
  title: "Terms and Conditions",
  updated: "September 16, 2026",
  sections: [
    {
      heading: "1. Completely Free",
      body: "This space is completely free — no fees, no subscriptions, no paid features, and no locked content. Everything here is shared for personal enjoyment, creativity, and connection. You will never be charged for visiting, listening, or following links from this page.",
    },
    {
      heading: "2. Respected Owners",
      body: "All content belongs to its respectful owners, credited here with gratitude:\n• Site design, layout & original text — Liliana (violily / Lila)\n• “Suzume” — RADWIMPS feat. Toaka\n• “this is what autumn feels like” — JVKE\n• “lovely” — Billie Eilish & Khalid\n• “Love Story (Version Orchestrale)” — M & Indila\n• Background visuals & artwork — their respective creators\nMusic and visuals are shared for personal, non-commercial ambience only, with full respect to the artists.",
    },
    {
      heading: "3. Please Respect the Owners",
      body: "Enjoy and share with respect: do not re-upload, sell, or claim anyone else's work as your own. If you share something from this page, please credit the rightful owners listed above and link back where possible.",
    },
    {
      heading: "4. External Links",
      body: "Outgoing links to third-party platforms (such as GitHub, Instagram, and Spotify) are provided for convenience only. Lila does not control, endorse, or assume responsibility for the content, products, or practices of external sites.",
    },
    {
      heading: "5. Changes to These Terms",
      body: "These terms may be updated from time to time. Any changes will appear on this page with a new modification date. Continuing to visit means you accept the current terms. Questions? Reach out through any linked profile.",
    },
  ],
  footer: "© 2026 Lila · Free forever · All credits belong to their respectful owners.",
};
