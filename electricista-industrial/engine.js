"use strict";

/* =========================================================
   Motor de diagramas de cableado (SVG)
   Terminales, rieles (buses), cables dibujados por el usuario,
   validacion por conectividad (union-find) y simulacion de
   energizado.
   ========================================================= */

const SVGNS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function text(x, y, str, cls, anchor) {
  const t = svgEl("text", { x, y, class: cls || "lbl", "text-anchor": anchor || "middle" });
  t.textContent = str;
  return t;
}

// terminal screw: a metallic bolt head with a screwdriver slot, used
// everywhere a wire can be attached so every connection point reads as
// real hardware rather than a schematic dot
function screwAt(g, x, y, r) {
  r = r || 7;
  g.appendChild(svgEl("circle", { cx: x, cy: y, r, class: "screw-head" }));
  g.appendChild(svgEl("line", { x1: x - r * 0.55, y1: y, x2: x + r * 0.55, y2: y, class: "screw-slot" }));
}

// draws an extruded "isometric" block (front + top + right-side faces) so a
// housing reads as a real 3D enclosure instead of a flat rectangle
function isoBox(g, x, y, w, h, rx, depth, faceCls, topCls, sideCls) {
  const hw = w / 2, hh = h / 2;
  g.appendChild(svgEl("polygon", {
    points: `${x + hw},${y - hh} ${x + hw},${y + hh} ${x + hw + depth},${y + hh - depth} ${x + hw + depth},${y - hh - depth}`,
    class: sideCls,
  }));
  g.appendChild(svgEl("polygon", {
    points: `${x - hw},${y - hh} ${x + hw},${y - hh} ${x + hw + depth},${y - hh - depth} ${x - hw + depth},${y - hh - depth}`,
    class: topCls,
  }));
  g.appendChild(svgEl("rect", { x: x - hw, y: y - hh, width: w, height: h, rx: rx || 0, class: faceCls }));
}
function buildDefs(svg) {
  const defs = svgEl("defs", {});
  defs.innerHTML = `
    <pattern id="gGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28,0 L0,0 0,28" fill="none" stroke="#1b2740" stroke-width="1"/>
    </pattern>
    <linearGradient id="gShell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8fa3d0"/>
      <stop offset="0.18" stop-color="#5c7099"/>
      <stop offset="0.55" stop-color="#324467"/>
      <stop offset="1" stop-color="#1a2338"/>
    </linearGradient>
    <linearGradient id="gShellTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e4ebfb"/>
      <stop offset="1" stop-color="#93a6d4"/>
    </linearGradient>
    <linearGradient id="gPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#243252"/>
      <stop offset="1" stop-color="#111a2c"/>
    </linearGradient>
    <radialGradient id="gScrew" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.45" stop-color="#c6cedc"/>
      <stop offset="1" stop-color="#5c6577"/>
    </radialGradient>
    <radialGradient id="gBezel" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#fafcff"/>
      <stop offset="0.5" stop-color="#c2cbe0"/>
      <stop offset="1" stop-color="#707d99"/>
    </radialGradient>
    <radialGradient id="gDomeGreenOn" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#d8ffe9"/>
      <stop offset="0.4" stop-color="#3fe083"/>
      <stop offset="1" stop-color="#0a7a3b"/>
    </radialGradient>
    <radialGradient id="gDomeGreenOff" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#bcd8c6"/>
      <stop offset="0.4" stop-color="#3e8560"/>
      <stop offset="1" stop-color="#0d3b22"/>
    </radialGradient>
    <radialGradient id="gDomeRedOn" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#ffdcd8"/>
      <stop offset="0.4" stop-color="#ef4d43"/>
      <stop offset="1" stop-color="#8a0f0a"/>
    </radialGradient>
    <radialGradient id="gDomeRedOff" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#d8bcbc"/>
      <stop offset="0.4" stop-color="#8a3e3e"/>
      <stop offset="1" stop-color="#440d0d"/>
    </radialGradient>
    <radialGradient id="gLampOff" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#4a5470"/>
      <stop offset="1" stop-color="#1a2033"/>
    </radialGradient>
    <radialGradient id="gLampGreenOn" cx="35%" cy="26%" r="85%">
      <stop offset="0" stop-color="#f2fff7"/>
      <stop offset="0.4" stop-color="#48ff96"/>
      <stop offset="1" stop-color="#0a8a42"/>
    </radialGradient>
    <radialGradient id="gLampRedOn" cx="35%" cy="26%" r="85%">
      <stop offset="0" stop-color="#fff2f0"/>
      <stop offset="0.4" stop-color="#ff5b50"/>
      <stop offset="1" stop-color="#9c0f0a"/>
    </radialGradient>
    <linearGradient id="gClema" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe388"/>
      <stop offset="0.5" stop-color="#e8bc46"/>
      <stop offset="1" stop-color="#9a7420"/>
    </linearGradient>
    <linearGradient id="gDinRail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dfe6f2"/>
      <stop offset="0.5" stop-color="#aab6cc"/>
      <stop offset="1" stop-color="#79869e"/>
    </linearGradient>
    <radialGradient id="gMotorBody" cx="32%" cy="28%" r="75%">
      <stop offset="0" stop-color="#d8e2f5"/>
      <stop offset="0.45" stop-color="#7f92bd"/>
      <stop offset="1" stop-color="#2c3752"/>
    </radialGradient>
    <linearGradient id="gWind" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a8bb5"/>
      <stop offset="0.5" stop-color="#dfe6f5"/>
      <stop offset="1" stop-color="#7a8bb5"/>
    </linearGradient>
    <filter id="fDrop" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  `;
  svg.appendChild(defs);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const WIRE_COLOR_COUNT = 10;

// builds a path through a list of waypoints with each corner rounded off
// (clamped to half the length of its shortest neighbouring segment) so the
// cable reads as a real conductor with a bend radius instead of a rigid
// schematic line snapping at right angles
function roundedPath(points, r) {
  if (points.length < 3) return "M" + points.map((p) => `${p.x},${p.y}`).join(" L");
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1], cur = points[i], next = points[i + 1];
    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y) || 1;
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const p1x = cur.x + ((prev.x - cur.x) / d1) * rr;
    const p1y = cur.y + ((prev.y - cur.y) / d1) * rr;
    const p2x = cur.x + ((next.x - cur.x) / d2) * rr;
    const p2y = cur.y + ((next.y - cur.y) / d2) * rr;
    d += ` L${p1x},${p1y} Q${cur.x},${cur.y} ${p2x},${p2y}`;
  }
  const last = points[points.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
}

/* ---------------- union-find ---------------- */

