"use strict";

/* =========================================================
   Datos: ejercicios de cableado, componentes del explorador
   y banco de preguntas.
   ========================================================= */

function C(id, label, tpl, x, y, extra) { return { id, label, tpl, x, y, ...extra }; }
function railComp(id, horizontal, len, label, x, y, taps) {
  return { id, label: null, tpl: TPL.rail(horizontal, len, label), x, y, taps };
}
function tapsAlong(xs, dy) { return xs.map((dx) => ({ dx, dy })); }

/* ---------------- helpers de simulacion ---------------- */

function logStep(msg) {
  return { run: async (d, log) => { log(msg); await sleep(650); } };
}
function actStep(fn, msg, wait) {
  return {
    run: async (d, log) => {
      if (msg) log(msg);
      fn(d);
      await sleep(wait || 650);
    },
  };
}

// dual-diagram versions for `combined: true` exercises, whose simulation
// script drives the control diagram AND the power diagram together
function cLogStep(msg) {
  return { run: async (dc, dp, log) => { log(msg); await sleep(650); } };
}
function cActStep(fn, msg, wait) {
  return {
    run: async (dc, dp, log) => {
      if (msg) log(msg);
      fn(dc, dp);
      await sleep(wait || 650);
    },
  };
}

/* =========================================================
   EJERCICIO 1: Arranque directo — CONTROL
   ========================================================= */

const dolControl = {
  id: "dol-control",
  level: 1,
  group: "directo",
  kind: "control",
  title: "Arranque Directo (DOL) — Circuito de Control",
  brief: "Cablea el clásico circuito de arranque-paro con sello: S0 (paro), S1 (marcha), el contacto de sello 13-14 de K1 y la bobina de K1, protegidos por el contacto térmico 95-96 de F2. Agrega los pilotos H1 (marcha) y H2 (paro). Una vez validado, presiona los botones para operar el circuito en vivo.",
  vb: [560, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
    C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "contactor"), 220, 400),
    C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "K1coil" }),
    C("H1", "H1 marcha", TPL.lamp("H1", "green"), 400, 240),
    C("K1aux3", "K1", TPL.contact("NC", "21-22", "21", "22"), 480, 150, { derivedFrom: "K1coil" }),
    C("H2", "H2 paro", TPL.lamp("H2", "red"), 480, 240),
  ],
  nets: [
    ["railL", "F2.95", "K1aux2.23", "K1aux3.21"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "K1aux1.13"],
    ["S1.4", "K1aux1.14", "K1coil.A1"],
    ["railN", "K1coil.A2", "H1.X2", "H2.X2"],
    ["K1aux2.24", "H1.X1"],
    ["K1aux3.22", "H2.X1"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => { d.setClosed("S1", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setClosed("K1aux2", true);
      d.setClosed("K1aux3", false);
      d.setEnergized("H1", true);
      d.setEnergized("H2", false);
    }, "K1 se energiza: cierra el contacto de sello 13-14 y sus auxiliares.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por el sello (13-14).", 900),
    logStep("Motor en marcha (ver circuito de fuerza). Presionas S0 (paro)..."),
    actStep((d) => {
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1", false);
      d.setClosed("K1aux2", false);
      d.setClosed("K1aux3", true);
      d.setEnergized("H1", false);
      d.setEnergized("H2", true);
    }, "K1 se desenergiza. El motor se detiene.", 900),
  ],
};

/* =========================================================
   EJERCICIO 2: Arranque directo — FUERZA
   ========================================================= */

const dolPower = {
  id: "dol-power",
  level: 1,
  group: "directo",
  kind: "fuerza",
  title: "Arranque Directo (DOL) — Circuito de Fuerza",
  brief: "Conecta L1, L2 y L3 a través de los 3 polos de K1 y del relé térmico F2 hacia las terminales U1, V1 y W1 del motor.",
  vb: [560, 560],
  components: [
    railComp("railL1", true, 380, "L1", 300, 60),
    railComp("railL2", true, 380, "L2", 300, 100),
    railComp("railL3", true, 380, "L3", 300, 140),
    C("K1a", "K1", TPL.pole("1-2", "1", "2"), 180, 220),
    C("K1b", "K1", TPL.pole("3-4", "3", "4"), 300, 220),
    C("K1c", "K1", TPL.pole("5-6", "5", "6"), 420, 220),
    C("F2a", "F2", TPL.pole("1-2", "1", "2"), 180, 320),
    C("F2b", "F2", TPL.pole("3-4", "3", "4"), 300, 320),
    C("F2c", "F2", TPL.pole("5-6", "5", "6"), 420, 320),
    C("M", "Motor", TPL.motor(true), 300, 440),
  ],
  nets: [
    ["railL1", "K1a.1"],
    ["railL2", "K1b.3"],
    ["railL3", "K1c.5"],
    ["K1a.2", "F2a.1"],
    ["K1b.4", "F2b.3"],
    ["K1c.6", "F2c.5"],
    ["F2a.2", "M.U1"],
    ["F2b.4", "M.V1"],
    ["F2c.6", "M.W1"],
  ],
  simulation: [
    logStep("K1 se energiza (circuito de control ya cerrado)..."),
    actStep((d) => { d.setClosed("K1a", true); d.setClosed("K1b", true); d.setClosed("K1c", true); }, "Los 3 polos de K1 cierran: L1-L2-L3 llegan al térmico F2.", 900),
    actStep((d) => { d.setRunning("M", true); }, "El motor arranca directo a tensión plena (100% Vred).", 900),
  ],
};

/* =========================================================
   EJERCICIO 3: Arranque con inversión de giro — CONTROL
   ========================================================= */

const revControl = {
  id: "rev-control",
  level: 1,
  group: "reversa",
  kind: "control",
  title: "Arranque con Inversión de Giro — Circuito de Control",
  brief: "Cablea el control de un arrancador reversible: S1 (adelante) y S2 (reversa) con sus contactos de sello, y el enclavamiento eléctrico cruzado entre KF y KR para que nunca cierren al mismo tiempo. Una vez validado, opera los botones en vivo.",
  vb: [640, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 500, "L", 340, 60),
    railComp("railN", true, 500, "N", 340, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 260, 130),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 260, 210, { manual: true }),
    C("S1", "S1 Adelante", TPL.button("NO", "3-4", "3", "4"), 180, 300, { manual: true }),
    C("KFaux1", "KF (sello)", TPL.contact("NO", "13-14", "13", "14"), 300, 300, { derivedFrom: "KFcoil" }),
    C("KRaux_i1", "KR (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 380, 300, { derivedFrom: "KRcoil" }),
    C("KFcoil", "KF", TPL.coil("KF", "adelante"), 300, 400),
    C("S2", "S2 Reversa", TPL.button("NO", "3-4", "3", "4"), 460, 300, { manual: true }),
    C("KRaux1", "KR (sello)", TPL.contact("NO", "13-14", "13", "14"), 540, 300, { derivedFrom: "KRcoil" }),
    C("KFaux_i1", "KF (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 460, 220, { derivedFrom: "KFcoil" }),
    C("KRcoil", "KR", TPL.coil("KR", "reversa"), 500, 400),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "KFaux1.13", "S2.3", "KRaux1.13"],
    ["S1.4", "KFaux1.14", "KRaux_i1.21"],
    ["KRaux_i1.22", "KFcoil.A1"],
    ["S2.4", "KRaux1.14", "KFaux_i1.21"],
    ["KFaux_i1.22", "KRcoil.A1"],
    ["railN", "KFcoil.A2", "KRcoil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 (adelante)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("KFcoil", true);
      d.setClosed("KFaux1", true);
      d.setClosed("KFaux_i1", false);
    }, "KF se energiza y abre su enclavamiento — KR queda bloqueado.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Motor gira ADELANTE (fase invertida en el circuito de fuerza).", 900),
    logStep("Presionas S0 (paro) y luego S2 (reversa)..."),
    actStep((d) => {
      d.setEnergized("KFcoil", false);
      d.setClosed("KFaux1", false);
      d.setClosed("KFaux_i1", true);
      d.setClosed("S2", true);
    }, "KF libera su enclavamiento. Ahora KR puede energizarse.", 900),
    actStep((d) => {
      d.setEnergized("KRcoil", true);
      d.setClosed("KRaux1", true);
      d.setClosed("KRaux_i1", false);
      d.setClosed("S2", false);
    }, "KR se energiza — motor gira en REVERSA. KF queda bloqueado.", 900),
  ],
};

/* =========================================================
   EJERCICIO 4: Estrella-Triángulo — CONTROL
   ========================================================= */

const ydControl = {
  id: "yd-control",
  level: 2,
  group: "estrella-delta",
  kind: "control",
  title: "Arranque Estrella-Triángulo — Circuito de Control",
  brief: "Cablea el control temporizado: al presionar S1 energizas K1 (línea) y K2 (estrella) junto con el temporizador KT. Al vencer el tiempo, KT desenergiza K2 y energiza K3 (triángulo), con enclavamiento eléctrico entre K2 y K3. El temporizador corre en tiempo real (3 s) una vez validado el circuito.",
  vb: [700, 620],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 560, "L", 360, 50),
    railComp("railN", true, 560, "N", 360, 570),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 200, 110),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 200, 180, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 140, 260, { manual: true }),
    C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 260, 260, { derivedFrom: "K1coil" }),
    C("K1coil", "K1 (línea)", TPL.coil("K1", "línea"), 200, 350),
    C("KTcoil", "KT", TPL.coil("KT", "temporiz."), 340, 350),
    C("KTnc", "KT (15-16)", TPL.contact("NC", "15-16", "15", "16"), 460, 260, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("K3auxNC", "K3 (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 460, 350, { derivedFrom: "K3coil" }),
    C("K2coil", "K2 (estrella)", TPL.coil("K2", "estrella"), 460, 440),
    C("KTno", "KT (15-18)", TPL.contact("NO", "15-18", "15", "18"), 580, 260, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("K2auxNC", "K2 (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 580, 350, { derivedFrom: "K2coil" }),
    C("K3coil", "K3 (triángulo)", TPL.coil("K3", "triángulo"), 580, 440),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "K1aux1.13"],
    ["S1.4", "K1aux1.14", "K1coil.A1", "KTcoil.A1", "KTnc.15", "KTno.15"],
    ["KTnc.16", "K3auxNC.21"],
    ["K3auxNC.22", "K2coil.A1"],
    ["KTno.18", "K2auxNC.21"],
    ["K2auxNC.22", "K3coil.A1"],
    ["railN", "K1coil.A2", "KTcoil.A2", "K2coil.A2", "K3coil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setEnergized("KTcoil", true);
    }, "K1 (línea) y KT (temporizador) se energizan juntos.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por su sello.", 700),
    actStep((d) => {
      d.setClosed("KTnc", true);
      d.setEnergized("K2coil", true);
      d.setClosed("K3auxNC", false);
    }, "El contacto KT 15-16 (NC instantáneo) energiza K2: motor en ESTRELLA.", 900),
    logStep("Transcurre el tiempo ajustado en KT (arranque en estrella)..."),
    actStep((d) => {
      d.setClosed("KTnc", false);
      d.setEnergized("K2coil", false);
      d.setClosed("K3auxNC", true);
    }, "KT vence: abre 15-16 y K2 se desenergiza (enclavamiento libre).", 900),
    actStep((d) => {
      d.setClosed("KTno", true);
      d.setEnergized("K3coil", true);
      d.setClosed("K2auxNC", false);
    }, "KT cierra 15-18: K3 se energiza — motor conmuta a TRIÁNGULO (tensión plena).", 900),
  ],
};

/* =========================================================
   EJERCICIO 5: Estrella-Triángulo — FUERZA
   ========================================================= */

