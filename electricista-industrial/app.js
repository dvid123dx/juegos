"use strict";

/* =========================================================
   Navegacion de pantallas y logica de la aplicacion
   ========================================================= */

const app = document.getElementById("app");
const crumb = document.getElementById("crumb");
const scoreBadge = document.getElementById("score-badge");

// progreso persistente: puntaje, retos resueltos y diagnosticos resueltos,
// guardados en localStorage para que sobrevivan a un cierre del navegador
const Progress = (() => {
  let data = { solved: [], diagsSolved: [], score: 0 };
  try {
    const raw = localStorage.getItem("ei-progress");
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* almacenamiento corrupto: seguimos con los valores por defecto */ }
  function save() { localStorage.setItem("ei-progress", JSON.stringify(data)); }
  return {
    isSolved(id) { return data.solved.includes(id); },
    markSolved(id) { if (!data.solved.includes(id)) { data.solved.push(id); save(); } },
    isDiagSolved(id) { return data.diagsSolved.includes(id); },
    markDiagSolved(id) { if (!data.diagsSolved.includes(id)) { data.diagsSolved.push(id); save(); } },
    solvedCount() { return data.solved.length; },
    getScore() { return data.score; },
    setScore(v) { data.score = v; save(); },
  };
})();

let SCORE = Progress.getScore();
scoreBadge.textContent = "Puntos: " + SCORE;
function addScore(v) {
  SCORE = Math.max(0, SCORE + v);
  scoreBadge.textContent = "Puntos: " + SCORE;
  Progress.setScore(SCORE);
}

const GROUP_LABELS = {
  directo: "Arranque Directo (DOL)",
  reversa: "Inversión de Giro",
  "estrella-delta": "Estrella-Triángulo",
  autotransformador: "Autotransformador",
  "dos-velocidades": "Motor de Dos Velocidades (Dahlander)",
  alarma: "Alarma y Sensores",
  variador: "Variador de Frecuencia (VFD)",
  chopper: "Motor DC con Chopper",
  botoneras: "Control Multi-Estación (Botoneras)",
  "arranque-suave": "Arrancador Suave (Soft Starter)",
  secuencial: "Arranque Secuencial de Motores",
  avanzado: "Retos Combinados",
  residencial: "Instalación Residencial",
  bombeo: "Sistemas de Bombeo",
  eficiencia: "Eficiencia Energética",
  automatizacion: "Automatización y Secuencias",
  seguridad: "Seguridad y Relé Maestro (MCR)",
  neumatica: "Sistemas Neumáticos",
  sensores: "Sensores y Clasificación",
  hvac: "HVAC y Ventilación",
  respaldo: "Energía de Respaldo (ATS)",
  calefaccion: "Calefacción y Protección de Motores",
  izaje: "Grúas y Polipastos (Izaje)",
};

