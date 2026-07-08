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

/* =========================================================
   EJERCICIO 1: Arranque directo — CONTROL
   ========================================================= */

const dolControl = {
  id: "dol-control",
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

const EXERCISES = [
  dolControl, dolPower, revControl, ydControl, ydPower, autoControl, autoPower,
  twoSpeedControl, twoSpeedPower, alarmControl,
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
];

/* =========================================================
   Quiz teorico
   ========================================================= */

const QUIZ = [
  { q: "¿Para qué sirve el contacto auxiliar 13-14 de un contactor en un circuito de arranque-paro?", a: ["Como contacto de sello para mantener energizada la bobina al soltar el botón de marcha", "Para proteger contra sobrecarga", "Para invertir el giro del motor", "Para reducir la tensión de arranque"], correct: 0 },
  { q: "¿Por qué el botón de paro (S0) es normalmente cerrado (NC)?", a: ["Porque así se ve mejor en el tablero", "Para que, si se rompe el cable, el circuito falle hacia un estado seguro (paro)", "Porque los botones NC son más baratos", "No hay una razón técnica"], correct: 1 },
  { q: "En un arranque estrella-triángulo, ¿qué contactor permanece cerrado durante todo el arranque y la marcha?", a: ["K2 (estrella)", "K3 (triángulo)", "K1 (línea)", "Ninguno, los tres alternan"], correct: 2 },
  { q: "¿Cuál es la reducción aproximada de corriente de línea en el arranque estrella-triángulo respecto al arranque directo?", a: ["A la mitad (50%)", "A un tercio (33%)", "Se mantiene igual", "Se reduce al 65%"], correct: 1 },
  { q: "¿Qué función cumple el contactor K2 en el arranque estrella-triángulo?", a: ["Conecta el motor directo a línea", "Puentea U2-V2-W2 para formar el punto estrella", "Alimenta el temporizador", "Protege contra sobrecarga"], correct: 1 },
  { q: "¿Por qué es indispensable el enclavamiento eléctrico entre K2 y K3?", a: ["Para ahorrar cableado", "Para evitar que ambos cierren al mismo tiempo y provoquen un cortocircuito entre fases", "Para que enciendan las lámparas piloto", "Es solo una recomendación estética"], correct: 1 },
  { q: "En el arranque por autotransformador, ¿qué hace el contactor KC ('común')?", a: ["Conecta el motor directo a línea", "Cierra el punto común/neutro del autotransformador para que actúe como tal durante el arranque", "Reemplaza al relé térmico", "Selecciona el sentido de giro"], correct: 1 },
  { q: "¿Qué ventaja tiene el arranque por autotransformador frente al estrella-triángulo?", a: ["Es más barato siempre", "Permite elegir el % de tensión de arranque mediante derivaciones (taps) y suele dar mejor par de arranque por amperio", "No necesita temporizador", "No requiere protección térmica"], correct: 1 },
  { q: "¿Qué terminales estándar (IEC) corresponden a la bobina de un contactor?", a: ["1-2", "13-14", "A1-A2", "95-96"], correct: 2 },
  { q: "¿Qué terminales estándar corresponden al contacto de protección (NC) de un relé térmico?", a: ["95-96", "13-14", "A1-A2", "21-22"], correct: 0 },
  { q: "En la caja de conexiones de un motor trifásico, ¿qué terminales se puentean para formar el triángulo (delta)?", a: ["U1-V1, V1-W1, W1-U1", "U1-W2, V1-U2, W1-V2", "U2-V2-W2 entre sí", "No se puentea nada, se deja abierto"], correct: 1 },
  { q: "¿Qué se hace en la caja de conexiones para formar la conexión estrella?", a: ["Se puentean U1-W2, V1-U2, W1-V2", "Se puentean U2, V2 y W2 entre sí y se alimenta U1-V1-W1", "Se puentea U1 con V1", "Se deja el motor sin puentes"], correct: 1 },
  { q: "¿Cuál de estas es una razón para usar un botón normalmente abierto (NA) para 'marcha'?", a: ["Para que el motor solo arranque cuando se da una orden activa y explícita", "Porque es más barato", "Porque así el motor arranca solo", "No tiene ninguna ventaja sobre uno NC"], correct: 0 },
  { q: "¿Qué pasaría si en un arranque directo se conecta el contacto de sello (13-14) en serie con el botón de marcha en vez de en paralelo?", a: ["Funcionaría igual de bien", "El motor solo funcionaría mientras se mantenga presionado el botón de marcha (no habría memoria/sello)", "El motor arrancaría en reversa", "Se quemaría el fusible inmediatamente"], correct: 1 },
  { q: "¿Cuál es el propósito del relé de tiempo (KT) en el arranque estrella-triángulo?", a: ["Proteger contra sobrecarga", "Medir el tiempo que el motor permanece en estrella antes de conmutar a triángulo", "Encender las lámparas piloto", "Invertir el sentido de giro"], correct: 1 },
  { q: "¿Qué es un enclavamiento mecánico entre dos contactores?", a: ["Un software que impide que ambos cierren", "Un dispositivo físico que impide que ambas bobinas cierren sus contactos simultáneamente, como respaldo del enclavamiento eléctrico", "Un tipo de fusible", "Un relé térmico especial"], correct: 1 },
  { q: "¿Cuál es la función principal del guardamotor (interruptor termomagnético) antes del contactor?", a: ["Encender el piloto verde", "Proteger contra cortocircuitos y sobrecargas, y permitir desconexión manual", "Reducir la tensión de arranque", "Invertir el sentido de giro"], correct: 1 },
  { q: "Para invertir el sentido de giro de un motor trifásico, ¿qué se debe hacer?", a: ["Invertir dos de las tres fases de alimentación", "Invertir las tres fases", "Cambiar la tensión de control", "Agregar un temporizador"], correct: 0 },
  { q: "¿Por qué KF y KR (adelante/reversa) deben tener enclavamiento eléctrico Y mecánico?", a: ["Por estética", "Porque si ambos cerraran a la vez se produciría un cortocircuito franco entre fases", "Porque lo exige el color del botón", "No es necesario, basta con uno"], correct: 1 },
  { q: "¿Qué ocurre eléctricamente si dos contactos NC de enclavamiento fallan y ambos contactores cierran a la vez en un arrancador reversible?", a: ["El motor gira más rápido", "Se produce un cortocircuito línea-línea a través de ambos juegos de contactos", "No pasa nada relevante", "El motor se detiene suavemente"], correct: 1 },
  { q: "¿Qué representa la 'M 3~' dentro del círculo en un diagrama?", a: ["Un motor monofásico", "Un motor trifásico", "Un medidor de corriente", "Un transformador"], correct: 1 },
  { q: "¿Cuál de los siguientes NO es un método de arranque a tensión reducida?", a: ["Estrella-triángulo", "Autotransformador", "Arranque directo (DOL)", "Arrancador suave (soft starter)"], correct: 2 },
  { q: "¿Qué ventaja tiene un arrancador a tensión reducida sobre uno directo?", a: ["Ninguna, siempre es mejor el directo", "Reduce la corriente de arranque y el golpe mecánico/eléctrico sobre la instalación", "Hace girar el motor más rápido", "Elimina la necesidad de protección térmica"], correct: 1 },
  { q: "En el circuito de fuerza del autotransformador, ¿qué contactor queda sin corriente durante la marcha normal (después de la transición)?", a: ["KL", "F2", "KS y KC (el autotransformador queda fuera de servicio)", "Ninguno, todos permanecen activos"], correct: 2 },
  { q: "En un motor Dahlander (dos velocidades), ¿qué hace el contactor KM2 en alta velocidad?", a: ["Alimenta directamente el devanado de alta", "Puentea entre sí las terminales del devanado de baja velocidad (doble estrella)", "Protege contra sobrecarga", "Selecciona el sentido de giro"], correct: 1 },
  { q: "¿Por qué un motor de dos velocidades normalmente lleva DOS relés térmicos distintos?", a: ["Por error de diseño", "Porque cada velocidad tiene una corriente nominal distinta y necesita su propio ajuste de protección", "Porque los térmicos se dañan rápido", "No es cierto, siempre se usa uno solo"], correct: 1 },
  { q: "¿Qué función cumple un interruptor de límite (fin de carrera) en una máquina?", a: ["Mide la temperatura del motor", "Detecta mecánicamente que una pieza móvil llegó a una posición determinada", "Reduce la tensión de arranque", "Sustituye al relé térmico"], correct: 1 },
  { q: "¿Para qué se usa un relé auxiliar de control (CR) en vez de aprovechar los contactos del propio contactor?", a: ["Para que se vea más complicado el tablero", "Cuando se necesitan más contactos auxiliares de los que trae el contactor, o para aislar niveles de tensión", "Porque los contactores no tienen bobina", "No tiene ninguna utilidad real"], correct: 1 },
];