const ydPower = {
  id: "yd-power",
  level: 2,
  group: "estrella-delta",
  kind: "fuerza",
  title: "Arranque Estrella-Triángulo — Circuito de Fuerza",
  brief: "Conecta L1-L2-L3 a K1 y F2 hacia U1-V1-W1. Con K3 cruza U1→W2, V1→U2, W1→V2 para cerrar el triángulo. Con K2 une U2-V2-W2 (puente) para formar el punto estrella.",
  vb: [760, 700],
  components: [
    railComp("railL1", true, 560, "L1", 380, 50),
    railComp("railL2", true, 560, "L2", 380, 90),
    railComp("railL3", true, 560, "L3", 380, 130),
    C("K1a", "K1", TPL.pole("1-2", "1", "2"), 260, 200),
    C("K1b", "K1", TPL.pole("3-4", "3", "4"), 380, 200),
    C("K1c", "K1", TPL.pole("5-6", "5", "6"), 500, 200),
    C("F2a", "F2", TPL.pole("1-2", "1", "2"), 260, 290),
    C("F2b", "F2", TPL.pole("3-4", "3", "4"), 380, 290),
    C("F2c", "F2", TPL.pole("5-6", "5", "6"), 500, 290),
    C("M", "Motor (6 terminales)", TPL.motor(false), 380, 410),
    C("K3a", "K3", TPL.pole("U1-W2", "in1", "out1"), 200, 560),
    C("K3b", "K3", TPL.pole("V1-U2", "in2", "out2"), 320, 560),
    C("K3c", "K3", TPL.pole("W1-V2", "in3", "out3"), 440, 560),
    C("K2a", "K2", TPL.pole("U2", "in1", "out1"), 560, 480),
    C("K2b", "K2", TPL.pole("V2", "in2", "out2"), 640, 480),
    C("K2c", "K2", TPL.pole("W2", "in3", "out3"), 720, 480),
  ],
  nets: [
    ["railL1", "K1a.1"],
    ["railL2", "K1b.3"],
    ["railL3", "K1c.5"],
    ["K1a.2", "F2a.1"],
    ["K1b.4", "F2b.3"],
    ["K1c.6", "F2c.5"],
    ["F2a.2", "M.U1", "K3a.in1"],
    ["F2b.4", "M.V1", "K3b.in2"],
    ["F2c.6", "M.W1", "K3c.in3"],
    ["K3a.out1", "M.W2", "K2c.in3"],
    ["K3b.out2", "M.U2", "K2a.in1"],
    ["K3c.out3", "M.V2", "K2b.in2"],
    ["K2a.out1", "K2b.out2", "K2c.out3"],
  ],
  simulation: [
    logStep("Motor arrancando en ESTRELLA (K1 + K2 cerrados)..."),
    actStep((d) => { d.setClosed("K1a", true); d.setClosed("K1b", true); d.setClosed("K1c", true); }, "K1 conecta L1-L2-L3 a U1-V1-W1.", 800),
    actStep((d) => { d.setClosed("K2a", true); d.setClosed("K2b", true); d.setClosed("K2c", true); d.setRunning("M", true); }, "K2 puentea U2-V2-W2: punto estrella formado. Corriente reducida ~33%.", 1000),
    logStep("Temporizador vence..."),
    actStep((d) => { d.setClosed("K2a", false); d.setClosed("K2b", false); d.setClosed("K2c", false); }, "K2 abre — se libera el punto estrella.", 700),
    actStep((d) => { d.setClosed("K3a", true); d.setClosed("K3b", true); d.setClosed("K3c", true); }, "K3 cierra el triángulo (U1-W2, V1-U2, W1-V2): tensión plena en cada devanado.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 6: Autotransformador — CONTROL
   ========================================================= */

const autoControl = {
  id: "auto-control",
  level: 2,
  group: "autotransformador",
  kind: "control",
  title: "Arranque por Autotransformador — Circuito de Control",
  brief: "Al presionar S1 energizas KS (arranque) y KC (común) junto con KT. Al vencer el tiempo, KT desenergiza KS/KC y energiza KL (línea), que se autosostiene con su propio sello. Enclavamiento cruzado entre KS y KL. El temporizador corre en tiempo real (3 s).",
  vb: [760, 620],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 620, "L", 390, 50),
    railComp("railN", true, 620, "N", 390, 570),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 200, 110),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 200, 180, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 140, 260, { manual: true }),
    C("KTauxSeal", "KT (sello)", TPL.contact("NO", "13-14", "13", "14"), 260, 260, { derivedFrom: "KTcoil" }),
    C("KTcoil", "KT", TPL.coil("KT", "temporiz."), 200, 350),
    C("KTnc", "KT (15-16)", TPL.contact("NC", "15-16", "15", "16"), 340, 350, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("KLauxNC", "KL (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 340, 430, { derivedFrom: "KLcoil" }),
    C("KScoil", "KS (arranque)", TPL.coil("KS", "arranque"), 220, 520),
    C("KCcoil", "KC (común)", TPL.coil("KC", "común"), 340, 520),
    C("KTno", "KT (15-18)", TPL.contact("NO", "15-18", "15", "18"), 460, 260, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("KSauxNC", "KS (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 580, 260, { derivedFrom: "KScoil" }),
    C("KLauxSeal", "KL (sello)", TPL.contact("NO", "13-14", "13", "14"), 580, 350, { derivedFrom: "KLcoil" }),
    C("KLcoil", "KL (línea)", TPL.coil("KL", "línea"), 580, 440),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "KTauxSeal.13", "KLauxSeal.13"],
    ["S1.4", "KTauxSeal.14", "KTcoil.A1", "KTnc.15", "KTno.15"],
    ["KTnc.16", "KLauxNC.21"],
    ["KLauxNC.22", "KScoil.A1", "KCcoil.A1"],
    ["KTno.18", "KSauxNC.21"],
    ["KSauxNC.22", "KLcoil.A1", "KLauxSeal.14"],
    ["railN", "KScoil.A2", "KCcoil.A2", "KTcoil.A2", "KLcoil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setClosed("KTauxSeal", true);
      d.setEnergized("KTcoil", true);
      d.setEnergized("KScoil", true);
      d.setEnergized("KCcoil", true);
      d.setClosed("KSauxNC", false);
    }, "KT se energiza y se sella (13-14). Con 15-16 cerrado en reposo, KS y KC arrancan: motor al tap del autotransformador (65%).", 1000),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — KT se mantiene por su propio sello.", 700),
    logStep("Transcurre el tiempo ajustado en KT..."),
    actStep((d) => {
      d.setClosed("KTnc", false);
      d.setEnergized("KScoil", false);
      d.setEnergized("KCcoil", false);
      d.setClosed("KSauxNC", true);
      d.setClosed("KTno", true);
    }, "KT vence: abre 15-16 (KS/KC se desenergizan) y cierra 15-18.", 900),
    actStep((d) => {
      d.setEnergized("KLcoil", true);
      d.setClosed("KLauxSeal", true);
      d.setClosed("KLauxNC", false);
    }, "KL se energiza y se autosostiene con su sello (13-14): motor a tensión plena, directo a línea.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 7: Autotransformador — FUERZA
   ========================================================= */

const autoPower = {
  id: "auto-power",
  level: 2,
  group: "autotransformador",
  kind: "fuerza",
  title: "Arranque por Autotransformador — Circuito de Fuerza",
  brief: "En arranque, KS conecta L1-L2-L3 a la línea del autotransformador y KC cierra su punto común; el motor toma la derivación (tap) de cada fase. En marcha, KL conecta L1-L2-L3 directo al motor y el autotransformador queda fuera de servicio.",
  vb: [780, 760],
  components: [
    railComp("railL1", true, 620, "L1", 400, 50),
    railComp("railL2", true, 620, "L2", 400, 90),
    railComp("railL3", true, 620, "L3", 400, 130),
    C("KSa", "KS", TPL.pole("1-2", "1", "2"), 220, 210),
    C("KSb", "KS", TPL.pole("3-4", "3", "4"), 340, 210),
    C("KSc", "KS", TPL.pole("5-6", "5", "6"), 460, 210),
    C("ATa", "Autotransformador A", TPL.autoPhase("A"), 220, 340),
    C("ATb", "Autotransformador B", TPL.autoPhase("B"), 340, 340),
    C("ATc", "Autotransformador C", TPL.autoPhase("C"), 460, 340),
    C("KCa", "KC", TPL.pole("1-2", "1", "2"), 220, 470),
    C("KCb", "KC", TPL.pole("3-4", "3", "4"), 340, 470),
    C("KCc", "KC", TPL.pole("5-6", "5", "6"), 460, 470),
    C("KLa", "KL", TPL.pole("1-2", "1", "2"), 600, 210),
    C("KLb", "KL", TPL.pole("3-4", "3", "4"), 660, 260),
    C("KLc", "KL", TPL.pole("5-6", "5", "6"), 720, 310),
    C("F2a", "F2", TPL.pole("1-2", "1", "2"), 220, 610),
    C("F2b", "F2", TPL.pole("3-4", "3", "4"), 340, 610),
    C("F2c", "F2", TPL.pole("5-6", "5", "6"), 460, 610),
    C("M", "Motor", TPL.motor(true), 340, 700),
  ],
  nets: [
    ["railL1", "KSa.1", "KLa.1"],
    ["railL2", "KSb.3", "KLb.3"],
    ["railL3", "KSc.5", "KLc.5"],
    ["KSa.2", "ATa.L"],
    ["KSb.4", "ATb.L"],
    ["KSc.6", "ATc.L"],
    ["ATa.C", "KCa.1"],
    ["ATb.C", "KCb.3"],
    ["ATc.C", "KCc.5"],
    ["KCa.2", "KCb.4", "KCc.6"],
    ["ATa.D", "F2a.1", "KLa.2"],
    ["ATb.D", "F2b.3", "KLb.4"],
    ["ATc.D", "F2c.5", "KLc.6"],
    ["F2a.2", "M.U1"],
    ["F2b.4", "M.V1"],
    ["F2c.6", "M.W1"],
  ],
  simulation: [
    logStep("Arranque: KS y KC se energizan (ver control)..."),
    actStep((d) => { d.setClosed("KSa", true); d.setClosed("KSb", true); d.setClosed("KSc", true); }, "KS conecta L1-L2-L3 a la línea del autotransformador.", 800),
    actStep((d) => { d.setClosed("KCa", true); d.setClosed("KCb", true); d.setClosed("KCc", true); }, "KC cierra el punto común: el autotransformador entra en servicio.", 800),
    actStep((d) => { d.setRunning("M", true); }, "Motor arranca con ~65% de tensión en la derivación (tap).", 900),
    logStep("Temporizador vence..."),
    actStep((d) => { d.setClosed("KSa", false); d.setClosed("KSb", false); d.setClosed("KSc", false); d.setClosed("KCa", false); d.setClosed("KCb", false); d.setClosed("KCc", false); }, "KS y KC abren: autotransformador queda fuera de servicio.", 800),
    actStep((d) => { d.setClosed("KLa", true); d.setClosed("KLb", true); d.setClosed("KLc", true); }, "KL conecta L1-L2-L3 directo al motor: tensión plena.", 900),
  ],
};

/* =========================================================
   EJERCICIO 8: Motor de Dos Velocidades (Dahlander) — CONTROL
   ========================================================= */

const twoSpeedControl = {
  id: "2speed-control",
  level: 2,
  group: "dos-velocidades",
  kind: "control",
  title: "Motor de Dos Velocidades (Dahlander) — Circuito de Control",
  brief: "Cablea S1 (baja velocidad) y S2 (alta velocidad), cada uno con su sello, y el enclavamiento eléctrico cruzado entre KM1 (baja) y KM3+KM2 (alta) para que nunca cierren juntos.",
  vb: [700, 620],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 560, "L", 360, 50),
    railComp("railN", true, 560, "N", 360, 570),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 260, 110),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 260, 180, { manual: true }),
    C("S1", "S1 Baja vel.", TPL.button("NO", "3-4", "3", "4"), 180, 260, { manual: true }),
    C("KM1aux1", "KM1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 300, 260, { derivedFrom: "KM1coil" }),
    C("KM3aux_i", "KM3 (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 380, 260, { derivedFrom: "KM3coil" }),
    C("KM1coil", "KM1", TPL.coil("KM1", "baja vel."), 300, 350),
    C("S2", "S2 Alta vel.", TPL.button("NO", "3-4", "3", "4"), 460, 260, { manual: true }),
    C("KM3aux1", "KM3 (sello)", TPL.contact("NO", "13-14", "13", "14"), 540, 260, { derivedFrom: "KM3coil" }),
    C("KM1aux_i", "KM1 (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 460, 180, { derivedFrom: "KM1coil" }),
    C("KM3coil", "KM3", TPL.coil("KM3", "alta vel."), 480, 440),
    C("KM2coil", "KM2", TPL.coil("KM2", "puente alta"), 600, 440),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "KM1aux1.13", "S2.3", "KM3aux1.13"],
    ["S1.4", "KM1aux1.14", "KM3aux_i.21"],
    ["KM3aux_i.22", "KM1coil.A1"],
    ["S2.4", "KM3aux1.14", "KM1aux_i.21"],
    ["KM1aux_i.22", "KM3coil.A1", "KM2coil.A1"],
    ["railN", "KM1coil.A2", "KM3coil.A2", "KM2coil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 (baja velocidad)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("KM1coil", true);
      d.setClosed("KM1aux1", true);
      d.setClosed("KM1aux_i", false);
    }, "KM1 se energiza y abre su enclavamiento — la alta velocidad queda bloqueada.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Motor gira en BAJA velocidad (polos en paralelo estrella).", 900),
    logStep("Presionas S0 (paro) y luego S2 (alta velocidad)..."),
    actStep((d) => {
      d.setEnergized("KM1coil", false);
      d.setClosed("KM1aux1", false);
      d.setClosed("KM1aux_i", true);
      d.setClosed("S2", true);
    }, "KM1 libera su enclavamiento.", 900),
    actStep((d) => {
      d.setEnergized("KM3coil", true);
      d.setEnergized("KM2coil", true);
      d.setClosed("KM3aux1", true);
      d.setClosed("KM3aux_i", false);
      d.setClosed("S2", false);
    }, "KM3 + KM2 se energizan juntos — motor conmuta a ALTA velocidad (doble estrella).", 900),
  ],
};

/* =========================================================
   EJERCICIO 9: Motor de Dos Velocidades (Dahlander) — FUERZA
   ========================================================= */

const twoSpeedPower = {
  id: "2speed-power",
  level: 2,
  group: "dos-velocidades",
  kind: "fuerza",
  title: "Motor de Dos Velocidades (Dahlander) — Circuito de Fuerza",
  brief: "Con KM1 alimenta U1-V1-W1 (baja velocidad). Con KM3 alimenta U2-V2-W2 (alta velocidad) mientras KM2 puentea U1-V1-W1 entre sí (doble estrella). Cada velocidad tiene su propio relé térmico, calibrado a su corriente nominal.",
  vb: [780, 700],
  components: [
    railComp("railL1", true, 620, "L1", 400, 50),
    railComp("railL2", true, 620, "L2", 400, 90),
    railComp("railL3", true, 620, "L3", 400, 130),
    C("KM1a", "KM1", TPL.pole("1-2", "1", "2"), 220, 210),
    C("KM1b", "KM1", TPL.pole("3-4", "3", "4"), 340, 210),
    C("KM1c", "KM1", TPL.pole("5-6", "5", "6"), 460, 210),
    C("KM3a", "KM3", TPL.pole("1-2", "1", "2"), 560, 210),
    C("KM3b", "KM3", TPL.pole("3-4", "3", "4"), 660, 210),
    C("KM3c", "KM3", TPL.pole("5-6", "5", "6"), 760, 210),
    C("F2a", "F2 (baja)", TPL.pole("1-2", "1", "2"), 220, 300),
    C("F2b", "F2 (baja)", TPL.pole("3-4", "3", "4"), 340, 300),
    C("F2c", "F2 (baja)", TPL.pole("5-6", "5", "6"), 460, 300),
    C("F2xa", "F2 (alta)", TPL.pole("1-2", "1", "2"), 560, 300),
    C("F2xb", "F2 (alta)", TPL.pole("3-4", "3", "4"), 660, 300),
    C("F2xc", "F2 (alta)", TPL.pole("5-6", "5", "6"), 760, 300),
    C("M", "Motor (6 terminales)", TPL.motor(false), 460, 430),
    C("KM2a", "KM2", TPL.pole("U1", "in1", "out1"), 220, 570),
    C("KM2b", "KM2", TPL.pole("V1", "in2", "out2"), 320, 570),
    C("KM2c", "KM2", TPL.pole("W1", "in3", "out3"), 420, 570),
  ],
  nets: [
    ["railL1", "KM1a.1", "KM3a.1"],
    ["railL2", "KM1b.3", "KM3b.3"],
    ["railL3", "KM1c.5", "KM3c.5"],
    ["KM1a.2", "F2a.1"],
    ["KM1b.4", "F2b.3"],
    ["KM1c.6", "F2c.5"],
    ["F2a.2", "M.U1", "KM2a.in1"],
    ["F2b.4", "M.V1", "KM2b.in2"],
    ["F2c.6", "M.W1", "KM2c.in3"],
    ["KM2a.out1", "KM2b.out2", "KM2c.out3"],
    ["KM3a.2", "F2xa.1"],
    ["KM3b.4", "F2xb.3"],
    ["KM3c.6", "F2xc.5"],
    ["F2xa.2", "M.U2"],
    ["F2xb.4", "M.V2"],
    ["F2xc.6", "M.W2"],
  ],
  simulation: [
    logStep("KM1 energizado (baja velocidad, ver control)..."),
    actStep((d) => { d.setClosed("KM1a", true); d.setClosed("KM1b", true); d.setClosed("KM1c", true); d.setRunning("M", "low"); }, "KM1 conecta L1-L2-L3 a U1-V1-W1: motor en baja velocidad.", 1000),
    logStep("Presionas S0, luego S2 (alta velocidad)..."),
    actStep((d) => { d.setClosed("KM1a", false); d.setClosed("KM1b", false); d.setClosed("KM1c", false); }, "KM1 abre.", 700),
    actStep((d) => { d.setClosed("KM3a", true); d.setClosed("KM3b", true); d.setClosed("KM3c", true); }, "KM3 conecta L1-L2-L3 a U2-V2-W2.", 800),
    actStep((d) => { d.setClosed("KM2a", true); d.setClosed("KM2b", true); d.setClosed("KM2c", true); d.setRunning("M", "high"); }, "KM2 puentea U1-V1-W1 (doble estrella): motor en ALTA velocidad.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 10: Alarma con Sensor de Límite — CONTROL
   ========================================================= */

const alarmControl = {
  id: "alarm-control",
  level: 1,
  group: "alarma",
  kind: "control",
  title: "Alarma con Sensor de Límite — Circuito de Control",
  brief: "Cablea el guardamotor Q1 (interruptor manual), el sensor de límite LS1 que dispara la alarma con sello a través del relé auxiliar CR, la bocina H1 y el piloto H2 ('sistema listo'). Q1 es un interruptor de verdad: ábrelo para cortar toda la alimentación.",
  vb: [640, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 500, "L", 340, 60),
    railComp("railN", true, 500, "N", 340, 500),
    C("Q1", "Q1 guardamotor", TPL.breaker("Q1", "1", "2"), 220, 130, { toggle: true }),
    C("S0", "S0 Reset", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
    C("LS1", "LS1 sensor", TPL.limitSwitch("NO", "3-4", "3", "4"), 180, 300, { manual: true }),
    C("CRaux1", "CR (sello)", TPL.contact("NO", "13-14", "13", "14"), 300, 300, { derivedFrom: "CRcoil" }),
    C("CRcoil", "CR", TPL.coil("CR", "relé aux."), 240, 400),
    C("CRaux2", "CR", TPL.contact("NO", "23-24", "23", "24"), 420, 150, { derivedFrom: "CRcoil" }),
    C("H1", "H1 bocina", TPL.horn("ALARMA"), 420, 250),
    C("CRaux3", "CR", TPL.contact("NC", "31-32", "31", "32"), 520, 150, { derivedFrom: "CRcoil" }),
    C("H2", "H2 listo", TPL.lamp("H2", "green"), 520, 250),
  ],
  nets: [
    ["railL", "Q1.1"],
    ["Q1.2", "S0.1", "CRaux2.23", "CRaux3.31"],
    ["S0.2", "LS1.3", "CRaux1.13"],
    ["LS1.4", "CRaux1.14", "CRcoil.A1"],
    ["railN", "CRcoil.A2", "H1.X2", "H2.X2"],
    ["CRaux2.24", "H1.X1"],
    ["CRaux3.32", "H2.X1"],
  ],
  simulation: [
    logStep("Un objeto activa el sensor LS1..."),
    actStep((d) => { d.setClosed("LS1", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("CRcoil", true);
      d.setClosed("CRaux1", true);
      d.setClosed("CRaux2", true);
      d.setClosed("CRaux3", false);
      d.setEnergized("H1", true);
      d.setEnergized("H2", false);
    }, "CR se energiza y se sella — suena la bocina H1.", 1000),
    actStep((d) => { d.setClosed("LS1", false); }, "El objeto ya pasó (LS1 se libera) pero la alarma se mantiene sellada.", 900),
    logStep("Presionas S0 para reconocer y silenciar la alarma..."),
    actStep((d) => {
      d.setEnergized("CRcoil", false);
      d.setClosed("CRaux1", false);
      d.setClosed("CRaux2", false);
      d.setClosed("CRaux3", true);
      d.setEnergized("H1", false);
      d.setEnergized("H2", true);
    }, "CR se desenergiza — la bocina calla y el piloto verde indica 'listo'.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 11: Variador de Frecuencia — CONTROL
   ========================================================= */

const vfdControl = {
  id: "vfd-control",
  level: 2,
  group: "variador",
  kind: "control",
  title: "Arranque con Variador de Frecuencia — Circuito de Control",
  brief: "Los variadores modernos aceptan señales de mando simples: cablea el selector SEL1 (marcha/paro) y SEL2 (adelante/reversa) directo a las entradas digitales del variador — sin sello ni enclavamiento, porque el propio variador gestiona la transición de forma segura.",
  vb: [640, 520],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 500, "L", 340, 50),
    railComp("railN", true, 500, "N", 340, 460),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 260, 110),
    C("SEL1", "SEL1 Marcha/Paro", TPL.selector("0-1", "0", "1"), 220, 190, { toggle: true }),
    C("SEL2", "SEL2 Adel./Rev.", TPL.selector("0-1", "0", "1"), 420, 190, { toggle: true }),
    C("VFDRUNaux", "VFD", TPL.contact("NO", "13-14", "13", "14"), 105, 190),
    C("VFDDIRaux", "VFD", TPL.contact("NO", "13-14", "13", "14"), 545, 190),
    C("VFDRUNcoil", "VFD", TPL.coil("VFD", "marcha"), 220, 300),
    C("VFDDIRcoil", "VFD", TPL.coil("VFD", "reversa"), 420, 300),
    C("H1", "H1 marcha", TPL.lamp("H1", "green"), 105, 390),
    C("H2", "H2 reversa", TPL.lamp("H2", "red"), 545, 390),
  ],
  nets: [
    ["railL", "F2.95", "VFDRUNaux.13", "VFDDIRaux.13"],
    ["F2.96", "SEL1.0", "SEL2.0"],
    ["SEL1.1", "VFDRUNcoil.A1"],
    ["SEL2.1", "VFDDIRcoil.A1"],
    ["VFDRUNaux.14", "H1.X1"],
    ["VFDDIRaux.14", "H2.X1"],
    ["railN", "VFDRUNcoil.A2", "VFDDIRcoil.A2", "H1.X2", "H2.X2"],
  ],
  simulation: [
    logStep("Giras SEL1 a la posición 'Marcha'..."),
    actStep((d) => { d.setClosed("SEL1", true); d.setEnergized("VFDRUNcoil", true); d.setEnergized("H1", true); }, "El variador recibe la orden de marcha (entrada digital activa).", 900),
    actStep((d) => { d.setRunning("M", true); }, "El variador rampa la velocidad — motor en marcha (ver fuerza).", 900),
    logStep("Giras SEL2 a 'Reversa'..."),
    actStep((d) => { d.setClosed("SEL2", true); d.setEnergized("VFDDIRcoil", true); d.setEnergized("H2", true); }, "El variador invierte la secuencia internamente — sin contactores de por medio.", 900),
  ],
};

/* =========================================================
   EJERCICIO 12: Variador de Frecuencia — FUERZA
   ========================================================= */

const vfdPower = {
  id: "vfd-power",
  level: 2,
  group: "variador",
  kind: "fuerza",
  title: "Arranque con Variador de Frecuencia — Circuito de Fuerza",
  brief: "Conecta L1-L2-L3 a través del guardamotor Q1 hacia las entradas del variador, y de sus salidas U-V-W directo al motor. Un variador sustituye por completo al arreglo de contactores de un arranque a tensión reducida.",
  vb: [560, 560],
  components: [
    railComp("railL1", true, 420, "L1", 300, 50),
    railComp("railL2", true, 420, "L2", 300, 90),
    railComp("railL3", true, 420, "L3", 300, 130),
    C("Q1a", "Q1", TPL.pole("1-2", "1", "2"), 220, 210),
    C("Q1b", "Q1", TPL.pole("3-4", "3", "4"), 300, 210),
    C("Q1c", "Q1", TPL.pole("5-6", "5", "6"), 380, 210),
    C("VFD", "Variador", TPL.vfd(), 300, 340),
    C("M", "Motor", TPL.motor(true), 300, 480),
  ],
  nets: [
    ["railL1", "Q1a.1"],
    ["railL2", "Q1b.3"],
    ["railL3", "Q1c.5"],
    ["Q1a.2", "VFD.L1"],
    ["Q1b.4", "VFD.L2"],
    ["Q1c.6", "VFD.L3"],
    ["VFD.U", "M.U1"],
    ["VFD.V", "M.V1"],
    ["VFD.W", "M.W1"],
  ],
  simulation: [
    logStep("Q1 cierra (ver control)..."),
    actStep((d) => { d.setClosed("Q1a", true); d.setClosed("Q1b", true); d.setClosed("Q1c", true); }, "Q1 energiza el variador con las 3 líneas.", 900),
    actStep((d) => { d.setRunning("M", true); }, "El variador rampa la frecuencia de 0 a 60 Hz: arranque suave, sin picos de corriente.", 1100),
  ],
};

/* =========================================================
   EJERCICIO 13: Motor DC con Chopper — CONTROL
   ========================================================= */

const chopperControl = {
  id: "chopper-control",
  level: 2,
  group: "chopper",
  kind: "control",
  title: "Motor DC con Chopper — Circuito de Control",
  brief: "Cablea el clásico arranque-paro con sello para habilitar el chopper: S0 (paro), S1 (marcha), el contacto de sello y la bobina que habilita el módulo. El chopper regula internamente el voltaje de armadura mediante PWM.",
  vb: [560, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
    C("CHaux1", "CH (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "CHcoil" }),
    C("CHcoil", "CHOPPER", TPL.coil("CH", "habilita"), 220, 400),
    C("CHaux2", "CH", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "CHcoil" }),
    C("H1", "H1 marcha", TPL.lamp("H1", "green"), 400, 240),
    C("CHaux3", "CH", TPL.contact("NC", "21-22", "21", "22"), 480, 150, { derivedFrom: "CHcoil" }),
    C("H2", "H2 paro", TPL.lamp("H2", "red"), 480, 240),
  ],
  nets: [
    ["railL", "F2.95", "CHaux2.23", "CHaux3.21"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "CHaux1.13"],
    ["S1.4", "CHaux1.14", "CHcoil.A1"],
    ["railN", "CHcoil.A2", "H1.X2", "H2.X2"],
    ["CHaux2.24", "H1.X1"],
    ["CHaux3.22", "H2.X1"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("CHcoil", true);
      d.setClosed("CHaux1", true);
      d.setClosed("CHaux2", true);
      d.setClosed("CHaux3", false);
      d.setEnergized("H1", true);
      d.setEnergized("H2", false);
    }, "El chopper queda habilitado y modula el PWM hacia la armadura.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — la habilitación se mantiene por el sello.", 800),
    logStep("Motor DC en marcha (ver fuerza). Presionas S0..."),
    actStep((d) => {
      d.setEnergized("CHcoil", false);
      d.setClosed("CHaux1", false);
      d.setClosed("CHaux2", false);
      d.setClosed("CHaux3", true);
      d.setEnergized("H1", false);
      d.setEnergized("H2", true);
    }, "El chopper se deshabilita. El motor DC se detiene.", 900),
  ],
};

/* =========================================================
   EJERCICIO 14: Motor DC con Chopper — FUERZA
   ========================================================= */

const chopperPower = {
  id: "chopper-power",
  level: 2,
  group: "chopper",
  kind: "fuerza",
  title: "Motor DC con Chopper — Circuito de Fuerza",
  brief: "Conecta la fuente DC (L+/L-) a través del interruptor BRK hacia las entradas del chopper, y sus salidas (A+/A-) al motor DC. El chopper recorta (\"chopea\") el voltaje mediante PWM para regular la velocidad.",
  vb: [500, 560],
  components: [
    railComp("railLp", true, 340, "L+", 260, 60),
    railComp("railLm", true, 340, "L-", 260, 100),
    C("BRKp", "BRK", TPL.pole("+", "1", "2"), 200, 190),
    C("BRKm", "BRK", TPL.pole("-", "1", "2"), 320, 190),
    C("CH", "Chopper", TPL.chopper(), 260, 320),
    C("M", "Motor DC", TPL.motorDC(), 260, 450),
  ],
  nets: [
    ["railLp", "BRKp.1"],
    ["railLm", "BRKm.1"],
    ["BRKp.2", "CH.Lp"],
    ["BRKm.2", "CH.Lm"],
    ["CH.Ap", "M.A1"],
    ["CH.Am", "M.A2"],
  ],
  simulation: [
    logStep("BRK cierra (ver control)..."),
    actStep((d) => { d.setClosed("BRKp", true); d.setClosed("BRKm", true); }, "El chopper recibe la alimentación DC.", 900),
    actStep((d) => { d.setRunning("M", true); }, "El chopper module el ancho de pulso: motor DC gira a la velocidad de referencia.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 15: Control desde Dos Botoneras — CONTROL
   ========================================================= */

const twoStationControl = {
  id: "twostation-control",
  level: 2,
  group: "botoneras",
  kind: "control",
  title: "Control desde Dos Botoneras — Circuito de Control",
  brief: "Arranque directo controlado desde dos ubicaciones: los paros (S0 local y S0 remoto) van en SERIE — cualquiera detiene el motor — y las marchas (S1 local y S1 remoto) van en PARALELO — cualquiera lo arranca. Comparte el mismo circuito de fuerza que el arranque directo.",
  vb: [700, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 560, "L", 360, 60),
    railComp("railN", true, 560, "N", 360, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 260, 130),
    C("S0a", "S0 Paro (local)", TPL.button("NC", "1-2", "1", "2"), 260, 210, { manual: true }),
    C("S0b", "S0 Paro (remoto)", TPL.button("NC", "1-2", "1", "2"), 260, 290, { manual: true }),
    C("S1a", "S1 Marcha (local)", TPL.button("NO", "3-4", "3", "4"), 460, 210, { manual: true }),
    C("S1b", "S1 Marcha (remoto)", TPL.button("NO", "3-4", "3", "4"), 460, 290, { manual: true }),
    C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 580, 250, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "contactor"), 400, 400),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0a.1"],
    ["S0a.2", "S0b.1"],
    ["S0b.2", "S1a.3", "S1b.3", "K1aux1.13"],
    ["S1a.4", "S1b.4", "K1aux1.14", "K1coil.A1"],
    ["railN", "K1coil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 remoto (marcha)..."),
    actStep((d) => { d.setClosed("S1b", true); d.setEnergized("K1coil", true); d.setClosed("K1aux1", true); }, "K1 se energiza — se puede haber presionado cualquiera de las dos marchas.", 900),
    actStep((d) => { d.setClosed("S1b", false); }, "Motor en marcha, sellado por 13-14.", 700),
    logStep("Presionas S0 local (paro)..."),
    actStep((d) => { d.setClosed("S0a", false); }, "Basta con abrir CUALQUIERA de los dos paros en serie para detener el motor.", 700),
    actStep((d) => { d.setEnergized("K1coil", false); d.setClosed("K1aux1", false); }, "K1 se desenergiza. Motor detenido.", 900),
    actStep((d) => { d.setClosed("S0a", true); }, "S0 local regresa a reposo (cerrado).", 500),
  ],
};

/* =========================================================
   EJERCICIO 16: Arrancador Suave (Soft Starter) — CONTROL
   ========================================================= */

const softStarterControl = {
  id: "softstarter-control",
  level: 2,
  group: "arranque-suave",
  kind: "control",
  title: "Arrancador Suave — Circuito de Control",
  brief: "Habilita el arrancador suave con un arranque-paro sellado. Un temporizador (KT) cuenta la rampa de aceleración y, al vencer, cierra el contactor de bypass (ahorra pérdidas del SCR); el arrancador suave permanece habilitado incluso con el bypass cerrado.",
  vb: [640, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 500, "L", 300, 60),
    railComp("railN", true, 500, "N", 300, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
    C("SSaux1", "SS (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "SScoil" }),
    C("SScoil", "ARR.SUAVE", TPL.coil("SS", "habilita"), 220, 400),
    C("KTcoil", "KT", TPL.coil("KT", "rampa"), 340, 400),
    C("KTno", "KT (rampa)", TPL.contact("NO", "15-18", "15", "18"), 460, 340, { timedFrom: { coil: "KTcoil", delayMs: 3500 } }),
    C("BYPcoil", "BYPASS", TPL.coil("BYP", "ahorro"), 460, 460),
    C("SSaux2", "SS", TPL.contact("NO", "23-24", "23", "24"), 560, 150),
    C("H1", "H1 marcha", TPL.lamp("H1", "green"), 560, 240),
    C("BYPaux", "BYP", TPL.contact("NO", "23-24", "23", "24"), 640, 150, { derivedFrom: "BYPcoil" }),
    C("H2", "H2 bypass", TPL.lamp("H2", "red"), 640, 240),
  ],
  nets: [
    ["railL", "F2.95", "SSaux2.23", "BYPaux.23"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "SSaux1.13"],
    ["S1.4", "SSaux1.14", "SScoil.A1", "KTcoil.A1", "KTno.15"],
    ["KTno.18", "BYPcoil.A1"],
    ["railN", "SScoil.A2", "KTcoil.A2", "BYPcoil.A2", "H1.X2", "H2.X2"],
    ["SSaux2.24", "H1.X1"],
    ["BYPaux.24", "H2.X1"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("SScoil", true);
      d.setEnergized("KTcoil", true);
      d.setClosed("SSaux1", true);
      d.setEnergized("H1", true);
    }, "El arrancador suave se habilita y comienza la rampa de tensión/frecuencia. KT empieza a contar.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — se mantiene por el sello SSaux1.", 700),
    logStep("Motor rampando (ver fuerza). KT vence su tiempo..."),
    actStep((d) => {
      d.setClosed("KTno", true);
      d.setEnergized("BYPcoil", true);
      d.setEnergized("H2", true);
    }, "KT cierra su contacto de rampa: el contactor de bypass cierra en paralelo al SCR — ya no hay pérdidas de conmutación, pero el arrancador suave sigue habilitado (monitoreo).", 1000),
    logStep("Presionas S0 (paro)..."),
    actStep((d) => {
      d.setClosed("S0", false);
    }, "Se abre S0.", 500),
    actStep((d) => {
      d.setEnergized("SScoil", false);
      d.setEnergized("KTcoil", false);
      d.setClosed("SSaux1", false);
      d.setClosed("KTno", false);
      d.setEnergized("BYPcoil", false);
      d.setEnergized("H1", false);
      d.setEnergized("H2", false);
    }, "Todo se desenergiza: el arrancador suave y el bypass se abren. Motor detenido.", 900),
    actStep((d) => { d.setClosed("S0", true); }, "S0 regresa a reposo (cerrado).", 500),
  ],
};

/* =========================================================
   EJERCICIO 17: Arrancador Suave (Soft Starter) — FUERZA
   ========================================================= */

const softStarterPower = {
  id: "softstarter-power",
  level: 2,
  group: "arranque-suave",
  kind: "fuerza",
  title: "Arrancador Suave — Circuito de Fuerza",
  brief: "Conecta las 3 líneas al arrancador suave (SCR) y sus salidas, a través de los térmicos, hacia el motor. El contactor de bypass (3 polos) se conecta en PARALELO a las salidas del arrancador: cuando cierra, deriva la corriente evitando las pérdidas de los tiristores.",
  vb: [560, 620],
  components: [
    railComp("railL1", true, 400, "L1", 280, 60),
    railComp("railL2", true, 400, "L2", 280, 100),
    railComp("railL3", true, 400, "L3", 280, 140),
    C("SS", "Arrancador Suave", TPL.softstarter(), 280, 260),
    C("BYPa", "BYP", TPL.pole("a", "1", "2"), 130, 380),
    C("BYPb", "BYP", TPL.pole("b", "1", "2"), 190, 380),
    C("BYPc", "BYP", TPL.pole("c", "1", "2"), 250, 380),
    C("F2a", "F2", TPL.contact("NC", "1-2", "1", "2"), 380, 380),
    C("F2b", "F2", TPL.contact("NC", "1-2", "1", "2"), 440, 380),
    C("F2c", "F2", TPL.contact("NC", "1-2", "1", "2"), 500, 380),
    C("M", "Motor", TPL.motor(true), 330, 500),
  ],
  nets: [
    ["railL1", "SS.L1", "BYPa.1"],
    ["railL2", "SS.L2", "BYPb.1"],
    ["railL3", "SS.L3", "BYPc.1"],
    ["SS.T1", "F2a.1", "BYPa.2"],
    ["SS.T2", "F2b.1", "BYPb.2"],
    ["SS.T3", "F2c.1", "BYPc.2"],
    ["F2a.2", "M.U1"],
    ["F2b.2", "M.V1"],
    ["F2c.2", "M.W1"],
  ],
  simulation: [
    logStep("SS habilita (ver control)..."),
    actStep((d) => { d.setClosed("SS", true); }, "El arrancador suave recibe las 3 líneas y comienza a rampar la tensión hacia el motor.", 900),
    actStep((d) => { d.setRunning("M", true); }, "El motor acelera suavemente — sin el pico de corriente de un arranque directo.", 1000),
    logStep("KT vence su tiempo (ver control) — cierra el bypass..."),
    actStep((d) => { d.setClosed("BYPa", true); d.setClosed("BYPb", true); d.setClosed("BYPc", true); }, "El contactor de bypass deriva la corriente por sus contactos mecánicos: ya no pasa por los tiristores.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 18: Arranque Secuencial de 2 Motores — CONTROL
   ========================================================= */

const sequentialControl = {
  id: "sequential-control",
  level: 3,
  group: "secuencial",
  kind: "control",
  title: "Arranque Secuencial de 2 Motores — Circuito de Control",
  brief: "El Motor 2 sólo puede arrancar si el Motor 1 ya está en marcha (enclavamiento por secuencia): el contacto auxiliar K1 (permiso) va en serie en el circuito de marcha de S2. El paro S0 es compartido y detiene ambos motores.",
  vb: [900, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 760, "L", 300, 60),
    railComp("railN", true, 760, "N", 300, 500),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
    C("S0", "S0 Paro (ambos)", TPL.button("NC", "1-2", "1", "2"), 220, 200, { manual: true }),
    C("S1", "S1 Marcha M1", TPL.button("NO", "3-4", "3", "4"), 160, 300, { manual: true }),
    C("K1aux1seal", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 300, 300, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "motor 1"), 220, 400),
    C("K1auxRun", "K1 (permiso M2)", TPL.contact("NO", "23-24", "23", "24"), 480, 220, { derivedFrom: "K1coil" }),
    C("S2", "S2 Marcha M2", TPL.button("NO", "3-4", "3", "4"), 620, 300, { manual: true }),
    C("K2aux1seal", "K2 (sello)", TPL.contact("NO", "13-14", "13", "14"), 760, 300, { derivedFrom: "K2coil" }),
    C("K2coil", "K2", TPL.coil("K2", "motor 2"), 690, 400),
  ],
  nets: [
    ["railL", "F2.95"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "K1aux1seal.13", "K1auxRun.23"],
    ["S1.4", "K1aux1seal.14", "K1coil.A1"],
    ["K1auxRun.24", "S2.3", "K2aux1seal.13"],
    ["S2.4", "K2aux1seal.14", "K2coil.A1"],
    ["railN", "K1coil.A2", "K2coil.A2"],
  ],
  simulation: [
    logStep("Presionas S2 (marcha Motor 2) SIN arrancar Motor 1 primero..."),
    actStep((d) => { d.setClosed("S2", true); }, "S2 se presiona, pero K1auxRun sigue abierto: no llega tensión, K2 NO energiza.", 900),
    actStep((d) => { d.setClosed("S2", false); }, "Sueltas S2. Nada ocurrió — es necesario arrancar Motor 1 primero.", 700),
    logStep("Presionas S1 (marcha Motor 1)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1seal", true);
      d.setClosed("K1auxRun", true);
    }, "K1 energiza y sella. Su contacto de permiso K1auxRun cierra, habilitando el arranque de Motor 2.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1. Motor 1 en marcha.", 700),
    logStep("Ahora presionas S2 (marcha Motor 2)..."),
    actStep((d) => {
      d.setClosed("S2", true);
      d.setEnergized("K2coil", true);
      d.setClosed("K2aux1seal", true);
    }, "Ahora sí: K2 energiza — Motor 2 arranca porque Motor 1 ya estaba corriendo.", 900),
    actStep((d) => { d.setClosed("S2", false); }, "Sueltas S2. Ambos motores en marcha.", 700),
    logStep("Presionas S0 (paro general)..."),
    actStep((d) => {
      d.setClosed("S0", false);
    }, "Se abre el paro compartido.", 500),
    actStep((d) => {
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1seal", false);
      d.setClosed("K1auxRun", false);
      d.setEnergized("K2coil", false);
      d.setClosed("K2aux1seal", false);
    }, "Ambos contactores se desenergizan simultáneamente. Los dos motores se detienen.", 900),
    actStep((d) => { d.setClosed("S0", true); }, "S0 regresa a reposo (cerrado).", 500),
  ],
};

/* =========================================================
   EJERCICIO 19 (AVANZADO): Estrella-Triángulo con Inversión de Giro — CONTROL
   ========================================================= */

const ydRevControl = {
  id: "ydrev-control",
  group: "avanzado",
  kind: "control",
  level: 3,
  title: "Estrella-Triángulo con Inversión de Giro — Circuito de Control",
  brief: "Combina dos técnicas: KF/KR seleccionan el sentido de giro (con enclavamiento cruzado, igual que un reversible), y juntos alimentan la misma etapa de arranque estrella-triángulo (KT, KY, KD). Debes parar (S0) antes de poder invertir el sentido. Nivel avanzado.",
  vb: [960, 860],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 760, "L", 500, 50),
    railComp("railN", true, 760, "N", 500, 800),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 300, 110),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 300, 180, { manual: true }),
    C("S1", "S1 Adelante", TPL.button("NO", "3-4", "3", "4"), 180, 260, { manual: true }),
    C("KFaux1", "KF (sello)", TPL.contact("NO", "13-14", "13", "14"), 320, 260, { derivedFrom: "KFcoil" }),
    C("KRaux_i1", "KR (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 440, 260, { derivedFrom: "KRcoil" }),
    C("S2", "S2 Reversa", TPL.button("NO", "3-4", "3", "4"), 600, 260, { manual: true }),
    C("KRaux1", "KR (sello)", TPL.contact("NO", "13-14", "13", "14"), 740, 260, { derivedFrom: "KRcoil" }),
    C("KFaux_i1", "KF (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 600, 180, { derivedFrom: "KFcoil" }),
    C("KFcoil", "KF", TPL.coil("KF", "adelante"), 280, 360),
    C("KRcoil", "KR", TPL.coil("KR", "reversa"), 680, 360),
    C("KFauxRun", "KF", TPL.contact("NO", "23-24", "23", "24"), 280, 450, { derivedFrom: "KFcoil" }),
    C("KRauxRun", "KR", TPL.contact("NO", "23-24", "23", "24"), 680, 450, { derivedFrom: "KRcoil" }),
    C("KTcoil", "KT", TPL.coil("KT", "temporiz."), 480, 450),
    C("KTnc", "KT (15-16)", TPL.contact("NC", "15-16", "15", "16"), 340, 540, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("KTno", "KT (15-18)", TPL.contact("NO", "15-18", "15", "18"), 620, 540, { timedFrom: { coil: "KTcoil", delayMs: 3000 } }),
    C("KDauxNC", "KD (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 340, 630, { derivedFrom: "KDcoil" }),
    C("KYauxNC", "KY (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 620, 630, { derivedFrom: "KYcoil" }),
    C("KYcoil", "KY", TPL.coil("KY", "estrella"), 340, 720),
    C("KDcoil", "KD", TPL.coil("KD", "triángulo"), 620, 720),
  ],
  nets: [
    ["railL", "F2.95", "KFauxRun.23", "KRauxRun.23"],
    ["F2.96", "S0.1"],
    ["S0.2", "S1.3", "KFaux1.13", "S2.3", "KRaux1.13"],
    ["S1.4", "KFaux1.14", "KRaux_i1.21"],
    ["KRaux_i1.22", "KFcoil.A1"],
    ["S2.4", "KRaux1.14", "KFaux_i1.21"],
    ["KFaux_i1.22", "KRcoil.A1"],
    ["KFauxRun.24", "KRauxRun.24", "KTcoil.A1", "KTnc.15", "KTno.15"],
    ["KTnc.16", "KDauxNC.21"],
    ["KDauxNC.22", "KYcoil.A1"],
    ["KTno.18", "KYauxNC.21"],
    ["KYauxNC.22", "KDcoil.A1"],
    ["railN", "KFcoil.A2", "KRcoil.A2", "KTcoil.A2", "KYcoil.A2", "KDcoil.A2"],
  ],
  simulation: [
    logStep("Presionas S1 (adelante)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("KFcoil", true);
      d.setClosed("KFaux1", true);
      d.setClosed("KFaux_i1", false);
      d.setClosed("KFauxRun", true);
      d.setEnergized("KTcoil", true);
    }, "KF se energiza (adelante) y bloquea a KR. Arranca también el temporizador KT.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — KF se mantiene por su sello.", 700),
    actStep((d) => {
      d.setClosed("KTnc", true);
      d.setEnergized("KYcoil", true);
      d.setClosed("KDauxNC", false);
    }, "KT 15-16 (NC, ya cerrado desde el arranque) energiza KY: motor en ESTRELLA, girando ADELANTE.", 900),
    logStep("Transcurre el tiempo ajustado en KT (arranque en estrella)..."),
    actStep((d) => {
      d.setClosed("KTnc", false);
      d.setEnergized("KYcoil", false);
      d.setClosed("KDauxNC", true);
    }, "KT vence: abre 15-16 y KY se desenergiza (enclavamiento libre).", 900),
    actStep((d) => {
      d.setClosed("KTno", true);
      d.setEnergized("KDcoil", true);
      d.setClosed("KYauxNC", false);
    }, "KT cierra 15-18: KD se energiza — TRIÁNGULO (tensión plena), sigue girando ADELANTE.", 900),
    logStep("Presionas S0 (paro) y luego S2 (reversa)..."),
    actStep((d) => { d.setClosed("S0", false); }, "Se abre S0.", 500),
    actStep((d) => {
      d.setEnergized("KFcoil", false);
      d.setClosed("KFaux1", false);
      d.setClosed("KFaux_i1", true);
      d.setClosed("KFauxRun", false);
      d.setEnergized("KTcoil", false);
      d.setClosed("KTno", false);
      d.setEnergized("KDcoil", false);
      d.setClosed("KYauxNC", true);
    }, "Todo se desenergiza: KF, KT y KD se abren. Motor detenido.", 900),
    actStep((d) => { d.setClosed("S0", true); d.setClosed("S2", true); }, "S0 regresa a reposo. Presionas S2 (reversa)...", 700),
    actStep((d) => {
      d.setEnergized("KRcoil", true);
      d.setClosed("KRaux1", true);
      d.setClosed("KRaux_i1", false);
      d.setClosed("KRauxRun", true);
      d.setEnergized("KTcoil", true);
      d.setClosed("S2", false);
    }, "KR se energiza (reversa) — KF queda bloqueado. El temporizador arranca de nuevo: estrella y luego triángulo, ahora en REVERSA.", 1000),
  ],
};

/* =========================================================
   EJERCICIO 20 (AVANZADO): Cinta Transportadora con Paro de
   Emergencia y Fin de Carrera — CONTROL
   ========================================================= */

const conveyorControl = {
  id: "conveyor-control",
  group: "avanzado",
  kind: "control",
  level: 3,
  title: "Cinta Transportadora con Paro de Emergencia — Circuito de Control",
  brief: "Dos motores en secuencia (K2 solo arranca si K1 ya corre, igual que un arranque secuencial) más un interruptor de emergencia SETA (paro general, prioridad máxima) y un fin de carrera LS1 que detiene la banda 2 si la pieza llega al final del recorrido. Nivel avanzado.",
  vb: [1080, 650],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 900, "L", 550, 60),
    railComp("railN", true, 900, "N", 550, 590),
    C("SETA", "SETA Emergencia", TPL.button("NC", "1-2", "1", "2"), 200, 130, { manual: true }),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 320, 130),
    C("S0", "S0 Paro", TPL.button("NC", "3-4", "3", "4"), 320, 200, { manual: true }),
    C("S1", "S1 Marcha Banda 1", TPL.button("NO", "5-6", "5", "6"), 180, 290, { manual: true }),
    C("K1aux1seal", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 320, 290, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "banda 1"), 240, 390),
    C("K1auxRun", "K1 (permiso)", TPL.contact("NO", "23-24", "23", "24"), 480, 290, { derivedFrom: "K1coil" }),
    C("S2", "S2 Marcha Banda 2", TPL.button("NO", "5-6", "5", "6"), 620, 290, { manual: true }),
    C("LS1", "LS1 Fin de carrera", TPL.limitSwitch("NC", "1-2", "1", "2"), 800, 290, { manual: true }),
    C("K2aux1seal", "K2 (sello)", TPL.contact("NO", "13-14", "13", "14"), 940, 290, { derivedFrom: "K2coil" }),
    C("K2coil", "K2", TPL.coil("K2", "banda 2"), 820, 390),
    C("K1aux2", "K1", TPL.contact("NO", "33-34", "33", "34"), 240, 480, { derivedFrom: "K1coil" }),
    C("H1", "H1 banda 1", TPL.lamp("H1", "green"), 240, 560),
    C("K2aux2", "K2", TPL.contact("NO", "23-24", "23", "24"), 820, 480, { derivedFrom: "K2coil" }),
    C("H2", "H2 banda 2", TPL.lamp("H2", "red"), 820, 560),
  ],
  nets: [
    ["railL", "SETA.1", "K1aux2.33", "K2aux2.23"],
    ["SETA.2", "F2.95"],
    ["F2.96", "S0.3"],
    ["S0.4", "S1.5", "K1aux1seal.13", "K1auxRun.23"],
    ["S1.6", "K1aux1seal.14", "K1coil.A1"],
    ["K1auxRun.24", "S2.5", "LS1.1"],
    ["LS1.2", "K2aux1seal.13"],
    ["S2.6", "K2aux1seal.14", "K2coil.A1"],
    ["K1aux2.34", "H1.X1"],
    ["K2aux2.24", "H2.X1"],
    ["railN", "K1coil.A2", "K2coil.A2", "H1.X2", "H2.X2"],
  ],
  simulation: [
    logStep("Presionas S1 (marcha banda 1)..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1seal", true);
      d.setClosed("K1auxRun", true);
      d.setClosed("K1aux2", true);
      d.setEnergized("H1", true);
    }, "K1 arranca la banda 1, habilita el permiso para la banda 2 y enciende H1.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1. Banda 1 en marcha.", 700),
    logStep("Presionas S2 (marcha banda 2)..."),
    actStep((d) => {
      d.setClosed("S2", true);
      d.setEnergized("K2coil", true);
      d.setClosed("K2aux1seal", true);
      d.setClosed("K2aux2", true);
      d.setEnergized("H2", true);
    }, "K2 arranca — banda 2 en marcha porque LS1 está en reposo (cerrado) y la banda 1 ya corría.", 900),
    actStep((d) => { d.setClosed("S2", false); }, "Sueltas S2. Ambas bandas en marcha.", 700),
    logStep("La pieza llega al final del recorrido y acciona LS1..."),
    actStep((d) => {
      d.setClosed("LS1", false);
      d.setEnergized("K2coil", false);
      d.setClosed("K2aux1seal", false);
      d.setClosed("K2aux2", false);
      d.setEnergized("H2", false);
    }, "LS1 abre: K2 pierde alimentación de inmediato. Banda 2 se detiene (aunque estuviera sellada).", 900),
    actStep((d) => { d.setClosed("LS1", true); }, "La pieza libera el rodillo — LS1 regresa a reposo (cerrado).", 700),
    logStep("Alguien presiona la SETA de emergencia..."),
    actStep((d) => {
      d.setClosed("SETA", false);
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1seal", false);
      d.setClosed("K1auxRun", false);
      d.setClosed("K1aux2", false);
      d.setEnergized("H1", false);
    }, "La SETA corta la alimentación de TODO el circuito de una vez, sin importar el estado de K1/K2 — máxima prioridad de seguridad.", 1000),
    actStep((d) => { d.setClosed("SETA", true); }, "Se destraba la SETA girándola — el sistema queda listo para volver a arrancar.", 800),
  ],
};