const LEVEL_LABELS = {
  1: "Nivel 1 · Básico",
  2: "Nivel 2 · Intermedio",
  3: "Nivel 3 · Avanzado",
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
      else if (nav === "diagnostico") goDiagnostico();
      else if (nav === "referencia") goReferencia();
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
    case "vfd":
      return `<div class="f-body f-vfd"><div class="f-vfd-screen">60.0 Hz</div><div class="f-vfd-bars"><span></span><span></span><span></span><span></span><span></span></div><div class="f-termrow">L1 L2 L3 · U V W</div></div>`;
    case "chopper":
      return `<div class="f-body f-vfd"><div class="f-chopper-icon">⚡PWM</div><div class="f-termrow">L+ L- · A+ A-</div></div>`;
    case "motor-dc":
      return `<div class="f-body f-motor"><div class="f-motorbody"><span>M</span><span class="f-tilde">=</span></div><div class="f-tbox">A1&nbsp;&nbsp;&nbsp;A2</div></div>`;
    case "selector-2pos":
      return `<div class="f-body f-selector"><div class="f-knob f-knob-selector"></div><div class="f-termrow">0 · 1</div></div>`;
    case "softstarter":
      return `<div class="f-body f-vfd"><div class="f-vfd-screen">100 %V</div><div class="f-ss-ramp"></div><div class="f-termrow">L1 L2 L3 · T1 T2 T3</div></div>`;
    case "seta":
      return `<div class="f-body f-seta"><div class="f-seta-ring"><div class="f-seta-mushroom"></div></div><div class="f-termrow">1&nbsp;&nbsp;2</div></div>`;
    case "mcb":
      return `<div class="f-body f-breaker f-mcb"><div class="f-lever"></div><div class="f-termrow">1&nbsp;&nbsp;2</div></div>`;
    case "clema":
      return `<div class="f-body f-clema"><div class="f-clema-block"></div><div class="f-clema-block"></div><div class="f-clema-block"></div></div>`;
    case "sensor-inductivo":
      return `<div class="f-body f-sensor"><div class="f-sensor-body"></div><div class="f-sensor-led"></div><div class="f-termrow">1&nbsp;&nbsp;2</div></div>`;
    case "sensor-foto":
      return `<div class="f-body f-sensor"><div class="f-sensor-body"></div><div class="f-sensor-beam"></div><div class="f-termrow">1&nbsp;&nbsp;2</div></div>`;
    case "actuador":
      return `<div class="f-body f-actuador"><div class="f-act-piston"></div><div class="f-termrow">X1&nbsp;&nbsp;X2</div></div>`;
    case "motor-monofasico":
      return `<div class="f-body f-motor"><div class="f-motorbody"><span>M</span><span class="f-tilde">1~</span></div><div class="f-cap"></div><div class="f-tbox">L&nbsp;&nbsp;&nbsp;N</div></div>`;
    case "presostato":
      return `<div class="f-body f-pressure"><div class="f-gauge"><div class="f-needle"></div></div><div class="f-termrow">1&nbsp;&nbsp;2</div></div>`;
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
    info.innerHTML = `<h3>${comp.name}</h3><div class="explorer-tag">${comp.tag}</div><p>${comp.desc}</p>${comp.notes ? `<p class="explorer-notes">🔧 ${comp.notes}</p>` : ""}`;
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
  const progressEl = document.getElementById("challenges-progress");
  if (progressEl) progressEl.textContent = `${Progress.solvedCount()}/${EXERCISES.length} retos resueltos`;
  const byLevel = { 1: [], 2: [], 3: [] };
  for (const ex of EXERCISES) {
    const lvl = ex.level || 1;
    (byLevel[lvl] = byLevel[lvl] || []).push(ex);
  }
  for (const lvl of [1, 2, 3]) {
    const list = byLevel[lvl];
    if (!list || !list.length) continue;
    const box = document.createElement("div");
    box.className = "challenge-group";
    box.innerHTML = `<h3 class="level-h level-${lvl}">${LEVEL_LABELS[lvl]}</h3>`;
    const row = document.createElement("div");
    row.className = "challenge-row";
    for (const ex of list) {
      const card = document.createElement("button");
      card.className = "challenge-card" + (Progress.isSolved(ex.id) ? " challenge-solved" : "");
      const kindLabel = ex.combined ? "Control + Fuerza" : (ex.kind === "control" ? "Control" : ex.kind === "fuerza" ? "Fuerza" : "Circuito");
      card.innerHTML = `${Progress.isSolved(ex.id) ? '<span class="challenge-check">✓</span>' : ""}
        <span class="challenge-kind">${kindLabel}</span>
        <span class="challenge-topic">${GROUP_LABELS[ex.group] || ex.group}</span>
        <span class="challenge-name">${ex.title}</span>`;
      card.addEventListener("click", () => (ex.combined ? goWiringCombined(ex.id) : goWiring(ex.id)));
      row.appendChild(card);
    }
    box.appendChild(row);
    container.appendChild(box);
  }
}

/* ---------------- Modo Diagnostico ---------------- */

function goDiagnostico() {
  crumb.textContent = "Modo Diagnóstico";
  useTemplate("tpl-diagnostics");
  const row = document.getElementById("diagnostics-list");
  for (const diag of DIAGNOSTICS) {
    const card = document.createElement("button");
    card.className = "challenge-card" + (Progress.isDiagSolved(diag.id) ? " challenge-solved" : "");
    card.innerHTML = `${Progress.isDiagSolved(diag.id) ? '<span class="challenge-check">✓</span>' : ""}
      <span class="challenge-kind" style="background:rgba(255,107,107,0.15);color:#ff6b6b;">Falla reportada</span>
      <span class="challenge-topic">${diag.exercise.title}</span>
      <span class="challenge-name">${diag.title}</span>`;
    card.addEventListener("click", () => goWiring(diag.exercise.id, diag));
    row.appendChild(card);
  }
}

/* ---------------- Manual de Referencia ---------------- */

