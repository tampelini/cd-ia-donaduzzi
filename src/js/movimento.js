
/* Camada de movimento: tudo aqui é decorativo e opcional.
   - Só liga com JavaScript ativo e quando a pessoa NÃO pediu menos movimento (prefers-reduced-motion).
   - Nenhum conteúdo depende dela: sem este arquivo, a página fica igual, só que parada. */
(function () {
  "use strict";
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let ativo = !mq.matches;

  /* ---------- 1. revelação ao rolar (com escalonamento) ---------- */
  const ALVOS = [
    ".in-h2", ".in-sub", ".in-k", ".tl-steps li", ".mosaic figure", ".in-case", ".in-nums li", ".in-card",
    ".pais li", ".in-pais-fig", ".cta-box", ".big-h", ".sec-lede", ".faz", ".galeria figure", ".cars .car",
    ".pq", ".perto-in", ".exit", ".kpi", ".sal-card", ".chart", ".section-head", ".marquee",
  ].join(",");
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function marcar(raiz) {
    if (!ativo || !io) return;
    $$(ALVOS, raiz || document).forEach((el) => {
      if (el.dataset.rv) return;
      el.dataset.rv = "1";
      const irmaos = el.parentElement ? Array.from(el.parentElement.children).filter((x) => x.matches(ALVOS)) : [];
      el.style.setProperty("--rv-i", Math.min(irmaos.indexOf(el), 6));
      io.observe(el);
    });
  }

  /* ---------- 2. números que contam até o valor real ---------- */
  const fmtInt = new Intl.NumberFormat("pt-BR");
  const cio = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (!e.isIntersecting) return; cio.unobserve(e.target); contar(e.target); });
  }, { threshold: 0.6 }) : null;
  function contar(el) {
    const txt = el.textContent.trim();
    const m = txt.match(/^(\D*)([\d.]+)(\D*)$/); if (!m) return;
    const alvo = Number(m[2].replace(/\./g, "")); if (!isFinite(alvo) || alvo < 2) return;
    const t0 = performance.now(), dur = Math.min(1400, 600 + alvo / 8);
    el.classList.add("is-counting");
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + fmtInt.format(Math.round(alvo * ease)) + m[3];
      if (p < 1 && el.isConnected) requestAnimationFrame(passo); else { el.textContent = txt; el.classList.remove("is-counting"); }
    };
    requestAnimationFrame(passo);
  }
  function marcarContadores(raiz) {
    if (!ativo || !cio) return;
    $$(".in-proof b, .in-nums b, .hx-facts .pv, .in-badge b", raiz || document).forEach((el) => {
      if (el.dataset.cnt) return; el.dataset.cnt = "1"; cio.observe(el);
    });
  }

  /* ---------- 3. rede de dados animada no topo da página inicial ---------- */
  const redes = new Map();
  function rede(cv) {
    if (redes.has(cv)) return redes.get(cv);
    const g = cv.getContext("2d"); let W = 0, H = 0, pts = [], raf = 0, visivel = true, mx = -1e4, my = -1e4;
    const tam = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, Math.max(24, (W * H) / 16000)));
      let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      pts = Array.from({ length: n }, () => ({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 0.25, vy: (rnd() - 0.5) * 0.25, r: 1.2 + rnd() * 2.2, ouro: rnd() > 0.55 }));
    };
    const quadro = () => {
      g.clearRect(0, 0, W, H);
      const lig = Math.min(150, W / 7);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (ativo) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < lig) { g.strokeStyle = `rgba(158, 34, 56, ${(0.16 * (1 - d / lig)).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
        }
        const dm = Math.hypot(a.x - mx, a.y - my), perto = dm < 120;
        g.fillStyle = a.ouro ? `rgba(240, 150, 20, ${perto ? 0.9 : 0.55})` : `rgba(158, 34, 56, ${perto ? 0.85 : 0.4})`;
        g.beginPath(); g.arc(a.x, a.y, a.r + (perto ? 1.5 : 0), 0, Math.PI * 2); g.fill();
        if (perto) { g.strokeStyle = `rgba(158, 34, 56, ${(0.35 * (1 - dm / 120)).toFixed(3)})`; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(mx, my); g.stroke(); }
      }
    };
    const loop = () => { quadro(); raf = ativo && visivel && !document.hidden ? requestAnimationFrame(loop) : 0; };
    const ligar = () => { if (!raf && ativo && visivel) raf = requestAnimationFrame(loop); };
    const host = cv.parentElement;
    host.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    host.addEventListener("pointerleave", () => { mx = my = -1e4; });
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) ligar(); }).observe(cv);
    const api = { tam: () => { tam(); quadro(); ligar(); }, ligar };
    redes.set(cv, api); api.tam();
    return api;
  }

  /* ---------- 4. campo de pixels animado no topo dos cursos ----------
     Cada quadradinho pisca no seu ritmo, "pacotes de dados" sobem pelas colunas do feixe
     e o cursor acende os pixels por onde passa. Roda a ~30 quadros/s e para fora da tela. */
  const campos = new Map();
  function campo(cv) {
    if (campos.has(cv)) return campos.get(cv);
    const g = cv.getContext("2d"), host = cv.closest(".hx"), ia = !!(host && host.id === "ia");
    let W = 0, H = 0, cel = 12, cols = 0, rows = 0, cx = 0, cels = [], pac = [], raf = 0, vis = false, ult = 0, mx = -1e4, my = -1e4, rastro = [];
    let s = ia ? 99 : 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const tam = () => {
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cel = Math.max(10, Math.round(Math.min(W, 1400) / 64)); cols = Math.ceil(W / cel); rows = Math.ceil(H / cel);
      cx = cols * (W < 720 ? 0.8 : 0.74); cels = [];
      for (let y = 0; y < rows; y++) {
        const t = y / rows, abre = 1.4 + t * t * (W < 720 ? 6 : 10);
        for (let x = 0; x < cols; x++) {
          const d = Math.abs(x - cx) / abre, p = Math.exp(-d * d) * (1 - t * 0.8);
          if (rnd() > p * 0.95) continue;
          cels.push({ x, y, p, f: rnd() * 6.28, v: 0.6 + rnd() * 1.8 });
        }
      }
      pac = Array.from({ length: W < 720 ? 6 : 12 }, () => novoPac(true));
    };
    const novoPac = (inicio) => ({ c: Math.round(cx + (rnd() - 0.5) * (W < 720 ? 8 : 12)), y: inicio ? rnd() * rows : rows + 2, v: 3 + rnd() * 7, n: 3 + Math.floor(rnd() * 5) });
    const px = (x, y, a, brilho) => {
      if (a <= 0.02) return;
      const pad = cel * 0.12;
      g.fillStyle = `rgba(250, 168, 34, ${Math.min(0.95, a).toFixed(3)})`;
      if (brilho) { g.shadowColor = "rgba(250, 168, 34, .9)"; g.shadowBlur = 12; } else g.shadowBlur = 0;
      g.fillRect(x * cel + pad, y * cel + pad, cel - pad * 2, cel - pad * 2);
    };
    const quadro = (t) => {
      const k = t / 1000, dt = Math.min(0.1, (t - ult) / 1000 || 0.033); ult = t;
      g.clearRect(0, 0, W, H);
      const mcx = mx / cel, mcy = my / cel, R = 7;
      for (const c of cels) {
        let a = c.p * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(k * c.v + c.f)));
        if (ia) a *= 0.7 + 0.3 * Math.sin(k * 1.4 - c.y * 0.25); // na IA, ondas descendo pelo feixe
        const d = Math.hypot(c.x - mcx, c.y - mcy); if (d < R) a += (1 - d / R) * 0.6;
        px(c.x, c.y, a * 0.85, false);
      }
      // pacotes de dados subindo
      g.shadowBlur = 0;
      pac.forEach((q, i) => {
        q.y -= q.v * dt;
        for (let n = 0; n < q.n; n++) px(q.c, Math.floor(q.y) + n, (1 - n / q.n) * 0.95, n === 0);
        if (q.y + q.n < 0) pac[i] = novoPac(false);
      });
      // rastro do cursor: pixels que acendem e apagam onde o mouse passou
      g.shadowBlur = 0;
      rastro = rastro.filter((r) => (r.a -= dt * 1.6) > 0);
      rastro.forEach((r) => px(r.x, r.y, r.a * 0.7, r.a > 0.8));
    };
    const loop = (t) => {
      raf = 0;
      if (!ativo || !vis || document.hidden) return;
      if (t - ult >= 30) quadro(t);
      raf = requestAnimationFrame(loop);
    };
    const ligar = () => { if (!raf && ativo && vis) raf = requestAnimationFrame(loop); };
    if (host) {
      host.addEventListener("pointermove", (e) => {
        const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
        const x = Math.floor(mx / cel), y = Math.floor(my / cel);
        if (!rastro.length || rastro[rastro.length - 1].x !== x || rastro[rastro.length - 1].y !== y) { rastro.push({ x, y, a: 1 }); if (rastro.length > 40) rastro.shift(); }
      }, { passive: true });
      host.addEventListener("pointerleave", () => { mx = my = -1e4; });
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) ligar(); }).observe(cv);
    const api = { tam: () => { tam(); ligar(); }, ligar };
    cv.dataset.anim = "1"; campos.set(cv, api); api.tam();
    return api;
  }
  function animarFeixes() {
    if (!ativo) return;
    $$("canvas.hx-beam").forEach((c) => { if (c.offsetParent) campo(c).tam(); });
  }

  /* ---------- 4b. efeitos ao passar o mouse ---------- */
  const LUZ = ".in-card, .faz, .tl-steps li, .pq, .car, .px-a, .in-pills a, .lab-draw, .lab-net, .lab-res, .lab-cl, .kpi, .sal-card, .chart, .job, .exit, .in-nums li, .in-case, .perto-in, .qz-q, .faq details, .boletim";
  let luzAtual = null;
  document.addEventListener("pointermove", (e) => {
    if (!ativo || e.pointerType !== "mouse") return;
    const el = e.target.closest && e.target.closest(LUZ);
    if (luzAtual && luzAtual !== el) luzAtual.classList.remove("hv");
    luzAtual = el;
    if (el) { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`); el.classList.add("hv"); }
    // botões "magnéticos": o botão principal acompanha levemente o cursor
    const b = e.target.closest && e.target.closest(".btn.primary, .px-a");
    $$(".is-mag").forEach((x) => { if (x !== b) { x.classList.remove("is-mag"); x.style.translate = ""; } });
    if (b && b.matches(".btn.primary")) { const r = b.getBoundingClientRect(); b.classList.add("is-mag"); b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`; }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { if (luzAtual) luzAtual.classList.remove("hv"); }, { passive: true });

  /* ---------- 5. foto do topo com inclinação 3D e holofote nas faixas escuras ---------- */
  function inclinar(raiz) {
    if (!ativo || !finePointer.matches) return;
    $$(".in-hero-fig", raiz).forEach((f) => {
      if (f.dataset.tilt) return; f.dataset.tilt = "1";
      f.addEventListener("pointermove", (e) => {
        const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        f.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`); f.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      });
      f.addEventListener("pointerleave", () => { f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg"); });
    });
    $$(".escuro, .hx, .cta-box", raiz).forEach((s) => {
      if (s.dataset.spot) return; s.dataset.spot = "1";
      s.addEventListener("pointermove", (e) => { const r = s.getBoundingClientRect(); s.style.setProperty("--mx", `${e.clientX - r.left}px`); s.style.setProperty("--my", `${e.clientY - r.top}px`); s.classList.add("has-spot"); }, { passive: true });
      s.addEventListener("pointerleave", () => s.classList.remove("has-spot"));
    });
  }

  /* ---------- 6. faixa de tecnologias com botão de pausa (WCAG 2.2.2) ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-marquee-toggle]"); if (!b) return;
    const m = b.closest(".marquee"); const parado = m.classList.toggle("is-paused");
    b.setAttribute("aria-pressed", String(parado)); b.querySelector(".mq-l").textContent = parado ? "Continuar animação" : "Pausar animação";
  });

  /* ---------- orquestração ---------- */
  function tudo(raiz) {
    document.documentElement.classList.toggle("mv-on", ativo);
    marcar(raiz); marcarContadores(raiz); inclinar(raiz);
    $$("canvas.in-net", raiz).forEach((c) => { if (c.offsetParent) rede(c).tam(); });
    animarFeixes();
  }
  window.addEventListener("conteudo:pronto", () => tudo(document));
  window.addEventListener("aba:mudou", (e) => {
    const p = document.getElementById("aba-" + (e.detail && e.detail.aba));
    if (p && ativo) { p.classList.remove("aba-in"); void p.offsetWidth; p.classList.add("aba-in"); }
    tudo(p || document);
  });
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { redes.forEach((api, c) => c.offsetParent && api.tam()); campos.forEach((api, c) => c.offsetParent && api.tam()); }, 200); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { redes.forEach((api) => api.ligar()); campos.forEach((api) => api.ligar()); } });
  mq.addEventListener("change", () => { ativo = !mq.matches; if (!ativo) $$("[data-rv]").forEach((el) => el.classList.add("is-in")); tudo(document); });
  if (document.readyState !== "loading") tudo(document); else document.addEventListener("DOMContentLoaded", () => tudo(document));
})();

