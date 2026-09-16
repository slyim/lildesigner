// Playlist — only the [start, end] section of each track plays.
// Add more by dropping an .mp3 in public/music/ and appending a row here.
// Files are pre-trimmed to their section (+2s padding each side) so the
// full songs never download; start/end below are relative to the trimmed file.
export interface Track {
  title: string;
  artist: string;
  src: string;
  /** section start in seconds */
  start: number;
  /** section end in seconds (player skips to next track here) */
  end: number;
  /** background video shown while this track plays */
  bg: string;
}

export const tracks: Track[] = [
  // creation theme: already playing when the card is revealed, keeps going a while
  { title: "product", artist: "zelvacard", src: "/music/product.mp3", start: 0, end: 34, bg: "/blackhole.mp4" },
  { title: "Suzume", artist: "RADWIMPS feat. Toaka", src: "/music/suzume.mp3", start: 2, end: 32, bg: "/bg.mp4" },
  { title: "this is what autumn feels like", artist: "JVKE", src: "/music/autumn.mp3", start: 2, end: 32, bg: "/bg-city.mp4" },
  { title: "lovely", artist: "Billie Eilish, Khalid", src: "/music/lovely.mp3", start: 2, end: 32, bg: "/bg-pink.mp4" },
  { title: "Love Story (Version Orchestrale)", artist: "M, Indila", src: "/music/love-story.mp3", start: 2, end: 32, bg: "/bg-space.mp4" },
];