/* =========================================================
   EJERCICIO 21: Cinta Transportadora — FUERZA
   ========================================================= */

const conveyorPower = {
  id: "conveyor-power",
  group: "avanzado",
  kind: "fuerza",
  level: 2,
  title: "Cinta Transportadora — Circuito de Fuerza",
  brief: "Dos motores independientes, cada uno con su propio contactor y relé térmico: K1/F2a alimentan el motor de la banda 1, K2/F2b alimentan el de la banda 2. La SETA de emergencia del control corta ambos si se presiona.",
  vb: [640, 620],
  components: [
    railComp("railL1", true, 500, "L1", 340, 50),
    railComp("railL2", true, 500, "L2", 340, 90),
    railComp("railL3", true, 500, "L3", 340, 130),
    C("K1a", "K1", TPL.pole("1-2", "1", "2"), 220, 220),
    C("K1b", "K1", TPL.pole("3-4", "3", "4"), 300, 220),
    C("K1c", "K1", TPL.pole("5-6", "5", "6"), 380, 220),
    C("F2a1", "F2a", TPL.pole("1-2", "1", "2"), 220, 320),
    C("F2a2", "F2a", TPL.pole("3-4", "3", "4"), 300, 320),
    C("F2a3", "F2a", TPL.pole("5-6", "5", "6"), 380, 320),
    C("M1", "Motor Banda 1", TPL.motor(true), 300, 430),
    C("K2a", "K2", TPL.pole("1-2", "1", "2"), 480, 220),
    C("K2b", "K2", TPL.pole("3-4", "3", "4"), 560, 220),
    C("K2c", "K2", TPL.pole("5-6", "5", "6"), 620, 220),
    C("F2b1", "F2b", TPL.pole("1-2", "1", "2"), 480, 320),
    C("F2b2", "F2b", TPL.pole("3-4", "3", "4"), 560, 320),
    C("F2b3", "F2b", TPL.pole("5-6", "5", "6"), 620, 320),
    C("M2", "Motor Banda 2", TPL.motor(true), 560, 430),
  ],
  nets: [
    ["railL1", "K1a.1", "K2a.1"],
    ["railL2", "K1b.3", "K2b.3"],
    ["railL3", "K1c.5", "K2c.5"],
    ["K1a.2", "F2a1.1"],
    ["K1b.4", "F2a2.3"],
    ["K1c.6", "F2a3.5"],
    ["F2a1.2", "M1.U1"],
    ["F2a2.4", "M1.V1"],
    ["F2a3.6", "M1.W1"],
    ["K2a.2", "F2b1.1"],
    ["K2b.4", "F2b2.3"],
    ["K2c.6", "F2b3.5"],
    ["F2b1.2", "M2.U1"],
    ["F2b2.4", "M2.V1"],
    ["F2b3.6", "M2.W1"],
  ],
  simulation: [
    logStep("K1 cierra (ver control) — banda 1 arranca..."),
    actStep((d) => { d.setClosed("K1a", true); d.setClosed("K1b", true); d.setClosed("K1c", true); d.setRunning("M1", true); }, "Motor de la banda 1 en marcha.", 900),
    logStep("K2 cierra (ver control) — banda 2 arranca..."),
    actStep((d) => { d.setClosed("K2a", true); d.setClosed("K2b", true); d.setClosed("K2c", true); d.setRunning("M2", true); }, "Motor de la banda 2 en marcha. Ambas bandas transportando.", 900),
  ],
};

