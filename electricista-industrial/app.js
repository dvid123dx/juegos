"use strict";

/* =========================================================
   Navegacion de pantallas y logica de la aplicacion
   ========================================================= */

const app = document.getElementById("app");
const crumb = document.getElementById("crumb");
const scoreBadge = document.getElementById("score-badge");

let SCORE = 0;
function addScore(v) {
  SCORE = Math.max(0, SCORE + v);
  scoreBadge.textContent = "Puntos: " + SCORE;
}

const GROUP_LABELS = {
  directo: "Arranque Directo (DOL)",
  reversa: "Inversión de Giro",
  "estrella-delta": "Estrella-Triángulo",
  autotransformador: "Autotransformador",
  "dos-velocidades": "Motor de Dos Velocidades (Dahlander)",
  alarma: "Alarma y Sensores",
};

function clearApp() {
  app.innerHTML = "";
}

function useTemplate(id) {
  const tpl = document.getElementById(id);
  const node = tpl.content.cloneNode(true);
  clearApp();
  app.appendChild(node);
}

document.getElementById("btn-home").addEventListener("click", () => goMenu());

function goMenu() {
  crumb.textContent = "Electricista Industrial";
  useTemplate("tpl-menu");
  app.querySelectorAll(".menu-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      if (nav === "explorer") goExplorer();
      else if (nav === "challenges") goChallenges();
      else if (nav === "planos") goPlanos();
      else if (nav === "quiz") goQuiz();
      else if (nav === "free") goFree();
    });
  });
}

/* ---------------- Explorador 3D ---------------- */

function faceHTML(face) {
  switch (face) {
    case "contactor":
      return `<div class="f-body f-relay">
        <div class="f-coilblock"><span>A1</span><span>A2</span></div>
        <div class="f-poles">
          <div class="f-pole"></div><div class="f-pole"></div><div class="f-pole"></div>
        </div>
        <div class="f-termrow">1/2&nbsp;&nbsp;3/4&nbsp;&nbsp;5/6</div>
      </div>`;
    case "termico":
      return `<div class="f-body f-relay f-termico">
        <div class="f-dial"></div>
        <div class="f-poles"><div class="f-pole"></div><div class="f-pole"></div><div class="f-pole"></div></div>
        <div class="f-termrow">95&nbsp;96</div>
      </div>`;
    case "boton-na":
      return `<div class="f-body f-button"><div class="f-btnhead f-btn-green"></div><div class="f-btnlabel">I</div></div>`;
    case "boton-nc":
      return `<div class="f-body f-button"><div class="f-btnhead f-btn-red"></div><div class="f-btnlabel">O</div></div>`;
    case "selector":
      return `<div class="f-body f-selector"><div class="f-knob"></div><div class="f-termrow">0 · 1 · 2</div></div>`;
    case "piloto":
      return `<div class="f-body f-lamp"><div class="f-bulb"></div></div>`;
    case "timer":
      return `<div class="f-body f-timer"><div class="f-clockface"><div class="f-hand"></div></div><div class="f-termrow">A1 A2 · 15-16-18</div></div>`;
    case "guardamotor":
      return `<div class="f-body f-breaker"><div class="f-lever"></div><div class="f-termrow">1L1 3L2 5L3</div></div>`;
    case "transformador-control":
      return `<div class="f-body f-transformer"><div class="f-coilA"></div><div class="f-coilB"></div></div>`;
    case "autotransformador":
      return `<div class="f-body f-autotrans"><div class="f-wind"></div><div class="f-wind"></div><div class="f-wind"></div></div>`;
    case "motor6":
      return `<div class="f-body f-motor"><div class="f-motorbody"><span>M</span><span class="f-tilde">3~</span></div><div class="f-tbox">U1 V1 W1<br>W2 U2 V2</div></div>`;
    case "fusible":
      return `<div class="f-body f-fuse"><div class="f-fusetube"></div></div>`;
    case "limitswitch":
      return `<div class="f-body f-limitswitch"><div class="f-ls-body"><div class="f-ls-lever"></div><div class="f-ls-roller"></div></div></div>`;
    case "bocina":
      return `<div class="f-body f-bocina"><div class="f-horn-bell"></div><div class="f-horn-wave"></div><div class="f-horn-wave f-horn-wave2"></div></div>`;
    case "rele-auxiliar":
      return `<div class="f-body f-relay"><div class="f-coilblock"><span>A1</span><span>A2</span></div><div class="f-poles f-poles-small"><div class="f-pole"></div><div class="f-pole"></div></div><div class="f-termrow">13/14 21/22</div></div>`;
    default:
      return `<div class="f-body"></div>`;
  }
}