class UnionFind {
  constructor() { this.parent = new Map(); }
  find(a) {
    if (!this.parent.has(a)) this.parent.set(a, a);
    let r = a;
    while (this.parent.get(r) !== r) r = this.parent.get(r);
    let cur = a;
    while (this.parent.get(cur) !== r) {
      const next = this.parent.get(cur);
      this.parent.set(cur, r);
      cur = next;
    }
    return r;
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
  connected(a, b) { return this.find(a) === this.find(b); }
}

/* ---------------- component footprint templates ----------------
   Every template returns { terminals: {name:{x,y}}, draw(g) }
   Coordinates are local; caller translates by (x,y).
*/

const TPL = {};

TPL.coil = (label, sub) => ({
  w: 44, h: 60,
  isCoil: true,
  terminals: { A1: { x: 0, y: -30 }, A2: { x: 0, y: 30 } },
  draw(g) {
    g.appendChild(svgEl("line", { x1: 0, y1: -30, x2: 0, y2: -22, class: "cable-core" }));
    g.appendChild(svgEl("line", { x1: 0, y1: 22, x2: 0, y2: 30, class: "cable-core" }));
    isoBox(g, 0, 0, 38, 44, 6, 7, "relay-shell", "relay-top", "relay-side");
    g.appendChild(svgEl("rect", { x: -19, y: -22, width: 38, height: 9, rx: 4, class: "relay-toplight" }));
    g.appendChild(svgEl("rect", { x: -15, y: -8, width: 30, height: 21, rx: 3, class: "nameplate" }));
    g.appendChild(text(0, 1, label, "nameplate-label"));
    g.appendChild(text(0, 10, sub || "", "nameplate-sub"));
    for (let i = 0; i < 3; i++) g.appendChild(svgEl("line", { x1: -14, y1: 16 + i * 3, x2: 14, y2: 16 + i * 3, class: "relay-rib" }));
    g.appendChild(svgEl("circle", { cx: 13, cy: -16, r: 3, class: "led-indicator" }));
    screwAt(g, 0, -30);
    screwAt(g, 0, 30);
  },
});

// contact block: two metallic screws with a pivoting metal blade between
// them. the blade is visible when the wrapping .component has class
// "closed" (real rest-state for NC, actuated-state for NO)
function contactGap(g, kind, y1, y2) {
  const mid = (y1 + y2) / 2;
  const topBarY = mid - 9, botBarY = mid + 9;
  g.appendChild(svgEl("line", { x1: 0, y1, x2: 0, y2: topBarY, class: "cable-core" }));
  g.appendChild(svgEl("line", { x1: 0, y1: botBarY, x2: 0, y2, class: "cable-core" }));
  g.appendChild(svgEl("rect", { x: -10, y: topBarY - 12, width: 20, height: botBarY - topBarY + 24, rx: 4, class: "contact-housing" }));
  g.appendChild(svgEl("line", { x1: -10, y1: topBarY, x2: 10, y2: topBarY, class: "blade-fixed" }));
  g.appendChild(svgEl("line", { x1: -10, y1: botBarY, x2: 10, y2: botBarY, class: "blade-fixed" }));
  g.appendChild(svgEl("line", { x1: 0, y1: topBarY, x2: 0, y2: botBarY, class: "blade" }));
  if (kind === "NC") {
    g.appendChild(svgEl("line", { x1: -9, y1: botBarY + 1, x2: 10, y2: topBarY - 1, class: "nc-mark" }));
  }
  screwAt(g, 0, y1);
  screwAt(g, 0, y2);
}

TPL.contact = (kind, ref, t1, t2) => ({
  // kind: 'NO' | 'NC'
  w: 26, h: 40,
  gate: true,
  terminals: { [t1]: { x: 0, y: -20 }, [t2]: { x: 0, y: 20 } },
  restClosed: kind === "NC",
  draw(g) {
    contactGap(g, kind, -20, 20);
    g.appendChild(text(17, 2, ref, "sym-ref", "start"));
  },
});

TPL.button = (kind, ref, t1, t2) => ({
  w: 34, h: 46,
  gate: true,
  btnKind: kind,
  terminals: { [t1]: { x: 0, y: -23 }, [t2]: { x: 0, y: 23 } },
  restClosed: kind === "NC",
  draw(g) {
    contactGap(g, kind, -23, 23);
    g.appendChild(svgEl("ellipse", { cx: 1.5, cy: 2, rx: 12.5, ry: 11, class: "mount-base" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 12.5, class: "bezel-ring", filter: "url(#fDrop)" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 9, class: (kind === "NO" ? "btn-dome dome-green" : "btn-dome dome-red") + " btn-pressable" }));
    g.appendChild(text(18, 3, ref, "sym-ref", "start"));
  },
});

TPL.lamp = (label, color) => ({
  w: 30, h: 40,
  isLamp: true,
  lampColor: color,
  lampLabel: label,
  terminals: { X1: { x: 0, y: -20 }, X2: { x: 0, y: 20 } },
  draw(g) {
    g.appendChild(svgEl("line", { x1: 0, y1: -20, x2: 0, y2: -11, class: "cable-core" }));
    g.appendChild(svgEl("line", { x1: 0, y1: 11, x2: 0, y2: 20, class: "cable-core" }));
    g.appendChild(svgEl("ellipse", { cx: 1.5, cy: 2, rx: 12.5, ry: 11, class: "mount-base" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 12.5, class: "bezel-ring", filter: "url(#fDrop)" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 9.5, class: "lamp-glass lamp-" + color }));
    g.appendChild(text(0, 4, label, "lamp-caption"));
    screwAt(g, 0, -20, 5.5);
    screwAt(g, 0, 20, 5.5);
  },
});

TPL.pole = (ref, tin, tout) => ({
  w: 26, h: 44,
  gate: true,
  terminals: { [tin]: { x: 0, y: -22 }, [tout]: { x: 0, y: 22 } },
  restClosed: false,
  draw(g) {
    contactGap(g, "NO", -22, 22);
    g.appendChild(text(-17, 2, ref, "sym-ref", "end"));
  },
});

TPL.limitSwitch = (kind, ref, t1, t2) => ({
  // interruptor de limite (fin de carrera): mismo contacto NA/NC, con
  // palanca y rodillo en vez de capuchon de boton
  w: 34, h: 46,
  gate: true,
  btnKind: kind,
  terminals: { [t1]: { x: 0, y: -23 }, [t2]: { x: 0, y: 23 } },
  restClosed: kind === "NC",
  draw(g) {
    contactGap(g, kind, -23, 23);
    g.appendChild(svgEl("line", { x1: 0, y1: -2, x2: 14, y2: -14, class: "ls-lever" }));
    g.appendChild(svgEl("circle", { cx: 16, cy: -16, r: 5, class: "ls-roller btn-pressable" }));
    g.appendChild(text(18, 12, ref, "sym-ref", "start"));
  },
});

TPL.horn = (label) => ({
  w: 30, h: 42,
  isLamp: true,
  terminals: { X1: { x: 0, y: -21 }, X2: { x: 0, y: 21 } },
  draw(g) {
    g.appendChild(svgEl("line", { x1: 0, y1: -21, x2: 0, y2: -10, class: "cable-core" }));
    g.appendChild(svgEl("line", { x1: 0, y1: 10, x2: 0, y2: 21, class: "cable-core" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 12, class: "horn-body", filter: "url(#fDrop)" }));
    g.appendChild(svgEl("path", { d: "M-6,4 L-6,-4 L2,-9 L2,9 Z", class: "horn-bell" }));
    g.appendChild(svgEl("path", { d: "M5,-9 Q12,0 5,9", class: "horn-wave" }));
    g.appendChild(svgEl("path", { d: "M8,-12 Q18,0 8,12", class: "horn-wave" }));
    g.appendChild(text(0, 20, label, "lamp-caption"));
    screwAt(g, 0, -21, 5.5);
    screwAt(g, 0, 21, 5.5);
  },
});

TPL.breaker = (ref, tin, tout) => ({
  // guardamotor / interruptor termomagnetico manual: gate + manual, con
  // palanca que se ve verde(cerrado)/rojo(abierto)
  w: 30, h: 48,
  gate: true,
  restClosed: true,
  terminals: { [tin]: { x: 0, y: -24 }, [tout]: { x: 0, y: 24 } },
  draw(g) {
    g.appendChild(svgEl("line", { x1: 0, y1: -24, x2: 0, y2: -16, class: "cable-core" }));
    g.appendChild(svgEl("line", { x1: 0, y1: 16, x2: 0, y2: 24, class: "cable-core" }));
    isoBox(g, 0, 0, 26, 32, 4, 6, "brk-body", "brk-top", "brk-side");
    g.appendChild(svgEl("rect", { x: -5, y: -10, width: 10, height: 20, rx: 3, class: "brk-lever btn-pressable" }));
    g.appendChild(text(17, 3, ref, "sym-ref", "start"));
    screwAt(g, 0, -24);
    screwAt(g, 0, 24);
  },
});

TPL.rail = (horizontal, len, label) => ({
  w: horizontal ? len : 4,
  h: horizontal ? 4 : len,
  isRail: true,
  horizontal,
  len,
  draw(g) {
    const half = len / 2;
    if (horizontal) {
      g.appendChild(svgEl("rect", { x: -half - 6, y: -7, width: len + 12, height: 14, rx: 3, class: "din-rail" }));
      for (let d = -half; d <= half + 0.01; d += 36) {
        g.appendChild(svgEl("rect", { x: d - 9, y: -13, width: 18, height: 26, rx: 2, class: "clema-block" }));
        screwAt(g, d, 0, 4.6);
      }
      g.appendChild(text(-half - 16, 4, label, "rail-label", "end"));
    } else {
      g.appendChild(svgEl("rect", { x: -7, y: -half - 6, width: 14, height: len + 12, rx: 3, class: "din-rail" }));
      for (let d = -half; d <= half + 0.01; d += 36) {
        g.appendChild(svgEl("rect", { x: -13, y: d - 9, width: 26, height: 18, rx: 2, class: "clema-block" }));
        screwAt(g, 0, d, 4.6);
      }
      g.appendChild(text(18, -half + 4, label, "rail-label", "start"));
    }
  },
});

TPL.motor = (leadsOnly3) => {
  const topY = 34, botY = 62;
  const terms = leadsOnly3
    ? { U1: { x: -30, y: topY }, V1: { x: 0, y: topY }, W1: { x: 30, y: topY } }
    : {
        U1: { x: -30, y: topY }, V1: { x: 0, y: topY }, W1: { x: 30, y: topY },
        W2: { x: -30, y: botY }, U2: { x: 0, y: botY }, V2: { x: 30, y: botY },
      };
  return {
    w: 100, h: leadsOnly3 ? 78 : 100,
    terminals: terms,
    draw(g) {
      g.appendChild(svgEl("circle", { cx: 0, cy: -10, r: 34, class: "motor-shell", filter: "url(#fDrop)" }));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.appendChild(svgEl("circle", { cx: Math.cos(a) * 29, cy: -10 + Math.sin(a) * 29, r: 2.1, class: "motor-bolt" }));
      }
      g.appendChild(svgEl("circle", { cx: 0, cy: -10, r: 22, class: "motor-face" }));
      g.appendChild(text(0, -6, "M", "sym-motor"));
      g.appendChild(text(0, 10, "3~", "sym-label-small"));
      const fanWrap = svgEl("g", { class: "motor-fan-wrap", transform: "translate(0,-10)" });
      const fan = svgEl("g", { class: "motor-fan" });
      for (let i = 0; i < 3; i++) {
        fan.appendChild(svgEl("path", { d: "M0,0 L6,-18 Q0,-23 -6,-18 Z", transform: `rotate(${i * 120})`, class: "motor-blade" }));
      }
      fan.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 4.5, class: "motor-hub" }));
      fanWrap.appendChild(fan);
      g.appendChild(fanWrap);
      g.appendChild(svgEl("line", { x1: -30, y1: 24, x2: -30, y2: topY - 9, class: "cable-core" }));
      g.appendChild(svgEl("line", { x1: 0, y1: 24, x2: 0, y2: topY - 9, class: "cable-core" }));
      g.appendChild(svgEl("line", { x1: 30, y1: 24, x2: 30, y2: topY - 9, class: "cable-core" }));
      g.appendChild(svgEl("rect", {
        x: -46, y: topY - 9, width: 92, height: leadsOnly3 ? 26 : (botY - topY + 26),
        rx: 3, class: "terminal-box", filter: "url(#fDrop)",
      }));
      for (const name in terms) {
        const p = terms[name];
        screwAt(g, p.x, p.y, 5.5);
        g.appendChild(text(p.x, p.y - 10, name, "sym-ref"));
      }
    },
  };
};

