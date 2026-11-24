
/* Laboratório "Veja uma IA pensando".
   Modo 1: rede neural de verdade (784 → 64 → 32 → 10), treinada no MNIST, reconhece o número desenhado e mostra cada camada.
   Modo 2: a pessoa ensina uma IA pequena com os próprios desenhos (3 classes) e vê o treino acontecer.
   Tudo roda no navegador, sem enviar nada para servidor nenhum. */
(function () {
  "use strict";
  const L = window.__LAB__;
  const reduz = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pct = (x) => `${Math.round(x * 100)}%`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- rede pré-treinada ---------------- */
  function camada(o) {
    const raw = atob(o.w), q = new Int8Array(raw.length);
    for (let i = 0; i < raw.length; i++) q[i] = (raw.charCodeAt(i) << 24) >> 24;
    const W = new Float32Array(q.length); for (let i = 0; i < q.length; i++) W[i] = q[i] * o.s;
    return { n: o.in, m: o.out, W, b: Float32Array.from(o.b) };
  }
  const NET = L ? [camada(L.l1), camada(L.l2), camada(L.l3)] : null;
  const EX = L ? (() => { const r = atob(L.ex), a = new Float32Array(r.length); for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i) / 255; return a; })() : null;
  function denso(x, c, relu) {
    const y = new Float32Array(c.m);
    for (let j = 0; j < c.m; j++) y[j] = c.b[j];
    for (let i = 0; i < c.n; i++) { const xi = x[i]; if (!xi) continue; const off = i * c.m; for (let j = 0; j < c.m; j++) y[j] += xi * c.W[off + j]; }
    if (relu) for (let j = 0; j < c.m; j++) if (y[j] < 0) y[j] = 0;
    return y;
  }
  function softmax(z) { let mx = -Infinity; for (const v of z) mx = Math.max(mx, v); const e = Array.from(z, (v) => Math.exp(v - mx)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
  function prever(x) { const a1 = denso(x, NET[0], true), a2 = denso(a1, NET[1], true), p = softmax(denso(a2, NET[2], false)); return { x, a1, a2, p }; }

  /* ---------------- desenho → 28×28 no padrão MNIST ---------------- */
  function prancheta(cv, aoMudar, aoSoltar) {
    const g = cv.getContext("2d", { willReadFrequently: true });
    let desenhando = false, ult = null, sujo = false, vazio = true;
    const ajustar = () => { const dpr = Math.min(2, devicePixelRatio || 1); cv.width = 280 * dpr; cv.height = 280 * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = "round"; g.lineJoin = "round"; };
    ajustar();
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 280, y: ((e.clientY - r.top) / r.height) * 280 }; };
    let agendado = false;
    const tick = () => { agendado = false; if (sujo) { sujo = false; aoMudar && aoMudar(); } };
    const traco = (a, b) => { g.strokeStyle = "#14060A"; g.lineWidth = 22; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x + 0.01, b.y); g.stroke(); sujo = true; vazio = false; if (!agendado) { agendado = true; requestAnimationFrame(tick); } };
    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); desenhando = true; ult = pos(e); traco(ult, ult); });
    cv.addEventListener("pointermove", (e) => { if (!desenhando) return; const p = pos(e); traco(ult, p); ult = p; });
    const fim = () => { if (!desenhando) return; desenhando = false; aoSoltar && aoSoltar(); };
    cv.addEventListener("pointerup", fim); cv.addEventListener("pointercancel", fim);
    return {
      limpar() { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore(); vazio = true; },
      vazio: () => vazio,
      desenharVetor(v) { // mostra um exemplo 28×28 na prancheta
        this.limpar(); const t = document.createElement("canvas"); t.width = t.height = 28; const tg = t.getContext("2d"); const id = tg.createImageData(28, 28);
        for (let i = 0; i < 784; i++) { id.data[i * 4] = 20; id.data[i * 4 + 1] = 6; id.data[i * 4 + 2] = 10; id.data[i * 4 + 3] = Math.round(v[i] * 255); }
        tg.putImageData(id, 0, 0); g.save(); g.imageSmoothingEnabled = true; g.drawImage(t, 0, 0, 280, 280); g.restore(); vazio = false;
      },
      vetor() { return paraMnist(cv); },
    };
  }
  function paraMnist(cv) {
    const W = cv.width, H = cv.height, d = cv.getContext("2d").getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 30) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const out = new Float32Array(784); if (x1 < 0) return out;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = 20 / Math.max(bw, bh), tw = Math.max(1, Math.round(bw * k)), th = Math.max(1, Math.round(bh * k));
    const t = document.createElement("canvas"); t.width = tw; t.height = th; const tg = t.getContext("2d");
    tg.imageSmoothingEnabled = true; tg.imageSmoothingQuality = "high"; tg.drawImage(cv, x0, y0, bw, bh, 0, 0, tw, th);
    const td = tg.getImageData(0, 0, tw, th).data; let sx = 0, sy = 0, s = 0;
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const v = td[(y * tw + x) * 4 + 3] / 255; sx += x * v; sy += y * v; s += v; }
    const ox = Math.round(14 - (s ? sx / s : tw / 2)), oy = Math.round(14 - (s ? sy / s : th / 2));
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X > 27 || Y > 27) continue; out[Y * 28 + X] = Math.min(1, td[(y * tw + x) * 4 + 3] / 255 * 1.15); }
    return out;
  }

  /* ---------------- visualização das camadas ---------------- */
  function visual(cv) {
    const g = cv.getContext("2d");
    let W = 0, H = 0, est = null, t = 1, raf = 0;
    const ajustar = () => { const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const grade = (n, cols, cx, cy, cel) => { const rows = Math.ceil(n / cols), out = []; for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); out.push({ x: cx + (c - (cols - 1) / 2) * cel, y: cy + (r - (rows - 1) / 2) * cel }); } return out; };
    function desenhar() {
      g.clearRect(0, 0, W, H); if (!W) return;
      const narrow = W < 520, cy = H / 2, img = Math.min(narrow ? 84 : 112, H * 0.5);
      const xs = narrow ? [img / 2 + 4, W * 0.42, W * 0.68, W - 26] : [img / 2 + 14, W * 0.42, W * 0.7, W - 40];
      const cel1 = Math.min(narrow ? 13 : 24, (H - 50) / 8), cel2 = Math.min(narrow ? 15 : 28, (H - 50) / 8);
      const P1 = grade(64, 8, xs[1], cy, cel1), P2 = grade(32, 4, xs[2], cy, cel2), P3 = grade(10, 1, xs[3], cy, Math.min(26, (H - 30) / 10));
      const a1 = est ? est.a1 : new Float32Array(64), a2 = est ? est.a2 : new Float32Array(32), p = est ? est.p : new Array(10).fill(0);
      const m1 = Math.max(1e-6, ...a1), m2 = Math.max(1e-6, ...a2), best = est ? p.indexOf(Math.max(...p)) : -1;
      const fase = (k) => Math.max(0, Math.min(1, t * 3.2 - k)); // 0..3: entrada→l1→l2→saída
      // ligações mais fortes
      const liga = (A, B, pares, alpha, cor) => { pares.forEach(([i, j, w]) => { g.strokeStyle = `rgba(${cor}, ${(alpha * w).toFixed(3)})`; g.lineWidth = 0.6 + w * 1.6; g.beginPath(); g.moveTo(A[i].x, A[i].y); g.lineTo(B[j].x, B[j].y); g.stroke(); }); };
      if (est) {
        const top1 = Array.from(a1, (v, i) => [i, v / m1]).sort((a, b) => b[1] - a[1]).slice(0, 14);
        const imgR = { x: xs[0] + img / 2, y: cy };
        top1.forEach(([i, w]) => { g.strokeStyle = `rgba(250, 168, 34, ${(0.35 * w * fase(0.4)).toFixed(3)})`; g.lineWidth = 0.6 + w; g.beginPath(); g.moveTo(imgR.x, imgR.y + (P1[i].y - cy) * 0.35); g.lineTo(P1[i].x, P1[i].y); g.stroke(); });
        const c2 = NET[1], pares12 = [];
        for (const [i] of top1.slice(0, 10)) for (let j = 0; j < 32; j++) { const v = a1[i] * c2.W[i * 32 + j]; if (v > 0) pares12.push([i, j, v]); }
        const mx12 = Math.max(1e-6, ...pares12.map((x) => x[2])); pares12.sort((a, b) => b[2] - a[2]);
        liga(P1, P2, pares12.slice(0, 46).map(([i, j, v]) => [i, j, v / mx12]), 0.55 * fase(1.2), "250, 168, 34");
        const c3 = NET[2], pares23 = [];
        for (let i = 0; i < 32; i++) for (let j = 0; j < 10; j++) { const v = a2[i] * c3.W[i * 10 + j]; if (v > 0) pares23.push([i, j, v * (j === best ? 1.6 : 0.6)]); }
        const mx23 = Math.max(1e-6, ...pares23.map((x) => x[2])); pares23.sort((a, b) => b[2] - a[2]);
        liga(P2, P3, pares23.slice(0, 30).map(([i, j, v]) => [i, j, v / mx23]), 0.6 * fase(2.1), "246, 244, 231");
      }
      // entrada: o que a IA "vê"
      const x0 = xs[0] - img / 2, y0 = cy - img / 2, px = img / 28;
      g.fillStyle = "rgba(247, 244, 231, .08)"; g.fillRect(x0, y0, img, img);
      if (est) for (let i = 0; i < 784; i++) { const v = est.x[i]; if (v < 0.03) continue; g.fillStyle = `rgba(247, 244, 231, ${(v * fase(0)).toFixed(3)})`; g.fillRect(x0 + (i % 28) * px, y0 + Math.floor(i / 28) * px, px + 0.3, px + 0.3); }
      g.strokeStyle = "rgba(250, 168, 34, .5)"; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, img - 1, img - 1);
      // neurônios
      const no = (P, a, m, raio, f) => P.forEach((q, i) => { const v = (a[i] / m) * f; g.beginPath(); g.arc(q.x, q.y, raio, 0, Math.PI * 2); g.fillStyle = v > 0.02 ? `rgba(250, 168, 34, ${(0.15 + 0.85 * v).toFixed(3)})` : "rgba(247, 244, 231, .12)"; g.fill(); if (v > 0.6) { g.strokeStyle = "rgba(250, 168, 34, .9)"; g.lineWidth = 1.5; g.stroke(); } });
      no(P1, a1, m1, cel1 * 0.36, fase(1)); no(P2, a2, m2, cel2 * 0.36, fase(2));
      P3.forEach((q, i) => { const v = p[i] * fase(2.6), on = i === best && est; g.beginPath(); g.arc(q.x, q.y, on ? 11 : 9, 0, Math.PI * 2); g.fillStyle = v > 0.02 ? `rgba(246, 244, 231, ${(0.2 + 0.8 * v).toFixed(3)})` : "rgba(247, 244, 231, .12)"; g.fill(); if (on) { g.strokeStyle = "#FAA822"; g.lineWidth = 2; g.stroke(); }
        g.fillStyle = on ? "#3D1220" : "rgba(247, 244, 231, .85)"; g.font = `700 ${on ? 12 : 11}px Inter, system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(i), q.x, q.y + 0.5); });
      // rótulos
      g.fillStyle = "rgba(247, 244, 231, .75)"; g.font = `600 ${narrow ? 10.5 : 12}px Inter, system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "alphabetic";
      const ly = H - 6;
      g.fillText(narrow ? "entrada" : "entrada: 784 pixels", xs[0], ly); g.fillText(narrow ? "64 neurônios" : "camada oculta: 64", xs[1], ly); g.fillText(narrow ? "32" : "camada oculta: 32", xs[2], ly); g.fillText("saída", xs[3], ly);
    }
    const anim = () => { t = Math.min(1, t + 0.045); desenhar(); raf = t < 1 ? requestAnimationFrame(anim) : 0; };
    return {
      ajustar() { ajustar(); desenhar(); },
      mostrar(e, pulsar) { est = e; if (pulsar && !reduz()) { t = 0; if (!raf) raf = requestAnimationFrame(anim); } else { t = 1; desenhar(); } },
      limpar() { est = null; t = 1; desenhar(); },
    };
  }

  /* ---------------- modo 2: treine sua IA ---------------- */
  function rede2(nIn, nH, nOut) {
    let s = 42; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
    const mk = (a, b) => Float32Array.from({ length: a * b }, () => rnd() * 2 * Math.sqrt(2 / a));
    const P = { W1: mk(nIn, nH), b1: new Float32Array(nH), W2: mk(nH, nOut), b2: new Float32Array(nOut) };
    const M = {}, V = {}; Object.keys(P).forEach((k) => { M[k] = new Float32Array(P[k].length); V[k] = new Float32Array(P[k].length); });
    let passo = 0;
    function fwd(x) {
      const h = new Float32Array(nH); for (let j = 0; j < nH; j++) h[j] = P.b1[j];
      for (let i = 0; i < nIn; i++) { const xi = x[i]; if (!xi) continue; for (let j = 0; j < nH; j++) h[j] += xi * P.W1[i * nH + j]; }
      for (let j = 0; j < nH; j++) if (h[j] < 0) h[j] = 0;
      const z = new Float32Array(nOut); for (let k = 0; k < nOut; k++) z[k] = P.b2[k];
      for (let j = 0; j < nH; j++) for (let k = 0; k < nOut; k++) z[k] += h[j] * P.W2[j * nOut + k];
      return { h, p: softmax(z) };
    }
    function treinarLote(xs, ys, lr) {
      const G = {}; Object.keys(P).forEach((k) => (G[k] = new Float32Array(P[k].length)));
      let perda = 0, certos = 0;
      xs.forEach((x, n) => {
        const { h, p } = fwd(x), y = ys[n]; perda -= Math.log(Math.max(1e-9, p[y])); if (p.indexOf(Math.max(...p)) === y) certos++;
        const dz = p.map((v, k) => v - (k === y ? 1 : 0));
        for (let k = 0; k < nOut; k++) G.b2[k] += dz[k];
        const dh = new Float32Array(nH);
        for (let j = 0; j < nH; j++) { for (let k = 0; k < nOut; k++) { G.W2[j * nOut + k] += h[j] * dz[k]; dh[j] += P.W2[j * nOut + k] * dz[k]; } if (h[j] <= 0) dh[j] = 0; G.b1[j] += dh[j]; }
        for (let i = 0; i < nIn; i++) { const xi = x[i]; if (!xi) continue; for (let j = 0; j < nH; j++) G.W1[i * nH + j] += xi * dh[j]; }
      });
      passo++;
      Object.keys(P).forEach((k) => { const p = P[k], g = G[k], m = M[k], v = V[k]; for (let i = 0; i < p.length; i++) { const gi = g[i] / xs.length; m[i] = 0.9 * m[i] + 0.1 * gi; v[i] = 0.999 * v[i] + 0.001 * gi * gi; p[i] -= (lr * (m[i] / (1 - 0.9 ** passo))) / (Math.sqrt(v[i] / (1 - 0.999 ** passo)) + 1e-8); } });
      return { perda: perda / xs.length, acc: certos / xs.length };
    }
    return { fwd, treinarLote };
  }
  const reduzir14 = (v) => { const o = new Float32Array(196); for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const i = y * 2 * 28 + x * 2; o[y * 14 + x] = (v[i] + v[i + 1] + v[i + 28] + v[i + 29]) / 4; } return o; };
  const deslocar = (v, dx, dy) => { const o = new Float32Array(196); for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const X = x - dx, Y = y - dy; if (X >= 0 && Y >= 0 && X < 14 && Y < 14) o[y * 14 + x] = v[Y * 14 + X]; } return o; };
  const miniatura = (v) => { const c = document.createElement("canvas"); c.width = c.height = 28; const g = c.getContext("2d"); const id = g.createImageData(28, 28); for (let i = 0; i < 784; i++) { id.data[i * 4] = 84; id.data[i * 4 + 1] = 24; id.data[i * 4 + 2] = 34; id.data[i * 4 + 3] = Math.round(v[i] * 255); } g.putImageData(id, 0, 0); return c.toDataURL(); };

  /* ---------------- montagem ---------------- */
  function montar(box) {
    if (!NET) { box.innerHTML = `<p class="src-note">O laboratório não carregou (arquivo data/ia-lab.js ausente).</p>`; return; }
    box.innerHTML = `
<div class="lab-modos" role="group" aria-label="Modo do laboratório">
  <button type="button" class="lab-modo" data-modo="ver" aria-pressed="true"><span>1</span> Reconhecer números</button>
  <button type="button" class="lab-modo" data-modo="treinar" aria-pressed="false"><span>2</span> Treine sua IA</button>
</div>

<div class="lab-p" data-painel="ver">
  <div class="lab-g">
    <div class="lab-draw">
      <p class="lab-dica" id="lab-dica1">Desenhe um número de 0 a 9 bem grande.</p>
      <canvas class="lab-cv" width="280" height="280" role="img" aria-label="Área de desenho. Desenhe um número com o mouse ou o dedo, ou use o botão Exemplo pronto." aria-describedby="lab-dica1"></canvas>
      <div class="lab-acts"><button type="button" class="btn small" data-lab="limpar">Limpar</button><button type="button" class="btn small" data-lab="exemplo">Exemplo pronto</button></div>
    </div>
    <div class="lab-net"><canvas class="lab-viz" aria-hidden="true"></canvas></div>
    <div class="lab-res">
      <p class="lab-rk">A rede acha que é</p>
      <p class="lab-big"><b data-lab="pred">?</b><span data-lab="cert">desenhe para começar</span></p>
      <ol class="lab-bars" data-lab="bars" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<li><span class="lb-d">${i}</span><span class="lb-t"><i style="width:0"></i></span><span class="lb-v">0%</span></li>`).join("")}</ol>
      <p class="sr-only" aria-live="polite" data-lab="sr"></p>
    </div>
  </div>
  <ol class="lab-passos">
    <li><b>1. Entrada</b><span>Seu desenho vira uma grade de 28 × 28 = 784 números, um por pixel.</span></li>
    <li><b>2. Camadas ocultas</b><span>64 e depois 32 neurônios combinam os pixels com pesos aprendidos. Os dourados são os que “acenderam”.</span></li>
    <li><b>3. Saída</b><span>Dez neurônios dão a probabilidade de cada dígito. São 52 mil pesos aprendidos com 10 mil números escritos à mão.</span></li>
  </ol>