function goReferencia() {
  crumb.textContent = "Manual de Referencia";
  useTemplate("tpl-referencia");
}

/* ---------------- Panel de operacion 3D ---------------- */

function buildPanel3D(box, exercise, diagram) {
  box.innerHTML = "";
  const controls = exercise.components.filter((c) => c.manual || c.toggle);
  const lamps = exercise.components.filter((c) => c.tpl.isLamp);
  const items = {};

  // size the panel to how many pieces it actually holds, with a tight,
  // constant pitch between them, instead of always stretching to a fixed
  // width — so 2 controls sit close together and 4 still all fit on screen
  const PITCH = 92;
  const cols = Math.max(controls.length, lamps.length, 1);
  const boxW = Math.max(200, cols * PITCH + 40);
  const rows = (controls.length ? 1 : 0) + (lamps.length ? 1 : 0);
  const boxH = rows >= 2 ? 178 : 110;
  box.style.width = boxW + "px";
  box.style.height = boxH + "px";

  // the panel now lives in the narrow sidebar (next to the diagram, so it's
  // always in view without scrolling) — shrink it to fit when it holds more
  // pieces than that column is wide, instead of overflowing/getting clipped
  const stageEl = document.getElementById("panel3d-stage");
  const avail = (stageEl ? stageEl.clientWidth : 320) - 16;
  const scale = boxW > avail ? Math.max(0.55, avail / boxW) : 1;

  const nameplate = document.createElement("div");
  nameplate.className = "p3d-nameplate";
  nameplate.textContent = exercise.title.split("—")[0].trim().toUpperCase();
  box.appendChild(nameplate);

  function place(list, y) {
    const n = list.length;
    const rowW = n * PITCH;
    const startX = (boxW - rowW) / 2 + PITCH / 2;
    list.forEach((comp, i) => {
      const x = startX + i * PITCH;
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
      } else if (comp.toggle) {
        el.innerHTML = `<div class="p3d-bezel"><div class="p3d-switch"><div class="p3d-switch-nub"></div></div></div><div class="p3d-caption">${comp.label}</div>`;
        const sw = el.querySelector(".p3d-switch");
        sw.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          diagram.toggleManual(comp.id);
        });
      } else {
        el.innerHTML = `<div class="p3d-lamp-housing"><div class="p3d-lamp-glass"></div></div><div class="p3d-caption">${comp.label}</div>`;
      }
    });
  }

  place(controls, 28);
  place(lamps, controls.length ? 100 : 28);

  function refresh() {
    for (const comp of controls) {
      if (!comp.toggle) continue;
      const el = items[comp.id];
      if (el) el.querySelector(".p3d-switch").classList.toggle("on", diagram.isClosed(comp.id));
    }
    for (const comp of lamps) {
      const el = items[comp.id];
      if (!el) continue;
      const glass = el.querySelector(".p3d-lamp-glass");
      const on = diagram.isEnergized(comp.id);
      glass.classList.toggle("on-green", on && comp.tpl.lampColor === "green");
      glass.classList.toggle("on-red", on && comp.tpl.lampColor === "red");
    }
  }

  const stage = stageEl;
  let rotX = -10, rotY = 18;
  function applyRot() { box.style.transform = `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`; }
  applyRot();
  let dragging = false, lastX = 0, lastY = 0;
  stage.addEventListener("pointerdown", (e) => {
    // don't hijack taps on the buttons/switches themselves: capturing the
    // pointer here retargets their click/mouseup events to the stage,
    // which silently broke every control mounted on the 3D panel
    if (e.target.closest(".p3d-dome, .p3d-switch")) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId);
  });
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

// turn an internal terminal id ("VFDRUNaux.13", "railL@-210,0", "K1coil.A1")
// into something a person can actually read and match against the
// component labels printed on the diagram ("VFD (terminal 13)", "riel L").
function friendlyTerminal(id, exercise) {
  const plain = id.split("@")[0];
  const dot = plain.indexOf(".");
  const compId = dot === -1 ? plain : plain.slice(0, dot);
  const term = dot === -1 ? null : plain.slice(dot + 1);
  const comp = exercise.components.find((c) => c.id === compId);
  if (comp && comp.tpl && comp.tpl.isRail) return `riel ${compId.replace(/^rail/, "")}`;
  const label = (comp && comp.label) || compId;
  return term ? `${label} (terminal ${term})` : label;
}