TPL.autoPhase = (ref) => ({
  w: 34, h: 90,
  terminals: { L: { x: 0, y: -45 }, D: { x: 0, y: 0 }, C: { x: 0, y: 45 } },
  draw(g) {
    g.appendChild(svgEl("rect", { x: -11, y: -40, width: 22, height: 80, rx: 8, class: "wind-core", filter: "url(#fDrop)" }));
    for (let i = 0; i < 9; i++) {
      g.appendChild(svgEl("rect", { x: -11, y: -40 + i * 8.9, width: 22, height: 5, class: "wind-band" }));
    }
    g.appendChild(svgEl("line", { x1: -11, y1: 0, x2: 11, y2: 0, class: "sym-tap" }));
    screwAt(g, 0, -45); screwAt(g, 0, 0); screwAt(g, 0, 45);
    g.appendChild(text(-16, -42, ref + " L", "sym-label-small", "end"));
    g.appendChild(text(-16, 4, "65%", "sym-label-small", "end"));
    g.appendChild(text(-16, 48, ref + " C", "sym-label-small", "end"));
  },
});

TPL.vfd = () => ({
  w: 90, h: 110,
  terminals: {
    L1: { x: -24, y: -46 }, L2: { x: 0, y: -46 }, L3: { x: 24, y: -46 },
    U: { x: -24, y: 46 }, V: { x: 0, y: 46 }, W: { x: 24, y: 46 },
  },
  draw(g) {
    for (const dx of [-24, 0, 24]) {
      g.appendChild(svgEl("line", { x1: dx, y1: -46, x2: dx, y2: -36, class: "cable-core" }));
      g.appendChild(svgEl("line", { x1: dx, y1: 36, x2: dx, y2: 46, class: "cable-core" }));
    }
    isoBox(g, 0, 0, 76, 84, 6, 9, "vfd-body", "vfd-top", "vfd-side");
    g.appendChild(svgEl("rect", { x: -30, y: -26, width: 60, height: 22, rx: 2, class: "vfd-screen" }));
    g.appendChild(text(0, -14, "60.0 Hz", "vfd-readout"));
    for (let i = 0; i < 5; i++) {
      g.appendChild(svgEl("rect", { x: -26 + i * 12, y: 6, width: 8, height: 6 + i * 3, class: "vfd-bar" }));
    }
    g.appendChild(text(0, 34, "VARIADOR", "nameplate-sub"));
    for (const dx of [-24, 0, 24]) { screwAt(g, dx, -46, 5.5); screwAt(g, dx, 46, 5.5); }
    g.appendChild(text(0, -56, "L1  L2  L3", "sym-label-small"));
    g.appendChild(text(0, 62, "U   V   W", "sym-label-small"));
  },
});

