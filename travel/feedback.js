// Feedback widget shared by every brochure under nickholzherr.com/travel/.
// Page contract: <body data-brochure="<slug>" data-version="v1">, and each option
// is a <section data-section="<id>" data-label="<name>">. Notes go to the
// travel-feedback Worker (KV); scripts/pull-feedback.mjs reads them back.
(function () {
  const API = "/travel/api/feedback";
  const page = document.body.dataset.brochure;
  const version = document.body.dataset.version || "";
  if (!page) return;

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const notesKey = `travel-notes:${page}`;
  const reactKey = `travel-reactions:${page}`;

  const css = `
  .fb-react{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:16px 0 0;border-top:1px dashed var(--line)}
  .fb-react p{margin:0 8px 0 0;font-family:var(--mono,monospace);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .fb-chip{font:inherit;font-size:15px;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
  .fb-chip[aria-pressed="true"]{background:var(--c,var(--ink));border-color:var(--c,var(--ink));color:var(--paper)}
  .fb-chip:focus-visible,.fb-fab:focus-visible,.fb-sheet button:focus-visible{outline:3px solid var(--c,var(--ink));outline-offset:2px}
  .fb-note{background:none;border:0;color:var(--ink);text-decoration:underline;text-underline-offset:3px;font:inherit;font-size:15px;cursor:pointer;padding:8px 4px}
  .fb-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:20;font-family:var(--display,sans-serif);font-weight:600;font-size:16px;padding:14px 20px;border-radius:999px;border:0;background:var(--ink);color:var(--paper);box-shadow:0 6px 24px rgba(0,0,0,.25);cursor:pointer}
  .fb-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:30}
  .fb-sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(560px,100%);max-height:88vh;overflow:auto;z-index:31;background:var(--paper);color:var(--ink);border-radius:14px 14px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));display:grid;gap:14px;box-shadow:0 -8px 30px rgba(0,0,0,.25)}
  .fb-sheet h2{font-family:var(--display,sans-serif);font-size:24px;margin:0}
  .fb-sheet label{display:grid;gap:6px;font-size:14px;color:var(--muted)}
  .fb-sheet select,.fb-sheet textarea,.fb-sheet input{font:inherit;font-size:16px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px;width:100%}
  .fb-sheet textarea{min-height:130px;resize:vertical}
  .fb-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
  .fb-send{font:inherit;font-weight:600;padding:12px 20px;border-radius:999px;border:0;background:var(--ink);color:var(--paper);cursor:pointer}
  .fb-cancel{font:inherit;padding:12px 16px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--ink);cursor:pointer}
  .fb-status{font-size:14px;margin:0;min-height:1.2em}
  .fb-hp{position:absolute;left:-9999px}
  .fb-mine{display:grid;gap:8px;border-top:1px solid var(--line);padding-top:12px}
  .fb-mine h3{font-family:var(--mono,monospace);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0;font-weight:500}
  .fb-mine div{font-size:14px;line-height:1.45;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 10px}
  .fb-mine small{display:block;color:var(--muted);font-size:12px}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const sections = [...document.querySelectorAll("[data-section]")];
  const labels = [["general", "The whole thing"], ...sections.map((s) => [s.dataset.section, s.dataset.label || s.dataset.section])];

  async function send(payload) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page, version, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "That didn't send. Check your connection and try again.");
    return data;
  }

  // Reaction chips at the foot of every option.
  const reactions = store.get(reactKey, {});
  const CHOICES = [["love", "Love it"], ["maybe", "Maybe"], ["no", "Not for us"]];
  sections.forEach((sec) => {
    const id = sec.dataset.section;
    const row = document.createElement("div");
    row.className = "fb-react";
    row.innerHTML = `<p>Your take</p>`;
    CHOICES.forEach(([val, text]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "fb-chip";
      b.textContent = text;
      b.setAttribute("aria-pressed", String(reactions[id] === val));
      b.addEventListener("click", async () => {
        row.querySelectorAll(".fb-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        reactions[id] = val;
        store.set(reactKey, reactions);
        try { await send({ section: id, reaction: val, name: store.get("travel-name", "") }); }
        catch { b.setAttribute("aria-pressed", "false"); }
      });
      row.appendChild(b);
    });
    const note = document.createElement("button");
    note.type = "button";
    note.className = "fb-note";
    note.textContent = "Add a note";
    note.addEventListener("click", () => open(id));
    row.appendChild(note);
    sec.appendChild(row);
  });

  // Floating button + bottom sheet.
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "fb-fab";
  fab.textContent = "Leave feedback";
  fab.addEventListener("click", () => open("general"));
  document.body.appendChild(fab);

  let sheet, backdrop;
  function open(sectionId) {
    close();
    backdrop = document.createElement("div");
    backdrop.className = "fb-backdrop";
    backdrop.addEventListener("click", close);
    sheet = document.createElement("form");
    sheet.className = "fb-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "Leave feedback");
    sheet.innerHTML = `
      <h2>What do you think?</h2>
      <label>About<select id="fb-section">${labels.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
      <label>Your thoughts<textarea id="fb-text" placeholder="Likes, dislikes, questions, other ideas, dates that suit better…"></textarea></label>
      <label>Your name<input id="fb-name" autocomplete="given-name"></label>
      <input class="fb-hp" id="fb-website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="fb-status" role="status"></p>
      <div class="fb-row"><button type="button" class="fb-cancel">Close</button><button type="submit" class="fb-send">Send to Nick</button></div>
      ${mineHtml()}`;
    sheet.querySelector("#fb-section").value = sectionId;
    sheet.querySelector("#fb-name").value = store.get("travel-name", "");
    sheet.querySelector(".fb-cancel").addEventListener("click", close);
    sheet.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = sheet.querySelector(".fb-status");
      const btn = sheet.querySelector(".fb-send");
      const text = sheet.querySelector("#fb-text").value.trim();
      const name = sheet.querySelector("#fb-name").value.trim();
      const section = sheet.querySelector("#fb-section").value;
      if (!text) { status.textContent = "Write something first."; return; }
      btn.disabled = true;
      status.textContent = "Sending…";
      try {
        await send({ section, text, name, website: sheet.querySelector("#fb-website").value });
        store.set("travel-name", name);
        const mine = store.get(notesKey, []);
        mine.unshift({ at: new Date().toISOString(), section, text });
        store.set(notesKey, mine.slice(0, 30));
        sheet.querySelector("#fb-text").value = "";
        status.textContent = "Sent. Nick has it, and the next version of this page will take it into account.";
        const old = sheet.querySelector(".fb-mine");
        if (old) old.remove();
        sheet.insertAdjacentHTML("beforeend", mineHtml());
      } catch (err) {
        status.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });
    document.body.append(backdrop, sheet);
    sheet.querySelector("#fb-text").focus();
    document.addEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    sheet?.remove(); backdrop?.remove(); sheet = backdrop = null;
    document.removeEventListener("keydown", onKey);
  }
  function mineHtml() {
    const mine = store.get(notesKey, []);
    if (!mine.length) return "";
    const name = Object.fromEntries(labels);
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    return `<div class="fb-mine"><h3>Notes you've sent</h3>${mine.map((n) =>
      `<div><small>${esc(name[n.section] || n.section)} · ${new Date(n.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small>${esc(n.text)}</div>`).join("")}</div>`;
  }
})();