function backFaceHTML(comp) {
  return `<div class="f-back">
    <div class="f-back-tag">${comp.tag}</div>
    <div class="f-back-name">${comp.name}</div>
  </div>`;
}

let explorerRotX = -18, explorerRotY = -28;

function goExplorer() {
  crumb.textContent = "Explorador de Componentes";
  useTemplate("tpl-explorer");
  const list = document.getElementById("explorer-list");
  const info = document.getElementById("explorer-info");
  const cube = document.getElementById("cube3d");
  const stage = document.getElementById("stage3d");

  EXPLORER.forEach((comp, i) => {
    const item = document.createElement("button");
    item.className = "explorer-item";
    item.textContent = comp.name;
    item.addEventListener("click", () => selectComponent(i));
    list.appendChild(item);
  });

  function buildCube(comp) {
    cube.innerHTML = "";
    const faces = [
      { cls: "face front", html: faceHTML(comp.face) },
      { cls: "face back", html: backFaceHTML(comp) },
      { cls: "face right", html: `<div class="f-side"></div>` },
      { cls: "face left", html: `<div class="f-side"></div>` },
      { cls: "face top", html: `<div class="f-side f-side-top"></div>` },
      { cls: "face bottom", html: `<div class="f-side"></div>` },
    ];
    for (const f of faces) {
      const div = document.createElement("div");
      div.className = f.cls;
      div.innerHTML = f.html;
      cube.appendChild(div);
    }
  }

  function applyRot() {
    cube.style.transform = `translateZ(-70px) rotateX(${explorerRotX}deg) rotateY(${explorerRotY}deg)`;
  }

  function selectComponent(i) {
    const comp = EXPLORER[i];
    list.querySelectorAll(".explorer-item").forEach((el, idx) => el.classList.toggle("active", idx === i));
    buildCube(comp);
    applyRot();
    info.innerHTML = `<h3>${comp.name}</h3><div class="explorer-tag">${comp.tag}</div><p>${comp.desc}</p>`;
  }

  selectComponent(0);

  let dragging = false, lastX = 0, lastY = 0;
  stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    explorerRotY += (e.clientX - lastX) * 0.5;
    explorerRotX -= (e.clientY - lastY) * 0.5;
    explorerRotX = Math.max(-80, Math.min(80, explorerRotX));
    lastX = e.clientX; lastY = e.clientY;
    applyRot();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointerleave", () => { dragging = false; });

  let autoSpin = true;
  stage.addEventListener("pointerdown", () => { autoSpin = false; });
  (function spin() {
    if (autoSpin) explorerRotY += 0.15;
    applyRot();
    requestAnimationFrame(spin);
  })();
}

/* ---------------- Retos de cableado ---------------- */

function goChallenges() {
  crumb.textContent = "Retos de Cableado";
  useTemplate("tpl-challenges");
  const container = document.getElementById("challenge-groups");
  const groups = {};
  for (const ex of EXERCISES) {
    groups[ex.group] = groups[ex.group] || [];
    groups[ex.group].push(ex);
  }
  for (const g in groups) {
    const box = document.createElement("div");
    box.className = "challenge-group";
    box.innerHTML = `<h3>${GROUP_LABELS[g] || g}</h3>`;
    const row = document.createElement("div");
    row.className = "challenge-row";
    for (const ex of groups[g]) {
      const card = document.createElement("button");
      card.className = "challenge-card";
      card.innerHTML = `<span class="challenge-kind">${ex.kind === "control" ? "Control" : "Fuerza"}</span>
        <span class="challenge-name">${ex.title}</span>`;
      card.addEventListener("click", () => goWiring(ex.id));
      row.appendChild(card);
    }
    box.appendChild(row);
    container.appendChild(box);
  }
}

