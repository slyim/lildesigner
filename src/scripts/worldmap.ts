// Lazily loads the world map into the About section and colors each
// country by its LGBT Equality Index score (see src/data/equalityIndex.ts).
// The SVG stays out of the initial HTML (~420KB) and is fetched once,
// the first time the About tab opens.

import { equalityIndex, bucketOf, SOURCE_URL } from "../data/equalityIndex";

let requested = false;

export function loadWorldMap() {
  const slot = document.getElementById("worldMapSlot");
  if (!slot || requested) return;
  requested = true;

  fetch("/world.svg")
    .then((res) => {
      if (!res.ok) throw new Error(`world.svg ${res.status}`);
      return res.text();
    })
    .then((text) => {
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) throw new Error("world.svg has no root");
      svg.setAttribute("class", "world-svg");
      svg.setAttribute("aria-hidden", "true");
      for (const path of svg.querySelectorAll("path")) {
        const score = equalityIndex[path.getAttribute("id") ?? ""];
        path.setAttribute("class", score === undefined ? "wm-unranked" : `wm-eq${bucketOf(score)}`);
      }
      slot.replaceChildren(document.importNode(svg, true));
    })
    .catch(() => {
      slot.classList.add("world-slot--error");
      slot.replaceChildren();
      const msg = document.createElement("p");
      msg.className = "world-error";
      msg.textContent = "The map couldn’t load — ";
      const link = document.createElement("a");
      link.href = SOURCE_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "see the data on Equaldex";
      msg.appendChild(link);
      msg.appendChild(document.createTextNode("."));
      slot.appendChild(msg);
    });
}