// `diag`, when provided, turns this into a Diagnostic Mode screen: the
// canvas starts pre-wired (correctly, except for one deliberate fault)
// instead of blank, and the brief is replaced with the reported symptom.
function goWiring(exId, diag) {
  const exercise = diag ? diag.exercise : EXERCISES.find((e) => e.id === exId);
  crumb.textContent = diag ? "Diagnóstico: " + diag.title : exercise.title;
  useTemplate("tpl-wiring");
  document.getElementById("wiring-title").textContent = diag ? "🔧 " + diag.title : exercise.title;
  document.getElementById("wiring-brief").textContent = diag ? diag.symptom : exercise.brief;
  const svg = document.getElementById("wiring-svg");
  const statusEl = document.getElementById("wiring-status");
  const logEl = document.getElementById("wiring-log");
  const btnCheck = document.getElementById("btn-check");
  const btnHint = document.getElementById("btn-hint");
  const btnClear = document.getElementById("btn-clear");
  const btnUndo = document.getElementById("btn-undo");
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

  if (diag) {
    diagram.presetWires(diag.faultWires);
    statusEl.textContent = `Circuito pre-cableado con ${diagram.wireCount()} cables — uno de ellos está mal. Presiona los botones (arriba, en el plano, o en el panel 3D) para observar la falla en vivo, luego usa "Verificar" para localizarla.`;
  }

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
      if (window.SFX) SFX.success();
      if (!solvedOnce) {
        addScore(100);
        solvedOnce = true;
        if (diag) Progress.markDiagSolved(diag.id); else Progress.markSolved(exercise.id);
      }
    } else if (val.shorts > 0) {
      statusEl.textContent = `Hay ${val.shorts} corto(s) circuito(s) no deseado(s) entre nodos distintos. Las terminales en rojo parpadean — revísalas.`;
      statusEl.className = "wiring-status status-bad";
      if (window.SFX) SFX.spark();
    } else {
      if (window.SFX) SFX.error();
      statusEl.textContent = `Van ${val.correctNets}/${val.totalNets} nodos correctos. Las terminales en rojo (parpadeando) aún no completan su nodo. Si te atoras, "Ver demostración guiada" te muestra el cableado correcto.`;
      statusEl.className = "wiring-status status-warn";
    }
  });

  btnHint.addEventListener("click", () => {
    const val = diagram.validate();
    const bad = val.results.find((r) => !r.ok);
    if (!bad) { statusEl.textContent = "Ya tienes todos los nodos completos — presiona Verificar."; return; }
    addScore(-10);
    const names = bad.net.map((id) => friendlyTerminal(id, exercise));
    statusEl.textContent = `Pista: estas terminales deben quedar unidas (no hace falta que sea un cable directo entre todas, pueden pasar por otras ya conectadas): ${names.join("  •  ")}`;
    statusEl.className = "wiring-status status-warn";
  });

  btnClear.addEventListener("click", () => {
    diagram.clearAll();
    diagram.markValidation({ results: exercise.nets.map((n) => ({ net: n, ok: false })) });
    statusEl.textContent = "Cableado borrado.";
    statusEl.className = "wiring-status";
  });

  btnUndo.addEventListener("click", () => {
    if (diagram.undoLastWire()) {
      statusEl.textContent = `Último cable eliminado. Cables colocados: ${diagram.wireCount()}`;
      statusEl.className = "wiring-status";
    } else {
      statusEl.textContent = "No hay cables que deshacer.";
    }
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

/* ---------------- Pantalla de cableado combinada (control + fuerza) ---------------- */

// exercises with `combined: true` show both circuits side by side, wired
// and validated independently, but sharing one panel 3D and one guided
// simulation — so the same references (K1, F2...) are visibly the same
// physical devices in both drawings.
function goWiringCombined(exId) {
  const exercise = EXERCISES.find((e) => e.id === exId);
  crumb.textContent = exercise.title;
  useTemplate("tpl-wiring-combined");
  document.getElementById("wiringc-title").textContent = exercise.title;
  document.getElementById("wiringc-brief").textContent = exercise.brief;
  const statusEl = document.getElementById("wiringc-status");
  const statusC = document.getElementById("wiringc-status-c");
  const statusP = document.getElementById("wiringc-status-p");
  const logEl = document.getElementById("wiringc-log");
  const btnSim = document.getElementById("btnc-simulate");
  const btnHint = document.getElementById("btnc-hint");
  const panelSection = document.getElementById("panel3d-section");

  let solvedOnce = false;
  let panel3d = null;
  let perfectC = false, perfectP = false;

  function refreshPanel3D() {
    if (panel3d) panel3d.refresh();
  }

  const dControl = new Diagram(document.getElementById("wiringc-svg-c"), exercise.control, {
    onChange: () => { statusC.textContent = `Cables colocados: ${dControl.wireCount()}`; statusC.className = "pane-status"; },
    onSolve: () => refreshPanel3D(),
  });
  const dPower = new Diagram(document.getElementById("wiringc-svg-p"), exercise.power, {
    onChange: () => { statusP.textContent = `Cables colocados: ${dPower.wireCount()}`; statusP.className = "pane-status"; },
  });

  if (exercise.control.source) {
    panelSection.classList.remove("hidden");
    panel3d = buildPanel3D(document.getElementById("panel3d-box"), { ...exercise.control, title: exercise.title }, dControl);
  } else {
    panelSection.classList.add("hidden");
  }

  function log(msg) {
    const p = document.createElement("div");
    p.className = "log-line";
    p.textContent = msg;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateOverall() {
    if (perfectC && perfectP) {
      statusEl.textContent = "¡Control y fuerza correctos! Ya puedes presionar los botones (arriba, en el plano, o en el panel 3D) para operar ambos circuitos en tiempo real.";
      statusEl.className = "wiring-status status-ok";
      if (!solvedOnce) { addScore(150); solvedOnce = true; Progress.markSolved(exercise.id); }
    } else {
      statusEl.textContent = "Verifica el circuito de control y el de fuerza por separado. Las terminales en rojo (parpadeando) marcan el problema. Si te atoras, \"Ver demostración guiada\" te muestra el resultado esperado sin necesidad de terminar el cableado.";
      statusEl.className = "wiring-status";
    }
  }

  function bindPane(d, ex, statusPane, btnCheckId, btnUndoId, btnClearId, setPerfect) {
    document.getElementById(btnCheckId).addEventListener("click", () => {
      const val = d.validate();
      d.markValidation(val);
      if (val.perfect) {
        statusPane.textContent = `¡Correcto! (${val.correctNets}/${val.totalNets} nodos)`;
        statusPane.className = "pane-status status-ok";
        if (window.SFX) SFX.success();
        setPerfect(true);
      } else if (val.shorts > 0) {
        statusPane.textContent = `${val.shorts} corto(s) circuito(s) no deseado(s). Revisa las terminales en rojo.`;
        statusPane.className = "pane-status status-bad";
        if (window.SFX) SFX.spark();
        setPerfect(false);
      } else {
        statusPane.textContent = `Van ${val.correctNets}/${val.totalNets} nodos correctos.`;
        statusPane.className = "pane-status status-warn";
        if (window.SFX) SFX.error();
        setPerfect(false);
      }
      updateOverall();
    });
    document.getElementById(btnUndoId).addEventListener("click", () => {
      if (d.undoLastWire()) {
        statusPane.textContent = `Último cable eliminado. Cables colocados: ${d.wireCount()}`;
      } else {
        statusPane.textContent = "No hay cables que deshacer.";
      }
      statusPane.className = "pane-status";
      setPerfect(false);
      updateOverall();
    });
    document.getElementById(btnClearId).addEventListener("click", () => {
      d.clearAll();
      d.markValidation({ results: ex.nets.map((n) => ({ net: n, ok: false })) });
      statusPane.textContent = "Cableado borrado.";
      statusPane.className = "pane-status";
      setPerfect(false);
      updateOverall();
    });
  }

  bindPane(dControl, exercise.control, statusC, "btnc-check-c", "btnc-undo-c", "btnc-clear-c", (v) => { perfectC = v; });
  bindPane(dPower, exercise.power, statusP, "btnc-check-p", "btnc-undo-p", "btnc-clear-p", (v) => { perfectP = v; });

  btnHint.addEventListener("click", () => {
    const valC = dControl.validate();
    const badC = valC.results.find((r) => !r.ok);
    const target = badC || (dPower.validate().results.find((r) => !r.ok));
    if (!target) { statusEl.textContent = "Ya tienes todos los nodos completos — presiona Verificar en ambos circuitos."; return; }
    addScore(-10);
    const owner = badC ? exercise.control : exercise.power;
    const names = target.net.map((id) => friendlyTerminal(id, owner));
    statusEl.textContent = `Pista (${badC ? "control" : "fuerza"}): estas terminales deben quedar unidas: ${names.join("  •  ")}`;
    statusEl.className = "wiring-status status-warn";
  });

  btnSim.addEventListener("click", async () => {
    btnSim.disabled = true;
    logEl.innerHTML = "";
    dControl.resetSimVisuals();
    dPower.resetSimVisuals();
    for (const step of exercise.simulation) {
      await step.run(dControl, dPower, log);
    }
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

  const planoEntries = [];
  for (const ex of EXERCISES) {
    if (ex.combined) {
      planoEntries.push({ title: ex.title + " — Control", ex: ex.control });
      planoEntries.push({ title: ex.title + " — Fuerza", ex: ex.power });
    } else {
      planoEntries.push({ title: ex.title, ex });
    }
  }

  planoEntries.forEach((entry, i) => {
    const item = document.createElement("button");
    item.className = "planos-item";
    item.textContent = entry.title;
    item.addEventListener("click", () => {
      list.querySelectorAll(".planos-item").forEach((el, idx) => el.classList.toggle("active", idx === i));
      show(entry.ex);
    });
    list.appendChild(item);
  });

  list.querySelector(".planos-item").classList.add("active");
  show(planoEntries[0].ex);
}

/* ---------------- Quiz ---------------- */

function goQuiz() {
  crumb.textContent = "Quiz Teórico";
  useTemplate("tpl-quiz");
  const body = document.getElementById("quiz-body");

  const pool = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 10);
  let idx = 0, correct = 0;

  // shuffle the answer order every time a question is shown, so the
  // correct answer's position (and its length relative to the others)
  // stops being a usable pattern — otherwise the same fixed order lets
  // you learn "option B" or "the longest one" instead of the material
  function shuffledOptions(item) {
    const order = item.a.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { options: order.map((i) => item.a[i]), correctIdx: order.indexOf(item.correct) };
  }

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
    const { options, correctIdx } = shuffledOptions(item);
    body.innerHTML = `
      <div class="quiz-progress">Pregunta ${idx + 1} de ${pool.length}</div>
      <div class="quiz-question">${item.q}</div>
      <div class="quiz-options" id="quiz-options"></div>
    `;
    const opts = document.getElementById("quiz-options");
    options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "quiz-option";
      b.textContent = opt;
      b.addEventListener("click", () => {
        const isCorrect = i === correctIdx;
        opts.querySelectorAll(".quiz-option").forEach((el, oi) => {
          el.classList.add(oi === correctIdx ? "opt-correct" : (oi === i ? "opt-wrong" : "opt-disabled"));
          el.disabled = true;
        });
        if (isCorrect) { correct++; addScore(20); if (window.SFX) SFX.success(); } else { addScore(-5); if (window.SFX) SFX.error(); }
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
  { key: "seta", label: "Paro de emergencia (SETA)", make: (n) => ({ prefix: "E", tpl: () => TPL.emergencyStop("E" + n, "1", "2"), manual: true }) },
  { key: "mcb", label: "Disyuntor (MCB)", make: (n) => ({ prefix: "Q", tpl: () => TPL.mcb("Q" + n, "1", "2"), toggle: true }) },
  { key: "clema", label: "Clema (bloque de conexiones)", make: (n) => ({ prefix: "X", tpl: () => TPL.terminalBlock("X" + n, "1", "2") }) },
  { key: "sensorInd", label: "Sensor inductivo", make: (n) => ({ prefix: "LS", tpl: () => TPL.inductiveSensor("NO", "1-2", "1", "2"), manual: true }) },
  { key: "sensorFoto", label: "Sensor fotoeléctrico", make: (n) => ({ prefix: "PE", tpl: () => TPL.photoSensor("NO", "1-2", "1", "2"), manual: true }) },
  { key: "floatSw", label: "Interruptor de flotador", make: (n) => ({ prefix: "FS", tpl: () => TPL.floatSwitch("NO", "3-4", "3", "4"), manual: true }) },
  { key: "photocell", label: "Fotocelda crepuscular", make: (n) => ({ prefix: "PC", tpl: () => TPL.photocell("NO", "1-2", "1", "2"), manual: true }) },
  { key: "pressureSw", label: "Presostato", make: (n) => ({ prefix: "PS", tpl: () => TPL.pressureSwitch("NC", "1-2", "1", "2"), manual: true }) },
  { key: "actuator", label: "Actuador / electroválvula", make: (n) => ({ prefix: "YV", tpl: () => TPL.actuator("YV" + n) }) },
  { key: "tc", label: "Transformador de control (TC)", make: (n) => ({ prefix: "TC", tpl: () => TPL.controlTransformer("TC" + n, "in", "out") }) },
  { key: "capbank", label: "Banco de capacitores", make: (n) => ({ prefix: "CB", tpl: () => TPL.capacitorBank("CB" + n) }) },
  { key: "selector", label: "Selector de 2 posiciones", make: (n) => ({ prefix: "SEL", tpl: () => TPL.selector("0-1", "0", "1"), toggle: true }) },
  { key: "fuse", label: "Fusible", make: (n) => ({ prefix: "F", tpl: () => TPL.fuse("F" + n, "1", "2"), toggle: true }) },
  { key: "pole", label: "Polo de potencia (contactor/guardamotor)", make: (n) => ({ prefix: "L", tpl: () => TPL.pole("1-2", "1", "2") }) },
  { key: "motor3", label: "Motor trifásico (3 puntas)", make: (n) => ({ prefix: "M", tpl: () => TPL.motor(true) }) },
  { key: "motor6", label: "Motor trifásico (6 puntas)", make: (n) => ({ prefix: "M", tpl: () => TPL.motor(false) }) },
  { key: "motor1ph", label: "Motor monofásico", make: (n) => ({ prefix: "M", tpl: () => TPL.singlePhaseMotor() }) },
  { key: "motorDC", label: "Motor de CD", make: (n) => ({ prefix: "M", tpl: () => TPL.motorDC() }) },
  { key: "vfd", label: "Variador de frecuencia (VFD)", make: (n) => ({ prefix: "VFD", tpl: () => TPL.vfd() }) },
  { key: "softstarter", label: "Arrancador suave", make: (n) => ({ prefix: "SS", tpl: () => TPL.softstarter() }) },
  { key: "chopper", label: "Chopper (DC-DC)", make: (n) => ({ prefix: "CH", tpl: () => TPL.chopper() }) },
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
      title: "Modo Libre",
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

  const panelSection = document.getElementById("panel3d-section");
  let panel3d = null;

  function refreshFreePanel3D() {
    const hasPanel = diagram.exercise.components.some((c) => c.manual || c.toggle || (c.tpl && c.tpl.isLamp));
    if (!hasPanel) {
      panelSection.classList.add("hidden");
      panel3d = null;
      return;
    }
    panelSection.classList.remove("hidden");
    panel3d = buildPanel3D(document.getElementById("panel3d-box"), diagram.exercise, diagram);
  }

  let diagram = new Diagram(svg, freshExercise(), {
    selectable: true,
    onChange: () => { statusEl.textContent = `Cables colocados: ${diagram.wireCount()}`; },
    onSelect: (id) => renderInspector(id),
    onSolve: () => { if (panel3d) panel3d.refresh(); },
  });
  refreshFreePanel3D();

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
    if (!armedType) return;
    if (e.target !== svg && !e.target.classList.contains("canvas-bg")) return;
    const item = FREE_PALETTE.find((p) => p.key === armedType);
    counters[item.key] = (counters[item.key] || 0) + 1;
    const spec = item.make(counters[item.key]);
    const id = spec.prefix + counters[item.key];
    const pt = diagram.toSvgPoint(e.clientX, e.clientY);
    const comp = { id, label: id, tpl: spec.tpl(), x: pt.x, y: pt.y };
    if (spec.manual) comp.manual = true;
    if (spec.toggle) comp.toggle = true;
    diagram.addComponent(comp);
    refreshFreePanel3D();
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
    else { inspectorEl.innerHTML = ""; statusEl.textContent = "Pieza eliminada."; refreshFreePanel3D(); }
  });
  document.getElementById("free-clear").addEventListener("click", () => {
    diagram = new Diagram(svg, freshExercise(), {
      selectable: true,
      onChange: () => { statusEl.textContent = `Cables colocados: ${diagram.wireCount()}`; },
      onSelect: (id) => renderInspector(id),
      onSolve: () => { if (panel3d) panel3d.refresh(); },
    });
    inspectorEl.innerHTML = "";
    statusEl.textContent = "Lienzo reiniciado — solo quedan los rieles L y N.";
    refreshFreePanel3D();
  });
}

goMenu();