/* ---------------- Panel de operacion 3D ---------------- */

function buildPanel3D(box, exercise, diagram) {
  box.innerHTML = "";
  const buttons = exercise.components.filter((c) => c.manual);
  const lamps = exercise.components.filter((c) => c.tpl.isLamp);
  const items = {};

  const nameplate = document.createElement("div");
  nameplate.className = "p3d-nameplate";
  nameplate.textContent = exercise.title.split("—")[0].trim().toUpperCase();
  box.appendChild(nameplate);

  function place(list, y) {
    const n = list.length;
    list.forEach((comp, i) => {
      const x = (420 / (n + 1)) * (i + 1);
      const el = document.createElement("div");
      el.className = "p3d-item";
      el.style.left = x - 27 + "px";
      el.style.top = y + "px";
      box.appendChild(el);
      items[comp.id] = el;

      if (comp.manual) {
        const kind = comp.tpl.btnKind;
        el.innerHTML = `<div class="p3d-bezel"><div class="p3d-dome ${kind === "NO" ? "p3d-dome-green" : "p3d-dome-red"}"></div></div><div class="p3d-caption">${comp.label}</div>`;
        const dome = el.querySelector(".p3d-dome");
        const press = (e) => {
          e.preventDefault(); e.stopPropagation();
          el.classList.add("pressed");
          diagram.pressManual(comp.id, true);
        };
        const release = (e) => {
          e.preventDefault();
          el.classList.remove("pressed");
          diagram.pressManual(comp.id, false);
        };
        dome.addEventListener("mousedown", press);
        dome.addEventListener("touchstart", press, { passive: false });
        window.addEventListener("mouseup", release);
        dome.addEventListener("touchend", release);
        dome.addEventListener("touchcancel", release);
      } else {
        el.innerHTML = `<div class="p3d-lamp-housing"><div class="p3d-lamp-glass"></div></div><div class="p3d-caption">${comp.label}</div>`;
      }
    });
  }

  place(buttons, 32);
  place(lamps, 120);

  function refresh() {
    for (const comp of lamps) {
      const el = items[comp.id];
      if (!el) continue;
      const glass = el.querySelector(".p3d-lamp-glass");
      const on = diagram.isEnergized(comp.id);
      glass.classList.toggle("on-green", on && comp.tpl.lampColor === "green");
      glass.classList.toggle("on-red", on && comp.tpl.lampColor === "red");
    }
  }

  const stage = document.getElementById("panel3d-stage");
  let rotX = -10, rotY = 18;
  function applyRot() { box.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`; }
  applyRot();
  let dragging = false, lastX = 0, lastY = 0;
  stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    rotY += (e.clientX - lastX) * 0.4;
    rotX -= (e.clientY - lastY) * 0.4;
    rotX = Math.max(-70, Math.min(70, rotX));
    lastX = e.clientX; lastY = e.clientY;
    applyRot();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointerleave", () => { dragging = false; });

  refresh();
  return { refresh };
}

/* ---------------- Pantalla de cableado ---------------- */

function goWiring(exId) {
  const exercise = EXERCISES.find((e) => e.id === exId);
  crumb.textContent = exercise.title;
  useTemplate("tpl-wiring");
  document.getElementById("wiring-title").textContent = exercise.title;
  document.getElementById("wiring-brief").textContent = exercise.brief;
  const svg = document.getElementById("wiring-svg");
  const statusEl = document.getElementById("wiring-status");
  const logEl = document.getElementById("wiring-log");
  const btnCheck = document.getElementById("btn-check");
  const btnHint = document.getElementById("btn-hint");
  const btnClear = document.getElementById("btn-clear");
  const btnSim = document.getElementById("btn-simulate");

  let solvedOnce = false;
  let panel3d = null;
  const panelSection = document.getElementById("panel3d-section");

  const diagram = new Diagram(svg, exercise, {
    onChange: () => {
      statusEl.textContent = `Cables colocados: ${diagram.wireCount()}`;
      statusEl.className = "wiring-status";
    },
    onSolve: () => refreshPanel3D(),
  });

  if (exercise.source) {
    panelSection.classList.remove("hidden");
    panel3d = buildPanel3D(document.getElementById("panel3d-box"), exercise, diagram);
  } else {
    panelSection.classList.add("hidden");
  }

  function refreshPanel3D() {
    if (panel3d) panel3d.refresh();
  }

  function log(msg) {
    const p = document.createElement("div");
    p.className = "log-line";
    p.textContent = msg;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  btnCheck.addEventListener("click", () => {
    const val = diagram.validate();
    diagram.markValidation(val);
    if (val.perfect) {
      statusEl.textContent = exercise.source
        ? `¡Circuito correcto! (${val.correctNets}/${val.totalNets} nodos) — ya puedes presionar los botones (arriba, en el plano, o en el panel 3D) para operar el circuito en tiempo real.`
        : `¡Circuito correcto! (${val.correctNets}/${val.totalNets} nodos)`;
      statusEl.className = "wiring-status status-ok";
      btnSim.disabled = false;
      if (!solvedOnce) { addScore(100); solvedOnce = true; }
    } else if (val.shorts > 0) {
      statusEl.textContent = `Hay ${val.shorts} corto(s) circuito(s) no deseado(s) entre nodos distintos. Revisa las terminales en rojo.`;
      statusEl.className = "wiring-status status-bad";
      btnSim.disabled = true;
    } else {
      statusEl.textContent = `Van ${val.correctNets}/${val.totalNets} nodos correctos. Sigue conectando (terminales en rojo aún no completan su nodo).`;
      statusEl.className = "wiring-status status-warn";
      btnSim.disabled = true;
    }
  });

  btnHint.addEventListener("click", () => {
    const val = diagram.validate();
    const bad = val.results.find((r) => !r.ok);
    if (!bad) { statusEl.textContent = "Ya tienes todos los nodos completos — presiona Verificar."; return; }
    addScore(-10);
    statusEl.textContent = `Pista: conecta juntas estas terminales — ${bad.net.join(", ")}`;
    statusEl.className = "wiring-status status-warn";
  });

  btnClear.addEventListener("click", () => {
    diagram.clearAll();
    diagram.markValidation({ results: exercise.nets.map((n) => ({ net: n, ok: false })) });
    statusEl.textContent = "Cableado borrado.";
    statusEl.className = "wiring-status";
    btnSim.disabled = true;
  });

  btnSim.addEventListener("click", async () => {
    btnSim.disabled = true;
    btnCheck.disabled = true;
    logEl.innerHTML = "";
    await diagram.simulate(exercise.simulation, log);
    btnCheck.disabled = false;
    btnSim.disabled = false;
  });
}

/* ---------------- Planos de referencia ---------------- */

function goPlanos() {
  crumb.textContent = "Planos de Referencia";
  useTemplate("tpl-planos");
  const list = document.getElementById("planos-list");
  const svg = document.getElementById("planos-svg");

  function show(ex) {
    const solved = {
      ...ex,
      staticWires: ex.nets.flatMap((net) => {
        const pairs = [];
        for (let i = 1; i < net.length; i++) pairs.push([net[0], net[i]]);
        return pairs;
      }),
    };
    new Diagram(svg, solved, { readonly: true });
  }

  EXERCISES.forEach((ex, i) => {
    const item = document.createElement("button");
    item.className = "planos-item";
    item.textContent = ex.title;
    item.addEventListener("click", () => {
      list.querySelectorAll(".planos-item").forEach((el, idx) => el.classList.toggle("active", idx === i));
      show(ex);
    });
    list.appendChild(item);
  });

  list.querySelector(".planos-item").classList.add("active");
  show(EXERCISES[0]);
}

/* ---------------- Quiz ---------------- */

function goQuiz() {
  crumb.textContent = "Quiz Teórico";
  useTemplate("tpl-quiz");
  const body = document.getElementById("quiz-body");

  const pool = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 10);
  let idx = 0, correct = 0;

  function renderQ() {
    if (idx >= pool.length) {
      body.innerHTML = `<div class="quiz-result">
        <h3>Resultado: ${correct} / ${pool.length}</h3>
        <p>${correct === pool.length ? "¡Excelente! Dominas la teoría." : correct >= pool.length * 0.6 ? "Buen trabajo, sigue repasando." : "Repasa el Explorador y los Planos, y vuelve a intentarlo."}</p>
        <button class="btn btn-primary" id="quiz-restart">Reintentar</button>
      </div>`;
      document.getElementById("quiz-restart").addEventListener("click", goQuiz);
      return;
    }
    const item = pool[idx];
    body.innerHTML = `
      <div class="quiz-progress">Pregunta ${idx + 1} de ${pool.length}</div>
      <div class="quiz-question">${item.q}</div>
      <div class="quiz-options" id="quiz-options"></div>
    `;
    const opts = document.getElementById("quiz-options");
    item.a.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "quiz-option";
      b.textContent = opt;
      b.addEventListener("click", () => {
        const isCorrect = i === item.correct;
        opts.querySelectorAll(".quiz-option").forEach((el, oi) => {
          el.classList.add(oi === item.correct ? "opt-correct" : (oi === i ? "opt-wrong" : "opt-disabled"));
          el.disabled = true;
        });
        if (isCorrect) { correct++; addScore(20); } else { addScore(-5); }
        setTimeout(() => { idx++; renderQ(); }, 1100);
      });
      opts.appendChild(b);
    });
  }
  renderQ();
}

/* ---------------- Modo libre ---------------- */

const FREE_PALETTE = [
  { key: "coil", label: "Bobina (contactor/relé)", make: (n) => ({ prefix: "K", tpl: () => TPL.coil("K" + n, "bobina") }) },
  { key: "btnNO", label: "Botón NA (marcha)", make: (n) => ({ prefix: "S", tpl: () => TPL.button("NO", "3-4", "3", "4"), manual: true }) },
  { key: "btnNC", label: "Botón NC (paro)", make: (n) => ({ prefix: "S", tpl: () => TPL.button("NC", "1-2", "1", "2"), manual: true }) },
  { key: "contNO", label: "Contacto auxiliar NA", make: (n) => ({ prefix: "C", tpl: () => TPL.contact("NO", "13-14", "13", "14") }) },
  { key: "contNC", label: "Contacto auxiliar NC", make: (n) => ({ prefix: "C", tpl: () => TPL.contact("NC", "21-22", "21", "22") }) },
  { key: "lampG", label: "Lámpara verde", make: (n) => ({ prefix: "H", tpl: () => TPL.lamp("H" + n, "green") }) },
  { key: "lampR", label: "Lámpara roja", make: (n) => ({ prefix: "H", tpl: () => TPL.lamp("H" + n, "red") }) },
  { key: "horn", label: "Bocina", make: (n) => ({ prefix: "H", tpl: () => TPL.horn("H" + n) }) },
  { key: "ls", label: "Interruptor de límite", make: (n) => ({ prefix: "LS", tpl: () => TPL.limitSwitch("NO", "3-4", "3", "4"), manual: true }) },
  { key: "brk", label: "Guardamotor (interruptor)", make: (n) => ({ prefix: "Q", tpl: () => TPL.breaker("Q" + n, "1", "2"), toggle: true }) },
];

function goFree() {
  crumb.textContent = "Modo Libre";
  useTemplate("tpl-free");
  const svg = document.getElementById("free-svg");
  const statusEl = document.getElementById("free-status");
  const paletteEl = document.getElementById("free-palette");
  const inspectorEl = document.getElementById("free-inspector");
  const counters = {};
  let armedType = null;

  function freshExercise() {
    return {
      id: "free",
      vb: [900, 600],
      source: ["freeL"],
      return: ["freeN"],
      components: [
        railComp("freeL", true, 760, "L", 460, 50),
        railComp("freeN", true, 760, "N", 460, 550),
      ],
      nets: [],
    };
  }

  let diagram = new Diagram(svg, freshExercise(), {
    selectable: true,
    onChange: () => { statusEl.textContent = `Cables colocados: ${diagram.wireCount()}`; },
    onSelect: (id) => renderInspector(id),
  });

  paletteEl.innerHTML = "";
  for (const item of FREE_PALETTE) {
    const b = document.createElement("button");
    b.className = "palette-btn";
    b.textContent = item.label;
    b.addEventListener("click", () => {
      armedType = item.key;
      paletteEl.querySelectorAll(".palette-btn").forEach((el) => el.classList.remove("armed"));
      b.classList.add("armed");
      statusEl.textContent = `Haz clic en el lienzo para colocar: ${item.label}`;
    });
    paletteEl.appendChild(b);
  }

  svg.addEventListener("click", (e) => {
    if (!armedType || e.target !== svg) return;
    const item = FREE_PALETTE.find((p) => p.key === armedType);
    counters[item.key] = (counters[item.key] || 0) + 1;
    const spec = item.make(counters[item.key]);
    const id = spec.prefix + counters[item.key];
    const pt = diagram.toSvgPoint(e.clientX, e.clientY);
    const comp = { id, label: id, tpl: spec.tpl(), x: pt.x, y: pt.y };
    if (spec.manual) comp.manual = true;
    if (spec.toggle) comp.toggle = true;
    diagram.addComponent(comp);
    statusEl.textContent = `${id} colocado. Sigue colocando piezas o conecta terminales.`;
  });

  function renderInspector(id) {
    if (!id) { inspectorEl.innerHTML = ""; return; }
    const comp = diagram.exercise.components.find((c) => c.id === id);
    if (!comp) { inspectorEl.innerHTML = ""; return; }
    let html = `<div class="inspector-title">${comp.label}</div>`;
    if (comp.tpl.gate && !comp.manual && !comp.toggle) {
      const coils = diagram.exercise.components.filter((c) => c.tpl.isCoil);
      html += `<label class="inspector-label">Vincular a bobina:</label>
        <select id="inspector-link">
          <option value="">— sin vincular (fijo) —</option>
          ${coils.map((c) => `<option value="${c.id}" ${comp.derivedFrom === c.id ? "selected" : ""}>${c.label}</option>`).join("")}
        </select>
        <p class="inspector-hint">El contacto ${comp.tpl.restClosed ? "abrirá" : "cerrará"} cuando esa bobina se energice.</p>`;
    } else if (comp.manual) {
      html += `<p class="inspector-hint">Botón/sensor manual: mantenlo presionado directamente en el lienzo.</p>`;
    } else if (comp.toggle) {
      html += `<p class="inspector-hint">Interruptor de enclavamiento: un clic lo deja fijo en su nueva posición.</p>`;
    } else if (comp.tpl.isCoil) {
      html += `<p class="inspector-hint">Bobina: se energiza cuando su A1 y A2 quedan conectados a L y N por un camino cerrado.</p>`;
    } else if (comp.tpl.isLamp) {
      html += `<p class="inspector-hint">Carga (lámpara/bocina): se activa cuando queda conectada entre L y N.</p>`;
    }
    inspectorEl.innerHTML = html;
    const sel = document.getElementById("inspector-link");
    if (sel) {
      sel.addEventListener("change", () => {
        comp.derivedFrom = sel.value || undefined;
        diagram.solve();
      });
    }
  }

  document.getElementById("free-undo-wire").addEventListener("click", () => {
    if (!diagram.undoLastWire()) statusEl.textContent = "No hay cables que deshacer.";
  });
  document.getElementById("free-delete").addEventListener("click", () => {
    if (!diagram.removeSelected()) statusEl.textContent = "Selecciona primero una pieza haciendo clic sobre ella.";
    else { inspectorEl.innerHTML = ""; statusEl.textContent = "Pieza eliminada."; }
  });
  document.getElementById("free-clear").addEventListener("click", () => {
    diagram = new Diagram(svg, freshExercise(), {
      selectable: true,
      onChange: () => { statusEl.textContent = `Cables colocados: ${diagram.wireCount()}`; },
      onSelect: (id) => renderInspector(id),
    });
    inspectorEl.innerHTML = "";
    statusEl.textContent = "Lienzo reiniciado — solo quedan los rieles L y N.";
  });
}

goMenu();