TPL.softstarter = () => ({
  w: 90, h: 110,
  terminals: {
    L1: { x: -24, y: -46 }, L2: { x: 0, y: -46 }, L3: { x: 24, y: -46 },
    T1: { x: -24, y: 46 }, T2: { x: 0, y: 46 }, T3: { x: 24, y: 46 },
  },
  draw(g) {
    for (const dx of [-24, 0, 24]) {
      g.appendChild(svgEl("line", { x1: dx, y1: -46, x2: dx, y2: -36, class: "cable-core" }));
      g.appendChild(svgEl("line", { x1: dx, y1: 36, x2: dx, y2: 46, class: "cable-core" }));
    }
    isoBox(g, 0, 0, 76, 84, 6, 9, "vfd-body", "vfd-top", "vfd-side");
    g.appendChild(svgEl("rect", { x: -30, y: -26, width: 60, height: 22, rx: 2, class: "vfd-screen" }));
    g.appendChild(text(0, -14, "100 %V", "vfd-readout"));
    g.appendChild(svgEl("path", { d: "M-24,20 L-8,20 L10,4", class: "ss-ramp" }));
    g.appendChild(svgEl("circle", { cx: 10, cy: 4, r: 2, class: "vfd-bar" }));
    g.appendChild(text(0, 34, "ARR. SUAVE", "nameplate-sub"));
    for (const dx of [-24, 0, 24]) { screwAt(g, dx, -46, 5.5); screwAt(g, dx, 46, 5.5); }
    g.appendChild(text(0, -56, "L1  L2  L3", "sym-label-small"));
    g.appendChild(text(0, 62, "T1  T2  T3", "sym-label-small"));
  },
});

TPL.chopper = () => ({
  w: 70, h: 92,
  terminals: {
    Lp: { x: -16, y: -40 }, Lm: { x: 16, y: -40 },
    Ap: { x: -16, y: 40 }, Am: { x: 16, y: 40 },
  },
  draw(g) {
    for (const dx of [-16, 16]) {
      g.appendChild(svgEl("line", { x1: dx, y1: -40, x2: dx, y2: -30, class: "cable-core" }));
      g.appendChild(svgEl("line", { x1: dx, y1: 30, x2: dx, y2: 40, class: "cable-core" }));
    }
    isoBox(g, 0, 0, 56, 68, 6, 8, "vfd-body", "vfd-top", "vfd-side");
    g.appendChild(svgEl("path", { d: "M-18,-4 L-6,-4 L-6,-12 L6,4 L-6,4 L-6,12 Z", class: "chopper-pwm" }));
    g.appendChild(text(0, 26, "CHOPPER", "nameplate-sub"));
    screwAt(g, -16, -40, 5.5); screwAt(g, 16, -40, 5.5);
    screwAt(g, -16, 40, 5.5); screwAt(g, 16, 40, 5.5);
    g.appendChild(text(-16, -46, "L+", "sym-label-small"));
    g.appendChild(text(16, -46, "L-", "sym-label-small"));
    g.appendChild(text(-16, 52, "A+", "sym-label-small"));
    g.appendChild(text(16, 52, "A-", "sym-label-small"));
  },
});

TPL.motorDC = () => ({
  w: 90, h: 78,
  terminals: { A1: { x: -20, y: 32 }, A2: { x: 20, y: 32 } },
  draw(g) {
    g.appendChild(svgEl("circle", { cx: 0, cy: -8, r: 32, class: "motor-shell", filter: "url(#fDrop)" }));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.appendChild(svgEl("circle", { cx: Math.cos(a) * 27, cy: -8 + Math.sin(a) * 27, r: 2, class: "motor-bolt" }));
    }
    g.appendChild(svgEl("circle", { cx: 0, cy: -8, r: 20, class: "motor-face" }));
    g.appendChild(text(0, -3, "M", "sym-motor"));
    g.appendChild(text(0, 13, "=", "sym-label-small"));
    const fanWrap = svgEl("g", { class: "motor-fan-wrap", transform: "translate(0,-8)" });
    const fan = svgEl("g", { class: "motor-fan" });
    for (let i = 0; i < 3; i++) fan.appendChild(svgEl("path", { d: "M0,0 L5,-16 Q0,-20 -5,-16 Z", transform: `rotate(${i * 120})`, class: "motor-blade" }));
    fan.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 4, class: "motor-hub" }));
    fanWrap.appendChild(fan);
    g.appendChild(fanWrap);
    g.appendChild(svgEl("line", { x1: -20, y1: 22, x2: -20, y2: 26, class: "cable-core" }));
    g.appendChild(svgEl("line", { x1: 20, y1: 22, x2: 20, y2: 26, class: "cable-core" }));
    g.appendChild(svgEl("rect", { x: -34, y: 26, width: 68, height: 20, rx: 3, class: "terminal-box", filter: "url(#fDrop)" }));
    screwAt(g, -20, 32, 5.5); screwAt(g, 20, 32, 5.5);
    g.appendChild(text(-20, 24, "A1", "sym-ref"));
    g.appendChild(text(20, 24, "A2", "sym-ref"));
  },
});

