
/* Abertura dividida da página inicial.
   Metade Ciência de Dados: feixe de pixels com "pacotes de dados" subindo, como no topo do curso.
   Metade Inteligência Artificial: camadas de uma rede neural em pixels, com sinais atravessando da esquerda para a direita.
   O divisor acompanha o mouse (o lado apontado cresce) e o cursor acende os pixels por onde passa.
   Roda a ~30 quadros/s, só quando a abertura está visível, e fica parada com "reduzir movimento". */
(function () {
  "use strict";
  const reduz = matchMedia("(prefers-reduced-motion: reduce)");
  const OURO = "250, 168, 34", CREME = "246, 244, 231", ROSA = "236, 120, 140";

  function iniciar(sec) {
    if (sec.dataset.sp) return; sec.dataset.sp = "1";
    const cv = sec.querySelector(".sp-cv"), g = cv.getContext("2d");
    let W = 0, H = 0, cel = 12, cols = 0, rows = 0, vert = false;
    let cd = [], ia = [], pac = [], sinais = [], camadas = [], rastro = [];
    const toqueSo = matchMedia("(hover: none)").matches; const BASE = toqueSo ? 0.55 : 0.1;
    let iCD = BASE, iIA = BASE, split = 0.5, alvo = 0.5, lado = null, mx = -1e4, my = -1e4, raf = 0, vis = false, ult = 0;
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

    function tam() {
      const r = sec.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; vert = W < 760;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cel = Math.max(10, Math.round(Math.min(W, 1400) / 72)); cols = Math.ceil(W / cel); rows = Math.ceil(H / cel);
      s = 11; cd = []; ia = []; camadas = [];
      // região de cada curso, em células (no celular: CD em cima, IA embaixo)
      const cam = sec.querySelector(".sp-caminho"), fundo = cam ? Math.floor((cam.offsetTop - 8) / cel) : Math.floor(rows * 0.7);
      const regCD = vert ? { x0: 0, x1: cols, y0: 0, y1: Math.floor(fundo * 0.5) } : { x0: 0, x1: Math.floor(cols / 2), y0: 0, y1: fundo };
      const regIA = vert ? { x0: 0, x1: cols, y0: Math.floor(fundo * 0.5), y1: fundo } : { x0: Math.ceil(cols / 2), x1: cols, y0: 0, y1: fundo };
      // CD: feixe que se abre para baixo, encostado no divisor
      const fx = vert ? cols * 0.78 : regCD.x1 - Math.max(3, cols * 0.08);
      for (let y = regCD.y0; y < regCD.y1; y++) {
        const t = (y - regCD.y0) / (regCD.y1 - regCD.y0), abre = 1.4 + t * t * (vert ? 5 : 9);
        for (let x = regCD.x0; x < regCD.x1; x++) {
          const d = Math.abs(x - fx) / abre, p = Math.exp(-d * d) * (1 - t * 0.7);
          if (rnd() > p * 0.95) continue;
          cd.push({ x, y, p, f: rnd() * 6.28, v: 0.6 + rnd() * 1.8 });
        }
      }
      // IA: 5 camadas de neurônios; a primeira encosta no divisor
      const nC = vert ? 5 : 5, larg = regIA.x1 - regIA.x0, alt = regIA.y1 - regIA.y0;
      const qtd = [7, 9, 9, 6, 3];
      for (let c = 0; c < nC; c++) {
        const x = vert ? Math.round(regIA.x0 + larg * (0.12 + c * 0.19)) : Math.round(regIA.x0 + Math.max(3, cols * 0.06) + c * (larg * 0.15));
        const n = vert ? Math.max(2, qtd[c] - 3) : qtd[c], ys = [];
        for (let k = 0; k < n; k++) ys.push(Math.round(regIA.y0 + alt * (0.14 + (0.72 * (k + 0.5)) / n)));
        camadas.push({ x, ys });
        ys.forEach((y) => ia.push({ x, y, p: 0.9, f: rnd() * 6.28, v: 0.8 + rnd(), no: true }));
      }
      for (let k = 0; k < (vert ? 24 : 60); k++) { // poeira de pixels em volta das camadas
        const x = regIA.x0 + Math.floor(rnd() * larg * 0.85), y = regIA.y0 + Math.floor(rnd() * alt);
        ia.push({ x, y, p: 0.18 + rnd() * 0.22, f: rnd() * 6.28, v: 0.5 + rnd() * 1.5 });
      }
      pac = Array.from({ length: vert ? 5 : 10 }, () => novoPac(true, fx, regCD));
      sinais = Array.from({ length: vert ? 4 : 8 }, () => novoSinal(true));
      quadro(performance.now(), true);
    }
    function novoPac(inicio, fx, reg) {
      return { c: Math.round(fx + (rnd() - 0.5) * (vert ? 6 : 10)), y: inicio ? reg.y0 + rnd() * (reg.y1 - reg.y0) : reg.y1 + 2, v: 3 + rnd() * 7, n: 3 + Math.floor(rnd() * 5), reg, fx };
    }
    function novoSinal(inicio) {
      const c = Math.floor(rnd() * (camadas.length - 1));
      return { c, a: camadas[c].ys[Math.floor(rnd() * camadas[c].ys.length)], b: camadas[c + 1].ys[Math.floor(rnd() * camadas[c + 1].ys.length)], t: inicio ? rnd() : 0, v: 0.8 + rnd() * 1.2 };
    }
    function px(x, y, cor, a, brilho) {
      if (a <= 0.02) return;
      const pad = cel * 0.12;
      g.fillStyle = `rgba(${cor}, ${Math.min(0.95, a).toFixed(3)})`;
      if (brilho) { g.shadowColor = `rgba(${cor}, .9)`; g.shadowBlur = 12; } else g.shadowBlur = 0;
      g.fillRect(x * cel + pad, y * cel + pad, cel - pad * 2, cel - pad * 2);
    }

    function quadro(t, parado) {
      const k = t / 1000, dt = Math.min(0.1, (t - ult) / 1000 || 0.033); ult = t;
      split += (alvo - split) * Math.min(1, dt * 6);
      const e = Math.min(1, dt * 4);
      iCD += ((lado === "cd" ? 1 : BASE) - iCD) * e; iIA += ((lado === "ia" ? 1 : BASE) - iIA) * e;
      if (!vert) sec.style.setProperty("--sp", split.toFixed(4));
      g.clearRect(0, 0, W, H);
      // o lado em destaque brilha mais; o deslocamento do divisor empurra cada metade
      const forCD = iCD, forIA = iIA;
      const desl = vert ? 0 : Math.round((split - 0.5) * cols);
      const mcx = mx / cel, mcy = my / cel, R = 7;
      for (const c of cd) {
        const x = c.x + desl;
        let a = c.p * (0.6 + 0.4 * forCD * Math.sin(k * c.v + c.f));
        const d = Math.hypot(x - mcx, c.y - mcy); void d;
        px(x, c.y, OURO, a * 0.85 * forCD, false);
      }
      // ligações entre as camadas da rede
      g.lineWidth = 1;
      for (let c = 0; c < camadas.length - 1; c++) {
        const A = camadas[c], B = camadas[c + 1];
        for (const ya of A.ys) for (const yb of B.ys) {
          const ax = (A.x + desl + 0.5) * cel, bx = (B.x + desl + 0.5) * cel, ay = (ya + 0.5) * cel, by = (yb + 0.5) * cel;
          g.strokeStyle = `rgba(${CREME}, ${(0.09 * forIA).toFixed(3)})`;
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
        }
      }
      for (const c of ia) {
        const x = c.x + desl;
        let a = c.p * (c.no ? 0.55 + 0.45 * Math.sin(k * c.v + c.f) : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(k * c.v + c.f)));
        const d = Math.hypot(x - mcx, c.y - mcy); void d;
        if (c.no) { const s2 = cel * 0.5; g.fillStyle = `rgba(${CREME}, ${Math.min(0.95, a * forIA).toFixed(3)})`; g.shadowBlur = 0; g.fillRect((x + 0.5) * cel - s2 * 0.9, (c.y + 0.5) * cel - s2 * 0.9, s2 * 1.8, s2 * 1.8); }
        else px(x, c.y, ROSA, a * 0.8 * forIA, false);
      }
      g.shadowBlur = 0;
      if (!parado && (iCD > 0.2 || iIA > 0.2)) {
        // CD: pacotes de dados subindo pelo feixe
        pac.forEach((q, i) => {
          q.y -= q.v * dt;
          for (let n = 0; n < q.n; n++) px(q.c + desl, Math.floor(q.y) + n, OURO, (1 - n / q.n) * 0.95 * forCD, n === 0);
          if (q.y + q.n < q.reg.y0) pac[i] = novoPac(false, q.fx, q.reg);
        });
        // IA: sinais viajando de uma camada para a próxima
        sinais.forEach((q, i) => {
          q.t += q.v * dt;
          const A = camadas[q.c], B = camadas[q.c + 1];
          const x = Math.round(A.x + (B.x - A.x) * q.t) + desl, y = Math.round(q.a + (q.b - q.a) * q.t);
          for (let n = 0; n < 3; n++) { const tt = q.t - n * 0.06; if (tt < 0) continue; px(Math.round(A.x + (B.x - A.x) * tt) + desl, Math.round(q.a + (q.b - q.a) * tt), n ? OURO : CREME, (1 - n / 3) * 0.95 * forIA, n === 0); }
          if (q.t >= 1) { px(B.x + desl, q.b, OURO, forIA, true); sinais[i] = novoSinal(false); }
          void x; void y;
        });
        g.shadowBlur = 0;
        rastro = rastro.filter((r) => (r.a -= dt * 1.6) > 0);
        rastro.forEach((r) => px(r.x, r.y, r.cor, r.a * 0.7 * (r.cor === OURO ? iCD : iIA), r.a > 0.8));
      }
      g.shadowBlur = 0;
    }
    const loop = (t) => {
      raf = 0;
      if (reduz.matches || !vis || document.hidden) return;
      if (t - ult >= 30) quadro(t, false);
      const calmo = !lado && Math.abs(iCD - BASE) < 0.01 && Math.abs(iIA - BASE) < 0.01 && Math.abs(split - alvo) < 0.001 && !rastro.length && !toqueSo;
      if (calmo) { quadro(t, true); return; }
      raf = requestAnimationFrame(loop);
    };
    const ligar = () => { if (!raf && vis && !reduz.matches) raf = requestAnimationFrame(loop); };

    function escolher(l) {
      lado = l; sec.classList.toggle("is-cd", l === "cd"); sec.classList.toggle("is-ia", l === "ia");
      alvo = l === "cd" ? 0.54 : l === "ia" ? 0.46 : 0.5;
      if (reduz.matches) { split = alvo; iCD = l === "cd" ? 1 : BASE; iIA = l === "ia" ? 1 : BASE; quadro(performance.now(), true); } else ligar();
    }
    sec.addEventListener("pointermove", (e) => {
      const r = sec.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
      const el = e.target.closest(".sp-lado"); if (e.pointerType === "mouse") escolher(el ? el.dataset.lado : null);
      // sem rastro de pixels seguindo o cursor: só o lado apontado acende
    }, { passive: true });
    sec.addEventListener("pointerleave", () => { mx = my = -1e4; escolher(null); });
    sec.addEventListener("focusin", (e) => { const el = e.target.closest(".sp-lado"); if (el) escolher(el.dataset.lado); });
    sec.addEventListener("focusout", () => escolher(null));
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) ligar(); }).observe(sec); else vis = true;
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (sec.offsetParent) { tam(); ligar(); } }, 200); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ligar(); });
    reduz.addEventListener("change", () => { quadro(performance.now(), true); ligar(); });
    tam(); ligar();
  }

  function procurar() { document.querySelectorAll(".sp").forEach((sec) => { if (sec.offsetParent) iniciar(sec); }); }
  addEventListener("conteudo:pronto", procurar);
  addEventListener("aba:mudou", () => setTimeout(procurar, 50));
  if (document.readyState !== "loading") procurar(); else document.addEventListener("DOMContentLoaded", procurar);
  const alvoAba = document.getElementById("aba-inicio");
  if (alvoAba) new MutationObserver(procurar).observe(alvoAba, { childList: true });
})();

/* Grafo animado (o mesmo da antiga abertura) como fundo das seções claras das abas dos cursos. */
(function () {
  "use strict";
  const SEL = "#aba-cd section.block:not(.escuro):not(.cta-band), #aba-ia section.block:not(.escuro):not(.cta-band)";
  function colocar() {
    let novo = false;
    document.querySelectorAll(SEL).forEach((sec) => {
      if (sec.querySelector(":scope > canvas.in-net")) return;
      sec.classList.add("com-grafo");
      sec.insertAdjacentHTML("afterbegin", '<canvas class="in-net" aria-hidden="true"></canvas>');
      novo = true;
    });
    // pede ao site para ligar os grafos recém-colocados (só quando houve novidade, para não entrar em laço)
    if (novo) requestAnimationFrame(() => dispatchEvent(new CustomEvent("conteudo:pronto")));
  }
  addEventListener("conteudo:pronto", colocar);
  addEventListener("aba:mudou", () => setTimeout(colocar, 30));
  if (document.readyState !== "loading") colocar(); else document.addEventListener("DOMContentLoaded", colocar);
})();