/* =========================================================
   EJERCICIO 22 (COMBINADO): Motor Monofásico con Capacitor
   ========================================================= */

const singlePhaseMotorCombined = {
  id: "1ph-motor-combined",
  group: "monofasico",
  kind: "combinado",
  combined: true,
  level: 1,
  title: "Motor Monofásico con Capacitor — Control y Fuerza Combinados",
  brief: "Cablea juntos el control (arranque-paro con sello) y la fuerza de un motor monofásico con capacitor de arranque, ambos en 127/220V monofásico (L-N). Verás las mismas referencias K1 y F2 en los dos circuitos — así se relacionan visualmente control y fuerza.",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [560, 560],
    components: [
      railComp("railL", true, 420, "L", 300, 60),
      railComp("railN", true, 420, "N", 300, 500),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
      C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
      C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
      C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "K1coil" }),
      C("K1coil", "K1", TPL.coil("K1", "contactor"), 220, 400),
      C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "K1coil" }),
      C("H1", "H1 marcha", TPL.lamp("H1", "green"), 400, 240),
    ],
    nets: [
      ["railL", "F2.95", "K1aux2.23"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3", "K1aux1.13"],
      ["S1.4", "K1aux1.14", "K1coil.A1"],
      ["railN", "K1coil.A2", "H1.X2"],
      ["K1aux2.24", "H1.X1"],
    ],
  },
  power: {
    vb: [420, 520],
    components: [
      railComp("railL", true, 300, "L", 220, 60),
      railComp("railN", true, 300, "N", 220, 460),
      C("Q1", "Q1 disyuntor", TPL.mcb("Q1", "1", "2"), 220, 140, { toggle: true }),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 220, 240),
      C("F2a", "F2", TPL.pole("1-2", "1", "2"), 220, 330),
      C("M", "Motor Monofásico", TPL.singlePhaseMotor(), 220, 420),
    ],
    nets: [
      ["railL", "Q1.1"],
      ["Q1.2", "K1a.1"],
      ["K1a.2", "F2a.1"],
      ["F2a.2", "M.L"],
      ["railN", "M.N"],
    ],
  },
  simulation: [
    cLogStep("Presionas S1 (marcha)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S1", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setClosed("K1aux2", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
    }, "K1 se energiza (control): cierra el sello, y en fuerza K1 conecta la línea al motor.", 900),
    cActStep((dc) => { dc.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por el sello.", 700),
    cActStep((dc, dp) => { dp.setRunning("M", true); }, "El motor monofásico arranca — el capacitor da el impulso inicial de giro.", 1000),
    cLogStep("Presionas S0 (paro)..."),
    cActStep((dc, dp) => {
      dc.setEnergized("K1coil", false);
      dc.setClosed("K1aux1", false);
      dc.setClosed("K1aux2", false);
      dc.setEnergized("H1", false);
      dp.setClosed("K1a", false);
      dp.setRunning("M", false);
    }, "K1 se desenergiza en ambos circuitos. Motor detenido.", 900),
  ],
};

/* =========================================================
   EJERCICIO 23 (COMBINADO): Calentador Bifásico (220V)
   ========================================================= */

const twoPhaseHeaterCombined = {
  id: "2ph-heater-combined",
  group: "bifasico",
  kind: "combinado",
  combined: true,
  level: 2,
  title: "Bomba Bifásica (220V) — Control y Fuerza Combinados",
  brief: "En instalaciones bifásicas se usan dos fases (L1 y L2) sin neutro para cargas de 220V. Cablea el control (arranque-paro) y la fuerza de una bomba monofásica alimentada entre L1 y L2, con K1 de dos polos.",
  control: {
    source: ["railL1"],
    return: ["railL2"],
    vb: [560, 560],
    components: [
      railComp("railL1", true, 420, "L1", 300, 60),
      railComp("railL2", true, 420, "L2", 300, 500),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
      C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
      C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
      C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "K1coil" }),
      C("K1coil", "K1", TPL.coil("K1", "contactor"), 220, 400),
      C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "K1coil" }),
      C("H1", "H1 marcha", TPL.lamp("H1", "green"), 400, 240),
    ],
    nets: [
      ["railL1", "F2.95", "K1aux2.23"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3", "K1aux1.13"],
      ["S1.4", "K1aux1.14", "K1coil.A1"],
      ["railL2", "K1coil.A2", "H1.X2"],
      ["K1aux2.24", "H1.X1"],
    ],
  },
  power: {
    vb: [420, 520],
    components: [
      railComp("railL1", true, 300, "L1", 220, 60),
      railComp("railL2", true, 300, "L2", 220, 460),
      C("Q1a", "Q1", TPL.mcb("Q1", "1", "2"), 170, 140, { toggle: true }),
      C("Q1b", "Q1", TPL.mcb("Q1", "1", "2"), 270, 140, { toggle: true }),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 170, 240),
      C("K1b", "K1", TPL.pole("3-4", "3", "4"), 270, 240),
      C("M", "Bomba (motor 1~)", TPL.singlePhaseMotor("L2"), 220, 380),
    ],
    nets: [
      ["railL1", "Q1a.1"],
      ["railL2", "Q1b.1"],
      ["Q1a.2", "K1a.1"],
      ["Q1b.2", "K1b.3"],
      ["K1a.2", "M.L"],
      ["K1b.4", "M.N"],
    ],
  },
  simulation: [
    cLogStep("Presionas S1 (marcha)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S1", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setClosed("K1aux2", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
      dp.setClosed("K1b", true);
    }, "K1 se energiza y cierra sus DOS polos en fuerza — la bomba queda entre L1 y L2 (sin neutro).", 900),
    cActStep((dc) => { dc.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por el sello.", 700),
    cActStep((dc, dp) => { dp.setRunning("M", true); }, "La bomba arranca, alimentada entre las dos fases.", 1000),
    cLogStep("Presionas S0 (paro)..."),
    cActStep((dc, dp) => {
      dc.setEnergized("K1coil", false);
      dc.setClosed("K1aux1", false);
      dc.setClosed("K1aux2", false);
      dc.setEnergized("H1", false);
      dp.setClosed("K1a", false);
      dp.setClosed("K1b", false);
      dp.setRunning("M", false);
    }, "K1 se desenergiza. Bomba detenida.", 900),
  ],
};

/* =========================================================
   EJERCICIO 24 (COMBINADO, AVANZADO): Banda Clasificadora con
   Sensor y Actuador
   ========================================================= */

const sensorActuatorCombined = {
  id: "sensor-actuator-combined",
  group: "avanzado",
  kind: "combinado",
  combined: true,
  level: 3,
  title: "Banda Clasificadora con Sensor y Actuador — Control y Fuerza Combinados",
  brief: "La banda (motor trifásico K1) transporta piezas; un sensor inductivo LS1 detecta las piezas metálicas y energiza CR, que dispara el actuador neumático (electroválvula) para desviarlas. Nivel avanzado: combina sensores, relé auxiliar, actuador, control y fuerza.",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [700, 560],
    components: [
      railComp("railL", true, 560, "L", 360, 60),
      railComp("railN", true, 560, "N", 360, 500),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
      C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 200, { manual: true }),
      C("S1", "S1 Marcha Banda", TPL.button("NO", "3-4", "3", "4"), 170, 280, { manual: true }),
      C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 280, { derivedFrom: "K1coil" }),
      C("K1coil", "K1", TPL.coil("K1", "banda"), 220, 380),
      C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 660, 200, { derivedFrom: "K1coil" }),
      C("LS1", "LS1 Inductivo", TPL.inductiveSensor("NO", "1-2", "1", "2"), 460, 200, { manual: true }),
      C("CRcoil", "CR", TPL.coil("CR", "relé"), 460, 300),
      C("CRaux1", "CR", TPL.contact("NO", "13-14", "13", "14"), 580, 200, { derivedFrom: "CRcoil" }),
      C("YV1", "YV1 Actuador", TPL.actuator("desvío"), 580, 340),
      C("H1", "H1 banda", TPL.lamp("H1", "green"), 660, 300),
    ],
    nets: [
      ["railL", "F2.95", "K1aux2.23"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3", "K1aux1.13", "LS1.1", "CRaux1.13"],
      ["S1.4", "K1aux1.14", "K1coil.A1"],
      ["LS1.2", "CRcoil.A1"],
      ["CRaux1.14", "YV1.X1"],
      ["K1aux2.24", "H1.X1"],
      ["railN", "K1coil.A2", "CRcoil.A2", "YV1.X2", "H1.X2"],
    ],
  },
  power: {
    vb: [560, 620],
    components: [
      railComp("railL1", true, 420, "L1", 300, 50),
      railComp("railL2", true, 420, "L2", 300, 90),
      railComp("railL3", true, 420, "L3", 300, 130),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 220, 220),
      C("K1b", "K1", TPL.pole("3-4", "3", "4"), 300, 220),
      C("K1c", "K1", TPL.pole("5-6", "5", "6"), 380, 220),
      C("F2a", "F2", TPL.pole("1-2", "1", "2"), 220, 320),
      C("F2b", "F2", TPL.pole("3-4", "3", "4"), 300, 320),
      C("F2c", "F2", TPL.pole("5-6", "5", "6"), 380, 320),
      C("M", "Motor Banda", TPL.motor(true), 300, 450),
    ],
    nets: [
      ["railL1", "K1a.1"],
      ["railL2", "K1b.3"],
      ["railL3", "K1c.5"],
      ["K1a.2", "F2a.1"],
      ["K1b.4", "F2b.3"],
      ["K1c.6", "F2c.5"],
      ["F2a.2", "M.U1"],
      ["F2b.4", "M.V1"],
      ["F2c.6", "M.W1"],
    ],
  },
  simulation: [
    cLogStep("Presionas S1 (marcha banda)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S1", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setClosed("K1aux2", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
      dp.setClosed("K1b", true);
      dp.setClosed("K1c", true);
      dp.setRunning("M", true);
    }, "K1 arranca la banda (control y fuerza juntos).", 900),
    cActStep((dc) => { dc.setClosed("S1", false); }, "Sueltas S1. Banda en marcha, sellada por K1aux1.", 700),
    cLogStep("Una pieza metálica pasa frente al sensor LS1..."),
    cActStep((dc) => {
      dc.setClosed("LS1", true);
      dc.setEnergized("CRcoil", true);
      dc.setClosed("CRaux1", true);
    }, "LS1 detecta el metal y energiza CR, que dispara el actuador YV1.", 900),
    cActStep((dc) => { dc.setClosed("LS1", false); }, "La pieza sigue de largo — LS1 vuelve a reposo, CR se desenergiza y YV1 se retrae.", 900),
    cActStep((dc) => { dc.setEnergized("CRcoil", false); dc.setClosed("CRaux1", false); }, "CR y YV1 quedan listos para la siguiente pieza.", 700),
  ],
};

/* =========================================================
   EJERCICIO 25 (COMBINADO): Variador de Frecuencia — Control
   y Fuerza, con el motor a la vista
   ========================================================= */

const vfdCombined = {
  id: "vfd-combined",
  group: "variador",
  kind: "combinado",
  combined: true,
  level: 2,
  title: "Arranque con Variador de Frecuencia — Control y Fuerza Combinados",
  brief: "Cablea el selector SEL1 (marcha/paro) y SEL2 (adelante/reversa) en el control, y L1-L2-L3 → Q1 → variador → motor en la fuerza. Aquí ves el motor girar en el mismo lugar donde operas el variador — sin sello ni enclavamiento, porque el propio variador gestiona la transición.",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [640, 520],
    components: [
      railComp("railL", true, 500, "L", 340, 50),
      railComp("railN", true, 500, "N", 340, 460),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 260, 110),
      C("SEL1", "SEL1 Marcha/Paro", TPL.selector("0-1", "0", "1"), 220, 190, { toggle: true }),
      C("SEL2", "SEL2 Adel./Rev.", TPL.selector("0-1", "0", "1"), 420, 190, { toggle: true }),
      C("VFDRUNaux", "VFD", TPL.contact("NO", "13-14", "13", "14"), 105, 190),
      C("VFDDIRaux", "VFD", TPL.contact("NO", "13-14", "13", "14"), 545, 190),
      C("VFDRUNcoil", "VFD", TPL.coil("VFD", "marcha"), 220, 300),
      C("VFDDIRcoil", "VFD", TPL.coil("VFD", "reversa"), 420, 300),
      C("H1", "H1 marcha", TPL.lamp("H1", "green"), 105, 390),
      C("H2", "H2 reversa", TPL.lamp("H2", "red"), 545, 390),
    ],
    nets: [
      ["railL", "F2.95", "VFDRUNaux.13", "VFDDIRaux.13"],
      ["F2.96", "SEL1.0", "SEL2.0"],
      ["SEL1.1", "VFDRUNcoil.A1"],
      ["SEL2.1", "VFDDIRcoil.A1"],
      ["VFDRUNaux.14", "H1.X1"],
      ["VFDDIRaux.14", "H2.X1"],
      ["railN", "VFDRUNcoil.A2", "VFDDIRcoil.A2", "H1.X2", "H2.X2"],
    ],
  },
  power: {
    vb: [560, 560],
    components: [
      railComp("railL1", true, 420, "L1", 300, 50),
      railComp("railL2", true, 420, "L2", 300, 90),
      railComp("railL3", true, 420, "L3", 300, 130),
      C("Q1a", "Q1", TPL.pole("1-2", "1", "2"), 220, 210),
      C("Q1b", "Q1", TPL.pole("3-4", "3", "4"), 300, 210),
      C("Q1c", "Q1", TPL.pole("5-6", "5", "6"), 380, 210),
      C("VFD", "Variador", TPL.vfd(), 300, 340),
      C("M", "Motor", TPL.motor(true), 300, 480),
    ],
    nets: [
      ["railL1", "Q1a.1"],
      ["railL2", "Q1b.3"],
      ["railL3", "Q1c.5"],
      ["Q1a.2", "VFD.L1"],
      ["Q1b.4", "VFD.L2"],
      ["Q1c.6", "VFD.L3"],
      ["VFD.U", "M.U1"],
      ["VFD.V", "M.V1"],
      ["VFD.W", "M.W1"],
    ],
  },
  simulation: [
    cLogStep("Giras SEL1 a la posición 'Marcha'..."),
    cActStep((dc, dp) => {
      dc.setClosed("SEL1", true);
      dc.setEnergized("VFDRUNcoil", true);
      dc.setEnergized("H1", true);
      dp.setClosed("Q1a", true);
      dp.setClosed("Q1b", true);
      dp.setClosed("Q1c", true);
    }, "El variador recibe la orden de marcha (entrada digital activa) y queda alimentado por las 3 líneas.", 900),
    cActStep((dc, dp) => {
      dp.setRunning("VFD", true);
      dp.setRunning("M", true);
    }, "El variador rampa la velocidad de 0 a 60 Hz — mira el motor acelerar suavemente.", 1100),
    cLogStep("Giras SEL2 a 'Reversa'..."),
    cActStep((dc) => {
      dc.setClosed("SEL2", true);
      dc.setEnergized("VFDDIRcoil", true);
      dc.setEnergized("H2", true);
    }, "El variador invierte la secuencia internamente — sin contactores de por medio.", 900),
  ],
};

/* =========================================================
   EJERCICIO 26: Escalera con Conmutadores de 3 Vías
   ========================================================= */

const staircaseSwitches = {
  id: "staircase-switches",
  group: "residencial",
  kind: "circuito",
  level: 1,
  title: "Escalera con Conmutadores de 3 Vías",
  brief: "Cablea una lámpara controlada desde dos puntos (arriba y abajo de la escalera) con dos conmutadores de 3 vías. Cada conmutador real es una sola palanca de 3 terminales; aquí se dibuja como dos contactos enlazados (A/B) que siempre están en posiciones opuestas — igual que el brazo mecánico real. La lámpara enciende cuando ambos coinciden en la misma posición.",
  vb: [620, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 480, "L", 320, 60),
    railComp("railN", true, 480, "N", 320, 400),
    C("Q1", "Q1 interruptor", TPL.mcb("Q1", "1", "2"), 220, 130, { toggle: true }),
    C("SW1a", "SW1", TPL.wayContact("A", "com-a", "com", "a"), 260, 220, { toggle: true, pairedWith: "SW1b" }),
    C("SW1b", "SW1", TPL.wayContact("B", "com-b", "com", "b"), 360, 220, { toggle: true, pairedWith: "SW1a" }),
    C("SW2a", "SW2", TPL.wayContact("A", "com-a", "com", "a"), 260, 320, { toggle: true, pairedWith: "SW2b" }),
    C("SW2b", "SW2", TPL.wayContact("B", "com-b", "com", "b"), 360, 320, { toggle: true, pairedWith: "SW2a" }),
    C("H1", "H1 lámpara", TPL.lamp("H1", "green"), 500, 320),
  ],
  nets: [
    ["railL", "Q1.1"],
    ["Q1.2", "SW1a.com", "SW1b.com"],
    ["SW1a.a", "SW2a.a"],
    ["SW1b.b", "SW2b.b"],
    ["SW2a.com", "SW2b.com", "H1.X1"],
    ["railN", "H1.X2"],
  ],
  simulation: [
    logStep("Ambos interruptores empiezan en posición A — la lámpara está encendida."),
    actStep((d) => { d.setEnergized("H1", true); }, "Camino cerrado: SW1(A) coincide con SW2(A).", 800),
    logStep("Subes la escalera y accionas SW2..."),
    actStep((d) => {
      d.setClosed("SW2a", false);
      d.setClosed("SW2b", true);
      d.setEnergized("H1", false);
    }, "SW2 pasa a posición B — ya no coincide con SW1(A): la lámpara se apaga.", 900),
    logStep("Desde arriba, accionas SW2 otra vez..."),
    actStep((d) => {
      d.setClosed("SW2a", true);
      d.setClosed("SW2b", false);
      d.setEnergized("H1", true);
    }, "SW2 vuelve a A — coincide de nuevo con SW1: la lámpara enciende. Puedes controlarla desde cualquiera de los dos puntos.", 900),
  ],
};

/* =========================================================
   EJERCICIO 27: Timbre de Puerta con Transformador
   ========================================================= */

const doorbellCircuit = {
  id: "doorbell-circuit",
  group: "residencial",
  kind: "circuito",
  level: 1,
  title: "Timbre de Puerta con Transformador",
  brief: "El transformador de timbre (TC) reduce la tensión de línea a un valor seguro para el circuito del botón y la chicharra. Cablea L-N a través del TC, el botón S1 y el timbre H1.",
  vb: [480, 420],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 340, "L", 240, 60),
    railComp("railN", true, 340, "N", 240, 360),
    C("TC", "TC timbre", TPL.controlTransformer("TC", "in", "out"), 240, 150),
    C("S1", "S1 Botón", TPL.button("NO", "3-4", "3", "4"), 240, 250, { manual: true }),
    C("H1", "H1 Timbre", TPL.horn("TIMBRE"), 240, 320),
  ],
  nets: [
    ["railL", "TC.in"],
    ["TC.out", "S1.3"],
    ["S1.4", "H1.X1"],
    ["railN", "H1.X2"],
  ],
  simulation: [
    logStep("Alguien presiona el botón de la puerta..."),
    actStep((d) => { d.setClosed("S1", true); d.setEnergized("H1", true); }, "El timbre suena mientras el botón permanece presionado.", 900),
    actStep((d) => { d.setClosed("S1", false); d.setEnergized("H1", false); }, "Al soltar el botón, el timbre se detiene — no tiene sello, es un contacto momentáneo.", 800),
  ],
};

/* =========================================================
   EJERCICIO 28: Iluminación Automática por Fotocelda
   ========================================================= */

const photocellLighting = {
  id: "photocell-lighting",
  group: "residencial",
  kind: "circuito",
  level: 1,
  title: "Iluminación Automática por Fotocelda",
  brief: "La fotocelda PC1 detecta la caída de luz natural y energiza K1 para encender el alumbrado exterior automáticamente al anochecer, sin intervención manual.",
  vb: [560, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 400),
    C("Q1", "Q1 interruptor", TPL.mcb("Q1", "1", "2"), 220, 130, { toggle: true }),
    C("PC1", "PC1 fotocelda", TPL.photocell("NO", "1-2", "1", "2"), 220, 220, { manual: true }),
    C("K1coil", "K1", TPL.coil("K1", "alumbrado"), 220, 320),
    C("K1aux1", "K1", TPL.contact("NO", "13-14", "13", "14"), 400, 150, { derivedFrom: "K1coil" }),
    C("H1", "H1 alumbrado", TPL.lamp("H1", "green"), 400, 240),
  ],
  nets: [
    ["railL", "Q1.1", "K1aux1.13"],
    ["Q1.2", "PC1.1"],
    ["PC1.2", "K1coil.A1"],
    ["K1aux1.14", "H1.X1"],
    ["railN", "K1coil.A2", "H1.X2"],
  ],
  simulation: [
    logStep("Cae la noche — la fotocelda detecta la oscuridad..."),
    actStep((d) => {
      d.setClosed("PC1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setEnergized("H1", true);
    }, "PC1 cierra, K1 energiza y enciende el alumbrado exterior automáticamente.", 1000),
    logStep("Amanece — la fotocelda detecta la luz del sol..."),
    actStep((d) => {
      d.setClosed("PC1", false);
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1", false);
      d.setEnergized("H1", false);
    }, "PC1 abre: el alumbrado se apaga solo, sin que nadie tenga que accionar un interruptor.", 900),
  ],
};

/* =========================================================
   EJERCICIO 29 (COMBINADO): Extractor con Sensor de Humedad
   ========================================================= */

