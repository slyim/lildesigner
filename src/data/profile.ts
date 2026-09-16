// Profile data — swap this with a CMS fetch later.
export const profile = {
  name: "violily",
  displayName: "Liliana",
  pronouns: "she/faer",
  bio: "product designer, ich war ich bin ich werde sein. Aby <3",
  avatar: "/avatar.jpg",
  banner: "/bg.gif",
  status: "online" as const,
  location: "earth",
  occupation: "product designer",
  // Discord presence box (via free Lanyard API — join https://discord.gg/lanyard
  // with this account first). Empty = box stays hidden.
  discordId: "",
  // Weather box (free Open-Meteo, resolved at runtime). Empty = hidden.
  weatherCity: "",
  links: [
    { icon: "ph-fill ph-globe", label: "Portfolio", href: "https://liladesign.dev" },
    { icon: "ph-fill ph-github-logo", label: "GitHub", href: "https://github.com/slyim" },
    { icon: "ph-fill ph-butterfly", label: "Bluesky", href: "https://bsky.app/profile/violila.bsky.social" },
    { icon: "ph-fill ph-instagram-logo", label: "Instagram", href: "https://www.instagram.com/violilygirl/" },
    { icon: "ph-fill ph-dribbble-logo", label: "Dribbble", href: "https://dribbble.com/Shylesiana" },
    { icon: "ph-fill ph-behance-logo", label: "Behance", href: "https://www.behance.net/eb0aa8d3" },
  ],
};