</div>

<div class="lab-p" data-painel="treinar" hidden>
  <p class="lab-intro">Como no Teachable Machine do Google: dê exemplos, treine e teste. <span class="lab-dica2">Ligue a câmera e <strong>segure o botão</strong> de cada classe para gravar exemplos (10 ou mais em cada). Treine e mostre para a câmera: o palpite aparece ao vivo.</span></p>
  <div class="lab-g2">
    <div class="lab-draw lab-fonte">
      <div class="lab-cam">
        <video class="lab-video" playsinline muted aria-label="Imagem da sua câmera"></video>
        <div class="lab-cam-off"><p class="lab-cam-msg">Sua imagem fica só no seu aparelho. Nada é enviado para a internet.</p><button type="button" class="btn primary small" data-lab="camera">Ligar a câmera</button></div>
        <span class="lab-rec" hidden>gravando</span>
      </div>
      <canvas class="lab-cv lab-cv2" width="280" height="280" role="img" aria-label="Área de desenho para ensinar a IA" aria-describedby="lab-st2" hidden></canvas>
      <div class="lab-acts"><button type="button" class="btn small" data-lab="limpar2" hidden>Limpar</button><button type="button" class="btn small" data-lab="fonte">Prefiro desenhar</button></div>
    </div>
    <div class="lab-classes">${["Mão aberta", "Joinha", "Só o fundo"].map((n, k) => `
      <div class="lab-cl" data-cl="${k}">
        <label class="sr-only" for="lab-nome${k}">Nome da classe ${k + 1}</label>
        <input id="lab-nome${k}" class="lab-nome" value="${n}" maxlength="18" autocomplete="off">
        <button type="button" class="btn small" data-add="${k}"><span class="lab-acao">Segure para gravar</span> <span class="lab-n">(0)</span></button>
        <div class="lab-thumbs" aria-hidden="true"></div>
        <div class="lab-prob" aria-hidden="true"><i style="width:0"></i><span>0%</span></div>
      </div>`).join("")}
    </div>
    <div class="lab-train">
      <button type="button" class="btn primary" data-lab="treinar" disabled>Treinar a IA</button>
      <canvas class="lab-loss" width="280" height="120" aria-hidden="true"></canvas>
      <p class="lab-st" id="lab-st2" aria-live="polite">Ligue a câmera para começar.</p>
      <button type="button" class="btn small" data-lab="reset2">Começar de novo</button>
    </div>
  </div>
  <ol class="lab-passos lab-passos2">
    <li><b>1. A câmera vira números</b><span>Uma rede pronta, a MobileNet, que já aprendeu a enxergar com mais de 1 milhão de fotos, resume cada quadro em 256 números.</span></li>
    <li><b>2. Sua rede aprende</b><span>Uma rede pequena, de 32 neurônios, aprende só a separar as suas classes. Reaproveitar o que outra IA já sabe se chama transferência de aprendizado.</span></li>
    <li><b>3. Tudo no seu aparelho</b><span>A imagem e o treino ficam no seu navegador. Nenhuma foto é enviada para a internet.</span></li>
  </ol>
  <p class="src-note">Dica: grave cada classe de jeitos um pouco diferentes (mais perto, mais longe, de lado). Quanto mais variados os exemplos, melhor a IA acerta.</p>
