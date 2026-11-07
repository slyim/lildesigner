import { profile } from "./profile";

// Keep the gallery in sync with the current profile portrait.
export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export const gallery: GalleryItem[] = [
  { src: profile.avatar, alt: "Liliana's illustrated Goddess portrait", caption: "me!" },
];