TPL.selector = (ref, t1, t2) => ({
  // interruptor selector de 2 posiciones (enclavado): un clic lo deja fijo,
  // a diferencia de un pulsador con resorte
  w: 30, h: 46,
  gate: true,
  restClosed: false,
  terminals: { [t1]: { x: 0, y: -23 }, [t2]: { x: 0, y: 23 } },
  draw(g) {
    contactGap(g, "NO", -23, 23);
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 11, class: "sel-body" }));
    g.appendChild(svgEl("line", { x1: 0, y1: 0, x2: 0, y2: -9, class: "sel-pointer" }));
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 2.4, class: "sel-hub" }));
    // the visible knob/pointer is tiny (a 9px line) — click anywhere on the
    // whole knob face instead of having to hit that thin line exactly
    g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 16, class: "sel-hit btn-pressable" }));
    g.appendChild(text(17, 3, ref, "sym-ref", "start"));
  },
});

/* ---------------- Diagram ---------------- */

class Diagram {
  constructor(svg, exercise, opts) {
    this.svg = svg;
    this.exercise = exercise;
    this.opts = opts || {};
    this.wires = []; // {a,b,el}
    this.uf = new UnionFind();
    this.termPos = new Map(); // id -> {x,y}
    this.pending = null;
    this.onChange = this.opts.onChange || (() => {});
    this._build();
  }

  _build() {
    this.svg.innerHTML = "";
    this.svg.setAttribute("viewBox", `0 0 ${this.exercise.vb[0]} ${this.exercise.vb[1]}`);
    buildDefs(this.svg);
    const bg = svgEl("rect", {
      x: 0, y: 0, width: this.exercise.vb[0], height: this.exercise.vb[1], fill: "url(#gGrid)", class: "canvas-bg",
    });
    this.svg.appendChild(bg);
    this.gWires = svgEl("g", { class: "layer-wires" });
    this.gComp = svgEl("g", { class: "layer-components" });
    this.gTerm = svgEl("g", { class: "layer-terminals" });
    this.svg.appendChild(this.gWires);
    this.svg.appendChild(this.gComp);
    this.svg.appendChild(this.gTerm);

    this.compGroups = new Map();
    this.compLabelEls = new Map();
    for (const comp of this.exercise.components) {
      this._registerComponentVisual(comp);
    }

    // pre-union every point that belongs to the same rail id
    const railGroups = {};
    for (const [id, info] of this.termPos) {
      if (info.railId) {
        railGroups[info.railId] = railGroups[info.railId] || [];
        railGroups[info.railId].push(id);
      }
    }
    for (const rid in railGroups) {
      const ids = railGroups[rid];
      for (let i = 1; i < ids.length; i++) this.uf.union(ids[0], ids[i]);
      this.uf.union(ids[0], rid); // also alias the plain rail id itself
      this.termPos.set(rid, { ...this.termPos.get(ids[0]), isAliasOnly: true });
    }
    this.railTapIds = railGroups;
    this._timerState = {};
    this._bindManualControls();

    for (const [id, info] of this.termPos) {
      if (info.isAliasOnly) continue;
      this._drawTerminalCircle(id, info);
    }

    if (this.exercise.staticWires) {
      for (const [a, b] of this.exercise.staticWires) this._drawWire(a, b, true);
    }

    this._recolorWires();
    this.solve();
  }

  _autoTaps(tpl) {
    const pts = [];
    const step = 36;
    const half = tpl.len / 2;
    for (let d = -half; d <= half; d += step) {
      pts.push(tpl.horizontal ? { dx: d, dy: 0 } : { dx: 0, dy: d });
    }
    return pts;
  }

  _registerTerminal(id, abs, railId, isRail) {
    this.termPos.set(id, { x: abs.x, y: abs.y, railId: isRail ? railId : null });
  }

  _registerComponentVisual(comp) {
    const tpl = comp.tpl;
    const cls = "component" + (tpl.restClosed ? " closed" : "");
    const g = svgEl("g", { transform: `translate(${comp.x},${comp.y})`, class: cls, "data-id": comp.id });
    tpl.draw(g);
    this.gComp.appendChild(g);
    this.compGroups.set(comp.id, g);

    if (this.opts.selectable) {
      g.addEventListener("click", (e) => {
        if (this.pending) return; // mid-wire, let the terminal click win
        e.stopPropagation();
        this.selectComponent(comp.id);
      });
    }

    if (comp.label) {
      const lbl = text(comp.x, comp.y - (tpl.h / 2) - 8, comp.label, "comp-label");
      this.gComp.appendChild(lbl);
      this.compLabelEls.set(comp.id, lbl);
    }

    if (tpl.isRail) {
      const pts = comp.taps || this._autoTaps(tpl);
      for (const tp of pts) {
        const id = comp.id; // all taps share the same net id
        const abs = { x: comp.x + tp.dx, y: comp.y + tp.dy };
        this._registerTerminal(id + "@" + tp.dx + "," + tp.dy, abs, comp.id, true);
      }
    } else {
      for (const name in tpl.terminals) {
        const rel = tpl.terminals[name];
        const abs = { x: comp.x + rel.x, y: comp.y + rel.y };
        const id = comp.id + "." + name;
        this._registerTerminal(id, abs, comp.id, false);
      }
    }
  }

  _drawTerminalCircle(id, info) {
    const c = svgEl("circle", { cx: info.x, cy: info.y, r: 10, class: "terminal", "data-term": id });
    c.addEventListener("click", (e) => this._onTerminalClick(id, e));
    this.gTerm.appendChild(c);
    // print the terminal's own number/letter (13, A1, L1...) right next to
    // its screw, so the same physical point can be recognized when it shows
    // up again in a different diagram (e.g. K1 in the control vs. power plan)
    if (!info.railId) {
      const dot = id.lastIndexOf(".");
      if (dot !== -1) {
        const name = id.slice(dot + 1);
        this.gTerm.appendChild(text(info.x + 13, info.y + 3, name, "term-label", "start"));
      }
    }
    return c;
  }