</div>`;

    // ---------- modo 1
    const viz = visual($(".lab-viz", box));
    const elPred = $('[data-lab="pred"]', box), elCert = $('[data-lab="cert"]', box), elSr = $('[data-lab="sr"]', box), bars = $$('[data-lab="bars"] li', box);
    let ultimo = -1;
    function atualizar(pulsar) {
      if (pad1.vazio()) { viz.limpar(); elPred.textContent = "?"; elCert.textContent = "desenhe para começar"; bars.forEach((li) => { li.querySelector("i").style.width = "0"; li.querySelector(".lb-v").textContent = "0%"; li.classList.remove("is-top"); }); return; }
      const e = prever(pad1.vetor()), best = e.p.indexOf(Math.max(...e.p));
      viz.mostrar(e, pulsar || best !== ultimo); ultimo = best;
      elPred.textContent = String(best); elCert.textContent = `com ${pct(e.p[best])} de certeza`;
      bars.forEach((li, i) => { li.querySelector("i").style.width = pct(e.p[i]); li.querySelector(".lb-v").textContent = pct(e.p[i]); li.classList.toggle("is-top", i === best); });
      return { best, p: e.p[best] };
    }
    const pad1 = prancheta($(".lab-cv", box), () => atualizar(false), () => { const r = atualizar(true); if (r) elSr.textContent = `A rede acha que é ${r.best}, com ${pct(r.p)} de certeza.`; });
    let exI = Math.floor(Math.random() * 20);
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lab]"); if (!b) return;
      const a = b.dataset.lab;
      if (a === "limpar") { pad1.limpar(); ultimo = -1; atualizar(); elSr.textContent = "Desenho apagado."; }
      if (a === "exemplo") { exI = (exI + 7) % 20; pad1.desenharVetor(EX.subarray(exI * 784, exI * 784 + 784)); const r = atualizar(true); elSr.textContent = `Exemplo carregado. A rede acha que é ${r.best}, com ${pct(r.p)} de certeza.`; }
      if (a === "limpar2") pad2.limpar();
      if (a === "treinar") treinar();
      if (a === "reset2") resetar2();
    });

    // ---------- modo 2: treine sua IA (câmera, com desenho como alternativa)
    const st = $(".lab-st", box), btT = $('[data-lab="treinar"]', box), loss = $(".lab-loss", box), lg = loss.getContext("2d");
    const camBox = $(".lab-cam", box), video = $(".lab-video", box), cv2 = $(".lab-cv2", box), btFonte = $('[data-lab="fonte"]', box), btLimpar2 = $('[data-lab="limpar2"]', box), rec = $(".lab-rec", box), btCam = $('[data-lab="camera"]', box), camMsg = $(".lab-cam-msg", box);
    const passos = $(".lab-passos2", box);
    let dados = [[], [], []], modelo = null, treinando = false, fonte = "cam", stream = null, extrator = null, ligando = false;
    const MIN = () => (fonte === "cam" ? 10 : 3), MAX = 80;
    const nomes = () => $$(".lab-nome", box).map((i) => i.value.trim() || "classe");

    // rede pronta (MobileNet) carregada só quando a pessoa liga a câmera
    const TF_URL = "https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.22.0/tf.min.js";
    const MN_URL = "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";
    let tfP = null, base = null;
    function carregarRede() {
      if (!tfP) tfP = new Promise((ok, er) => { if (window.tf) return ok(); const s = document.createElement("script"); s.src = TF_URL; s.async = true; s.onload = ok; s.onerror = er; document.head.append(s); })
        .then(() => tf.loadLayersModel(MN_URL))
        .then((m) => { base = tf.model({ inputs: m.inputs, outputs: m.getLayer("conv_pw_13_relu").output }); tf.tidy(() => base.predict(tf.zeros([1, 224, 224, 3]))); return "mobilenet"; })
        .catch(() => "pixels");
      return tfP;
    }
    const c224 = document.createElement("canvas"); c224.width = c224.height = 224; const x224 = c224.getContext("2d", { willReadFrequently: true });
    const c16 = document.createElement("canvas"); c16.width = c16.height = 16; const x16 = c16.getContext("2d", { willReadFrequently: true });
    function quadro() { const vw = video.videoWidth, vh = video.videoHeight, s = Math.min(vw, vh); x224.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, 224, 224); }
    function featCam() {
      quadro();
      if (extrator === "mobilenet") {
        const v = tf.tidy(() => base.predict(tf.browser.fromPixels(c224).toFloat().div(127.5).sub(1).expandDims()).mean([1, 2]).dataSync());
        let n = 0; for (let i = 0; i < v.length; i++) n += v[i] * v[i]; n = Math.sqrt(n) || 1;
        return Float32Array.from(v, (x) => (x / n) * 8);
      }
      x16.drawImage(c224, 0, 0, 16, 16); const d = x16.getImageData(0, 0, 16, 16).data, o = new Float32Array(768);
      for (let i = 0; i < 256; i++) for (let c = 0; c < 3; c++) o[i * 3 + c] = d[i * 4 + c] / 255 - 0.5;
      return o;
    }
    const tamEntrada = () => (fonte === "draw" ? 196 : extrator === "mobilenet" ? 256 : 768);
    function miniCam() { const c = document.createElement("canvas"); c.width = c.height = 40; const g = c.getContext("2d"); g.translate(40, 0); g.scale(-1, 1); g.drawImage(c224, 0, 0, 40, 40); return c.toDataURL("image/jpeg", 0.7); }

    async function ligarCamera() {
      if (stream || ligando) return; ligando = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camErro("Este navegador não liberou a câmera nesta página. Abra o site direto no navegador do celular ou do computador, ou use o desenho."); ligando = false; return; }
      btCam.disabled = true; camMsg.textContent = "Pedindo permissão para usar a câmera…";
      try {
        const [s, ex] = await Promise.all([navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 320 } }, audio: false }), carregarRede().then((r) => { camMsg.textContent = "Carregando a rede pronta…"; return r; })]);
        stream = s; extrator = ex; video.srcObject = s; await video.play().catch(() => {});
        camBox.classList.add("on"); passos.dataset.extrator = ex;
        if (ex !== "mobilenet") passos.querySelector("li span").textContent = "A rede pronta não carregou, então usamos o modo simples: cada quadro vira 768 números, as cores de uma miniatura de 16 × 16 pixels.";
        st.textContent = ex === "mobilenet" ? "Câmera ligada. Segure o botão de cada classe para gravar exemplos." : "Câmera ligada (modo simples, sem a rede pronta). Segure o botão de cada classe para gravar.";
        contar(); requestAnimationFrame(vivo);
      } catch (e) {
        const n = e && e.name;
        camErro(n === "NotAllowedError" ? "Você não liberou a câmera. Dá para liberar no cadeado ao lado do endereço do site, ou use o desenho." : n === "NotFoundError" || n === "OverconstrainedError" ? "Não encontrei uma câmera neste aparelho. Use o desenho." : "Não consegui abrir a câmera. Ela pode estar em uso por outro programa.");
      }
      ligando = false; btCam.disabled = false;
    }
    function camErro(t) { camMsg.textContent = t; st.textContent = t; btCam.textContent = "Tentar de novo"; }
    function desligarCamera() { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; video.srcObject = null; camBox.classList.remove("on"); camMsg.textContent = "Sua imagem fica só no seu aparelho. Nada é enviado para a internet."; btCam.textContent = "Ligar a câmera"; pararGravar(); }

    function contar() {
      const m = MIN();
      $$(".lab-cl", box).forEach((c, k) => { c.querySelector(".lab-n").textContent = `(${dados[k].length})`; });
      const ok = dados.every((d) => d.length >= m); btT.disabled = !ok || treinando;
      if (modelo || treinando) return;
      if (fonte === "cam" && !stream) { st.textContent = "Ligue a câmera para começar."; return; }
      st.textContent = ok ? "Pronto para treinar." : `Faltam exemplos: ${dados.map((d, k) => `${nomes()[k]} ${Math.max(0, m - d.length)}`).filter((x) => !/ 0$/.test(x)).join(", ")}.`;
    }
    function addThumb(k, src) { const t = $$(".lab-thumbs", box)[k], im = document.createElement("img"); im.src = src; im.alt = ""; t.append(im); while (t.children.length > 12) t.firstChild.remove(); }
    function adicionarCam(k) {
      if (!stream || !video.videoWidth || dados[k].length >= MAX) return false;
      if (modelo) { modelo = null; btT.textContent = "Treinar de novo"; }
      dados[k].push(featCam()); addThumb(k, miniCam()); contar(); return true;
    }

    // gravar: segurar o botão (mouse/dedo); pelo teclado, cada clique grava 5 quadros
    let gravando = null;
    function gravar(k, b) {
      if (fonte !== "cam") return; if (!stream) { st.textContent = "Ligue a câmera primeiro."; return; }
      pararGravar(); let ult = 0;
      gravando = { b, raf: 0 }; b.classList.add("gravando"); camBox.classList.add("gravando"); rec.hidden = false;
      const passo = (t) => { if (!gravando) return; if (t - ult > 90) { ult = t; adicionarCam(k); st.textContent = `Gravando ${nomes()[k]}… ${dados[k].length} exemplos${dados[k].length >= MAX ? " (máximo)" : ""}`; } gravando.raf = requestAnimationFrame(passo); };
      gravando.raf = requestAnimationFrame(passo);
    }
    function pararGravar() { if (!gravando) return; cancelAnimationFrame(gravando.raf); gravando.b.classList.remove("gravando"); gravando = null; camBox.classList.remove("gravando"); rec.hidden = true; contar(); }
    $$("[data-add]", box).forEach((b) => {
      b.addEventListener("pointerdown", (e) => { if (fonte !== "cam" || e.button > 0) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} gravar(+b.dataset.add, b); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => b.addEventListener(ev, pararGravar));
      b.addEventListener("contextmenu", (e) => { if (fonte === "cam") e.preventDefault(); });
      b.addEventListener("click", (e) => {
        const k = +b.dataset.add;
        if (fonte === "cam") { if (e.detail === 0) { if (!stream) { st.textContent = "Ligue a câmera primeiro."; return; } for (let i = 0; i < 5; i++) adicionarCam(k); st.textContent = `${nomes()[k]}: ${dados[k].length} exemplos.`; } return; }
        if (pad2.vazio()) { st.textContent = "Desenhe algo antes de adicionar."; return; }
        const v = pad2.vetor(); dados[k].push(reduzir14(v)); addThumb(k, miniatura(v)); pad2.limpar(); contar();
      });
    });

    const pad2 = prancheta(cv2, () => { if (modelo && !treinando) testar(); }, () => { if (modelo && !treinando) { const r = testar(); st.textContent = `A IA acha que é ${nomes()[r.k]} (${pct(r.p)}).`; } });
    function barras(p) { const k = p.indexOf(Math.max(...p)); $$(".lab-cl", box).forEach((c, i) => { c.querySelector(".lab-prob i").style.width = pct(p[i]); c.querySelector(".lab-prob span").textContent = pct(p[i]); c.classList.toggle("is-top", i === k); }); return { k, p: p[k] }; }
    function testar() { return barras(modelo.fwd(reduzir14(pad2.vetor())).p); }
    let ultT = 0, ultK = -1;
    function vivo(t) {
      if (!stream) return; requestAnimationFrame(vivo);
      if (!modelo || treinando || gravando || fonte !== "cam" || t - ultT < 110 || !video.videoWidth) return; ultT = t;
      const r = barras(modelo.fwd(featCam()).p);
      if (r.k !== ultK) { ultK = r.k; st.textContent = `Ao vivo: a IA acha que é ${nomes()[r.k]}.`; }
    }

    function curva(hist) {
      const W = loss.width, H = loss.height; lg.clearRect(0, 0, W, H); lg.strokeStyle = "rgba(247,244,231,.15)"; lg.beginPath(); lg.moveTo(0, H - 0.5); lg.lineTo(W, H - 0.5); lg.stroke();
      if (!hist.length) return; const mx = Math.max(...hist.map((h) => h.perda), 0.01);
      lg.strokeStyle = "#FAA822"; lg.lineWidth = 2; lg.beginPath(); hist.forEach((h, i) => { const x = (i / 119) * W, y = H - 6 - (h.perda / mx) * (H - 14); i ? lg.lineTo(x, y) : lg.moveTo(x, y); }); lg.stroke();
      lg.fillStyle = "rgba(247,244,231,.8)"; lg.font = "600 11px Inter, system-ui"; lg.fillText("erro durante o treino", 6, 14);
    }
    const ruido = (v, a) => Float32Array.from(v, (x) => x + (Math.random() - 0.5) * a);
    function treinar() {
      pararGravar(); treinando = true; btT.disabled = true; ultK = -1; modelo = rede2(tamEntrada(), 32, 3);
      const xs = [], ys = []; dados.forEach((d, k) => d.forEach((v) => { xs.push(v); ys.push(k); }));
      const aum = fonte === "draw" ? (v) => deslocar(v, Math.round(Math.random() * 2 - 1), Math.round(Math.random() * 2 - 1)) : (v) => ruido(v, extrator === "mobilenet" ? 0.25 : 0.06);
      const hist = []; let ep = 0;
      const rodada = () => {
        for (let r = 0; r < (reduz() ? 120 : 2); r++) { hist.push(modelo.treinarLote(xs.map(aum), ys, 0.01)); ep++; if (ep >= 120) break; }
        curva(hist); const h = hist[hist.length - 1];
        st.textContent = `Treinando… época ${ep} de 120 · acerto nos exemplos ${pct(h.acc)}`;
        if (ep < 120) requestAnimationFrame(rodada);
        else { treinando = false; contar(); btT.textContent = "Treinar de novo"; btT.disabled = false; st.textContent = fonte === "cam" ? `Pronto! Acerto nos exemplos: ${pct(h.acc)}. Agora mostre para a câmera e veja o palpite ao vivo.` : `Pronto! Acerto nos exemplos: ${pct(h.acc)}. Agora desenhe uma forma e veja o palpite da IA.`; if (fonte === "draw") pad2.limpar(); }
      };
      requestAnimationFrame(rodada);
    }
    function resetar2() { pararGravar(); dados = [[], [], []]; modelo = null; ultK = -1; $$(".lab-thumbs", box).forEach((t) => (t.innerHTML = "")); barras([0, 0, 0]); $$(".lab-cl", box).forEach((c) => c.classList.remove("is-top")); btT.textContent = "Treinar a IA"; pad2.limpar(); curva([]); contar(); }
    function trocarFonte(f) {
      fonte = f; const cam = f === "cam";
      camBox.hidden = !cam; cv2.hidden = cam; btLimpar2.hidden = cam;
      btFonte.textContent = cam ? "Prefiro desenhar" : "Usar a câmera";
      $$("[data-add]", box).forEach((b) => (b.querySelector(".lab-acao").textContent = cam ? "Segure para gravar" : "+ Adicionar exemplo"));
      const pad = cam ? ["Mão aberta", "Joinha", "Só o fundo"] : ["Círculo", "Triângulo", "Raio"];
      $$(".lab-nome", box).forEach((i, k) => (i.value = pad[k]));
      passos.hidden = !cam; $(".lab-dica2", box).innerHTML = cam ? "Ligue a câmera e <strong>segure o botão</strong> de cada classe para gravar exemplos (10 ou mais em cada). Treine e mostre para a câmera: o palpite aparece ao vivo." : "Desenhe uma forma e clique na classe certa. Com <strong>3 exemplos ou mais</strong> em cada uma, o botão Treinar libera.";
      if (!cam) desligarCamera();
      resetar2();
    }
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-lab]"); if (!b) return; if (b.dataset.lab === "camera") ligarCamera(); if (b.dataset.lab === "fonte") trocarFonte(fonte === "cam" ? "draw" : "cam"); });
    $$(".lab-nome", box).forEach((i) => i.addEventListener("input", () => { if (!modelo) contar(); }));
    document.addEventListener("visibilitychange", () => { if (document.hidden) desligarCamera(); });
    addEventListener("aba:mudou", desligarCamera);
    box._lab = { get dados() { return dados; }, get extrator() { return extrator; }, get modelo() { return modelo; }, ligarCamera, desligarCamera, adicionarCam, treinar, video, carregarRede };
    contar(); curva([]);

    // ---------- alternância de modos
    $$(".lab-modo", box).forEach((b) => b.addEventListener("click", () => {
      $$(".lab-modo", box).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$(".lab-p", box).forEach((p) => (p.hidden = p.dataset.painel !== b.dataset.modo));
      if (b.dataset.modo === "ver") { desligarCamera(); requestAnimationFrame(() => viz.ajustar()); }
    }));
    const ro = "ResizeObserver" in window ? new ResizeObserver(() => viz.ajustar()) : null;
    if (ro) ro.observe($(".lab-net", box)); else addEventListener("resize", () => viz.ajustar());
    viz.ajustar();
    // abre com um exemplo para a área não ficar vazia
    pad1.desenharVetor(EX.subarray(exI * 784, exI * 784 + 784)); atualizar(false);
  }

  function iniciar() { $$("[data-lab-app]").forEach((b) => { if (!b.dataset.ok) { b.dataset.ok = "1"; montar(b); } }); }
  addEventListener("conteudo:pronto", iniciar);
  if (document.readyState !== "loading") iniciar(); else document.addEventListener("DOMContentLoaded", iniciar);
})();

