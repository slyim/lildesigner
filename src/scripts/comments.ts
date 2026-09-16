// Profile comments (guns.lol style), Supabase-backed: a 4-note preview grid
// plus two liquid-glass modals — an "all comments" browser with sorting and
// a post composer (the composer stacks above the browser for replies).
// Renders everything via textContent so posts can never inject markup.
// Null client parks the UI in an offline state.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZelvaDB } from "../db/database";

interface CommentRow {
  id: number;
  parent_id: number | null;
  name: string;
  body: string;
  likes: number;
  created_at: string;
}

type SortMode = "newest" | "oldest" | "liked";

const PAGE_SIZE = 50;
const PREVIEW_COUNT = 4;
const POST_COOLDOWN_MS = 5000;
const LIKES_KEY = "zelva-comment-likes";
const SORT_KEY = "zelva-comments-sort";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} at ${time}`;
}

function avatarHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function loadLikedIds(): Set<number> {
  try {
    const raw = JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(raw) ? raw.filter((n): n is number => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

function loadSort(): SortMode {
  try {
    const v = localStorage.getItem(SORT_KEY);
    return v === "oldest" || v === "liked" ? v : "newest";
  } catch {
    return "newest";
  }
}

export function initComments(supabase: SupabaseClient<ZelvaDB> | null) {
  const list = document.getElementById("commentsList");
  const status = document.getElementById("commentsStatus");
  const count = document.getElementById("commentsCount");
  const actions = document.getElementById("commentsActions");
  const viewAll = document.getElementById("commentsViewAll") as HTMLButtonElement | null;
  const write = document.getElementById("commentsWrite") as HTMLButtonElement | null;
  const modal = document.getElementById("commentsModal");
  const modalList = document.getElementById("commentsModalList");
  const modalCount = document.getElementById("commentsModalCount");
  const modalX = document.getElementById("commentsModalX") as HTMLButtonElement | null;
  const sortSel = document.getElementById("commentsSort") as HTMLSelectElement | null;
  const postModal = document.getElementById("commentsPostModal");
  const postX = document.getElementById("commentsPostX") as HTMLButtonElement | null;
  const form = document.getElementById("commentsForm") as HTMLFormElement | null;
  const nameInput = document.getElementById("commentsName") as HTMLInputElement | null;
  const bodyInput = document.getElementById("commentsBody") as HTMLTextAreaElement | null;
  const postButton = document.getElementById("commentsPost") as HTMLButtonElement | null;
  const replying = document.getElementById("commentsReplying");
  const replyingTo = document.getElementById("commentsReplyingTo");
  const cancelReply = document.getElementById("commentsCancelReply");
  if (!list || !form || !nameInput || !bodyInput || !postButton || !viewAll || !write
      || !modal || !modalList || !modalX || !sortSel || !postModal || !postX) return;

  if (!supabase) {
    if (status) status.textContent = "comments are offline right now";
    actions?.replaceChildren();
    return;
  }
  // alias to a const: parameter narrowing doesn't survive into async closures
  const db = supabase;

  try {
    const saved = localStorage.getItem("zelva-name");
    if (saved) nameInput.value = saved;
  } catch { /* private mode */ }

  const likedIds = loadLikedIds();
  const saveLikedIds = () => {
    try { localStorage.setItem(LIKES_KEY, JSON.stringify([...likedIds])); } catch { /* private mode */ }
  };

  let topLevel: CommentRow[] = [];
  let repliesByParent = new Map<number, CommentRow[]>();
  let total = 0;
  let replyTo: CommentRow | null = null;
  let sort: SortMode = loadSort();
  sortSel.value = sort;

  // ——— modal stack: ESC/backdrop close the topmost, focus returns home ———
  interface OpenModal { el: HTMLElement; opener: HTMLElement | null; }
  const stack: OpenModal[] = [];
  const syncScrollLock = () => { document.body.style.overflow = stack.length ? "hidden" : ""; };
  function openModal(el: HTMLElement, closeBtn: HTMLButtonElement) {
    if (!el.hidden) return;
    stack.push({ el, opener: document.activeElement as HTMLElement | null });
    el.hidden = false;
    syncScrollLock();
    closeBtn.focus();
  }
  function closeModal(el: HTMLElement) {
    const i = stack.findIndex((m) => m.el === el);
    if (i === -1) return;
    const [m] = stack.splice(i, 1);
    el.hidden = true;
    syncScrollLock();
    try { m.opener?.focus?.(); } catch { /* opener gone */ }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length) closeModal(stack[stack.length - 1].el);
  });
  for (const m of [modal, postModal]) {
    m.querySelector("[data-close-modal]")?.addEventListener("click", () => closeModal(m));
  }
  modalX.addEventListener("click", () => closeModal(modal));
  postX.addEventListener("click", () => closeModal(postModal));

  function setReplyTo(row: CommentRow | null) {
    replyTo = row;
    if (replying) replying.hidden = !row;
    if (replyingTo && row) replyingTo.textContent = row.name;
  }

  function openComposer(row?: CommentRow) {
    setReplyTo(row ?? null);
    syncPostButton();
    openModal(postModal!, postX!);
    (nameInput!.value ? bodyInput! : nameInput!).focus();
  }

  function renderHead(row: CommentRow): HTMLElement {
    const head = document.createElement("div");
    head.className = "comment-head";
    const avatar = document.createElement("span");
    avatar.className = "comment-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.style.background = `linear-gradient(135deg, hsl(${avatarHue(row.name)}, 70%, 55%), hsl(${(avatarHue(row.name) + 40) % 360}, 70%, 45%))`;
    avatar.textContent = row.name.slice(0, 1).toUpperCase();
    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.className = "comment-name";
    name.textContent = row.name;
    const time = document.createElement("time");
    time.className = "comment-time";
    time.dateTime = row.created_at;
    time.textContent = fmtDate(row.created_at);
    meta.append(name, time);
    head.append(avatar, meta);
    return head;
  }

  function renderBody(row: CommentRow): HTMLElement {
    const body = document.createElement("p");
    body.className = "comment-body";
    body.textContent = row.body;
    return body;
  }

  function renderLike(row: CommentRow): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "comment-action comment-action--like" + (likedIds.has(row.id) ? " liked" : "");
    btn.title = "Like this comment";
    btn.setAttribute("aria-label", `Like this comment (${row.likes} likes)`);
    const icon = document.createElement("i");
    icon.className = (likedIds.has(row.id) ? "ph-fill" : "ph") + " ph-heart";
    const n = document.createElement("span");
    n.textContent = row.likes > 0 ? String(row.likes) : "";
    btn.append(icon, n);
    btn.addEventListener("click", async () => {
      if (likedIds.has(row.id) || btn.disabled) return;
      btn.disabled = true;
      try {
        const { data, error } = await db.rpc("increment_comment_likes", { comment_id: row.id });
        if (error) throw error;
        row.likes = data as number;
        likedIds.add(row.id);
        saveLikedIds();
        // the same row renders twice (grid + browser) — sync both buttons
        for (const root of [list!, modalList!]) {
          const mine = root.querySelector(`[data-id="${row.id}"] .comment-action--like`) as HTMLButtonElement | null;
          if (!mine) continue;
          mine.classList.add("liked");
          mine.disabled = true;
          (mine.querySelector("i") as HTMLElement).className = "ph-fill ph-heart";
          (mine.querySelector("span") as HTMLElement).textContent = String(row.likes);
          mine.setAttribute("aria-label", `Liked (${row.likes} likes)`);
        }
      } catch {
        btn.disabled = false;
      }
    });
    return btn;
  }

  function renderReply(row: CommentRow): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "comment-action";
    btn.title = "Reply to this comment";
    btn.setAttribute("aria-label", `Reply to ${row.name}`);
    const icon = document.createElement("i");
    icon.className = "ph ph-arrow-bend-up-left";
    btn.appendChild(icon);
    btn.addEventListener("click", () => openComposer(row));
    return btn;
  }

  function renderCard(row: CommentRow): HTMLElement {
    const card = document.createElement("article");
    card.className = "comment";
    card.dataset.id = String(row.id);
    // actions live in the head row (top-right), name + date inline left
    const head = renderHead(row);
    const actionsRow = document.createElement("div");
    actionsRow.className = "comment-actions";
    actionsRow.append(renderLike(row), renderReply(row));
    head.appendChild(actionsRow);
    card.append(head, renderBody(row));

    const replies = repliesByParent.get(row.id) ?? [];
    if (replies.length) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "comment-replies-toggle";
      toggle.setAttribute("aria-expanded", "false");
      const caret = document.createElement("i");
      caret.className = "ph-bold ph-caret-down";
      const label = document.createElement("span");
      label.textContent = `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
      toggle.append(caret, label);
      const box = document.createElement("div");
      box.className = "comment-replies";
      box.hidden = true;
      for (const r of replies) {
        const el = document.createElement("div");
        el.className = "comment-reply";
        el.append(renderHead(r), renderBody(r));
        box.appendChild(el);
      }
      toggle.addEventListener("click", () => {
        const open = box.hidden;
        box.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        label.textContent = open
          ? `Hide ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
          : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
      });
      card.append(toggle, box);
    }
    return card;
  }

  function sortedTopLevel(): CommentRow[] {
    const rows = [...topLevel];
    if (sort === "oldest") rows.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === "liked") {
      rows.sort((a, b) => b.likes - a.likes || +new Date(b.created_at) - +new Date(a.created_at));
    }
    return rows; // newest: load order is already newest-first
  }

  function paint() {
    list!.replaceChildren();
    if (!topLevel.length) {
      const empty = document.createElement("p");
      empty.className = "comments-status";
      empty.textContent = "no notes yet — be the first ♡";
      list!.appendChild(empty);
    } else {
      for (const row of topLevel.slice(0, PREVIEW_COUNT)) list!.appendChild(renderCard(row));
    }
    if (count) count.textContent = total ? `(${total})` : "";
    viewAll!.hidden = topLevel.length <= PREVIEW_COUNT;
  }

  function paintModal() {
    modalList!.replaceChildren();
    const rows = sortedTopLevel();
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "comments-status";
      empty.textContent = "no notes yet — be the first ♡";
      modalList!.appendChild(empty);
    } else {
      for (const row of rows) modalList!.appendChild(renderCard(row));
    }
    if (modalCount) modalCount.textContent = total ? `(${total})` : "";
  }

  const load = async () => {
    const [{ data, error }, counted] = await Promise.all([
      db.from("comments").select("id, parent_id, name, body, likes, created_at")
        .order("created_at", { ascending: false }).limit(PAGE_SIZE * 2),
      db.from("comments").select("id", { count: "exact", head: true }),
    ]);
    if (error) throw error;
    if (counted.error) throw counted.error;
    const rows = (data ?? []) as CommentRow[];
    topLevel = rows.filter((r) => r.parent_id === null).slice(0, PAGE_SIZE);
    repliesByParent = new Map();
    for (const r of rows) {
      if (r.parent_id === null) continue;
      const group = repliesByParent.get(r.parent_id) ?? [];
      group.push(r);
      repliesByParent.set(r.parent_id, group);
    }
    for (const group of repliesByParent.values()) {
      group.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    }
    total = counted.count ?? topLevel.length;
    paint();
    paintModal();
  };
  load().catch(() => {
    list.replaceChildren();
    const err = document.createElement("p");
    err.className = "comments-status";
    err.textContent = "couldn't load comments";
    list.appendChild(err);
  });

  viewAll.addEventListener("click", () => openModal(modal, modalX));
  write.addEventListener("click", () => openComposer());
  cancelReply?.addEventListener("click", () => setReplyTo(null));
  sortSel.addEventListener("change", () => {
    const v = sortSel.value;
    sort = v === "oldest" || v === "liked" ? v : "newest";
    try { localStorage.setItem(SORT_KEY, sort); } catch { /* private mode */ }
    paintModal();
    modalList.scrollTop = 0;
  });

  let coolingDown = false;
  function syncPostButton() {
    postButton!.disabled = coolingDown || !nameInput!.value.trim() || !bodyInput!.value.trim();
  }
  nameInput.addEventListener("input", syncPostButton);
  bodyInput.addEventListener("input", syncPostButton);
  syncPostButton();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (coolingDown) return;
    const name = nameInput.value.trim().slice(0, 40);
    const body = bodyInput.value.trim().slice(0, 500);
    if (!name || !body) return;
    postButton.disabled = true;
    try {
      const { data, error } = await db.from("comments")
        .insert({ name, body, parent_id: replyTo?.id ?? null })
        .select("id, parent_id, name, body, likes, created_at")
        .single();
      if (error) throw error;
      const row = data as CommentRow;
      try { localStorage.setItem("zelva-name", name); } catch { /* private mode */ }
      bodyInput.value = "";
      total++;
      if (row.parent_id === null) {
        topLevel.unshift(row);
      } else {
        const group = repliesByParent.get(row.parent_id) ?? [];
        group.push(row);
        repliesByParent.set(row.parent_id, group);
      }
      const wasReply = replyTo !== null;
      const parentId = row.parent_id;
      setReplyTo(null);
      paint();
      paintModal();
      modalList.scrollTop = 0;
      closeModal(postModal);
      // reveal the new reply: expand its thread wherever it's visible
      if (wasReply && parentId !== null) {
        for (const root of [list, modalList]) {
          const t = root.querySelector(`[data-id="${parentId}"] .comment-replies-toggle`) as HTMLButtonElement | null;
          if (t?.getAttribute("aria-expanded") === "false") t.click();
        }
      }
      coolingDown = true;
      setTimeout(() => { coolingDown = false; syncPostButton(); }, POST_COOLDOWN_MS);
    } catch {
      syncPostButton();
      bodyInput.setCustomValidity("couldn't post — try again");
      bodyInput.reportValidity();
      bodyInput.setCustomValidity("");
    }
  });
}