  /* ---------------- modo libre: agregar/quitar piezas en vivo ---------------- */

  addComponent(comp) {
    this.exercise.components.push(comp);
    this._registerComponentVisual(comp);
    for (const name in comp.tpl.terminals) {
      const id = comp.id + "." + name;
      this._drawTerminalCircle(id, this.termPos.get(id));
    }
    if (comp.manual || comp.toggle) this._bindOneManualControl(comp);
    this.solve();
    return comp;
  }

  removeComponent(id) {
    const g = this.compGroups.get(id);
    if (!g) return;
    const prefix = id + ".";
    for (const w of [...this.wires]) {
      if (w.a.startsWith(prefix) || w.b.startsWith(prefix)) this._removeWire(w);
    }
    for (const [tid] of [...this.termPos]) {
      if (tid.startsWith(prefix)) {
        this.termPos.delete(tid);
        const c = this.gTerm.querySelector(`[data-term="${CSS.escape(tid)}"]`);
        if (c) c.remove();
      }
    }
    g.remove();
    this.compGroups.delete(id);
    const lbl = this.compLabelEls.get(id);
    if (lbl) { lbl.remove(); this.compLabelEls.delete(id); }
    this.exercise.components = this.exercise.components.filter((c) => c.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.solve();
  }

  selectComponent(id) {
    if (this.selectedId) {
      const prev = this.compGroups.get(this.selectedId);
      if (prev) prev.classList.remove("selected");
    }
    this.selectedId = this.selectedId === id ? null : id;
    if (this.selectedId) {
      const g = this.compGroups.get(this.selectedId);
      if (g) g.classList.add("selected");
    }
    if (this.opts.onSelect) this.opts.onSelect(this.selectedId);
  }

  removeSelected() {
    if (!this.selectedId) return false;
    this.removeComponent(this.selectedId);
    return true;
  }

  toSvgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  /* ---------------- tiempo real: presionar botones y ver la corriente ---------------- */

  _bindManualControls() {
    if (!this.exercise.source) return;
    for (const comp of this.exercise.components) {
      if (!comp.manual && !comp.toggle) continue;
      this._bindOneManualControl(comp);
    }
  }

  _bindOneManualControl(comp) {
    const g = this.compGroups.get(comp.id);
    const dome = g && g.querySelector(".btn-pressable");
    if (!dome) return;
    dome.classList.add("pressable-hit");
    if (comp.toggle) {
      dome.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.toggleManual(comp.id); });
      return;
    }
    const press = (e) => { e.preventDefault(); this.pressManual(comp.id, true); };
    const release = (e) => { e.preventDefault(); this.pressManual(comp.id, false); };
    dome.addEventListener("mousedown", press);
    dome.addEventListener("touchstart", press, { passive: false });
    window.addEventListener("mouseup", release);
    dome.addEventListener("touchend", release);
    dome.addEventListener("touchcancel", release);
  }

  // manually actuate a pushbutton: pressed=true means the physical button is
  // held down (NO contact closes, NC contact opens), released returns it to
  // its spring rest-state. Recomputes the whole circuit immediately.
  pressManual(compId, pressed) {
    const comp = this.exercise.components.find((c) => c.id === compId);
    const g = this.compGroups.get(compId);
    if (!comp || !g) return;
    const restClosed = !!comp.tpl.restClosed;
    const wantClosed = pressed ? !restClosed : restClosed;
    g.classList.toggle("closed", wantClosed);
    g.classList.toggle("pressed", pressed);
    this._flash(g);
    this.solve();
  }

  // latching switch (breaker/disconnect): each click flips it and stays,
  // unlike a spring-return pushbutton.
  toggleManual(compId) {
    const g = this.compGroups.get(compId);
    if (!g) return;
    g.classList.toggle("closed");
    this._flash(g);
    this.solve();
  }

  // fixed-point relay-logic solver: figures out, from the current state of
  // every switch/contact, which coils are energized and which wires are
  // carrying current right now — and keeps contacts that are derived from a
  // coil (seals, interlocks) in sync, cascading until the circuit settles.
  solve() {
    const ex = this.exercise;
    if (!ex.source) return;

    const addE = (map, a, b) => {
      if (!map.has(a)) map.set(a, new Set());
      if (!map.has(b)) map.set(b, new Set());
      map.get(a).add(b);
      map.get(b).add(a);
    };
    const baseAdj = new Map();
    for (const rid in this.railTapIds) {
      for (const tid of this.railTapIds[rid]) addE(baseAdj, rid, tid);
    }
    for (const w of this.wires) addE(baseAdj, w.a, w.b);
    if (ex.staticWires) for (const [a, b] of ex.staticWires) addE(baseAdj, a, b);

    const gateComps = ex.components.filter((c) => c.tpl.gate);
    const coilComps = ex.components.filter((c) => c.tpl.isCoil);
    const lampComps = ex.components.filter((c) => c.tpl.isLamp);

    const bfs = (adj, starts) => {
      const seen = new Set(starts);
      const stack = [...starts];
      while (stack.length) {
        const cur = stack.pop();
        for (const nb of adj.get(cur) || []) {
          if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
        }
      }
      return seen;
    };

    // snapshot the observable state before this solve pass, so we can flash
    // only the parts that actually flip once everything has settled
    const before = new Map();
    for (const c of [...coilComps, ...gateComps, ...lampComps]) {
      const grp = this.compGroups.get(c.id);
      if (grp) before.set(c.id, { energized: grp.classList.contains("energized"), closed: grp.classList.contains("closed") });
    }

    let liveSrc = new Set(), liveRet = new Set();
    for (let iter = 0; iter < 8; iter++) {
      const adj = new Map();
      for (const [k, set] of baseAdj) adj.set(k, new Set(set));
      for (const gc of gateComps) {
        const grp = this.compGroups.get(gc.id);
        if (grp && grp.classList.contains("closed")) {
          const names = Object.keys(gc.tpl.terminals);
          addE(adj, gc.id + "." + names[0], gc.id + "." + names[1]);
        }
      }
      liveSrc = bfs(adj, ex.source);
      liveRet = ex.return ? bfs(adj, ex.return) : new Set();

      let changed = false;
      for (const cc of coilComps) {
        const names = Object.keys(cc.tpl.terminals);
        const en = liveSrc.has(cc.id + "." + names[0]) && (ex.return ? liveRet.has(cc.id + "." + names[1]) : true);
        const grp = this.compGroups.get(cc.id);
        if (grp.classList.contains("energized") !== en) changed = true;
        grp.classList.toggle("energized", en);
      }
      for (const gc of gateComps) {
        if (!gc.derivedFrom) continue;
        const coilGrp = this.compGroups.get(gc.derivedFrom);
        const coilEnergized = coilGrp ? coilGrp.classList.contains("energized") : false;
        const wantClosed = gc.tpl.restClosed ? !coilEnergized : coilEnergized;
        const grp = this.compGroups.get(gc.id);
        if (grp.classList.contains("closed") !== wantClosed) changed = true;
        grp.classList.toggle("closed", wantClosed);
      }
      if (!changed) break;
    }

    for (const lc of lampComps) {
      const grp = this.compGroups.get(lc.id);
      const en = liveSrc.has(lc.id + ".X1") && (ex.return ? liveRet.has(lc.id + ".X2") : true);
      grp.classList.toggle("energized", en);
    }

    this._updateTimedContacts();
    this._markLiveWires(liveSrc, liveRet);
    this._flashChanges(before);
    if (this.opts.onSolve) this.opts.onSolve();
  }

  // one bright pulse on any component whose energized/closed state actually
  // flipped during this solve pass, so a change of state is unmistakable
  _flashChanges(before) {
    for (const [id, prev] of before) {
      const grp = this.compGroups.get(id);
      if (!grp) continue;
      const now = { energized: grp.classList.contains("energized"), closed: grp.classList.contains("closed") };
      if (now.energized !== prev.energized || now.closed !== prev.closed) this._flash(grp);
    }
  }

  _flash(g) {
    g.classList.remove("state-flash");
    void g.offsetWidth; // force reflow so the animation restarts
    g.classList.add("state-flash");
    clearTimeout(g._flashTimer);
    g._flashTimer = setTimeout(() => g.classList.remove("state-flash"), 550);
  }

  _updateTimedContacts() {
    for (const gc of this.exercise.components) {
      if (!gc.tpl.gate || !gc.timedFrom) continue;
      const coilGrp = this.compGroups.get(gc.timedFrom.coil);
      const coilEnergized = coilGrp ? coilGrp.classList.contains("energized") : false;
      const st = this._timerState[gc.id] || { energized: false, timeout: null };
      if (coilEnergized && !st.energized) {
        st.energized = true;
        st.timeout = setTimeout(() => {
          const grp = this.compGroups.get(gc.id);
          grp.classList.toggle("closed", !gc.tpl.restClosed);
          this._flash(grp);
          this.solve();
        }, gc.timedFrom.delayMs);
      } else if (!coilEnergized && st.energized) {
        st.energized = false;
        if (st.timeout) clearTimeout(st.timeout);
        st.timeout = null;
        const grp = this.compGroups.get(gc.id);
        grp.classList.toggle("closed", !!gc.tpl.restClosed);
      }
      this._timerState[gc.id] = st;
    }
  }

  _markLiveWires(liveSrc, liveRet) {
    for (const w of this.wires) {
      const live = (liveSrc.has(w.a) && liveSrc.has(w.b)) || (liveRet.has(w.a) && liveRet.has(w.b));
      w.el.classList.toggle("live", live);
    }
  }

  _onTerminalClick(id, e) {
    if (this.opts.readonly) return;
    e.stopPropagation();
    if (!this.pending) {
      this.pending = id;
      this._highlight(id, true);
      return;
    }
    if (this.pending === id) {
      this._highlight(id, false);
      this.pending = null;
      return;
    }
    this._addWire(this.pending, id);
    this._highlight(this.pending, false);
    this.pending = null;
  }

  _highlight(id, on) {
    const c = this.gTerm.querySelector(`[data-term="${CSS.escape(id)}"]`);
    if (c) c.classList.toggle("terminal-pending", on);
  }

  _addWire(a, b) {
    if (a === b) return;
    [a, b] = this._normalizeEndpoints(a, b);
    if (a === b) return;
    const exists = this.wires.find((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a));
    if (exists) { this._removeWire(exists); return; }
    this._drawWire(a, b, false);
    this.uf.union(a, b);
    this._recolorWires();
    this.solve();
    this.onChange();
  }

  // rail taps are all electrically identical, so pick whichever tap sits
  // closest to the other end of the wire — this keeps rail drops short and
  // near-vertical instead of an arbitrary tap forcing a long horizontal jog
  // that crosses in front of unrelated components.
  _nearestRailTap(railId, otherPos) {
    const taps = this.railTapIds[railId];
    if (!taps || !taps.length) return null;
    let best = null, bestD = Infinity;
    for (const tid of taps) {
      const p = this.termPos.get(tid);
      if (!p) continue;
      const d = Math.hypot(p.x - otherPos.x, p.y - otherPos.y);
      if (d < bestD) { bestD = d; best = tid; }
    }
    return best;
  }

  _resolveEndpoint(id, otherId) {
    const info = this.termPos.get(id);
    const otherInfo = this.termPos.get(otherId);
    if (info && info.railId && otherInfo && !otherInfo.railId) {
      const snapped = this._nearestRailTap(info.railId, otherInfo);
      if (snapped) return snapped;
    }
    return id;
  }

  _normalizeEndpoints(a, b) {
    const na = this._resolveEndpoint(a, b);
    const nb = this._resolveEndpoint(b, na);
    return [na, nb];
  }

  _drawWire(a, b, isStatic) {
    [a, b] = this._normalizeEndpoints(a, b);
    const pa = this.termPos.get(a), pb = this.termPos.get(b);
    if (!pa || !pb) return;
    let d;
    const dx = Math.abs(pa.x - pb.x), dy = Math.abs(pa.y - pb.y);
    if (dx < 1 || dy < 1) {
      d = `M${pa.x},${pa.y} L${pb.x},${pb.y}`;
    } else {
      // spread the elbow across almost the whole span between the two
      // terminals, at a fraction picked from a hash of this specific wire's
      // endpoints, so every wire takes a visibly different path instead of
      // many wires bunching along the same line. Route along whichever axis
      // has the greater distance first: a pair of terminals that sit at
      // nearly the same height but far apart in x (e.g. two components in
      // the same row) used to always jog vertically first, producing a
      // cramped little zigzag right where it leaves the terminal instead of
      // a clean run across the row.
      const key = a < b ? a + "|" + b : b + "|" + a;
      const h = hashStr(key);
      const frac = 0.12 + (h % 89) / 100; // 0.12 .. 1.00 of the span
      if (dy >= dx) {
        const top = Math.min(pa.y, pb.y), bottom = Math.max(pa.y, pb.y);
        const span = Math.max(bottom - top, 1);
        const jogY = Math.min(Math.max(top + span * frac, top + 4), bottom - 4);
        d = roundedPath([pa, { x: pa.x, y: jogY }, { x: pb.x, y: jogY }, pb], 11);
      } else {
        const left = Math.min(pa.x, pb.x), right = Math.max(pa.x, pb.x);
        const span = Math.max(right - left, 1);
        const jogX = Math.min(Math.max(left + span * frac, left + 4), right - 4);
        d = roundedPath([pa, { x: jogX, y: pa.y }, { x: jogX, y: pb.y }, pb], 11);
      }
    }
    const group = svgEl("g", { class: "wire-group" + (isStatic ? " wire-static" : "") });
    const shadow = svgEl("path", { d, class: "cable-shadow", fill: "none", transform: "translate(1.5,2.5)" });
    const core = svgEl("path", { d, class: "cable-tube", fill: "none" });
    const hi = svgEl("path", { d, class: "cable-hi", fill: "none" });
    const ferruleA = svgEl("circle", { cx: pa.x, cy: pa.y, r: 4.2, class: "cable-ferrule" });
    const ferruleB = svgEl("circle", { cx: pb.x, cy: pb.y, r: 4.2, class: "cable-ferrule" });
    const hit = svgEl("path", { d, class: "cable-hit", fill: "none" });
    group.appendChild(shadow);
    group.appendChild(core);
    group.appendChild(hi);
    group.appendChild(ferruleA);
    group.appendChild(ferruleB);
    group.appendChild(hit);
    if (!isStatic) {
      hit.addEventListener("click", (e) => {
        if (this.opts.readonly) return;
        e.stopPropagation();
        this._removeWire(wireObj);
      });
      hit.addEventListener("contextmenu", (e) => {
        if (this.opts.readonly) return;
        e.preventDefault();
        e.stopPropagation();
        this._removeWire(wireObj);
      });
    }
    this.gWires.appendChild(group);
    const wireObj = { a, b, el: group, isStatic };
    if (!isStatic) this.wires.push(wireObj);
    if (isStatic) this.uf.union(a, b);
  }

  _removeWire(wireObj) {
    wireObj.el.remove();
    this.wires = this.wires.filter((w) => w !== wireObj);
    this._rebuildUnionFromWires();
    this._recolorWires();
    this.solve();
    this.onChange();
  }

  // quick undo: remove the most recently placed wire
  undoLastWire() {
    if (!this.wires.length) return false;
    this._removeWire(this.wires[this.wires.length - 1]);
    return true;
  }

  // color every wire by the electrical node (net) it currently belongs to,
  // so two wires on the same node always match and different nodes are
  // always visually distinguishable, no matter how much they cross
  _recolorWires() {
    for (const w of this.wires) {
      const root = this.uf.find(w.a);
      const idx = hashStr(String(root)) % WIRE_COLOR_COUNT;
      for (let i = 0; i < WIRE_COLOR_COUNT; i++) w.el.classList.remove("wire-c" + i);
      w.el.classList.add("wire-c" + idx);
    }
  }

  _rebuildUnionFromWires() {
    this.uf = new UnionFind();
    const railGroups = {};
    for (const [id, info] of this.termPos) {
      if (info.railId) {
        railGroups[info.railId] = railGroups[info.railId] || [];
        railGroups[info.railId].push(id);
      }
    }
    for (const rid in railGroups) {
      const ids = railGroups[rid];
      for (let i = 1; i < ids.length; i++) this.uf.union(ids[0], ids[i]);
    }
    if (this.exercise.staticWires) {
      for (const [a, b] of this.exercise.staticWires) this.uf.union(a, b);
    }
    for (const w of this.wires) this.uf.union(w.a, w.b);
  }

  clearAll() {
    for (const w of [...this.wires]) this._removeWire(w);
  }

  wireCount() { return this.wires.length; }

  validate() {
    const nets = this.exercise.nets;
    const results = [];
    let correctNets = 0;
    for (const net of nets) {
      const roots = new Set(net.map((t) => this.uf.find(t)));
      const ok = roots.size === 1;
      if (ok) correctNets++;
      results.push({ net, ok });
    }
    // detect unwanted shorts between different nets
    let shorts = 0;
    for (let i = 0; i < nets.length; i++) {
      for (let j = i + 1; j < nets.length; j++) {
        if (this.uf.find(nets[i][0]) === this.uf.find(nets[j][0])) shorts++;
      }
    }
    return {
      correctNets, totalNets: nets.length, shorts,
      perfect: correctNets === nets.length && shorts === 0,
      results,
    };
  }

  markValidation(val) {
    this.gTerm.querySelectorAll(".terminal").forEach((c) => c.classList.remove("terminal-ok", "terminal-bad"));
    for (const r of val.results) {
      for (const t of r.net) {
        const c = this.gTerm.querySelector(`[data-term="${CSS.escape(t)}"]`);
        if (c) c.classList.add(r.ok ? "terminal-ok" : "terminal-bad");
      }
    }
  }

  setClosed(id, on) {
    const g = this.compGroups.get(id);
    if (!g) return;
    if (g.classList.contains("closed") !== !!on) this._flash(g);
    g.classList.toggle("closed", on);
  }

  setEnergized(id, on) {
    const g = this.compGroups.get(id);
    if (!g) return;
    if (g.classList.contains("energized") !== !!on) this._flash(g);
    g.classList.toggle("energized", on);
  }

  setRunning(id, on) {
    const g = this.compGroups.get(id);
    if (!g) return;
    g.classList.toggle("running", !!on);
    g.classList.toggle("speed-low", on === "low");
    g.classList.toggle("speed-high", on === "high");
  }

  isEnergized(id) {
    const g = this.compGroups.get(id);
    return g ? g.classList.contains("energized") : false;
  }

  isClosed(id) {
    const g = this.compGroups.get(id);
    return g ? g.classList.contains("closed") : false;
  }

  resetSimVisuals() {
    for (const g of this.compGroups.values()) {
      g.classList.remove("energized", "running");
    }
    for (const comp of this.exercise.components) {
      const g = this.compGroups.get(comp.id);
      if (g) g.classList.toggle("closed", !!comp.tpl.restClosed);
    }
  }

  async simulate(steps, log) {
    this.resetSimVisuals();
    for (const step of steps) {
      await step.run(this, log);
    }
  }
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
