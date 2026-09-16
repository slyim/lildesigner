// Live profile widgets: Discord presence (Lanyard, no key) and weather
// (Open-Meteo, no key). Both boxes stay hidden unless their data attribute
// is configured in profile.ts AND the fetch succeeds.

interface LanyardData {
  discord_user: { id: string; username: string; global_name?: string | null; avatar: string | null };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: { type: number; name: string; state?: string; details?: string }[];
  listening_to_spotify: boolean;
  spotify?: { song: string; artist: string } | null;
}

function presenceLine(data: LanyardData): string {
  if (data.listening_to_spotify && data.spotify) return `♪ ${data.spotify.song} — ${data.spotify.artist}`;
  const game = data.activities.find((a) => a.type === 0);
  if (game) return game.details ? `${game.name} — ${game.details}` : `playing ${game.name}`;
  const custom = data.activities.find((a) => a.type === 4);
  if (custom?.state) return custom.state;
  return { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" }[data.discord_status];
}

async function initPresence(box: HTMLElement) {
  const id = box.dataset.discordId?.trim();
  if (!id) return;
  const res = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`lanyard ${res.status}`);
  const { success, data } = (await res.json()) as { success: boolean; data: LanyardData };
  if (!success || !data) throw new Error("lanyard empty");

  const avatar = box.querySelector("#presenceAvatar");
  const name = box.querySelector("#presenceName");
  const status = box.querySelector("#presenceStatus");
  const dot = box.querySelector("#presenceDot");
  if (!avatar || !name || !status || !dot) return;

  const user = data.discord_user;
  const display = user.global_name || user.username;
  avatar.replaceChildren();
  if (user.avatar) {
    const img = document.createElement("img");
    img.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    img.alt = "";
    avatar.appendChild(img);
  } else {
    avatar.textContent = display.slice(0, 1).toUpperCase();
  }
  name.textContent = display;
  status.textContent = presenceLine(data);
  dot.className = `presence-dot presence-dot--${data.discord_status}`;
  box.hidden = false;
}

// WMO weather codes -> [label, phosphor icon]
function describeWeather(code: number): [string, string] {
  if (code === 0) return ["clear sky", "ph-fill ph-sun"];
  if (code <= 3) return [["", "mostly clear", "partly cloudy", "overcast"][code], code === 1 ? "ph-fill ph-sun" : "ph-fill ph-cloud-sun"];
  if (code <= 48) return ["foggy", "ph-fill ph-cloud-fog"];
  if (code <= 57) return ["drizzle", "ph-fill ph-cloud-rain"];
  if (code <= 67) return ["rain", "ph-fill ph-cloud-rain"];
  if (code <= 77) return ["snow", "ph-fill ph-snowflake"];
  if (code <= 82) return ["showers", "ph-fill ph-cloud-rain"];
  if (code <= 86) return ["snow showers", "ph-fill ph-snowflake"];
  if (code <= 99) return ["thunderstorm", "ph-fill ph-cloud-lightning"];
  return ["", "ph-fill ph-cloud"];
}

async function initWeather(box: HTMLElement) {
  const city = box.dataset.weatherCity?.trim();
  if (!city) return;
  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
  );
  if (!geo.ok) throw new Error(`geo ${geo.status}`);
  const { results } = (await geo.json()) as { results?: { latitude: number; longitude: number; name: string }[] };
  const place = results?.[0];
  if (!place) throw new Error("city not found");
  const wx = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`,
  );
  if (!wx.ok) throw new Error(`weather ${wx.status}`);
  const { current } = (await wx.json()) as { current?: { temperature_2m: number; weather_code: number } };
  if (!current) throw new Error("no current weather");

  const icon = box.querySelector("#weatherIcon");
  const cityEl = box.querySelector("#weatherCity");
  const nowEl = box.querySelector("#weatherNow");
  if (!icon || !cityEl || !nowEl) return;

  const [label, iconClass] = describeWeather(current.weather_code);
  const c = Math.round(current.temperature_2m);
  const f = Math.round((c * 9) / 5 + 32);
  const i = document.createElement("i");
  i.className = iconClass;
  icon.replaceChildren(i);
  cityEl.textContent = place.name;
  nowEl.textContent = `${c}°C (${f}°F) · ${label}`;
  box.hidden = false;
}

export function initWidgets() {
  const presence = document.getElementById("presenceBox");
  if (presence) initPresence(presence).catch(() => { /* stays hidden */ });
  const weather = document.getElementById("weatherBox");
  if (weather) initWeather(weather).catch(() => { /* stays hidden */ });
}
