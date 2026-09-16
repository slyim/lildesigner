// Gallery — poster tiles. Two examples below; add yours by dropping files
// in public/ and appending rows. Portrait-ish art looks best.
export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export const gallery: GalleryItem[] = [
  { src: "/avatar.jpg", alt: "Liliana's avatar", caption: "me!" },
  { src: "/gallery-hole.jpg", alt: "Black hole still from the creation backdrop", caption: "event horizon" },
];
