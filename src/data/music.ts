// Playlist — only the [start, end] section of each track plays.
// Add more by dropping an .mp3 in public/music/ and appending a row here.
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
  { title: "Suzume", artist: "RADWIMPS feat. Toaka", src: "/music/suzume.mp3", start: 37, end: 67, bg: "/bg.mp4" },
  { title: "this is what autumn feels like", artist: "JVKE", src: "/music/autumn.mp3", start: 55, end: 85, bg: "/bg-city.mp4" },
  { title: "lovely", artist: "Billie Eilish, Khalid", src: "/music/Billie Ellish, Khaild- Lovely.mp3", start: 130, end: 160, bg: "/bg-pink.mp4" },
  { title: "Love Story (Version Orchestrale)", artist: "M, Indila", src: "/music/M_-_Indila_-Love_Story_Version_Orchestrale_(mp3.pm)_bass_boosted.mp3", start: 245, end: 275, bg: "/bg-space.mp4" },
];