const humidityFanCombined = {
  id: "humidity-fan-combined",
  group: "residencial",
  kind: "combinado",
  combined: true,
  level: 2,
  title: "Extractor de Baño con Sensor de Humedad — Control y Fuerza Combinados",
  brief: "El sensor de humedad SH1 detecta el vapor de la regadera y energiza K1, que enciende el extractor. Cablea el control (sensor + contactor + piloto) y la fuerza (motor monofásico del extractor).",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [560, 420],
    components: [
      railComp("railL", true, 420, "L", 300, 60),
      railComp("railN", true, 420, "N", 300, 360),
      C("Q1", "Q1 interruptor", TPL.mcb("Q1", "1", "2"), 220, 130, { toggle: true }),
      C("SH1", "SH1 sensor humedad", TPL.inductiveSensor("NO", "1-2", "1", "2"), 220, 220, { manual: true }),
      C("K1coil", "K1", TPL.coil("K1", "extractor"), 220, 320),
      C("K1aux1", "K1", TPL.contact("NO", "13-14", "13", "14"), 400, 150, { derivedFrom: "K1coil" }),
      C("H1", "H1 extractor ON", TPL.lamp("H1", "green"), 400, 240),
    ],
    nets: [
      ["railL", "Q1.1", "K1aux1.13"],
      ["Q1.2", "SH1.1"],
      ["SH1.2", "K1coil.A1"],
      ["K1aux1.14", "H1.X1"],
      ["railN", "K1coil.A2", "H1.X2"],
    ],
  },
  power: {
    vb: [360, 420],
    components: [
      railComp("railL", true, 260, "L", 200, 60),
      railComp("railN", true, 260, "N", 200, 360),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 200, 180),
      C("M", "Extractor", TPL.singlePhaseMotor(), 200, 300),
    ],
    nets: [
      ["railL", "K1a.1"],
      ["K1a.2", "M.L"],
      ["railN", "M.N"],
    ],
  },
  simulation: [
    cLogStep("Alguien se baña — sube la humedad y SH1 la detecta..."),
    cActStep((dc, dp) => {
      dc.setClosed("SH1", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
      dp.setRunning("M", true);
    }, "K1 energiza — el extractor arranca automáticamente para ventilar el baño.", 1000),
    cLogStep("El ambiente se seca y SH1 regresa a reposo..."),
    cActStep((dc, dp) => {
      dc.setClosed("SH1", false);
      dc.setEnergized("K1coil", false);
      dc.setClosed("K1aux1", false);
      dc.setEnergized("H1", false);
      dp.setClosed("K1a", false);
      dp.setRunning("M", false);
    }, "SH1 abre: el extractor se detiene.", 900),
  ],
};

/* =========================================================
   EJERCICIO 30 (COMBINADO): Bomba de Agua con Dos Flotadores
   ========================================================= */

const dualFloatPumpCombined = {
  id: "dual-float-pump-combined",
  group: "bombeo",
  kind: "combinado",
  combined: true,
  level: 2,
  title: "Bomba de Agua con Dos Flotadores — Control y Fuerza Combinados",
  brief: "El flotador FSlo (NA) arranca la bomba cuando el nivel del tanque baja; el flotador FShi (NC) la detiene cuando el tanque se llena. Cablea el control (flotadores + sello + contactor) y la fuerza (bomba trifásica).",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [640, 460],
    components: [
      railComp("railL", true, 500, "L", 340, 60),
      railComp("railN", true, 500, "N", 340, 400),
      C("Q1", "Q1 interruptor", TPL.mcb("Q1", "1", "2"), 220, 130, { toggle: true }),
      C("FShi", "FShi Alto (paro)", TPL.floatSwitch("NC", "1-2", "1", "2"), 220, 220, { manual: true }),
      C("FSlo", "FSlo Bajo (marcha)", TPL.floatSwitch("NO", "3-4", "3", "4"), 340, 300, { manual: true }),
      C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 460, 300, { derivedFrom: "K1coil" }),
      C("K1coil", "K1", TPL.coil("K1", "bomba"), 340, 380),
      C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 580, 150, { derivedFrom: "K1coil" }),
      C("H1", "H1 bomba ON", TPL.lamp("H1", "green"), 580, 240),
    ],
    nets: [
      ["railL", "Q1.1", "K1aux2.23"],
      ["Q1.2", "FShi.1"],
      ["FShi.2", "FSlo.3", "K1aux1.13"],
      ["FSlo.4", "K1aux1.14", "K1coil.A1"],
      ["K1aux2.24", "H1.X1"],
      ["railN", "K1coil.A2", "H1.X2"],
    ],
  },
  power: {
    vb: [420, 520],
    components: [
      railComp("railL1", true, 300, "L1", 220, 50),
      railComp("railL2", true, 300, "L2", 220, 90),
      railComp("railL3", true, 300, "L3", 220, 130),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 140, 220),
      C("K1b", "K1", TPL.pole("3-4", "3", "4"), 220, 220),
      C("K1c", "K1", TPL.pole("5-6", "5", "6"), 300, 220),
      C("F2a", "F2", TPL.pole("1-2", "1", "2"), 140, 320),
      C("F2b", "F2", TPL.pole("3-4", "3", "4"), 220, 320),
      C("F2c", "F2", TPL.pole("5-6", "5", "6"), 300, 320),
      C("M", "Motor Bomba", TPL.motor(true), 220, 440),
    ],
    nets: [
      ["railL1", "K1a.1"],
      ["railL2", "K1b.3"],
      ["railL3", "K1c.5"],
      ["K1a.2", "F2a.1"],
      ["K1b.4", "F2b.3"],
      ["K1c.6", "F2c.5"],
      ["F2a.2", "M.U1"],
      ["F2b.4", "M.V1"],
      ["F2c.6", "M.W1"],
    ],
  },
  simulation: [
    cLogStep("El nivel del tanque baja y FSlo detecta 'nivel bajo'..."),
    cActStep((dc, dp) => {
      dc.setClosed("FSlo", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setClosed("K1aux2", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
      dp.setClosed("K1b", true);
      dp.setClosed("K1c", true);
      dp.setRunning("M", true);
    }, "K1 se sella y arranca la bomba — empieza a llenar el tanque.", 1000),
    cActStep((dc) => { dc.setClosed("FSlo", false); }, "FSlo regresa a reposo — no importa, K1 ya se selló.", 700),
    cLogStep("El tanque se llena y llega a FShi..."),
    cActStep((dc, dp) => {
      dc.setClosed("FShi", false);
      dc.setEnergized("K1coil", false);
      dc.setClosed("K1aux1", false);
      dc.setClosed("K1aux2", false);
      dc.setEnergized("H1", false);
      dp.setClosed("K1a", false);
      dp.setClosed("K1b", false);
      dp.setClosed("K1c", false);
      dp.setRunning("M", false);
    }, "FShi abre y corta la alimentación de K1 de inmediato — la bomba se detiene con el tanque lleno.", 1000),
    cActStep((dc) => { dc.setClosed("FShi", true); }, "El nivel baja un poco y FShi regresa a reposo (cerrado), listo para el siguiente ciclo.", 700),
  ],
};

/* =========================================================
   EJERCICIO 31 (COMBINADO): Banco de Capacitores (Corrección
   de Factor de Potencia)
   ========================================================= */

const capacitorBankCombined = {
  id: "capacitor-bank-combined",
  group: "eficiencia",
  kind: "combinado",
  combined: true,
  level: 2,
  title: "Banco de Capacitores para Corrección de Factor de Potencia — Control y Fuerza Combinados",
  brief: "Los motores de inducción consumen energía reactiva que reduce el factor de potencia. Un banco de capacitores conectado en paralelo la compensa. Cablea el control (arranque-paro con sello) y la fuerza del contactor que energiza el banco.",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [560, 460],
    components: [
      railComp("railL", true, 420, "L", 300, 60),
      railComp("railN", true, 420, "N", 300, 400),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 130),
      C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
      C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
      C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "K1coil" }),
      C("K1coil", "K1", TPL.coil("K1", "capacitores"), 220, 400),
      C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "K1coil" }),
      C("H1", "H1 FP corregido", TPL.lamp("H1", "green"), 400, 240),
    ],
    nets: [
      ["railL", "F2.95", "K1aux2.23"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3", "K1aux1.13"],
      ["S1.4", "K1aux1.14", "K1coil.A1"],
      ["K1aux2.24", "H1.X1"],
      ["railN", "K1coil.A2", "H1.X2"],
    ],
  },
  power: {
    vb: [360, 420],
    components: [
      railComp("railL", true, 260, "L", 200, 60),
      railComp("railN", true, 260, "N", 200, 360),
      C("K1a", "K1", TPL.pole("1-2", "1", "2"), 200, 180),
      C("CB1", "Banco Capacitores", TPL.capacitorBank("CB1"), 200, 300),
    ],
    nets: [
      ["railL", "K1a.1"],
      ["K1a.2", "CB1.X1"],
      ["railN", "CB1.X2"],
    ],
  },
  simulation: [
    cLogStep("Presionas S1 (marcha)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S1", true);
      dc.setEnergized("K1coil", true);
      dc.setClosed("K1aux1", true);
      dc.setClosed("K1aux2", true);
      dc.setEnergized("H1", true);
      dp.setClosed("K1a", true);
    }, "K1 energiza y conecta el banco de capacitores en paralelo con la instalación.", 900),
    cActStep((dc) => { dc.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por el sello. El factor de potencia mejora, reduciendo pérdidas y el costo de energía reactiva.", 900),
  ],
};

/* =========================================================
   EJERCICIO 32: Semáforo de Tráfico con Temporizadores
   ========================================================= */

const trafficLightSequencer = {
  id: "traffic-light-sequencer",
  group: "automatizacion",
  kind: "circuito",
  level: 2,
  title: "Semáforo de Tráfico con Temporizadores",
  brief: "Un ciclo automático rojo → verde → amarillo → rojo, usando temporizadores encadenados (la salida de cada uno dispara al siguiente). Cablea S1 (arranque del ciclo), KT1/KT2 y las tres lámparas. Es la misma técnica de temporización que un arrancador estrella-triángulo, aplicada a una secuencia de señales en vez de un motor.",
  vb: [800, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 660, "L", 420, 60),
    railComp("railN", true, 660, "N", 420, 400),
    C("S1", "S1 Arranca ciclo", TPL.button("NO", "3-4", "3", "4"), 200, 140, { manual: true }),
    C("CRaux1", "CR (sello)", TPL.contact("NO", "13-14", "13", "14"), 320, 140, { derivedFrom: "CRcoil" }),
    C("CRcoil", "CR", TPL.coil("CR", "ciclo activo"), 200, 240),
    C("KT1coil", "KT1", TPL.coil("KT1", "rojo"), 340, 240),
    C("KT1no", "KT1 (rojo→verde)", TPL.contact("NO", "15-18", "15", "18"), 480, 140, { timedFrom: { coil: "KT1coil", delayMs: 2500 } }),
    C("KT2coil", "KT2", TPL.coil("KT2", "verde"), 560, 240),
    C("KT2no", "KT2 (verde→ámbar)", TPL.contact("NO", "15-18", "15", "18"), 700, 140, { timedFrom: { coil: "KT2coil", delayMs: 2200 } }),
    C("HR", "Rojo", TPL.lamp("R", "red"), 200, 340),
    C("HG", "Verde", TPL.lamp("G", "green"), 340, 340),
    C("HA", "Ámbar", TPL.lamp("A", "red"), 560, 340),
  ],
  nets: [
    ["railL", "S1.3"],
    ["S1.4", "CRaux1.13"],
    ["CRaux1.14", "CRcoil.A1", "KT1coil.A1", "HR.X1"],
    ["KT1no.15", "KT1coil.A2"],
    ["KT1no.18", "KT2coil.A1", "HG.X1"],
    ["KT2no.15", "KT2coil.A2"],
    ["KT2no.18", "HA.X1"],
    ["railN", "CRcoil.A2", "HR.X2", "HG.X2", "HA.X2"],
  ],
  simulation: [
    logStep("Presionas S1 para arrancar el ciclo..."),
    actStep((d) => {
      d.setClosed("S1", true);
      d.setEnergized("CRcoil", true);
      d.setClosed("CRaux1", true);
      d.setEnergized("KT1coil", true);
      d.setEnergized("HR", true);
    }, "CR se sella y arranca KT1: el semáforo queda en ROJO.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — el ciclo sigue solo, sellado por CR.", 700),
    logStep("Transcurren 2.5s en rojo..."),
    actStep((d) => {
      d.setClosed("KT1no", true);
      d.setEnergized("KT2coil", true);
      d.setEnergized("HR", false);
      d.setEnergized("HG", true);
    }, "KT1 vence: se apaga el rojo y enciende el VERDE, arrancando KT2.", 900),
    logStep("Transcurren 2.2s en verde..."),
    actStep((d) => {
      d.setClosed("KT2no", true);
      d.setEnergized("HG", false);
      d.setEnergized("HA", true);
    }, "KT2 vence: se apaga el verde y enciende el ÁMBAR.", 900),
  ],
};

/* =========================================================
   EJERCICIO 33 (COMBINADO, AVANZADO): Puerta Corrediza
   Automática (reversible con fines de carrera)
   ========================================================= */

const slidingDoorCombined = {
  id: "sliding-door-combined",
  group: "avanzado",
  kind: "combinado",
  combined: true,
  level: 3,
  title: "Puerta Corrediza Automática — Control y Fuerza Combinados",
  brief: "KA (abrir) y KC (cerrar) mueven la puerta en direcciones opuestas, enclavados entre sí como un reversible. En vez de soltar el botón, cada dirección se detiene sola al llegar a su fin de carrera (LSA / LSC). Nivel avanzado: combina sello, enclavamiento, fines de carrera y control+fuerza.",
  control: {
    source: ["railL"],
    return: ["railN"],
    vb: [880, 540],
    components: [
      railComp("railL", true, 680, "L", 440, 60),
      railComp("railN", true, 680, "N", 440, 500),
      C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 400, 140),
      C("S1", "S1 Abrir", TPL.button("NO", "3-4", "3", "4"), 140, 260, { manual: true }),
      C("KAaux1", "KA (sello)", TPL.contact("NO", "13-14", "13", "14"), 280, 260, { derivedFrom: "KAcoil" }),
      C("LSA", "LSA Fin Abierto", TPL.limitSwitch("NC", "1-2", "1", "2"), 200, 340, { manual: true }),
      C("KCaux_i", "KC (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 360, 340, { derivedFrom: "KCcoil" }),
      C("KAcoil", "KA", TPL.coil("KA", "abrir"), 200, 440),
      C("S2", "S2 Cerrar", TPL.button("NO", "3-4", "3", "4"), 600, 260, { manual: true }),
      C("KCaux1", "KC (sello)", TPL.contact("NO", "13-14", "13", "14"), 740, 260, { derivedFrom: "KCcoil" }),
      C("KAaux_i", "KA (enclav.)", TPL.contact("NC", "21-22", "21", "22"), 460, 340, { derivedFrom: "KAcoil" }),
      C("LSC", "LSC Fin Cerrado", TPL.limitSwitch("NC", "1-2", "1", "2"), 620, 340, { manual: true }),
      C("KCcoil", "KC", TPL.coil("KC", "cerrar"), 620, 440),
    ],
    nets: [
      ["railL", "F2.95"],
      ["F2.96", "S1.3", "KAaux1.13", "S2.3", "KCaux1.13"],
      ["S1.4", "KAaux1.14", "LSA.1"],
      ["LSA.2", "KCaux_i.21"],
      ["KCaux_i.22", "KAcoil.A1"],
      ["S2.4", "KCaux1.14", "LSC.1"],
      ["LSC.2", "KAaux_i.21"],
      ["KAaux_i.22", "KCcoil.A1"],
      ["railN", "KAcoil.A2", "KCcoil.A2"],
    ],
  },
  power: {
    vb: [760, 520],
    components: [
      railComp("railL1", true, 560, "L1", 380, 50),
      railComp("railL2", true, 560, "L2", 380, 90),
      railComp("railL3", true, 560, "L3", 380, 130),
      C("KAa", "KA", TPL.pole("1-2", "1", "2"), 160, 220),
      C("KAb", "KA", TPL.pole("3-4", "3", "4"), 240, 220),
      C("KAc", "KA", TPL.pole("5-6", "5", "6"), 320, 220),
      C("KCa", "KC", TPL.pole("1-2", "1", "2"), 440, 220),
      C("KCb", "KC", TPL.pole("3-4", "3", "4"), 520, 220),
      C("KCc", "KC", TPL.pole("5-6", "5", "6"), 600, 220),
      C("F2a", "F2", TPL.pole("1-2", "1", "2"), 300, 320),
      C("F2b", "F2", TPL.pole("3-4", "3", "4"), 380, 320),
      C("F2c", "F2", TPL.pole("5-6", "5", "6"), 460, 320),
      C("M", "Motor Puerta", TPL.motor(true), 380, 440),
    ],
    nets: [
      ["railL1", "KAa.1", "KCb.3"],
      ["railL2", "KAb.3", "KCa.1"],
      ["railL3", "KAc.5", "KCc.5"],
      ["KAa.2", "KCa.2", "F2a.1"],
      ["KAb.4", "KCb.4", "F2b.3"],
      ["KAc.6", "KCc.6", "F2c.5"],
      ["F2a.2", "M.U1"],
      ["F2b.4", "M.V1"],
      ["F2c.6", "M.W1"],
    ],
  },
  simulation: [
    cLogStep("Presionas S1 (abrir)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S1", true);
      dc.setEnergized("KAcoil", true);
      dc.setClosed("KAaux1", true);
      dc.setClosed("KAaux_i", false);
      dp.setClosed("KAa", true); dp.setClosed("KAb", true); dp.setClosed("KAc", true);
      dp.setRunning("M", true);
    }, "KA se energiza y se sella — la puerta empieza a abrir. KC queda bloqueado.", 900),
    cActStep((dc) => { dc.setClosed("S1", false); }, "Sueltas S1 — KA se mantiene por el sello mientras la puerta se mueve.", 800),
    cLogStep("La puerta llega al tope y acciona LSA..."),
    cActStep((dc, dp) => {
      dc.setClosed("LSA", false);
      dc.setEnergized("KAcoil", false);
      dc.setClosed("KAaux1", false);
      dc.setClosed("KAaux_i", true);
      dp.setClosed("KAa", false); dp.setClosed("KAb", false); dp.setClosed("KAc", false);
      dp.setRunning("M", false);
    }, "LSA abre: KA pierde alimentación de inmediato — la puerta se detiene sola, totalmente abierta.", 1000),
    cActStep((dc) => { dc.setClosed("LSA", true); }, "LSA regresa a reposo (cerrado) al alejarse la puerta del tope.", 600),
    cLogStep("Presionas S2 (cerrar)..."),
    cActStep((dc, dp) => {
      dc.setClosed("S2", true);
      dc.setEnergized("KCcoil", true);
      dc.setClosed("KCaux1", true);
      dc.setClosed("KCaux_i", false);
      dp.setClosed("KCa", true); dp.setClosed("KCb", true); dp.setClosed("KCc", true);
      dp.setRunning("M", true);
    }, "KC se energiza y se sella — la puerta cierra en sentido contrario. KA queda bloqueado.", 900),
    cActStep((dc) => { dc.setClosed("S2", false); }, "Sueltas S2 — KC se mantiene por el sello.", 800),
    cLogStep("La puerta llega al otro tope y acciona LSC..."),
    cActStep((dc, dp) => {
      dc.setClosed("LSC", false);
      dc.setEnergized("KCcoil", false);
      dc.setClosed("KCaux1", false);
      dc.setClosed("KCaux_i", true);
      dp.setClosed("KCa", false); dp.setClosed("KCb", false); dp.setClosed("KCc", false);
      dp.setRunning("M", false);
    }, "LSC abre: KC se detiene sola — puerta totalmente cerrada.", 1000),
    cActStep((dc) => { dc.setClosed("LSC", true); }, "LSC regresa a reposo. Listo para el siguiente ciclo.", 600),
  ],
};

/* =========================================================
   EJERCICIO: Paro de Emergencia con Relé Maestro (MCR) — CONTROL
   ========================================================= */

const estopMcrControl = {
  id: "estop-mcr-control",
  level: 2,
  group: "seguridad",
  kind: "control",
  title: "Paro de Emergencia con Relé Maestro (MCR) — Circuito de Control",
  brief: "Cablea un Relé Maestro de Control (KA): el paro de emergencia E1 y el botón de rearme S3 sellan la bobina KA a través de KAaux1; sus contactos auxiliares KAaux2/3/4 habilitan una 'barra segura' de la que cuelgan DOS arranques independientes (K1 y K2), cada uno con su propio térmico, paro y marcha. Agrega los pilotos H1 (MCR activo) y H2 (emergencia). Al presionar E1 ambos motores deben detenerse de inmediato sin importar sus propios botones, y KA no debe rearmar sola: hay que presionar S3 otra vez.",
  vb: [820, 720],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 680, "L", 400, 60),
    railComp("railN", true, 680, "N", 400, 680),

    C("E1", "E1 Paro Emergencia", TPL.emergencyStop("1", "1", "2"), 120, 140, { manual: true }),
    C("S3", "S3 Rearme MCR", TPL.button("NO", "3-4", "3", "4"), 120, 220, { manual: true }),
    C("KAaux1", "KA (sello)", TPL.contact("NO", "13-14", "13", "14"), 220, 220, { derivedFrom: "KAcoil" }),
    C("KAcoil", "KA", TPL.coil("KA", "MCR"), 120, 320),

    C("KAaux2", "KA (barra segura)", TPL.contact("NO", "23-24", "23", "24"), 340, 140, { derivedFrom: "KAcoil" }),
    C("KAaux3", "KA", TPL.contact("NO", "33-34", "33", "34"), 480, 140, { derivedFrom: "KAcoil" }),
    C("KAaux4", "KA", TPL.contact("NC", "41-42", "41", "42"), 620, 140, { derivedFrom: "KAcoil" }),
    C("H1", "H1 MCR activo", TPL.lamp("H1", "green"), 480, 230),
    C("H2", "H2 Emergencia", TPL.lamp("H2", "red"), 620, 230),

    C("F2A", "F2A térmico", TPL.contact("NC", "95-96", "95", "96"), 180, 380),
    C("S0A", "S0A Paro", TPL.button("NC", "1-2", "1", "2"), 180, 460, { manual: true }),
    C("S1A", "S1A Marcha", TPL.button("NO", "3-4", "3", "4"), 120, 540, { manual: true }),
    C("K1auxA", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 240, 540, { derivedFrom: "K1coilA" }),
    C("K1coilA", "K1", TPL.coil("K1", "motor A"), 180, 620),

    C("F2B", "F2B térmico", TPL.contact("NC", "95-96", "95", "96"), 480, 380),
    C("S0B", "S0B Paro", TPL.button("NC", "1-2", "1", "2"), 480, 460, { manual: true }),
    C("S1B", "S1B Marcha", TPL.button("NO", "3-4", "3", "4"), 420, 540, { manual: true }),
    C("K2auxB", "K2 (sello)", TPL.contact("NO", "13-14", "13", "14"), 540, 540, { derivedFrom: "K2coilB" }),
    C("K2coilB", "K2", TPL.coil("K2", "motor B"), 480, 620),
  ],
  nets: [
    ["railL", "E1.1", "KAaux2.23", "KAaux3.33", "KAaux4.41"],
    ["E1.2", "S3.3", "KAaux1.13"],
    ["S3.4", "KAaux1.14", "KAcoil.A1"],
    ["KAaux2.24", "F2A.95", "F2B.95"],
    ["KAaux3.34", "H1.X1"],
    ["KAaux4.42", "H2.X1"],
    ["F2A.96", "S0A.1"],
    ["S0A.2", "S1A.3", "K1auxA.13"],
    ["S1A.4", "K1auxA.14", "K1coilA.A1"],
    ["F2B.96", "S0B.1"],
    ["S0B.2", "S1B.3", "K2auxB.13"],
    ["S1B.4", "K2auxB.14", "K2coilB.A1"],
    ["railN", "KAcoil.A2", "H1.X2", "H2.X2", "K1coilA.A2", "K2coilB.A2"],
  ],
  simulation: [
    logStep("Al inicio, KA está desenergizada: H2 (rojo) indica 'sistema no habilitado'."),
    logStep("Presionas S3 (rearme del relé maestro MCR)..."),
    actStep((d) => { d.setClosed("S3", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("KAcoil", true);
      d.setClosed("KAaux1", true);
      d.setClosed("KAaux2", true);
      d.setClosed("KAaux3", true);
      d.setClosed("KAaux4", false);
      d.setEnergized("H1", true);
      d.setEnergized("H2", false);
    }, "KA se energiza: se sella (13-14), habilita la barra segura (KAaux2) y enciende H1.", 900),
    actStep((d) => { d.setClosed("S3", false); }, "Sueltas S3 — KA se mantiene sellada.", 800),
    logStep("Presionas S1A (marcha motor A)..."),
    actStep((d) => { d.setClosed("S1A", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("K1coilA", true);
      d.setClosed("K1auxA", true);
    }, "K1 arranca (motor A) — la barra segura ya tenía alimentación gracias a KA.", 900),
    actStep((d) => { d.setClosed("S1A", false); }, "Sueltas S1A — K1 se sella.", 800),
    logStep("Presionas S1B (marcha motor B)..."),
    actStep((d) => { d.setClosed("S1B", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("K2coilB", true);
      d.setClosed("K2auxB", true);
    }, "K2 también arranca (motor B) — ambos motores en marcha simultánea.", 900),
    actStep((d) => { d.setClosed("S1B", false); }, "Sueltas S1B.", 800),
    logStep("Ahora presionas el PARO DE EMERGENCIA E1 (sin tocar S0A ni S0B)..."),
    actStep((d) => { d.setClosed("E1", false); }, null, 500),
    actStep((d) => {
      d.setEnergized("KAcoil", false);
      d.setClosed("KAaux1", false);
      d.setClosed("KAaux2", false);
      d.setClosed("KAaux3", false);
      d.setClosed("KAaux4", true);
      d.setEnergized("H1", false);
      d.setEnergized("H2", true);
      d.setEnergized("K1coilA", false);
      d.setClosed("K1auxA", false);
      d.setEnergized("K2coilB", false);
      d.setClosed("K2auxB", false);
    }, "KA se desenergiza al instante: se abre KAaux2 y corta la barra segura — K1 Y K2 se detienen juntos, aunque sus propios botones no se tocaron.", 1200),
    actStep((d) => { d.setClosed("E1", true); }, "Giras y liberas E1 (vuelve a cerrar) — pero KA NO arranca sola: hay que presionar S3 otra vez para reponer el sistema.", 900),
  ],
};

/* =========================================================
   EJERCICIO: Control de Compresor con Presostato — CONTROL
   ========================================================= */

const compressorControl = {
  id: "compressor-control",
  level: 1,
  group: "neumatica",
  kind: "control",
  title: "Control de Compresor con Presostato — Circuito de Control",
  brief: "Cablea el guardamotor Q1, el térmico F2 y el presostato PS1 (normalmente cerrado: cierra cuando la presión del tanque baja del mínimo). PS1 alimenta directamente la bobina de K1 — sin botón ni sello, porque el propio presostato hace de interruptor automático. Agrega el piloto H1 ('compresor en marcha') a través del auxiliar K1aux1.",
  vb: [560, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 500),
    C("Q1", "Q1 Guardamotor", TPL.breaker("Q1", "1", "2"), 220, 130, { toggle: true }),
    C("F2", "F2 térmico", TPL.contact("NC", "95-96", "95", "96"), 220, 210),
    C("K1aux1", "K1", TPL.contact("NO", "13-14", "13", "14"), 340, 210, { derivedFrom: "K1coil" }),
    C("PS1", "PS1 Presostato", TPL.pressureSwitch("NC", "1-2", "1", "2"), 220, 300, { manual: true }),
    C("K1coil", "K1", TPL.coil("K1", "compresor"), 220, 400),
    C("H1", "H1 en marcha", TPL.lamp("H1", "green"), 340, 300),
  ],
  nets: [
    ["railL", "Q1.1"],
    ["Q1.2", "F2.95", "K1aux1.13"],
    ["F2.96", "PS1.1"],
    ["PS1.2", "K1coil.A1"],
    ["K1aux1.14", "H1.X1"],
    ["railN", "K1coil.A2", "H1.X2"],
  ],
  simulation: [
    logStep("El tanque está por debajo de la presión mínima: PS1 permanece cerrado (NC) en reposo."),
    actStep((d) => {
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setEnergized("H1", true);
    }, "K1 se energiza a través de PS1: el compresor arranca solo, sin intervención manual.", 900),
    logStep("La presión del tanque sube hasta el punto de corte de PS1..."),
    actStep((d) => {
      d.setClosed("PS1", false);
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1", false);
      d.setEnergized("H1", false);
    }, "PS1 abre al alcanzar la presión máxima: el compresor se detiene automáticamente.", 1000),
    logStep("El consumo de aire hace bajar la presión de nuevo..."),
    actStep((d) => {
      d.setClosed("PS1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setEnergized("H1", true);
    }, "PS1 vuelve a cerrar: el compresor arranca otra vez sin que nadie presione ningún botón.", 1000),
  ],
};

/* =========================================================
   EJERCICIO: Clasificador con Sensor Fotoeléctrico — CONTROL
   ========================================================= */

const photoSorterControl = {
  id: "photo-sorter-control",
  level: 1,
  group: "sensores",
  kind: "control",
  title: "Clasificador con Sensor Fotoeléctrico — Circuito de Control",
  brief: "Cablea el selector SEL (0=apagado, 1=habilitado) que pasa por la clema X1 hasta el sensor fotoeléctrico PE1 (normalmente abierto: cierra cuando una pieza interrumpe el haz de luz). PE1 acciona directamente la electroválvula YV1 (empujador neumático) y el piloto H1, mientras dure la interrupción del haz.",
  vb: [560, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 400),
    C("SEL", "SEL Habilitar", TPL.selector("0-1", "0", "1"), 220, 140, { toggle: true }),
    C("X1", "X1 clema", TPL.terminalBlock("X1", "1", "2"), 220, 220),
    C("PE1", "PE1 fotoeléctrico", TPL.photoSensor("NO", "1-2", "1", "2"), 220, 300, { manual: true }),
    C("YV1", "YV1 empujador", TPL.actuator("YV1"), 380, 220),
    C("H1", "H1 detectado", TPL.lamp("H1", "green"), 380, 320),
  ],
  nets: [
    ["railL", "SEL.0"],
    ["SEL.1", "X1.1"],
    ["X1.2", "PE1.1"],
    ["PE1.2", "YV1.X1", "H1.X1"],
    ["railN", "YV1.X2", "H1.X2"],
  ],
  simulation: [
    logStep("SEL está en 0 (apagado): aunque pase una pieza frente a PE1, no pasa nada."),
    logStep("Pones SEL en 1 (habilitado)..."),
    actStep((d) => { d.setClosed("SEL", true); }, null, 600),
    logStep("Una pieza interrumpe el haz de luz de PE1..."),
    actStep((d) => {
      d.setClosed("PE1", true);
      d.setEnergized("YV1", true);
      d.setEnergized("H1", true);
    }, "PE1 cierra: YV1 empuja la pieza fuera de la banda y H1 enciende, mientras dure la interrupción del haz.", 1000),
    actStep((d) => {
      d.setClosed("PE1", false);
      d.setEnergized("YV1", false);
      d.setEnergized("H1", false);
    }, "La pieza sigue su curso y libera el haz: PE1 abre, YV1 se retrae y H1 se apaga — listo para la siguiente pieza.", 1000),
  ],
};

/* =========================================================
   EJERCICIO: Ventilador con Termostato de Alto Límite — CONTROL
   ========================================================= */

const hvacFanControl = {
  id: "hvac-fan-control",
  level: 1,
  group: "hvac",
  kind: "control",
  title: "Ventilador de Extracción con Termostato de Alto Límite — Circuito de Control",
  brief: "Cablea el clásico arranque-paro con sello (S0, S1, sello K1aux1) pero protegido por TH1: un termostato de alto límite (normalmente cerrado) que corta la alimentación del ventilador de inmediato si el ducto se calienta demasiado, igual que un térmico pero por temperatura. Agrega H1 (en marcha) y H2 (detenido/falla).",
  vb: [560, 560],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 500),
    C("TH1", "TH1 alto límite", TPL.pressureSwitch("NC", "1-2", "1", "2"), 220, 130, { manual: true }),
    C("S0", "S0 Paro", TPL.button("NC", "1-2", "1", "2"), 220, 210, { manual: true }),
    C("S1", "S1 Marcha", TPL.button("NO", "3-4", "3", "4"), 170, 300, { manual: true }),
    C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 270, 300, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "ventilador"), 220, 400),
    C("K1aux2", "K1", TPL.contact("NO", "23-24", "23", "24"), 400, 150, { derivedFrom: "K1coil" }),
    C("H1", "H1 en marcha", TPL.lamp("H1", "green"), 400, 240),
    C("K1aux3", "K1", TPL.contact("NC", "21-22", "21", "22"), 480, 150, { derivedFrom: "K1coil" }),
    C("H2", "H2 detenido", TPL.lamp("H2", "red"), 480, 240),
  ],
  nets: [
    ["railL", "TH1.1", "K1aux2.23", "K1aux3.21"],
    ["TH1.2", "S0.1"],
    ["S0.2", "S1.3", "K1aux1.13"],
    ["S1.4", "K1aux1.14", "K1coil.A1"],
    ["railN", "K1coil.A2", "H1.X2", "H2.X2"],
    ["K1aux2.24", "H1.X1"],
    ["K1aux3.22", "H2.X1"],
  ],
  simulation: [
    logStep("El ducto está a temperatura normal: TH1 permanece cerrado."),
    logStep("Presionas S1 (marcha)..."),
    actStep((d) => { d.setClosed("S1", true); }, null, 500),
    actStep((d) => {
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setClosed("K1aux2", true);
      d.setClosed("K1aux3", false);
      d.setEnergized("H1", true);
      d.setEnergized("H2", false);
    }, "K1 se energiza y se sella. El ventilador arranca.", 900),
    actStep((d) => { d.setClosed("S1", false); }, "Sueltas S1 — K1 se mantiene por el sello.", 800),
    logStep("La temperatura del ducto sube demasiado..."),
    actStep((d) => {
      d.setClosed("TH1", false);
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1", false);
      d.setClosed("K1aux2", false);
      d.setClosed("K1aux3", true);
      d.setEnergized("H1", false);
      d.setEnergized("H2", true);
    }, "TH1 abre por seguridad: corta la alimentación del ventilador de inmediato, sin que nadie presione S0.", 1100),
    actStep((d) => { d.setClosed("TH1", true); }, "El ducto se enfría y TH1 vuelve a cerrar — pero el ventilador NO arranca solo: hay que presionar S1 otra vez.", 900),
  ],
};

/* =========================================================
   EJERCICIO: Bomba de Achique con Flotador y Alarma — CONTROL
   ========================================================= */

const sumpPumpControl = {
  id: "sump-pump-control",
  level: 1,
  group: "bombeo",
  kind: "control",
  title: "Bomba de Achique con Flotador y Alarma de Alto Nivel — Circuito de Control",
  brief: "Cablea el flotador FS1 (normalmente abierto) para que accione la bomba K1 directamente en cuanto sube el nivel del pozo, sin botón ni sello. Agrega un segundo flotador FS2, más alto, que dispara la bocina H1 si el nivel sigue subiendo (por ejemplo, si la bomba falla). H2 indica que la bomba está en marcha.",
  vb: [560, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 420, "L", 300, 60),
    railComp("railN", true, 420, "N", 300, 400),
    C("FS1", "FS1 nivel normal", TPL.floatSwitch("NO", "3-4", "3", "4"), 200, 140, { manual: true }),
    C("FS2", "FS2 nivel alto", TPL.floatSwitch("NO", "3-4", "3", "4"), 380, 140, { manual: true }),
    C("K1aux1", "K1 (sello)", TPL.contact("NO", "13-14", "13", "14"), 200, 220, { derivedFrom: "K1coil" }),
    C("K1coil", "K1", TPL.coil("K1", "bomba"), 200, 320),
    C("H1", "H1 alarma alto nivel", TPL.horn("H1"), 380, 220),
    C("H2", "H2 bomba en marcha", TPL.lamp("H2", "green"), 280, 320),
  ],
  nets: [
    ["railL", "FS1.3", "FS2.3", "K1aux1.13"],
    ["FS1.4", "K1coil.A1"],
    ["FS2.4", "H1.X1"],
    ["K1aux1.14", "H2.X1"],
    ["railN", "K1coil.A2", "H1.X2", "H2.X2"],
  ],
  simulation: [
    logStep("El nivel del pozo está bajo: ambos flotadores permanecen abiertos."),
    logStep("El nivel sube y llega al flotador FS1..."),
    actStep((d) => {
      d.setClosed("FS1", true);
      d.setEnergized("K1coil", true);
      d.setClosed("K1aux1", true);
      d.setEnergized("H2", true);
    }, "FS1 cierra: la bomba arranca sola para desalojar el agua.", 900),
    actStep((d) => {
      d.setClosed("FS1", false);
      d.setEnergized("K1coil", false);
      d.setClosed("K1aux1", false);
      d.setEnergized("H2", false);
    }, "La bomba logra bajar el nivel y FS1 abre: ciclo normal completado.", 900),
    logStep("Ahora imagina que la bomba falla y el nivel sigue subiendo hasta el segundo flotador FS2..."),
    actStep((d) => {
      d.setClosed("FS2", true);
      d.setEnergized("H1", true);
    }, "FS2 cierra: se activa la alarma sonora de alto nivel, avisando del problema antes de que el pozo se desborde.", 1000),
    actStep((d) => {
      d.setClosed("FS2", false);
      d.setEnergized("H1", false);
    }, "El nivel baja y FS2 abre de nuevo: la alarma se apaga.", 800),
  ],
};

/* =========================================================
   EJERCICIO: Esclusa de Acceso con Enclavamiento — CONTROL
   ========================================================= */

const airlockInterlockControl = {
  id: "airlock-interlock-control",
  level: 2,
  group: "seguridad",
  kind: "control",
  title: "Esclusa de Acceso: Enclavamiento entre Dos Puertas — Circuito de Control",
  brief: "Cablea una esclusa de dos puertas (A y B) que nunca pueden abrir a la vez: el botón S1A solo energiza el actuador YV1A si el interruptor de límite LSB indica que la puerta B está cerrada, y viceversa con S1B/LSA/YV1A. Es el mismo principio de enclavamiento que un arrancador reversible, aplicado a control de acceso.",
  vb: [620, 460],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 480, "L", 340, 60),
    railComp("railN", true, 480, "N", 340, 400),
    C("S1A", "S1A abrir puerta A", TPL.button("NO", "3-4", "3", "4"), 180, 140, { manual: true }),
    C("LSB", "LSB puerta B cerrada", TPL.limitSwitch("NC", "1-2", "1", "2"), 180, 220, { manual: true }),
    C("YV1A", "YV1A abre puerta A", TPL.actuator("YV1A"), 180, 320),
    C("S1B", "S1B abrir puerta B", TPL.button("NO", "3-4", "3", "4"), 500, 140, { manual: true }),
    C("LSA", "LSA puerta A cerrada", TPL.limitSwitch("NC", "1-2", "1", "2"), 500, 220, { manual: true }),
    C("YV1B", "YV1B abre puerta B", TPL.actuator("YV1B"), 500, 320),
  ],
  nets: [
    ["railL", "S1A.3", "S1B.3"],
    ["S1A.4", "LSB.1"],
    ["LSB.2", "YV1A.X1"],
    ["S1B.4", "LSA.1"],
    ["LSA.2", "YV1B.X1"],
    ["railN", "YV1A.X2", "YV1B.X2"],
  ],
  simulation: [
    logStep("Ambas puertas están cerradas: LSA y LSB permanecen cerrados (permiso concedido)."),
    logStep("Presionas S1A para abrir la puerta A..."),
    actStep((d) => {
      d.setClosed("S1A", true);
      d.setEnergized("YV1A", true);
    }, "Como la puerta B está cerrada (LSB cerrado), YV1A se energiza y abre la puerta A.", 900),
    actStep((d) => {
      d.setClosed("S1A", false);
      d.setEnergized("YV1A", false);
      d.setClosed("LSA", false);
    }, "Sueltas S1A. La puerta A queda abierta: LSA se abre, porque ya no está en su posición de cerrado.", 900),
    logStep("Mientras la puerta A sigue abierta, alguien presiona S1B para abrir la puerta B..."),
    actStep((d) => { d.setClosed("S1B", true); }, "Se presiona S1B, pero LSA está abierto (la puerta A no está cerrada): el permiso se niega, YV1B NO se energiza — la esclusa impide que ambas abran a la vez.", 1100),
    actStep((d) => { d.setClosed("S1B", false); }, null, 500),
    logStep("La puerta A se cierra de nuevo y LSA regresa a su posición de cerrado..."),
    actStep((d) => { d.setClosed("LSA", true); }, "Con LSA cerrado otra vez, ahora sí se podría abrir la puerta B.", 800),
    actStep((d) => {
      d.setClosed("S1B", true);
      d.setEnergized("YV1B", true);
    }, "Presionas S1B: ahora YV1B se energiza y abre la puerta B.", 900),
    actStep((d) => {
      d.setClosed("S1B", false);
      d.setEnergized("YV1B", false);
    }, "Sueltas S1B.", 600),
  ],
};

/* =========================================================
   EJERCICIO: Transferencia Automática de Emergencia (ATS) — CONTROL
   ========================================================= */

const atsControl = {
  id: "ats-control",
  level: 3,
  group: "respaldo",
  kind: "control",
  title: "Transferencia Automática de Emergencia (ATS) — Circuito de Control",
  brief: "Cablea una transferencia automática (ATS) simplificada: SELa/SELb son las dos mitades de un solo interruptor que simula el sensor de presencia de la red normal (SELa cerrado = hay red; SELb cerrado = falló la red). Si falla, el temporizador KT retarda el arranque del generador antes de que KE cierre; KNaux_i y KEaux_i se enclavan entre sí para que jamás ambas fuentes alimenten la carga a la vez. H1/H2 indican qué fuente está en línea.",
  vb: [620, 500],
  source: ["railL"],
  return: ["railN"],
  components: [
    railComp("railL", true, 480, "L", 340, 60),
    railComp("railN", true, 480, "N", 340, 440),
    C("SELa", "SELa red normal", TPL.wayContact("A", "com-a", "com", "a"), 180, 140, { toggle: true, pairedWith: "SELb" }),
    C("SELb", "SELb red falló", TPL.wayContact("B", "com-b", "com", "b"), 340, 140, { toggle: true, pairedWith: "SELa" }),
    C("KNaux_i", "KN (interlock)", TPL.contact("NC", "21-22", "21", "22"), 180, 220, { derivedFrom: "KEcoil" }),
    C("KNcoil", "KN", TPL.coil("KN", "red normal"), 180, 320),
    C("KTcoil", "KT", TPL.coil("KT", "arranque gen."), 340, 220),
    C("KTno", "KT (15-18)", TPL.contact("NO", "15-18", "15", "18"), 460, 220, { timedFrom: { coil: "KTcoil", delayMs: 2000 } }),
    C("KEaux_i", "KE (interlock)", TPL.contact("NC", "21-22", "21", "22"), 460, 300, { derivedFrom: "KNcoil" }),
    C("KEcoil", "KE", TPL.coil("KE", "generador"), 460, 400),
    C("KNaux2", "KN", TPL.contact("NO", "13-14", "13", "14"), 560, 140, { derivedFrom: "KNcoil" }),
    C("H1", "H1 red normal", TPL.lamp("H1", "green"), 560, 220),
    C("KEaux2", "KE", TPL.contact("NO", "13-14", "13", "14"), 560, 300, { derivedFrom: "KEcoil" }),
    C("H2", "H2 generador", TPL.lamp("H2", "red"), 560, 380),
  ],
  nets: [
    ["railL", "SELa.com", "SELb.com", "KNaux2.13", "KEaux2.13"],
    ["SELa.a", "KNaux_i.21"],
    ["KNaux_i.22", "KNcoil.A1"],
    ["SELb.b", "KTcoil.A1", "KTno.15"],
    ["KTno.18", "KEaux_i.21"],
    ["KEaux_i.22", "KEcoil.A1"],
    ["KNaux2.14", "H1.X1"],
    ["KEaux2.14", "H2.X1"],
    ["railN", "KNcoil.A2", "KEcoil.A2", "KTcoil.A2", "H1.X2", "H2.X2"],
  ],
  simulation: [
    logStep("La red eléctrica normal está presente: SELa cerrado, SELb abierto."),
    actStep((d) => {
      d.setEnergized("KNcoil", true);
      d.setClosed("KNaux2", true);
      d.setEnergized("H1", true);
    }, "KN está energizado de inmediato: la carga se alimenta de la red normal.", 900),
    logStep("Falla la red eléctrica (apagón)..."),
    actStep((d) => {
      d.setClosed("SELa", false);
      d.setClosed("SELb", true);
      d.setEnergized("KNcoil", false);
      d.setClosed("KNaux2", false);
      d.setEnergized("H1", false);
      d.setEnergized("KTcoil", true);
    }, "SELa abre y SELb cierra: KN se desenergiza y KT inicia la cuenta para arrancar el generador.", 1100),
    logStep("Después del retardo, KT cierra su contacto 15-18..."),
    actStep((d) => {
      d.setClosed("KTno", true);
      d.setEnergized("KEcoil", true);
      d.setClosed("KEaux2", true);
      d.setEnergized("H2", true);
    }, "KE se energiza: la carga se transfiere al generador. El enclavamiento impide que KN pudiera cerrar al mismo tiempo.", 1100),
    logStep("La red eléctrica se restablece..."),
    actStep((d) => {
      d.setClosed("SELa", true);
      d.setClosed("SELb", false);
      d.setEnergized("KTcoil", false);
      d.setClosed("KTno", false);
      d.setEnergized("KEcoil", false);
      d.setClosed("KEaux2", false);
      d.setEnergized("H2", false);
      d.setEnergized("KNcoil", true);
      d.setClosed("KNaux2", true);
      d.setEnergized("H1", true);
    }, "SELa vuelve a cerrar: la carga regresa a la red normal y KE se desenergiza — nunca ambas fuentes alimentan la carga a la vez.", 1200),
  ],
};

const EXERCISES = [
  dolControl, dolPower, revControl, ydControl, ydPower, autoControl, autoPower,
  twoSpeedControl, twoSpeedPower, alarmControl,
  vfdControl, vfdPower, chopperControl, chopperPower, twoStationControl,
  softStarterControl, softStarterPower, sequentialControl,
  ydRevControl, conveyorControl, conveyorPower, vfdCombined,
  singlePhaseMotorCombined, twoPhaseHeaterCombined, sensorActuatorCombined,
  staircaseSwitches, doorbellCircuit, photocellLighting, humidityFanCombined,
  dualFloatPumpCombined, capacitorBankCombined, trafficLightSequencer,
  slidingDoorCombined, estopMcrControl, compressorControl, photoSorterControl,
  hvacFanControl, sumpPumpControl, airlockInterlockControl, atsControl,
];

/* =========================================================
   Modo Diagnostico: circuitos pre-cableados con UNA falla real
   que hay que encontrar y corregir — como en un tablero de verdad.
   ========================================================= */

const DIAGNOSTICS = [
  {
    id: "diag-dol",
    title: "Arranque Directo: el motor no se sella",
    symptom: "Reportan que el motor SOLO gira mientras se mantiene presionado S1 (marcha) — en cuanto se suelta, se detiene. Debería quedarse sellado. Encuentra el cable mal conectado y corrígelo (haz clic para quitarlo, luego conecta el correcto).",
    exercise: dolControl,
    faultWires: [
      ["railL", "F2.95"], ["railL", "K1aux2.23"], ["railL", "K1aux3.21"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3"], ["S0.2", "K1aux1.13"],
      ["S0.2", "K1aux1.14"],
      ["S1.4", "K1coil.A1"],
      ["railN", "K1coil.A2"], ["railN", "H1.X2"], ["railN", "H2.X2"],
      ["K1aux2.24", "H1.X1"],
      ["K1aux3.22", "H2.X1"],
    ],
  },
  {
    id: "diag-yd",
    title: "Estrella-Triángulo: arranca directo en triángulo",
    symptom: "Reportan que el motor arranca directamente en TRIÁNGULO (a tensión plena), sin pasar por la etapa de estrella — se pierde por completo la reducción de corriente de arranque. Encuentra el cruce de cables en la etapa del temporizador.",
    exercise: ydControl,
    faultWires: [
      ["railL", "F2.95"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3"], ["S0.2", "K1aux1.13"],
      ["S1.4", "K1aux1.14"], ["S1.4", "K1coil.A1"], ["S1.4", "KTcoil.A1"], ["S1.4", "KTnc.15"], ["S1.4", "KTno.15"],
      ["KTnc.16", "K2auxNC.21"],
      ["K3auxNC.22", "K2coil.A1"],
      ["KTno.18", "K3auxNC.21"],
      ["K2auxNC.22", "K3coil.A1"],
      ["railN", "K1coil.A2"], ["railN", "KTcoil.A2"], ["railN", "K2coil.A2"], ["railN", "K3coil.A2"],
    ],
  },
  {
    id: "diag-rev",
    title: "Inversión de Giro: los botones quedaron cruzados",
    symptom: "Reportan que al presionar S1 (adelante) el motor gira en REVERSA, y al presionar S2 (reversa) gira ADELANTE — como si alguien hubiera cruzado los botones de mando. Encuentra dónde se cruzaron los cables.",
    exercise: revControl,
    faultWires: [
      ["railL", "F2.95"],
      ["F2.96", "S0.1"],
      ["S0.2", "S1.3"], ["S0.2", "KFaux1.13"], ["S0.2", "S2.3"], ["S0.2", "KRaux1.13"],
      ["S1.4", "KRaux1.14"], ["S1.4", "KFaux_i1.21"],
      ["KFaux_i1.22", "KRcoil.A1"],
      ["S2.4", "KFaux1.14"], ["S2.4", "KRaux_i1.21"],
      ["KRaux_i1.22", "KFcoil.A1"],
      ["railN", "KFcoil.A2"], ["railN", "KRcoil.A2"],
    ],
  },
];

/* =========================================================
   Explorador de componentes (tarjetas 3D)
   ========================================================= */

const EXPLORER = [
  {
    id: "contactor", name: "Contactor", tag: "K1 / KM",
    desc: "Interruptor electromagnético operado por una bobina (A1-A2). Al energizarse, cierra sus contactos principales (1-2, 3-4, 5-6) para alimentar la carga, y puede traer contactos auxiliares NA/NC (13-14, 21-22) para señalización o enclavamientos.",
    face: "contactor",
  },
  {
    id: "termico", name: "Relé Térmico (Overload)", tag: "F2",
    desc: "Protege al motor contra sobrecargas. Sus contactos principales (1-2,3-4,5-6) van en serie entre el contactor y el motor; su contacto auxiliar NC (95-96) abre el circuito de control si detecta exceso de corriente sostenido.",
    face: "termico",
  },
  {
    id: "boton-na", name: "Pulsador Normalmente Abierto", tag: "S1 (3-4)",
    desc: "Contacto que permanece abierto en reposo y cierra mientras se mantiene presionado. Se usa para dar la orden de 'marcha'.",
    face: "boton-na",
  },
  {
    id: "boton-nc", name: "Pulsador Normalmente Cerrado", tag: "S0 (1-2)",
    desc: "Contacto que permanece cerrado en reposo y abre al presionarlo. Se usa para dar la orden de 'paro' — así, si se corta un cable, el circuito falla de forma segura (a paro).",
    face: "boton-nc",
  },
  {
    id: "selector", name: "Selector de 2/3 posiciones", tag: "SS",
    desc: "Permite elegir entre modos de operación (Manual-0-Automático, o Local-Remoto) usando una perilla en vez de un pulsador momentáneo.",
    face: "selector",
  },
  {
    id: "piloto", name: "Lámpara Piloto", tag: "H1 / H2 / H3",
    desc: "Indicador luminoso. Convención común: verde = marcha, rojo = paro/falla, ámbar = automático o alarma. Se conecta entre L y N a través de un contacto auxiliar.",
    face: "piloto",
  },
  {
    id: "timer", name: "Relé de Tiempo (Temporizador)", tag: "KT",
    desc: "Su bobina (A1-A2) inicia el conteo al energizarse; después del tiempo ajustado, conmuta sus contactos retardados (por ejemplo 15-16 NC y 15-18 NA). Es el corazón de la transición estrella-triángulo y del arranque por autotransformador.",
    face: "timer",
  },
  {
    id: "guardamotor", name: "Guardamotor / Interruptor Termomagnético", tag: "Q1",
    desc: "Protege contra cortocircuitos y sobrecargas, y permite desconectar manualmente el circuito. Se instala antes de los contactores en la línea de fuerza.",
    face: "guardamotor",
  },
  {
    id: "transformador-control", name: "Transformador de Control", tag: "TC",
    desc: "Reduce la tensión de línea (ej. 440V/220V) a una tensión segura para el circuito de control (ej. 24V o 120V), aislando y protegiendo los componentes de mando.",
    face: "transformador-control",
  },
  {
    id: "autotransformador", name: "Autotransformador de Arranque", tag: "AT",
    desc: "Tres bobinas con derivaciones (típicamente 50-65-80%) que reducen la tensión aplicada al motor durante el arranque, reduciendo la corriente de línea más eficientemente que el arranque estrella-triángulo.",
    face: "autotransformador",
  },
  {
    id: "motor6", name: "Motor Trifásico (caja de 6 terminales)", tag: "U1 V1 W1 / W2 U2 V2",
    desc: "La caja de conexiones estándar IEC dispone U1-V1-W1 arriba y W2-U2-V2 abajo (desfasados), permitiendo puentear en estrella (U2-V2-W2 juntos) o en triángulo (U1-W2, V1-U2, W1-V2) según la tensión de la red y el dato de placa.",
    face: "motor6",
  },
  {
    id: "fusible", name: "Fusibles", tag: "F1",
    desc: "Elemento de protección de un solo uso: se funde para interrumpir el circuito ante una falla, protegiendo cables y componentes aguas abajo.",
    face: "fusible",
  },
  {
    id: "limitswitch", name: "Interruptor de Límite (fin de carrera)", tag: "LS1",
    desc: "Contacto NA/NC accionado mecánicamente por una palanca o rodillo cuando una pieza móvil (puerta, carro, pistón) llega a su posición. Muy usado en bandas transportadoras y máquinas con movimiento lineal.",
    face: "limitswitch",
  },
  {
    id: "bocina", name: "Bocina / Alarma Sonora", tag: "H1 (bocina)",
    desc: "Elemento de señalización audible. Se conecta igual que una lámpara piloto (entre L y N a través de un contacto), y suena mientras su bobina de control permanezca energizada.",
    face: "bocina",
  },
  {
    id: "rele-auxiliar", name: "Relé Auxiliar de Control", tag: "CR",
    desc: "Igual que un contactor pero sin contactos de potencia: multiplica y aísla señales de control cuando se necesitan más contactos auxiliares de los que trae un contactor, o para separar niveles de tensión.",
    face: "rele-auxiliar",
  },
  {
    id: "vfd", name: "Variador de Frecuencia (VFD)", tag: "L1 L2 L3 / U V W",
    desc: "Convierte la tensión de línea a una frecuencia y voltaje variables (rectificador + bus DC + inversor IGBT), permitiendo arrancar y regular la velocidad del motor de forma suave, sin los contactores de un arranque a tensión reducida.",
    face: "vfd",
  },
  {
    id: "chopper", name: "Chopper (Convertidor DC-DC)", tag: "L+ L- / A+ A-",
    desc: "Recorta ('chopea') un voltaje DC fijo mediante conmutación PWM de alta frecuencia, entregando un voltaje DC promedio variable a la armadura de un motor DC para regular su velocidad.",
    face: "chopper",
  },
  {
    id: "motor-dc", name: "Motor de Corriente Directa", tag: "A1 / A2",
    desc: "Motor DC de dos terminales de armadura. Su velocidad es proporcional al voltaje aplicado, por lo que se regula fácilmente con un chopper o un rectificador controlado, sin necesidad de variar la frecuencia.",
    face: "motor-dc",
  },
  {
    id: "selector-2pos", name: "Selector de 2 Posiciones (enclavado)", tag: "SEL",
    desc: "Interruptor de mando que permanece fijo en la posición elegida (a diferencia de un pulsador con resorte). Se usa para señales de mando mantenidas, como la orden de marcha de un variador de frecuencia.",
    face: "selector-2pos",
  },
  {
    id: "softstarter", name: "Arrancador Suave (Soft Starter)", tag: "L1 L2 L3 / T1 T2 T3",
    desc: "Regula la tensión aplicada al motor mediante tiristores (SCR) en antiparalelo por fase, rampando el voltaje de forma gradual para reducir la corriente y el golpe mecánico de arranque. Al terminar la rampa, un contactor de bypass suele derivar la corriente para ahorrar las pérdidas de conmutación de los tiristores.",
    face: "softstarter",
  },
  {
    id: "seta", name: "Paro de Emergencia (SETA)", tag: "E-STOP",
    desc: "Botón de hongo rojo sobre base amarilla, normalmente cerrado. Corta TODO el circuito de control con máxima prioridad ante un peligro. A diferencia de un paro normal, se enclava al presionarlo y solo se libera girándolo — no puede rearmarse por accidente.",
    face: "seta",
  },
  {
    id: "mcb", name: "Disyuntor / MCB", tag: "1-2",
    desc: "Interruptor termomagnético de riel DIN, normalmente de un solo polo. Protege circuitos monofásicos o de control contra cortocircuitos y sobrecargas, y sirve como interruptor de aislamiento manual.",
    face: "mcb",
  },
  {
    id: "clema", name: "Clema / Bloque de Conexiones", tag: "Empalme",
    desc: "No conmuta nada — solo empalma dos conductores de forma segura y desmontable. Presente en cualquier tablero real para organizar el cableado y facilitar el mantenimiento.",
    face: "clema",
  },
  {
    id: "sensor-inductivo", name: "Sensor Inductivo de Proximidad", tag: "1-2 (NA/NC)",
    desc: "Detecta objetos metálicos sin contacto físico, mediante un campo electromagnético. Muy usado en bandas transportadoras para contar o detectar piezas metálicas.",
    face: "sensor-inductivo",
  },
  {
    id: "sensor-foto", name: "Sensor Fotoeléctrico", tag: "1-2 (NA/NC)",
    desc: "Detecta la interrupción o el reflejo de un haz de luz (infrarrojo o láser). A diferencia del inductivo, detecta cualquier material que bloquee el haz, no solo metales.",
    face: "sensor-foto",
  },
  {
    id: "actuador", name: "Actuador / Electroválvula Solenoide", tag: "X1-X2",
    desc: "Convierte una señal eléctrica en movimiento mecánico: al energizarse, desplaza un émbolo que abre o cierra el paso de aire/fluido en un sistema neumático o hidráulico. Se cablea igual que una carga (lámpara), entre L y N a través de un contacto.",
    face: "actuador",
  },
  {
    id: "motor-monofasico", name: "Motor Monofásico con Capacitor", tag: "L / N",
    desc: "Motor de una sola fase para cargas residenciales y comerciales pequeñas. El capacitor de arranque genera un campo desfasado que le da al rotor el impulso inicial de giro, ya que una sola fase no produce un campo rotante por sí sola.",
    face: "motor-monofasico",
  },
  {
    id: "presostato", name: "Presostato (Interruptor de Presión)", tag: "1-2 (NA/NC)",
    desc: "Detecta la presión de un tanque o línea neumática/hidráulica y conmuta sus contactos al llegar al punto de corte ajustado. En compresores, su contacto NC alimenta directamente la bobina del contactor: no necesita botón ni sello, arranca y para el equipo solo.",
    face: "presostato",
  },
];

/* =========================================================
   Quiz teorico
   ========================================================= */

const QUIZ = [
  // ---- Arranque directo / conceptos basicos ----
  { q: "¿Para qué sirve el contacto auxiliar 13-14 de un contactor en un circuito de arranque-paro?", a: ["Para invertir el sentido de giro del motor automáticamente", "Como contacto de sello para mantener energizada la bobina al soltar el botón de marcha", "Para reducir la tensión aplicada al motor durante el arranque", "Para medir la corriente que consume el motor en marcha"], correct: 1 },
  { q: "¿Por qué el botón de paro (S0) es normalmente cerrado (NC)?", a: ["Porque los botones NC cuestan menos que los normalmente abiertos", "Porque así encienden mejor las lámparas piloto del tablero", "Para que, si se rompe el cable, el circuito falle hacia un estado seguro (paro)", "Porque lo exige el color rojo de la carcasa del botón"], correct: 2 },
  { q: "¿Qué pasaría si el contacto de sello (13-14) se conectara en serie con el botón de marcha en vez de en paralelo?", a: ["El motor solo funcionaría mientras se mantenga presionado el botón (no habría memoria)", "El motor arrancaría automáticamente sin necesidad de presionar nada", "El relé térmico se dispararía de inmediato al energizar la bobina", "No cambiaría nada, ambas conexiones son eléctricamente equivalentes"], correct: 0 },
  { q: "¿Cuál es una razón real para usar un botón normalmente abierto (NA) como botón de 'marcha'?", a: ["Los botones NA duran más años que los normalmente cerrados", "Para que el motor arranque solo, sin que nadie tenga que presionarlo", "Para que el motor solo arranque cuando se da una orden activa y explícita", "Para que el relé térmico no necesite protección adicional"], correct: 2 },
  { q: "¿Qué terminales estándar (IEC) corresponden a la bobina de un contactor?", a: ["95-96", "13-14", "A1-A2", "1-2"], correct: 2 },
  { q: "¿Qué terminales estándar corresponden al contacto de protección (NC) de un relé térmico?", a: ["95-96", "21-22", "A1-A2", "13-14"], correct: 0 },
  { q: "¿Qué representa la 'M 3~' dentro de un círculo en un diagrama eléctrico?", a: ["Un medidor de corriente trifásico instalado en línea", "Un motor trifásico", "Un transformador reductor de tres devanados", "Un relé térmico de tres polos"], correct: 1 },
  { q: "¿Cuál es la función principal del guardamotor (interruptor termomagnético) antes del contactor?", a: ["Encender automáticamente el piloto verde de marcha", "Reducir la tensión de arranque aplicada al motor", "Invertir el sentido de giro cuando se detecta una falla", "Proteger contra cortocircuitos y sobrecargas, y permitir desconexión manual"], correct: 3 },

  // ---- Estrella-Triangulo / autotransformador / dos velocidades ----
  { q: "En un arranque estrella-triángulo, ¿qué contactor permanece cerrado durante todo el arranque y la marcha?", a: ["K2 (estrella)", "K3 (triángulo)", "K1 (línea)", "Ninguno — los tres alternan por turnos"], correct: 2 },
  { q: "¿Cuál es la reducción aproximada de corriente de línea en el arranque estrella-triángulo respecto al arranque directo?", a: ["Se mantiene prácticamente igual", "A un tercio (33%) de la corriente directa", "A la mitad exacta (50%)", "Se reduce hasta un 65% de la corriente directa"], correct: 1 },
  { q: "¿Qué función cumple el contactor K2 en el arranque estrella-triángulo?", a: ["Conecta el motor directamente a la línea de alimentación", "Alimenta exclusivamente el circuito del temporizador", "Puentea U2-V2-W2 para formar el punto estrella", "Protege el devanado contra sobrecargas térmicas"], correct: 2 },
  { q: "¿Por qué es indispensable el enclavamiento eléctrico entre K2 y K3 en un arranque estrella-triángulo?", a: ["Para evitar que ambos cierren a la vez y provoquen un cortocircuito entre fases", "Para ahorrar algunos metros de cable adicional dentro del gabinete del tablero", "Para que las lámparas piloto enciendan siempre en la secuencia correcta", "Es solo una recomendación estética sugerida por el fabricante del contactor"], correct: 0 },
  { q: "En el arranque por autotransformador, ¿qué hace el contactor KC ('común')?", a: ["Conecta el motor directamente a la línea sin reducción", "Cierra el punto común del autotransformador durante el arranque", "Sustituye por completo al relé térmico de protección", "Selecciona entre giro adelante y reversa"], correct: 1 },
  { q: "¿Qué ventaja ofrece el arranque por autotransformador frente al estrella-triángulo?", a: ["Resulta más barato de instalar en absolutamente todos los casos", "Elimina por completo la necesidad de un temporizador", "Permite elegir el % de tensión de arranque mediante derivaciones (taps)", "No necesita ningún tipo de protección térmica"], correct: 2 },
  { q: "En el circuito de fuerza del autotransformador, ¿qué contactores quedan sin corriente durante la marcha normal, ya con el motor a tensión plena?", a: ["KL y F2 permanecen siempre energizados", "Ninguno — los tres contactores quedan activos permanentemente", "KS y KC, ya que el autotransformador queda fuera de servicio", "Solo F2, el resto sigue energizado"], correct: 2 },
  { q: "En un motor Dahlander (dos velocidades), ¿qué hace el contactor KM2 al pasar a alta velocidad?", a: ["Alimenta un devanado completamente independiente del de baja", "Puentea entre sí las terminales del devanado de baja velocidad", "Protege el motor contra sobrecargas térmicas", "Selecciona el sentido de giro del motor"], correct: 1 },
  { q: "¿Por qué un motor de dos velocidades normalmente lleva dos relés térmicos distintos?", a: ["Es un error común de diseño que normalmente conviene evitar", "Cada velocidad consume una corriente nominal distinta y necesita su propio ajuste", "Los relés térmicos se dañan más rápido cuando se usan en estos motores", "En realidad basta con uno solo — nunca se instalan dos en la práctica"], correct: 1 },
  { q: "¿Cuál de las siguientes técnicas NO es un método de arranque a tensión reducida?", a: ["Arranque estrella-triángulo", "Arranque por autotransformador", "Arranque directo (DOL)", "Arrancador suave (soft starter)"], correct: 2 },
  { q: "¿Qué ventaja general tiene un arrancador a tensión reducida sobre uno directo?", a: ["Ninguna — el arranque directo siempre resulta mejor", "Reduce la corriente de arranque y el golpe mecánico sobre la instalación", "Hace que el motor gire a mayor velocidad nominal", "Elimina por completo la necesidad de protección térmica"], correct: 1 },

  // ---- Inversion de giro / enclavamientos ----
  { q: "Para invertir el sentido de giro de un motor trifásico, ¿qué se debe hacer?", a: ["Invertir dos de las tres fases de alimentación", "Invertir las tres fases al mismo tiempo", "Cambiar únicamente la tensión del circuito de control", "Agregar un temporizador adicional al circuito"], correct: 0 },
  { q: "¿Por qué KF y KR (adelante/reversa) deben tener enclavamiento eléctrico Y mecánico?", a: ["Es solo una cuestión estética del tablero", "Porque si ambos cerraran a la vez se produciría un cortocircuito franco entre fases", "Porque así lo exige el color de los botones de mando", "En realidad basta con uno de los dos enclavamientos, nunca ambos"], correct: 1 },
  { q: "¿Qué ocurre eléctricamente si fallan los dos contactos NC de enclavamiento y ambos contactores cierran a la vez en un arrancador reversible?", a: ["El motor simplemente gira un poco más rápido de lo normal", "No pasa nada relevante para la instalación", "Se produce un cortocircuito línea-línea a través de ambos juegos de contactos", "El motor se detiene de forma suave y controlada"], correct: 2 },
  { q: "¿Qué es un enclavamiento mecánico entre dos contactores?", a: ["Un dispositivo físico que impide que ambas bobinas cierren sus contactos a la vez", "Un programa de software que bloquea ambas bobinas simultáneamente", "Un tipo especial de fusible de doble acción", "Un relé térmico calibrado para dos direcciones"], correct: 0 },
  { q: "En un arranque estrella-triángulo reversible, ¿por qué hay que presionar el paro (S0) antes de poder invertir el sentido de giro?", a: ["No es necesario — se puede invertir el giro en cualquier momento", "Porque KF y KR están enclavados entre sí y uno bloquea al otro mientras esté energizado", "Porque la norma exige siempre un temporizador antes de invertir", "Porque de lo contrario el motor se dañaría físicamente de inmediato"], correct: 1 },

  // ---- Sensores, temporizadores, componentes de control ----
  { q: "¿Cuál es el propósito del relé de tiempo (KT) en el arranque estrella-triángulo?", a: ["Proteger al motor contra sobrecargas térmicas sostenidas", "Medir el tiempo que el motor permanece en estrella antes de pasar a triángulo", "Encender en secuencia las lámparas piloto del tablero", "Invertir automáticamente el sentido de giro del motor"], correct: 1 },
  { q: "¿Qué función cumple un interruptor de límite (fin de carrera) en una máquina?", a: ["Mide continuamente la temperatura del devanado del motor", "Detecta mecánicamente que una pieza móvil llegó a una posición determinada", "Reduce la tensión aplicada durante el arranque", "Sustituye por completo al relé térmico de protección"], correct: 1 },
  { q: "¿Para qué se usa un relé auxiliar de control (CR) en vez de aprovechar los contactos del propio contactor?", a: ["Únicamente para que el tablero se vea más complejo ante el cliente", "Cuando se necesitan más contactos auxiliares de los que trae el contactor de fábrica", "Porque los contactores comerciales no incluyen bobina propia", "No tiene ninguna utilidad práctica real en instalaciones modernas"], correct: 1 },
  { q: "¿Cuál es la diferencia principal entre un sensor inductivo y uno fotoeléctrico?", a: ["No existe ninguna diferencia real entre ambos tipos de sensor", "El inductivo detecta solo metales; el fotoeléctrico detecta cualquier objeto que corte el haz", "El sensor fotoeléctrico siempre resulta más lento en su tiempo de respuesta", "El sensor inductivo necesita tocar físicamente la pieza que va a detectar"], correct: 1 },
  { q: "¿Cómo se cablea típicamente un actuador (electroválvula solenoide) en un circuito de control?", a: ["Siempre en serie con el devanado principal del motor", "Igual que una carga: entre línea y neutro, a través de un contacto que la energiza", "Únicamente conectado de forma directa a tierra física", "Requiere obligatoriamente su propio transformador dedicado"], correct: 1 },
  { q: "¿Para qué sirve una clema (bloque de conexiones) en un tablero de control?", a: ["Para conmutar y proteger circuitos completos de potencia", "Para empalmar y organizar cables de forma segura y desmontable, sin conmutar nada", "Para medir continuamente la corriente que circula por el circuito", "Para reducir la tensión que llega al circuito de control"], correct: 1 },
  { q: "¿Qué diferencia hay entre un selector de 2 posiciones (enclavado) y un pulsador normal?", a: ["Son en la práctica el mismo componente con un nombre distinto", "El selector se queda fijo en la posición elegida; el pulsador regresa solo por resorte", "El selector nunca puede emplearse dentro de un circuito de control", "El pulsador siempre debe ser de tipo normalmente cerrado"], correct: 1 },
  { q: "¿Qué distingue a un interruptor de emergencia tipo SETA de un paro normal (S0)?", a: ["Cumplen exactamente la misma función y son totalmente intercambiables", "La SETA va primero en la línea, corta todo con máxima prioridad y se enclava al presionarla", "La SETA es puramente decorativa y no cumple ninguna función eléctrica", "El paro normal siempre tiene mayor prioridad de corte que la SETA"], correct: 1 },
  { q: "En una cinta transportadora, ¿qué ocurre si un fin de carrera NC se abre mientras el motor está sellado (auto-mantenido)?", a: ["El sello mantiene energizado el contactor sin importar lo que pase", "El contactor pierde alimentación de inmediato, ya que el sello depende de esa misma línea", "El motor invierte automáticamente su sentido de giro", "Se dispara el relé térmico de protección"], correct: 1 },

  // ---- VFD, chopper, arrancador suave ----
  { q: "¿Por qué un variador de frecuencia (VFD) no necesita contactores separados ni enclavamiento mecánico entre adelante y reversa?", a: ["Porque los variadores no pueden invertir el sentido de giro", "Porque el propio variador gestiona la conmutación internamente mediante software", "Porque siempre giran en un único sentido fijo de fábrica", "Porque no incorporan ningún tipo de electrónica de potencia"], correct: 1 },
  { q: "¿Qué hace un chopper (convertidor DC-DC) en un accionamiento de motor de corriente directa?", a: ["Únicamente convierte corriente alterna a corriente directa", "Recorta un voltaje DC fijo mediante PWM para regular la velocidad", "Mide de forma continua la corriente que consume el motor", "Sustituye por completo al relé térmico de protección"], correct: 1 },
  { q: "¿Cuál es la ventaja principal de un variador de frecuencia frente a un arranque estrella-triángulo o por autotransformador?", a: ["Resulta siempre más económico sin excepción alguna", "Permite una rampa de velocidad continua y control total en marcha, no solo al arrancar", "Elimina por completo la necesidad de cablear un circuito de fuerza", "Hace innecesaria la existencia del propio motor"], correct: 1 },
  { q: "¿Cómo regula la tensión un arrancador suave (soft starter)?", a: ["Añadiendo un devanado adicional dentro del motor", "Mediante tiristores (SCR) en antiparalelo que rampan gradualmente el voltaje", "Cambiando la frecuencia de la línea de alimentación", "Con un autotransformador de derivaciones fijas"], correct: 1 },
  { q: "¿Para qué sirve el contactor de bypass en un arrancador suave?", a: ["Para invertir el sentido de giro del motor una vez arrancado", "Para derivar la corriente por contactos mecánicos y evitar pérdidas en los tiristores", "Para proteger al motor contra sobrecargas térmicas sostenidas", "Para medir de forma directa la velocidad real del motor"], correct: 1 },

  // ---- Multi-estacion / secuencial ----
  { q: "En un control desde dos botoneras (local y remota), ¿por qué los dos botones de PARO se conectan en serie?", a: ["Para que ninguno de los dos botones llegue a funcionar", "Basta con presionar cualquiera de los dos para detener el motor, por seguridad", "Para que se necesiten ambos al mismo tiempo para detener el motor", "Resulta indiferente — podrían conectarse igual en paralelo"], correct: 1 },
  { q: "En ese mismo control desde dos botoneras, ¿por qué los botones de MARCHA se conectan en paralelo?", a: ["Para que se necesiten ambos al mismo tiempo para poder arrancar", "Para poder arrancar el motor desde cualquiera de las dos ubicaciones", "Porque de esa forma protegen contra sobrecargas térmicas", "Es un error de diseño — deberían conectarse en serie"], correct: 1 },
  { q: "En un arranque secuencial de dos motores, ¿qué garantiza que el Motor 2 no pueda arrancar antes que el Motor 1?", a: ["Un temporizador instalado directamente en la bobina de K2", "Un contacto auxiliar NA de K1 (permiso) en serie con el circuito de marcha de K2", "El relé térmico exclusivo instalado para el Motor 2", "En realidad no existe forma de garantizar esto eléctricamente"], correct: 1 },
  { q: "En ese mismo arranque secuencial, ¿por qué el botón de paro (S0) se comparte entre ambos motores?", a: ["Únicamente para ahorrar algunos metros de cable", "Para poder detener ambos motores de forma segura con una sola orden", "Porque los motores no admiten paros independientes por norma", "Es simplemente un error de diseño frecuente"], correct: 1 },

  // ---- Monofasico / bifasico / residencial ----
  { q: "¿Por qué un motor monofásico necesita un capacitor de arranque?", a: ["Para reducir el consumo de energía durante la marcha normal", "Porque una sola fase no produce un campo magnético rotante por sí sola", "Para proteger el motor contra sobrecargas térmicas", "Para poder invertir el sentido de giro del motor"], correct: 1 },
  { q: "En una instalación 'bifásica' (220V entre L1 y L2, sin neutro), ¿qué diferencia hay respecto a un circuito monofásico L-N?", a: ["Ninguna — ambos circuitos son exactamente iguales", "Ambos conductores son fases activas, así que los dos deben protegerse como línea", "El circuito bifásico no requiere ningún tipo de protección térmica", "Un circuito bifásico es en realidad siempre trifásico"], correct: 1 },
  { q: "En una escalera con conmutadores de 3 vías, ¿qué ocurre con la lámpara cuando ambos interruptores están en posiciones opuestas (uno en A y el otro en B)?", a: ["La lámpara permanece encendida sin importar la posición", "La lámpara queda apagada, porque ningún camino de los dos travesaños queda cerrado", "La lámpara parpadea de forma intermitente", "Los dos interruptores se dañan al quedar en posiciones opuestas"], correct: 1 },
  { q: "¿Qué representa el transformador de timbre (TC) en un circuito de puerta con timbre?", a: ["Un dispositivo que reduce la tensión de línea a un valor seguro para botón y chicharra", "Un contactor especial fabricado únicamente para instalaciones de timbre", "Un relé térmico especialmente adaptado para trabajar a bajo voltaje", "Un capacitor de arranque destinado al motor interno del timbre"], correct: 0 },
  { q: "¿Cómo se logra que una lámpara exterior encienda automáticamente al anochecer?", a: ["Con un temporizador que sigue el horario del reloj del tablero", "Con una fotocelda que detecta la caída de luz natural y energiza el contactor", "Conectando la lámpara directamente sin ningún contacto intermedio", "Usando exclusivamente un interruptor de límite mecánico"], correct: 1 },

  // ---- Bombeo, eficiencia, automatizacion, avanzado ----
  { q: "En un control de bomba con dos flotadores, ¿qué función cumple el flotador de nivel ALTO (FShi, normalmente cerrado)?", a: ["Arranca la bomba cuando el tanque se vacía", "Detiene la bomba cuando el tanque se llena, cortando la alimentación del contactor", "Enciende una alarma sonora únicamente, sin afectar la bomba", "Invierte el sentido de giro de la bomba"], correct: 1 },
  { q: "¿Para qué se instala un banco de capacitores en paralelo con una instalación con motores?", a: ["Para aumentar la velocidad nominal de los motores", "Para corregir el factor de potencia y reducir el consumo de energía reactiva", "Para sustituir la función del relé térmico", "Para invertir el sentido de giro de los motores conectados"], correct: 1 },
  { q: "En un semáforo con temporizadores encadenados, ¿qué principio permite pasar de rojo a verde y luego a ámbar automáticamente?", a: ["Un sensor de tráfico que cuenta los vehículos que van pasando", "La salida de cada temporizador dispara la energización del siguiente en la secuencia", "Un interruptor manual que un operador debe accionar cada vez", "Las tres lámparas están cableadas todas en serie entre sí"], correct: 1 },
  { q: "En una puerta corrediza automática reversible con fines de carrera, ¿qué detiene el motor al llegar al extremo?", a: ["El usuario debe soltar el botón exactamente en el instante correcto", "Un fin de carrera (normalmente cerrado) que corta la alimentación del contactor activo", "El relé térmico se dispara automáticamente al llegar al tope mecánico", "Nada la detiene, así que el motor sigue funcionando indefinidamente"], correct: 1 },
  { q: "¿Qué papel juega el contacto auxiliar de 'permiso' en un sistema de banda con sensor y actuador (clasificadora)?", a: ["Ninguno — el sensor actúa siempre de forma completamente independiente", "Habilita que el motor de la banda arranque solo cuando las condiciones de seguridad están dadas", "Sustituye por completo al relé térmico de protección", "Sirve únicamente para encender la lámpara piloto de marcha"], correct: 1 },

  // ---- Diagnostico y buenas practicas ----
  { q: "Al diagnosticar un motor que arranca pero no se sella (se detiene al soltar el botón de marcha), ¿qué debe revisarse primero?", a: ["El relé térmico de protección del circuito de fuerza", "El contacto auxiliar de sello (13-14), que puede estar mal conectado o ausente", "La secuencia de fases en la caja de conexiones del motor", "El valor de la resistencia de aislamiento del devanado"], correct: 1 },
  { q: "¿Qué medida de seguridad debe tomarse antes de medir o tocar cualquier terminal de un tablero?", a: ["Ninguna en particular, basta con tener cuidado visualmente", "Confirmar que el circuito esté desenergizado y bloqueado (procedimiento LOTO)", "Verificar solamente que las lámparas piloto estén apagadas", "Aumentar la tensión para facilitar la detección de fallas"], correct: 1 },
  { q: "Si un arrancador estrella-triángulo pasa directo a tensión plena sin pasar por la etapa reducida, ¿qué conviene sospechar primero?", a: ["Que el motor está dañado internamente de forma irreversible", "Que los contactos instantáneo/retardado del temporizador quedaron cruzados", "Que el relé térmico está mal calibrado", "Que falta agregar más lámparas piloto al tablero"], correct: 1 },
  { q: "Si al presionar el botón de 'adelante' el motor gira en reversa (y viceversa), ¿cuál es la causa más probable?", a: ["Un relé térmico mal calibrado en el circuito de fuerza", "Los cables de los botones de mando quedaron cruzados entre sí", "El motor tiene una falla mecánica interna irreparable", "El temporizador está ajustado a un tiempo demasiado corto"], correct: 1 },

  // ---- Motores trifasicos: caja de conexiones ----
  { q: "En la caja de conexiones de un motor trifásico, ¿qué terminales se puentean para formar la conexión en triángulo (delta)?", a: ["Se puentean U2, V2 y W2 entre sí, alimentando U1-V1-W1", "Se puentean U1-W2, V1-U2 y W1-V2 entre sí", "Se puentean U1 con V1 directamente", "No se puentea nada — se deja la caja completamente abierta"], correct: 1 },
  { q: "¿Qué se hace en la caja de conexiones de un motor trifásico para formar la conexión en estrella?", a: ["Se puentean U1-W2, V1-U2 y W1-V2 entre sí", "Se puentean U2, V2 y W2 entre sí, y se alimenta U1-V1-W1", "Se puentea únicamente U1 con V1", "Se deja el motor completamente sin puentes"], correct: 1 },

  // ---- Seguridad y Rele Maestro de Control (MCR) ----
  { q: "En un sistema con Relé Maestro de Control (KA), ¿qué función cumplen sus contactos auxiliares hacia las 'barras seguras'?", a: ["Miden la corriente total que consumen ambos motores conectados", "Cortan la alimentación a los arrancadores aguas abajo si KA se desenergiza", "Invierten el sentido de giro de los motores conectados a la barra", "Sustituyen por completo a los relés térmicos de cada arrancador"], correct: 1 },
  { q: "Tras presionar un paro de emergencia (E-stop) y luego liberarlo girándolo, ¿qué debería pasar con el relé maestro KA?", a: ["Debe rearmarse solo apenas se libera el E-stop", "Debe permanecer desenergizado hasta presionar de nuevo el botón de rearme", "Debe quedar energizado a media tensión mientras tanto", "Debe alternar entre energizado y desenergizado varias veces"], correct: 1 },
  { q: "¿Por qué un E-stop se libera girando el hongo en vez de simplemente dejar de presionarlo?", a: ["Por estética del botón, no cambia nada eléctricamente", "Para impedir que se reponga por accidente y evitar un arranque inesperado", "Porque así lo exige únicamente el color rojo de su carcasa", "Para que encienda una lámpara piloto adicional al soltarlo"], correct: 1 },
  { q: "En un tablero con dos arrancadores (K1 y K2) alimentados por una barra segura desde el relé maestro KA, ¿qué ocurre si se presiona el E-stop mientras ambos motores están en marcha?", a: ["Solo se detiene el motor cuyo botón de marcha siga presionado", "Ambos motores se detienen de inmediato, sin importar el estado de sus propios botones", "Ninguno se detiene, ya que cada arrancador tiene su propio circuito independiente", "Solo se apagan las lámparas piloto, los motores continúan girando"], correct: 1 },
  { q: "¿Cuál es la diferencia principal entre un paro normal (S0) y un paro de emergencia (E-stop) en un tablero de control?", a: ["No existe ninguna diferencia real entre ambos tipos de botón", "El E-stop corta de golpe un grupo entero de cargas y exige rearme manual", "El paro normal siempre corta la corriente más rápido que el E-stop", "El E-stop únicamente enciende una alarma sonora en el tablero"], correct: 1 },
  { q: "¿Qué ventaja de diseño ofrece usar un relé maestro (KA) en vez de cablear el E-stop directamente en serie dentro de cada arrancador?", a: ["Ninguna, ambos enfoques son exactamente equivalentes en la práctica", "Permite agregar o quitar arrancadores de la barra segura sin recablear el E-stop cada vez", "Elimina por completo la necesidad de relés térmicos en los arrancadores", "Hace que los motores arranquen automáticamente al energizar KA"], correct: 1 },

  // ---- Presostatos, sensores fotoelectricos y clasificacion ----
  { q: "En un control de compresor con presostato, ¿por qué el presostato alimenta la bobina del contactor directamente, sin botón de marcha ni contacto de sello?", a: ["Porque el presostato mismo hace las veces de interruptor automático según la presión", "Porque los compresores nunca necesitan botón de marcha por norma", "Porque el sello eléctrico dañaría el diafragma interno del presostato", "Porque así lo exige siempre el fabricante del contactor, sin razón técnica"], correct: 0 },
  { q: "¿Qué contacto de presostato conviene usar para que el compresor arranque cuando la presión del tanque está baja?", a: ["Un contacto normalmente abierto (NA), que cierra a baja presión", "Un contacto normalmente cerrado (NC), que permanece cerrado a baja presión", "Cualquiera de los dos, el tipo de contacto no influye en el resultado", "Un contacto de tiempo retardado a la desenergización"], correct: 1 },
  { q: "¿En qué se diferencia un sensor fotoeléctrico de tipo 'barrera' (through-beam) de uno inductivo?", a: ["Detecta la interrupción de un haz de luz, no solo piezas metálicas", "El fotoeléctrico solamente puede detectar piezas metálicas grandes", "El inductivo siempre necesita dos cables adicionales de repuesto", "No hay ninguna diferencia real de funcionamiento entre ambos"], correct: 0 },
  { q: "En un clasificador con sensor fotoeléctrico y electroválvula, ¿qué función cumple el selector SEL en 'modo 0'?", a: ["Acelera el paso de piezas frente al sensor fotoeléctrico", "Corta la alimentación de todo el circuito de clasificación", "Invierte la lógica de la electroválvula de empuje", "Enciende una alarma sonora adicional en el tablero"], correct: 1 },
  { q: "¿Qué representa la clema (bloque de conexiones) en un diagrama de control?", a: ["Un punto de unión entre dos cables, sin conmutar nada", "Un tipo especial de contactor auxiliar de mando", "Un relé de tiempo con retardo ajustable", "Un fusible de protección contra sobrecorrientes"], correct: 0 },

  // ---- HVAC, bombeo, esclusas y transferencia automatica (ATS) ----
  { q: "¿Qué diferencia hay entre un termostato de alto límite (TH1, NC) y un relé térmico de sobrecarga en un circuito de ventilador?", a: ["Ninguna diferencia real, ambos hacen exactamente lo mismo", "El de alto límite corta por temperatura del ducto, el térmico por corriente del motor", "El térmico nunca puede colocarse en serie con el circuito de control", "El termostato de alto límite solo sirve para encender lámparas piloto"], correct: 1 },
  { q: "Tras un corte por termostato de alto límite (TH1), ¿qué debe pasar cuando el ducto se enfría y TH1 vuelve a cerrar?", a: ["El ventilador arranca solo de inmediato, sin intervención", "El ventilador permanece detenido hasta presionar marcha otra vez", "El termostato queda bloqueado permanentemente hasta cambiarlo", "Se invierte el sentido de giro del ventilador automáticamente"], correct: 1 },
  { q: "En un control de bomba de achique con dos flotadores (FS1 y FS2), ¿qué función cumple el segundo flotador (más alto)?", a: ["Arranca la bomba en lugar del primer flotador", "Dispara una alarma de alto nivel si la bomba no logra bajar el agua", "Invierte el sentido de giro de la bomba", "Sustituye por completo al relé térmico de protección"], correct: 1 },
  { q: "¿Por qué el flotador FS1 en un control de bomba de achique acciona la bobina directamente, sin botón ni contacto de sello?", a: ["Porque el propio flotador actúa como interruptor automático según el nivel", "Porque las bombas de achique nunca necesitan protección térmica", "Porque el sello eléctrico dañaría el mecanismo del flotador", "Porque así lo exige siempre el fabricante, sin razón técnica"], correct: 0 },
  { q: "En una esclusa de acceso con dos puertas enclavadas, ¿qué impide que la puerta B se abra mientras la A está abierta?", a: ["Un temporizador que retrasa unos segundos la apertura de B", "El interruptor de límite LSA (de la puerta A) debe estar cerrado para dar permiso a B", "Un relé térmico compartido entre ambas puertas", "Nada lo impide: ambas puertas pueden abrir libremente y a la vez"], correct: 1 },
  { q: "¿Qué principio de control comparten una esclusa de dos puertas y un arrancador reversible (adelante/reversa)?", a: ["Ambos usan exactamente el mismo tipo de motor trifásico", "Ambos dependen del enclavamiento: dos salidas que nunca deben activarse a la vez", "Ambos requieren obligatoriamente un transformador de control", "No comparten ningún principio de control en común"], correct: 1 },
  { q: "En una transferencia automática (ATS), ¿por qué KN (red normal) y KE (generador) deben estar enclavados entre sí?", a: ["Para ahorrar cableado dentro del gabinete del tablero", "Para impedir que ambas fuentes alimenten la carga al mismo tiempo", "Porque así lo exige únicamente el color de los botones de mando", "Para que el generador arranque más rápido en cada falla"], correct: 1 },
  { q: "¿Para qué sirve el temporizador KT en un circuito de transferencia automática (ATS)?", a: ["Para retardar el cierre de KE mientras arranca y estabiliza el generador", "Para medir la corriente que consume la carga conectada", "Para invertir el sentido de giro del generador", "Para encender la lámpara piloto de la red normal"], correct: 0 },
  { q: "Al restablecerse la red eléctrica normal en una ATS ya transferida al generador, ¿qué debe ocurrir?", a: ["El generador se queda encendido permanentemente junto con la red", "KE se desenergiza y KN vuelve a alimentar la carga, sin que ambas coincidan", "Se disparan las dos fuentes a la vez por seguridad", "No pasa nada hasta apagar manualmente el generador"], correct: 1 },
];
