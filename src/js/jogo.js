
/* ==========================================================================
   Jogo "Dirija pelo Biopark" · mundo 3D do Território do Biopark
   Carrega o Three.js só quando o visitante abre o jogo.
   ========================================================================== */
(() => {
  "use strict";
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const reduzMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toque = () => matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  // ------------------------------------------------------------------ dados do mapa
  // Coordenadas: x = leste, z = sul. Retângulos: [x0, z0, x1, z1].
  // Mapa redesenhado a partir do MASTERPLAN_2025 (DWG da engenharia do Biopark), na escala 1 unidade = 2 m,
  // girado 5,3° para a Av. Max Planck ficar na horizontal. As quadras, lotes, ruas e nomes vêm de campus.json (chave "mapa").
  const LIM = { x0: -380, z0: -330, x1: 470, z1: 410 };
  const ZONAS = [
    { id: "campus", nome: "Biopark Educação", cor: 0x3fae5c, r: [10, -275, 305, 123] },
    { id: "loteamento", nome: "Loteamento Universitário", cor: 0x9db9e6, r: [-20, 123, 470, 410] },
    { id: "loteamento", cor: 0x9db9e6, r: [210, -330, 470, 123] },
    { id: "industrial", nome: "Centro Industrial Arno Donaduzzi", cor: 0xbf4cb3, r: [-380, 30, -62, 410] },
    { id: "comercio", nome: "Comércio e Serviços", cor: 0xd8424c, r: [-380, -330, -62, 30] },
  ];
  const NOME_ZONA = {
    campus: "Campus", farm: "Smart Farm", loteamento: "Loteamento Univ.", industrial: "Industrial",
    comercio: "Comércio", residencial: "Residencial", sul: "Loteamento Sul", vias: "Ruas e rodovia",
  };
  const AVENIDA = [];
  const ROTATORIAS = [];

  // Pontos do mapa (números da legenda oficial do Território do Biopark)
  const MVV = [
    { k: "missao", t: "Missão", x: 80, z: -84.5, txt: "Transformar a sociedade por meio da excelência na educação, garantindo acessibilidade a todos." },
    { k: "visao", t: "Visão", x: 113, z: -84.5, txt: "Ser reconhecido como instituição de referência internacional, por meio da criação de um modelo de educação único, com foco na inovação, empreendedorismo e empregabilidade." },
    { k: "valores", t: "Valores", x: 146, z: -84.5, lista: ["Ética, Respeito e Honestidade", "Crescimento do Ser Humano", "Busca pela Excelência", "Sustentabilidade", "Cultura de Cooperação", "Inovação", "Empreendedorismo"] },
  ];
  const PONTOS = [
    { n: 1, t: "Faculdade de Medicina da UFPR", g: [20, -112], curso: "IA",
      d: "O curso de Medicina da Universidade Federal do Paraná funciona dentro do Biopark, do outro lado da Av. Max Planck.",
      ia: "Saúde é um dos campos que mais usa IA: modelos de visão computacional ajudam médicos a analisar exames de imagem, como raio-X e mamografia, e a priorizar os casos urgentes.",
      tags: ["Visão computacional", "Deep learning", "Saúde"] },
    { n: 2, t: "Ed. Charles Darwin · Biopark Educação", g: [58, -31], curso: "CD",
      d: "Prédio da Biopark Educação, a instituição da Faculdade Donaduzzi.",
      ia: "Toda escola gera dados: frequência, notas, uso da biblioteca. Com painéis de Business Intelligence dá para perceber cedo quem precisa de apoio e agir antes da evasão.",
      tags: ["SQL", "Power BI", "Business Intelligence"] },
    { n: 3, t: "Blocos Educacionais", g: [68, -8], curso: "CD",
      d: "Salas e laboratórios. A partir do 2º semestre, cada turma desenvolve um projeto integrador com dados reais.",
      ia: "É aqui que se aprende a base: programação em Python, bancos de dados, estatística e os primeiros modelos de machine learning.",
      tags: ["Python", "Estatística", "Machine learning"] },
    { n: 11, t: "Colégio Donaduzzi", g: [145, -12], curso: "IA",
      d: "Escola de educação básica que também fica no campus.",
      ia: "Sistemas de recomendação, os mesmos que sugerem séries e músicas, podem indicar exercícios de acordo com as dificuldades de cada estudante.",
      tags: ["Sistemas de recomendação", "Educação"] },
    { n: 8, t: "Central de Vendas", g: [-17, -45], curso: "CD",
      d: "Onde são comercializados os terrenos do Território do Biopark.",
      ia: "Quanto vale um terreno? Modelos de regressão estimam preços a partir de área, localização e histórico de vendas. É machine learning clássico.",
      tags: ["Regressão", "Previsão", "pandas"] },
    { n: 7, t: "Viveiro e Smart Farm", g: [131, 40], curso: "IA",
      d: "Viveiro de mudas ao lado dos blocos educacionais, ligado à área de agricultura de precisão do Biopark.",
      ia: "Sensores IoT medem solo e clima, câmeras e drones detectam pragas. Alunos de CD e IA criaram o Peso na Granja, que estima o peso de suínos por câmera, premiado no Hackathon do Show Rural Digital 2026.",
      tags: ["IoT", "Visão computacional", "Agro 4.0"] },
    { n: 10, t: "SANEPAR · Reservatório", g: [176, -290], curso: "CD",
      d: "Reservatório e estação elevatória da SANEPAR, que abastecem o Biopark de água e levam o esgoto para tratamento.",
      ia: "Sensores medem vazão e qualidade da água o tempo todo. Com séries temporais é possível prever o consumo e detectar vazamentos antes que virem problema.",
      tags: ["Séries temporais", "IoT", "Detecção de anomalias"] },
    { n: 4, t: "Centro de Distribuição Prati-Donaduzzi", g: [-100, 150], curso: "CD",
      d: "Centro de distribuição da Prati-Donaduzzi, indústria farmacêutica de Toledo.",
      ia: "Logística é dado puro: prever a demanda de cada produto, otimizar estoque e calcular as melhores rotas de entrega.",
      tags: ["Previsão de demanda", "Otimização", "Logística"] },
    { n: 9, t: "Área de Expansão Prati-Donaduzzi", g: [-160, 300], curso: "IA",
      d: "Área reservada para o crescimento da indústria. Pode derrubar as caixas, ninguém vai brigar.",
      ia: "Na indústria 4.0, gêmeos digitais simulam uma fábrica no computador antes de ela existir, e a IA testa milhares de cenários de produção.",
      tags: ["Gêmeo digital", "Simulação", "Indústria 4.0"] },
    { n: 5, t: "Condomínio Industrial", g: [-189, 205], curso: "IA",
      d: "Galpões para empresas que se instalam no Biopark.",
      ia: "Manutenção preditiva: sensores nas máquinas e modelos de machine learning avisam que uma peça vai falhar antes que ela pare a produção.",
      tags: ["Manutenção preditiva", "IoT", "Machine learning"] },
    { n: 6, t: "Flor da Terra Queijos Finos", g: [-327, 304], curso: "CD",
      d: "Queijaria que produz queijos finos no Biopark.",
      ia: "Maturar queijo exige controle fino de temperatura e umidade. Dados de sensores e modelos de classificação ajudam a manter cada lote no padrão.",
      tags: ["Controle de qualidade", "Classificação", "Sensores"] },
  ];

  const CUBOS = [
    [28, -20], [70, -14], [153, 2], [124, -58], [30, -56],
    [260, -84], [80, 139], [240, 139], [-48, 60], [-48, -120], [-48, 200],
    [-160, -70], [-150, 80], [-130, -199], [-286, -150], [100, -260], [250, -241], [-150, -245],
    [380, -226], [313, 60], [322, 250], [380, 40], [100, 196], [200, 242], [300, 289], [380, 253],
    [135, 60], [175, -118], [176, 228], [-150, 230], [-189, 230], [-255, 250],
    [75, -84, 4.5], [-48, -245, 5.5],
  ];

  // ------------------------------------------------------------------ utilidades
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function angDif(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz;
    const t = l ? clamp(((px - ax) * dx + (pz - az) * dz) / l, 0, 1) : 0;
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
  }
  function distAvenida(x, z) { let m = Infinity; for (let i = 0; i < AVENIDA.length - 1; i++) m = Math.min(m, distSeg(x, z, ...AVENIDA[i], ...AVENIDA[i + 1])); return m; }
  const dentro = (x, z, r, m = 0) => x >= r[0] - m && x <= r[2] + m && z >= r[1] - m && z <= r[3] + m;
  function zonaDe(x, z) { for (const zn of ZONAS) if (dentro(x, z, zn.r)) return zn.id; return "vias"; }
  const fmtTempo = (s) => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function lerLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravarLS(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } }

  // ------------------------------------------------------------------ cartaz da seção (SVG isométrico)
  function cartazSVG() {
    const iso = (x, z) => [((x - z) * 0.866) * 0.62 + 300, ((x + z) * 0.5) * 0.62 + 170];
    const poly = (r, cor, h) => {
      const p = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]].map(([x, z]) => iso(x, z));
      const top = p.map(([a, b]) => `${a.toFixed(1)},${(b - h).toFixed(1)}`).join(" ");
      const lado = [p[1], p[2], [p[2][0], p[2][1] - h], [p[1][0], p[1][1] - h]].map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
      const frente = [p[2], p[3], [p[3][0], p[3][1] - h], [p[2][0], p[2][1] - h]].map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
      const hex = "#" + cor.toString(16).padStart(6, "0");
      return `<polygon points="${lado}" fill="${hex}" style="filter:brightness(.62)"/><polygon points="${frente}" fill="${hex}" style="filter:brightness(.78)"/><polygon points="${top}" fill="${hex}"/>`;
    };
    let s = "";
    ZONAS.forEach((z) => (s += poly(z.r, z.cor, 4)));
    const av = AVENIDA.map(([x, z]) => iso(x, z).map((v, i) => (i ? v - 4 : v).toFixed(1)).join(",")).join(" ");
    s += `<polyline points="${av}" fill="none" stroke="#7c2433" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    const [hx0, hy0] = iso(0, LIM.z0), [hx1, hy1] = iso(0, LIM.z1);
    s += `<line x1="${hx0}" y1="${hy0}" x2="${hx1}" y2="${hy1}" stroke="#60646c" stroke-width="7"/>`;
    [[42, -36, 13, 30, 14], [60, -85, 56, 62, 6], [58, -150, 34, 16, 14], [-42, 62, 44, 26, 14], [-26, -25, 25, 29, 9]].forEach(([x, z, w, d, h]) => (s += poly([x - w / 2, z - d / 2, x + w / 2, z + d / 2], 0xf3f0e7, h)));
    PONTOS.forEach((p) => { const [a, b] = iso(p.g[0], p.g[1]); s += `<g transform="translate(${a.toFixed(1)},${(b - 16).toFixed(1)})"><circle r="7" fill="#fff" stroke="#101821" stroke-width="1.5"/><text y="3" text-anchor="middle" font-size="8.5" font-weight="700" fill="#101821" font-family="Inter,sans-serif">${p.n}</text></g>`; });
    const [cx, cy] = iso(66, 22);
    s += `<g transform="translate(${cx},${cy - 8}) rotate(-30)"><rect x="-9" y="-5" width="18" height="10" rx="3" fill="#9E2238"/><rect x="-3" y="-4" width="8" height="8" rx="2" fill="#F6F4E7"/></g>`;
    return `<svg viewBox="0 0 600 380" role="img" aria-label="Miniatura isométrica do mapa do Território do Biopark com um carrinho vermelho na avenida">${s}</svg>`;
  }
  function preencherCartazes() {
    document.querySelectorAll("[data-bp-poster]:not([data-ok])").forEach((el) => { el.setAttribute("data-ok", ""); el.insertAdjacentHTML("afterbegin", cartazSVG()); });
  }
  // prévia em vídeo da chamada: toca só quando está na tela e quando a pessoa não pediu menos movimento
  const obsPrevia = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target; if (reduzMov()) return;
    if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }), { threshold: 0.25 }) : null;
  function ativarPrevias() { document.querySelectorAll("video.bp-video:not([data-ok])").forEach((v) => { v.setAttribute("data-ok", ""); v.muted = true; if (obsPrevia) obsPrevia.observe(v); }); }

  // ------------------------------------------------------------------ áudio
  let ac = null, somLigado = lerLS("bp-som") !== "0";
  function bip(freqs, dur = 0.12, tipo = "sine", vol = 0.12) {
    if (!somLigado) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime;
      freqs.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = tipo; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        const ti = t0 + i * dur * 0.8;
        g.gain.setValueAtTime(0.0001, ti); g.gain.exponentialRampToValueAtTime(vol, ti + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ti + dur);
        o.start(ti); o.stop(ti + dur + 0.02);
      });
    } catch (e) { /* sem áudio */ }
  }

  // ------------------------------------------------------------------ ambiente: período, clima e música
  // A música é composta e tocada aqui mesmo, nota por nota, com a Web Audio API: não há arquivo de áudio
  // nem licença de terceiros. Chuva e vento são ruído filtrado.
  const CLIMAS = ["limpo", "chuva", "vento", "neve"];
  const AMB = { per: lerLS("bp-per") === "noite" ? "noite" : "dia", clima: CLIMAS.includes(lerLS("bp-clima")) ? lerLS("bp-clima") : "limpo" };
  let musicaLigada = lerLS("bp-musica") === "1"; // começa desligada; liga no botão ♫ ou na tecla B
  const Som = (() => {
    let ativo = false, pronto = false, mestre, filtro, mus, chuvaG, ventoG, ventoF, eco, timer = 0, prox = 0, passo = 0;
    // Trilha no espírito das músicas calmas de jogos de mundo aberto (piano abafado, acordes com 7ª e 9ª, muito espaço
    // e reverberação). As peças são originais, escritas aqui nota por nota como uma partitura MIDI; nenhuma melodia
    // de outro jogo é copiada. Cada ambiente tem a sua peça: tocam, descansam um pouco e voltam com pequenas variações.
    const PECAS = {
      dia: { // "Clareira": Ré maior com 4ª aumentada, piano e cordas suaves, passarinhos ao fundo
        bpm: 70, filtro: 6500, lh: { pat: [0, 1, 2, 3, 2, 1, 2, 3], passo: 1, vel: 0.3 }, pad: "B", amb: "passaros",
        ac: { D: [50, 57, 64, 66], G: [43, 50, 54, 61], Bm: [47, 54, 57, 62], As: [45, 52, 59, 62], Em: [40, 47, 54, 55], Fm: [42, 49, 52, 57], Ad: [45, 52, 59, 61], A6: [45, 52, 57, 66], G7: [43, 50, 54, 59] },
        sec: {
          I: { c: ["D", "D"], m: ["", ""] },
          A: { c: ["D", "D", "G", "G7", "Bm", "Bm", "G7", "As"], m: ["0 78 3,3 76 1,4 74 4", "0 69 2,2 71 2,4 73 4", "0 74 3,3 73 1,4 71 2,6 73 2", "0 71 4,4 69 4", "0 66 2,2 69 2,4 74 4", "0 73 3,3 71 1,4 69 4", "0 71 2,2 73 2,4 74 2,6 76 2", "0 76 8"] },
          B: { c: ["Em", "Fm", "G7", "Ad", "Bm", "G", "Em", "A6"], m: ["0 79 3,3 78 1,4 76 4", "0 73 2,2 76 2,4 78 4", "0 79 2,2 78 2,4 74 2,6 71 2", "0 71 6,6 73 2", "0 74 3,3 76 1,4 78 4", "0 73 4,4 71 2,6 69 2", "0 66 2,2 67 2,4 71 4", "0 69 8"] },
        },
        forma: ["I", "A", "A+", "B", "A", "F:D:74"],
      },
      noite: { // "Vagalumes": Lá dórico, lento, notas soltas no agudo, grilos
        bpm: 56, filtro: 2600, lh: { pat: [0, 1, 2, 3], passo: 2, vel: 0.26 }, pad: "*", amb: "grilos",
        ac: { Am: [45, 52, 59, 60], F: [41, 48, 52, 59], C: [48, 55, 59, 64], G: [47, 55, 59, 62], Dm: [50, 57, 64, 65], Em: [40, 47, 55, 62] },
        sec: {
          I: { c: ["Am", "F"], m: ["", ""] },
          A: { c: ["Am", "F", "C", "G", "Am", "F", "Dm", "Em"], m: ["0 76 6", "0 71 4,4 72 4", "0 74 4,4 76 4", "0 79 8", "0 81 2,2 79 2,4 76 4", "0 72 8", "0 77 4,4 76 2,6 74 2", "0 71 8"] },
          B: { c: ["F", "C", "Dm", "Am", "F", "C", "G", "Em"], m: ["0 72 4,4 76 4", "0 79 6", "0 77 2,2 76 2,4 74 4", "0 72 8", "0 69 4,4 72 4", "0 76 6,6 79 2", "0 74 8", "0 71 8"] },
        },
        forma: ["I", "A", "B", "A+", "F:Am:69"],
      },
      chuva: { // "Janela": Fá maior, arpejos contínuos de piano, como gotas
        bpm: 64, filtro: 3400, lh: { pat: [0, 1, 2, 3, 1, 2, 3, 2], passo: 1, vel: 0.28 }, pad: "", amb: "",
        ac: { F: [41, 48, 52, 57], Em: [40, 47, 50, 55], Dm: [38, 45, 52, 53], Bb: [46, 53, 57, 62], C6: [48, 55, 57, 64], Am: [45, 52, 55, 60], Gm: [43, 50, 57, 58], Cs: [48, 53, 55, 60] },
        sec: {
          I: { c: ["F", "Em"], m: ["", ""] },
          A: { c: ["F", "Em", "Dm", "Bb", "F", "Am", "Gm", "Cs"], m: ["0 72 2,2 69 2,4 67 2,6 69 2", "0 71 4,4 67 4", "0 69 2,2 65 2,4 64 2,6 65 2", "0 65 6,6 62 2", "0 72 2,2 74 2,4 76 4", "0 72 4,4 71 2,6 72 2", "0 74 4,4 70 2,6 69 2", "0 67 8"] },
          B: { c: ["Bb", "C6", "Am", "Dm", "Bb", "C6", "F", "F"], m: ["0 74 4,4 72 4", "0 76 6,6 74 2", "0 72 4,4 76 4", "0 77 8", "0 74 2,2 72 2,4 70 4", "0 69 4,4 67 4", "0 69 4,4 72 4", "0 69 8"] },
        },
        forma: ["I", "A", "B", "A+", "F:F:69"],
      },
      neve: { // "Flocos": Mi maior, sininhos no agudo sobre piano em semínimas
        bpm: 60, filtro: 5200, lh: { pat: [0, 2, 1, 3], passo: 2, vel: 0.24 }, pad: "*", amb: "", mel: "sino",
        ac: { E: [40, 47, 54, 56], Cm: [49, 56, 59, 63], A: [45, 52, 56, 59], Bs: [47, 52, 56, 59] },
        sec: {
          I: { c: ["E", "A"], m: ["", ""] },
          A: { c: ["E", "Cm", "A", "Bs", "E", "Cm", "A", "Bs"], m: ["0 88 2,2 87 2,4 83 4", "2 80 2,4 83 4", "0 85 2,2 83 2,4 80 2,6 78 2", "0 80 8", "0 88 2,2 90 2,4 92 4", "0 87 4,4 85 4", "0 83 2,2 85 2,4 80 4", "0 83 8"] },
        },
        forma: ["I", "A", "A", "F:E:83"],
      },
      vento: { // "Rajada": Lá menor, rápido, arpejos em semicolcheias no agudo, sem grave
        bpm: 100, filtro: 8000, lh: { pat: [0, 2, 1, 3, 2, 1, 3, 2], passo: 0.5, vel: 0.22, curto: true }, pad: "", amb: "", sem_grave: true,
        ac: { Am: [69, 71, 72, 76], F: [65, 69, 72, 76], C: [67, 72, 76, 79], Gs: [67, 72, 74, 79], Dm: [65, 69, 72, 74], Em: [67, 71, 74, 76] },
        sec: {
          A: { c: ["Am", "F", "C", "Gs", "Am", "F", "Dm", "Em"], m: ["0 84 2,2 83 2,4 81 4", "0 81 2,2 79 2,4 77 4", "0 79 2,2 81 2,4 84 4", "0 83 6,6 79 2", "0 84 2,2 86 2,4 88 4", "0 84 4,4 81 4", "0 81 2,2 79 2,4 77 2,6 76 2", "0 76 8"] },
        },
        forma: ["A", "A", "A+"],
      },
    };
    const estiloAtual = () => (AMB.clima === "limpo" ? AMB.per : AMB.clima);
    const EST = PECAS; // usado em aplicar() para o filtro geral
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    let ruidoBuf = null, rev = null, revIn = null;
    function ctx() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; }
    function montar() {
      if (pronto) return; pronto = true; const a = ctx();
      const comp = a.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 2.5; comp.connect(a.destination);
      mestre = a.createGain(); mestre.gain.value = 0; mestre.connect(comp);
      filtro = a.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 6000; filtro.Q.value = 0.3; filtro.connect(mestre);
      mus = a.createGain(); mus.gain.value = 0; mus.connect(filtro);
      // reverberação de sala grande: resposta ao impulso gerada aqui (ruído com decaimento, agudos somem antes)
      const L = Math.floor(a.sampleRate * 4.2), ir = a.createBuffer(2, L, a.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < L; i++) { const k = i / L, w = Math.random() * 2 - 1; lp += (w - lp) * (0.55 - 0.45 * k); d[i] = lp * Math.pow(1 - k, 2.4) * (i < a.sampleRate * 0.012 ? i / (a.sampleRate * 0.012) : 1); } }
      rev = a.createConvolver(); rev.buffer = ir; revIn = a.createGain(); revIn.gain.value = 0.55; revIn.connect(rev); rev.connect(mus);
      eco = a.createDelay(2); eco.delayTime.value = 0.64; const fb = a.createGain(); fb.gain.value = 0.28; eco.connect(fb); fb.connect(eco); eco.connect(revIn);
      ruidoBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = ruidoBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; }
      const fonte = (tipo, f, q) => { const n = a.createBufferSource(); n.buffer = ruidoBuf; n.loop = true; const fl = a.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q; const g = a.createGain(); g.gain.value = 0; n.connect(fl); fl.connect(g); g.connect(mestre); n.start(); return [g, fl]; };
      [chuvaG] = fonte("highpass", 700, 0.3);
      [ventoG, ventoF] = fonte("bandpass", 420, 0.9);
    }
    const env = (g, t, pico, ataque, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
    function osc(tipo, f, t, dur, pico, ataque, dest) {
      const a = ac, o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.frequency.value = f;
      o.connect(g); g.connect(dest || mus); env(g, t, pico, ataque, dur); o.start(t); o.stop(t + dur + 0.05); return o;
    }
    // piano abafado ("felt"): parciais levemente desafinados, cada um com seu decaimento, filtro que fecha com o tempo e batida do martelo
    function piano(m, t, dur, vel, dest, curto) {
      const a = ac, out = a.createGain(), lp = a.createBiquadFilter(), f = hz(m) * Math.pow(2, (Math.random() - 0.5) * 0.008);
      lp.type = "lowpass"; lp.Q.value = 0.2; lp.frequency.setValueAtTime(700 + vel * 2600 + m * 8, t); lp.frequency.exponentialRampToValueAtTime(420 + m * 5, t + 1.6);
      out.connect(lp); lp.connect(dest); const send = a.createGain(); send.gain.value = 0.9; lp.connect(send); send.connect(revIn);
      const fim = curto ? t + dur + 0.25 : t + dur + 1.2, base = 2.4 + Math.max(0, 76 - m) * 0.06;
      for (let n = 1; n <= 5; n++) {
        const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f * n * Math.sqrt(1 + 0.00035 * n * n);
        const amp = (vel * 0.13) / Math.pow(n, 1.45) * (n === 2 ? 1.25 : 1), dec = base / Math.pow(n, 0.7);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.006); g.gain.setTargetAtTime(0.0001, t + 0.006, dec / 4.5);
        g.gain.setTargetAtTime(0.0001, curto ? t + dur : t + dur + 0.2, curto ? 0.05 : 0.35);
        o.connect(g); g.connect(out); o.start(t); o.stop(fim + 0.3);
      }
      const nz = a.createBufferSource(); nz.buffer = ruidoBuf; const nf = a.createBiquadFilter(); nf.type = "lowpass"; nf.frequency.value = 900; const ng = a.createGain();
      nz.connect(nf); nf.connect(ng); ng.connect(out); env(ng, t, vel * 0.05, 0.002, 0.04); nz.start(t, Math.random()); nz.stop(t + 0.06);
    }
    function sino(m, t, vel, dest) {
      [[1, 1, 3.4], [2.76, 0.38, 1.5], [5.4, 0.18, 0.7], [8.9, 0.07, 0.35]].forEach(([k, amp, dec]) => {
        const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = hz(m) * k;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.085 * amp, t + 0.003); g.gain.setTargetAtTime(0.0001, t + 0.003, dec / 4);
        o.connect(g); g.connect(dest); const s = ac.createGain(); s.gain.value = 1.1; g.connect(s); s.connect(revIn); o.start(t); o.stop(t + dec * 1.4 + 0.1);
      });
    }
    function cordas(notas, t, dur, dest) { // cama de cordas bem suave
      notas.forEach((m) => [-7, 7].forEach((det) => {
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det;
        f.type = "lowpass"; f.frequency.value = 650; o.connect(f); f.connect(g); g.connect(dest); const s = ac.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(revIn);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.0065, t + Math.min(2.2, dur * 0.4)); g.gain.setTargetAtTime(0.0001, t + dur, 0.9);
        o.start(t); o.stop(t + dur + 4);
      }));
    }
    function passarinho(t) { const n = 2 + Math.floor(Math.random() * 3), f0 = 2600 + Math.random() * 1600; for (let i = 0; i < n; i++) { const ti = t + i * (0.09 + Math.random() * 0.05); const o = osc("sine", f0, ti, 0.08, 0.014, 0.005, revIn); o.frequency.setValueAtTime(f0 * (i % 2 ? 1.25 : 1), ti); o.frequency.exponentialRampToValueAtTime(f0 * (i % 2 ? 0.95 : 1.32), ti + 0.07); } }
    function grilo(t) { for (let i = 0; i < 3; i++) osc("sine", 4700, t + i * 0.034, 0.02, 0.008, 0.003); }

    // monta a "partitura" (lista de notas) de uma execução da peça, com pequenas variações a cada vez
    function partitura(P) {
      const ev = []; let bar = 0; const r = Math.random;
      for (const tok of P.forma) {
        if (tok.startsWith("F:")) { // acorde final, arpejado devagar, com a nota do topo
          const [, cn, top] = tok.split(":"), ch = P.ac[cn];
          ch.forEach((m, i) => ev.push({ t: bar * 8 + i * 0.35, m, d: 14, v: P.lh.vel * 1.1, k: "p" }));
          ev.push({ t: bar * 8 + 1.6, m: +top, d: 14, v: 0.5, k: P.mel || "p" });
          if (P.pad) ev.push({ t: bar * 8, cordas: ch.map((x) => x + 12), d: 16 });
          bar += 2; continue;
        }
        const oit = tok.endsWith("+") ? 12 : 0, s = P.sec[tok.replace("+", "")];
        s.c.forEach((cn, i) => {
          const ch = P.ac[cn], lh = P.lh, n = Math.round(8 / lh.passo);
          for (let k = 0; k < n; k++) ev.push({ t: bar * 8 + k * lh.passo, m: ch[lh.pat[k % lh.pat.length]], d: lh.curto ? lh.passo * 0.6 : lh.passo * 2.2, v: lh.vel * (k === 0 ? 1.18 : 0.9 + r() * 0.2), k: "p", c: lh.curto });
          if (P.pad === "*" || P.pad === tok.replace("+", "")) ev.push({ t: bar * 8, cordas: ch.slice(1).map((x) => x + 12), d: 8 * (30 / P.bpm) * 1.05 });
          (s.m[i] || "").split(",").filter(Boolean).forEach((nt) => {
            const [p, m, d] = nt.trim().split(/\s+/).map(Number);
            if (oit && r() < 0.18) return; // na repetição uma oitava acima, algumas notas ficam de fora
            ev.push({ t: bar * 8 + p, m: m + oit, d, v: (oit ? 0.42 : 0.55) * (0.9 + r() * 0.2), k: P.mel || "p" });
          });
          bar++;
        });
      }
      ev.sort((a, b) => a.t - b.t);
      return { ev, barras: bar };
    }
    let peca = null; // { P, nome, ev, i, t0, s8, fimT, ganho, barras }
    let proxPeca = 0, ambT = 0;
    function iniciarPeca(agora) {
      const nome = estiloAtual(), P = PECAS[nome], { ev, barras } = partitura(P), s8 = 30 / P.bpm;
      const ganho = ac.createGain(); ganho.gain.value = 0.0001; ganho.gain.setTargetAtTime(1, agora, 0.4); ganho.connect(mus);
      eco.delayTime.setTargetAtTime(Math.min(1.9, s8 * 3), agora, 0.3);
      peca = { P, nome, ev, i: 0, t0: agora + 0.2, s8, barras, ganho, fimT: agora + 0.2 + barras * 8 * s8 * 1.08 + 3 };
    }
    // ritardando nos dois últimos compassos
    const tempoDe = (pc, x) => { const ini = (pc.barras - 2) * 8; return pc.t0 + (x < ini ? x : ini + (x - ini) * 1.22) * pc.s8; };
    function tique() {
      const agora = ac.currentTime;
      if (peca && peca.nome !== estiloAtual()) { // mudou o ambiente: a peça atual some devagar e a nova entra logo
        peca.ganho.gain.setTargetAtTime(0.0001, agora, 0.6); const g = peca.ganho; setTimeout(() => { try { g.disconnect(); } catch (e) { /* já foi */ } }, 5000);
        peca = null; proxPeca = agora + 2.2;
      }
      if (!peca && agora >= proxPeca) iniciarPeca(agora);
      if (peca) {
        while (peca.i < peca.ev.length && tempoDe(peca, peca.ev[peca.i].t) < agora + 0.35) {
          const e = peca.ev[peca.i++], t = tempoDe(peca, e.t) + (Math.random() - 0.5) * 0.018;
          if (e.cordas) cordas(e.cordas, Math.max(t, agora), e.d * peca.s8, peca.ganho);
          else if (e.k === "sino") sino(e.m, Math.max(t, agora), e.v, peca.ganho);
          else piano(e.m, Math.max(t, agora), e.d * peca.s8, e.v, peca.ganho, e.c);
        }
        if (agora > peca.fimT) { // terminou: silêncio de respiro antes de tocar de novo, como nos jogos de mundo aberto
          const g = peca.ganho; setTimeout(() => { try { g.disconnect(); } catch (e) { /* já foi */ } }, 6000);
          proxPeca = agora + (peca.nome === "vento" ? 3 : 10 + Math.random() * 12); peca = null;
        }
      }
      // sons de natureza junto com a música
      if (agora > ambT) {
        ambT = agora + 0.5; const est = estiloAtual();
        if (est === "dia" && Math.random() < 0.09) passarinho(agora + Math.random() * 0.4);
        if (est === "noite" && Math.random() < 0.55) grilo(agora + Math.random() * 0.3);
      }
    }
    function rampa(param, v, tc) { param.setTargetAtTime(v, ac.currentTime, tc || 0.6); }
    function aplicar() {
      if (!ativo || !ac) return;
      if (ac.state === "suspended") ac.resume();
      const noite = AMB.per === "noite";
      rampa(mestre.gain, 1, 0.3);
      rampa(mus.gain, musicaLigada ? 1.45 : 0, 0.4);
      rampa(filtro.frequency, EST[estiloAtual()].filtro * (noite && AMB.clima !== "limpo" ? 0.6 : 1), 1);
      rampa(chuvaG.gain, somLigado && AMB.clima === "chuva" ? 0.55 : 0, 1);
      rampa(ventoG.gain, somLigado && AMB.clima === "vento" ? 0.5 : somLigado && AMB.clima === "neve" ? 0.12 : 0, 1);
      if (musicaLigada && !timer) { prox = ac.currentTime + 0.1; timer = setInterval(tique, 40); }
      if (!musicaLigada && timer) { clearInterval(timer); timer = 0; if (peca) { peca.ganho.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3); peca = null; } proxPeca = 0; }
    }
    let lfo = 0;
    return {
      ligar() { try { ctx(); montar(); ativo = true; aplicar(); } catch (e) { /* sem áudio */ } },
      desligar() { ativo = false; if (!pronto) return; rampa(mestre.gain, 0, 0.15); if (timer) { clearInterval(timer); timer = 0; } if (peca) { peca.ganho.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2); peca = null; } proxPeca = 0; },
      aplicar() { try { aplicar(); } catch (e) { /* sem áudio */ } },
      vento(dt) { if (!pronto || AMB.clima !== "vento") return; lfo += dt; ventoF.frequency.setTargetAtTime(380 + Math.sin(lfo * 0.7) * 160 + Math.sin(lfo * 2.3) * 60, ac.currentTime, 0.2); },
      trovao() { if (!pronto || !somLigado || !ativo) return; const t = ac.currentTime + 0.5 + Math.random() * 0.8; const n = ac.createBufferSource(); n.buffer = ruidoBuf; const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 160; const g = ac.createGain(); n.connect(fl); fl.connect(g); g.connect(mestre); env(g, t, 1.4, 0.08, 2.6); n.start(t); n.stop(t + 2.8); },
    };
  })();
  const ICONE_PER = { dia: "☀", noite: "☾" };
  const NOME_CLIMA = { limpo: "Céu limpo", chuva: "Chuva", vento: "Vento", neve: "Neve" };
  function definirAmbiente(per, clima, avisar) {
    if (per) AMB.per = per; if (clima) AMB.clima = clima;
    gravarLS("bp-per", AMB.per); gravarLS("bp-clima", AMB.clima);
    if (jogo) jogo.ambiente(AMB.per, AMB.clima);
    Som.aplicar();
    if (ui) {
      ui.el.querySelectorAll("[data-bp='per']").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === AMB.per)));
      ui.el.querySelectorAll("[data-bp='clima']").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === AMB.clima)));
      ui.h.ambic.textContent = ICONE_PER[AMB.per];
    }
    if (avisar && jogo) {
      const dica = { chuva: " Pista molhada: freie antes das curvas.", neve: " Pista escorregadia: o carro desliza nas curvas.", vento: " O vento empurra o carro, principalmente nos saltos.", limpo: "" }[AMB.clima];
      toast(`${AMB.per === "noite" ? "Noite" : "Dia"} · ${NOME_CLIMA[AMB.clima]}.${dica}`);
    }
  }
  function definirMusica(v) {
    musicaLigada = v; gravarLS("bp-musica", v ? "1" : "0"); Som.aplicar();
    if (ui) ui.el.querySelectorAll("[data-bp='musica']").forEach((b) => { b.setAttribute("aria-pressed", String(v)); b.classList.toggle("bp-off", !v); const t = b.querySelector(".bp-mus-t"); if (t) t.textContent = v ? "Ligada" : "Desligada"; });
  }

  // ------------------------------------------------------------------ interface (overlay)
  let ui = null, jogo = null, aberto = false, focoAntes = null;

  function montarUI() {
    const el = document.createElement("div");
    el.className = "bp-jogo";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "bp-titulo");
    el.hidden = true;
    el.innerHTML = `
<div class="bp-palco" tabindex="-1" aria-label="Mundo 3D do Território do Biopark. Use as setas ou W, A, S, D para dirigir."></div>
<div class="bp-hud" aria-hidden="false">
  <div class="bp-painel">
    <p class="bp-marca">Território do Biopark</p>
    <ul class="bp-cont">
      <li><span class="bp-ic bp-ic-cubo" aria-hidden="true"></span><b data-h="cubos">0</b><span>/${CUBOS.length} dados</span></li>
      <li><span class="bp-ic bp-ic-pin" aria-hidden="true"></span><b data-h="pontos">0</b><span>/${PONTOS.length} lugares</span></li>
      <li><span class="bp-ic bp-ic-rel" aria-hidden="true"></span><b data-h="tempo">00:00</b></li>
    </ul>
    <div class="bp-vel"><b data-h="vel">0</b><span>km/h</span><canvas class="bp-spark" width="240" height="56" aria-hidden="true"></canvas></div>
  </div>
  <div class="bp-dir">
    <canvas class="bp-mini" width="300" height="300" aria-hidden="true"></canvas>
    <div class="bp-botoes">
      <button type="button" class="bp-b ${musicaLigada ? "" : "bp-off"}" data-bp="musica" aria-pressed="${musicaLigada}" aria-label="Música (B)" title="Música (B)"><span aria-hidden="true">♫</span></button>
      <button type="button" class="bp-b" data-bp="amb" aria-expanded="false" aria-controls="bp-amb" aria-label="Dia, noite e clima" title="Dia, noite e clima (N, C)"><span aria-hidden="true" data-h="ambic">${ICONE_PER[AMB.per]}</span></button>
      <button type="button" class="bp-b" data-bp="menu" aria-label="Menu e lista de lugares"><span aria-hidden="true">☰</span></button>
      <button type="button" class="bp-b" data-bp="som" aria-pressed="${somLigado}" aria-label="Efeitos sonoros" title="Efeitos sonoros"><span aria-hidden="true" data-h="somic">${somLigado ? "♪" : "×"}</span></button>
      <button type="button" class="bp-b" data-bp="fechar" aria-label="Fechar o jogo"><span aria-hidden="true">✕</span></button>
    </div>
    <div class="bp-amb" id="bp-amb" hidden role="group" aria-label="Ambiente do jogo">
      <p class="bp-amb-t">Período</p>
      <div class="bp-seg">${["dia", "noite"].map((v) => `<button type="button" data-bp="per" data-v="${v}" aria-pressed="${AMB.per === v}"><span aria-hidden="true">${ICONE_PER[v]}</span> ${v === "dia" ? "Dia" : "Noite"}</button>`).join("")}</div>
      <p class="bp-amb-t">Clima</p>
      <div class="bp-seg bp-seg4">${CLIMAS.map((v) => `<button type="button" data-bp="clima" data-v="${v}" aria-pressed="${AMB.clima === v}"><span aria-hidden="true">${{ limpo: "○", chuva: "☂", vento: "≋", neve: "❄" }[v]}</span> ${v === "limpo" ? "Limpo" : NOME_CLIMA[v]}</button>`).join("")}</div>
      <p class="bp-amb-t">Música</p>
      <button type="button" class="bp-mus ${musicaLigada ? "" : "bp-off"}" data-bp="musica" aria-pressed="${musicaLigada}"><span aria-hidden="true">♫</span> <span class="bp-mus-t">${musicaLigada ? "Ligada" : "Desligada"}</span></button>
      <p class="bp-amb-d">Trilha original, criada pelo próprio jogo, livre de direitos. Atalhos: <kbd>N</kbd> dia/noite · <kbd>C</kbd> clima · <kbd>B</kbd> música</p>
    </div>
  </div>
</div>
<div class="bp-card" hidden role="region" aria-live="polite" aria-label="Lugar encontrado"></div>
<div class="bp-toast" aria-live="polite"></div>
<div class="bp-toque" aria-hidden="true">
  <div class="bp-joy"><span class="bp-joy-k"></span></div>
  <button type="button" class="bp-freio" tabindex="-1">Freio</button>
</div>
<div class="bp-tela" data-tela="inicio">
  <div class="bp-caixa">
    <p class="bp-k">Faculdade Donaduzzi · Ciência de Dados e IA</p>
    <h2 id="bp-titulo">Dirija pelo Biopark</h2>
    <p>Pegue o carro, colete os <b>${CUBOS.length} cubos de dados</b> espalhados pelo território e encontre os <b>${PONTOS.length} lugares numerados</b>. Em cada um, você descobre como a Ciência de Dados e a IA aparecem ali de verdade.</p>
    <ul class="bp-ctrl">
      <li class="bp-so-tecla"><span class="bp-teclas"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span> ou <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> para dirigir</li>
      <li class="bp-so-tecla"><kbd>Espaço</kbd> freio de mão · <kbd>R</kbd> volta ao início · <kbd>M</kbd> menu</li>
      <li>Na <b>Av. Max Planck</b>, passe por cima das placas de <b>Missão</b>, <b>Visão</b> e <b>Valores</b></li>
      <li class="bp-so-tecla"><kbd>N</kbd> dia ou noite · <kbd>C</kbd> chuva, vento ou neve · <kbd>B</kbd> música</li>
      <li class="bp-so-toque">No botão <b>☀</b>: dia, noite, chuva, vento, neve e música</li>
      <li class="bp-so-toque">No celular: arraste o joystick para onde quer ir</li>
      <li>Acelere nas <b>rampas vermelhas</b> para saltar e derrube o que achar pelo caminho: árvores, pinos de boliche, barris, fardos</li>
    </ul>
    <div class="bp-acoes">
      <button type="button" class="bp-btn bp-prim" data-bp="comecar">Começar</button>
      <button type="button" class="bp-btn" data-bp="lista">Prefere ler? Ver os lugares</button>
    </div>
    <p class="bp-status" data-h="status" role="status"></p>
  </div>
</div>
<div class="bp-tela" data-tela="menu" hidden>
  <div class="bp-caixa bp-larga">
    <h2>Lugares do Território do Biopark</h2>
    <p class="bp-sub">Clique em um lugar para ir até ele. Os números são os mesmos dos marcadores no mapa.</p>
    <ol class="bp-lista"></ol>
    <div class="bp-acoes">
      <button type="button" class="bp-btn bp-prim" data-bp="continuar">Continuar dirigindo</button>
      <button type="button" class="bp-btn" data-bp="relatorio">Ver meu relatório agora</button>
      <button type="button" class="bp-btn" data-bp="fechar">Sair do jogo</button>
    </div>
  </div>
</div>
<div class="bp-tela" data-tela="fim" hidden>
  <div class="bp-caixa bp-larga" data-h="relatorio"></div>
</div>`;
    document.body.appendChild(el);
    const $ = (s) => el.querySelector(s);
    ui = { el, $, palco: $(".bp-palco"), card: $(".bp-card"), toast: $(".bp-toast"), mini: $(".bp-mini"), spark: $(".bp-spark"),
      h: {}, telas: {} };
    el.querySelectorAll("[data-h]").forEach((n) => (ui.h[n.dataset.h] = n));
    el.querySelectorAll("[data-tela]").forEach((n) => (ui.telas[n.dataset.tela] = n));
    if (toque()) el.classList.add("bp-touch");

    el.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (a) { fechar(true); return; }
      const b = e.target.closest("[data-bp]"); if (!b) return;
      const acao = b.dataset.bp;
      if (acao === "fechar") fechar();
      else if (acao === "comecar") comecar();
      else if (acao === "lista") { mostrarTela("menu"); }
      else if (acao === "menu") { if (jogo) jogo.pausado = true; mostrarTela("menu"); }
      else if (acao === "continuar") continuar();
      else if (acao === "relatorio") mostrarRelatorio();
      else if (acao === "denovo") { jogo && jogo.reiniciar(); continuar(); }
      else if (acao === "som") { somLigado = !somLigado; gravarLS("bp-som", somLigado ? "1" : "0"); b.setAttribute("aria-pressed", String(somLigado)); ui.h.somic.textContent = somLigado ? "♪" : "×"; if (somLigado) bip([880], 0.08); Som.aplicar(); }
      else if (acao === "ir") { const p = PONTOS[+b.dataset.i]; if (jogo) { jogo.teleportar(p); continuar(); } else comecar(p); }
      else if (acao === "musica") definirMusica(!musicaLigada);
      else if (acao === "amb") { const p = ui.el.querySelector(".bp-amb"), abrir = p.hidden; p.hidden = !abrir; b.setAttribute("aria-expanded", String(abrir)); }
      else if (acao === "per") definirAmbiente(b.dataset.v, null, true);
      else if (acao === "clima") definirAmbiente(null, b.dataset.v, true);
      else if (acao === "fcard") { ui.card.hidden = true; if (jogo) jogo.cardFechado = jogo.cardAtual; }
    });
    // armadilha de foco simples
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const vis = [...el.querySelectorAll("button, a[href], [tabindex='0']")].filter((n) => n.offsetParent !== null && !n.closest("[hidden]"));
      if (!vis.length) return;
      const i = vis.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); vis[vis.length - 1].focus(); }
      else if (!e.shiftKey && i === vis.length - 1) { e.preventDefault(); vis[0].focus(); }
    });
    montarLista();
    montarToque();
  }

  function montarLista() {
    ui.$(".bp-lista").innerHTML = PONTOS.slice().sort((a, b) => a.n - b.n).map((p) => {
      const i = PONTOS.indexOf(p);
      return `<li><button type="button" class="bp-li" data-bp="ir" data-i="${i}"><span class="bp-num">${p.n}</span><span class="bp-li-t"><b>${escH(p.t)}</b><span>${escH(p.ia)}</span></span><span class="bp-tag bp-tag-${p.curso.toLowerCase()}">${p.curso === "IA" ? "IA" : "Dados"}</span></button></li>`;
    }).join("");
  }

  function mostrarTela(nome) {
    Object.entries(ui.telas).forEach(([k, n]) => (n.hidden = k !== nome));
    const t = ui.telas[nome];
    if (t) { const b = t.querySelector(".bp-prim, button"); b && b.focus(); }
  }

  function abrir() {
    if (aberto) return;
    if (!ui) montarUI();
    aberto = true; focoAntes = document.activeElement;
    ui.el.hidden = false;
    document.documentElement.classList.add("bp-trava");
    if (jogo) { mostrarTela("menu"); }
    else mostrarTela("inicio");
    // pré-carrega a biblioteca enquanto o visitante lê as instruções
    carregarThree().catch(() => {});
  }
  function fechar(navegando) {
    if (!aberto) return;
    aberto = false;
    if (jogo) { jogo.pausado = true; jogo.parar(); }
    Som.desligar();
    ui.el.hidden = true;
    document.documentElement.classList.remove("bp-trava");
    if (!navegando && focoAntes && focoAntes.focus) focoAntes.focus();
  }
  function continuar() {
    mostrarTela(null);
    if (!jogo) return;
    jogo.pausado = false; jogo.rodar(); ui.palco.focus(); Som.ligar();
  }

  let carregando = null;
  function carregarThree() {
    if (window.THREE) return Promise.resolve();
    if (carregando) return carregando;
    carregando = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = THREE_URL; s.async = true;
      s.onload = () => (window.THREE ? res() : rej());
      s.onerror = () => { carregando = null; s.remove(); rej(); };
      document.head.appendChild(s);
    });
    return carregando;
  }

  async function comecar(destino) {
    const st = ui.h.status;
    if (!jogo) {
      st.textContent = "Montando o Biopark em 3D…";
      try { await carregarThree(); } catch (e) { st.textContent = "Não foi possível carregar o mundo 3D. Verifique a conexão e tente de novo."; return; }
      if (!window.__BP_CAMPUS__) { try { const r = await fetch("campus.json"); if (r.ok) window.__BP_CAMPUS__ = await r.json(); } catch (e) { /* o jogo abre mesmo sem o campus detalhado */ } }
      try { jogo = criarJogo(); } catch (e) { console.error(e); st.textContent = "Seu navegador não conseguiu abrir o modo 3D (WebGL). Você ainda pode ver a lista de lugares."; return; }
      st.textContent = "";
      jogo.ambiente(AMB.per, AMB.clima, true);
      bip([523, 659, 784], 0.1, "triangle", 0.08);
    }
    if (destino) jogo.teleportar(destino);
    continuar();
  }

  // ------------------------------------------------------------------ joystick de toque
  const entrada = { cima: 0, baixo: 0, esq: 0, dir: 0, freio: 0, jx: 0, jy: 0, joy: false };
  function montarToque() {
    const base = ui.$(".bp-joy"), k = ui.$(".bp-joy-k"), freio = ui.$(".bp-freio");
    let id = null;
    const mover = (e) => {
      const r = base.getBoundingClientRect(), R = r.width / 2;
      let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
      const m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; }
      k.style.transform = `translate(${dx}px, ${dy}px)`;
      entrada.jx = dx / R; entrada.jy = -dy / R; entrada.joy = Math.hypot(entrada.jx, entrada.jy) > 0.15;
    };
    base.addEventListener("pointerdown", (e) => { id = e.pointerId; base.setPointerCapture(id); mover(e); e.preventDefault(); });
    base.addEventListener("pointermove", (e) => { if (e.pointerId === id) mover(e); });
    const soltar = (e) => { if (e.pointerId !== id) return; id = null; k.style.transform = ""; entrada.jx = entrada.jy = 0; entrada.joy = false; };
    base.addEventListener("pointerup", soltar); base.addEventListener("pointercancel", soltar);
    freio.addEventListener("pointerdown", (e) => { entrada.freio = 1; e.preventDefault(); });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => freio.addEventListener(ev, () => (entrada.freio = 0)));
  }
  const TECLAS = { ArrowUp: "cima", KeyW: "cima", ArrowDown: "baixo", KeyS: "baixo", ArrowLeft: "esq", KeyA: "esq", ArrowRight: "dir", KeyD: "dir", Space: "freio" };
  addEventListener("keydown", (e) => {
    if (!aberto) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (ui.telas.menu.hidden && ui.telas.inicio.hidden && ui.telas.fim.hidden && jogo) { jogo.pausado = true; mostrarTela("menu"); }
      else fechar();
      return;
    }
    const jogando = jogo && !jogo.pausado;
    if (!jogando) return;
    if (TECLAS[e.code]) {
      if (e.target.closest && e.target.closest("button") && e.code === "Space") return;
      entrada[TECLAS[e.code]] = 1; e.preventDefault(); e.stopPropagation();
    } else if (e.code === "KeyR") { jogo.voltarInicio(); }
    else if (e.code === "KeyM") { jogo.pausado = true; mostrarTela("menu"); }
    else if (e.code === "KeyN") definirAmbiente(AMB.per === "dia" ? "noite" : "dia", null, true);
    else if (e.code === "KeyC") definirAmbiente(null, CLIMAS[(CLIMAS.indexOf(AMB.clima) + 1) % CLIMAS.length], true);
    else if (e.code === "KeyB") definirMusica(!musicaLigada);
  }, true);
  addEventListener("keyup", (e) => { if (TECLAS[e.code]) entrada[TECLAS[e.code]] = 0; }, true);
  addEventListener("blur", () => { Object.keys(TECLAS).forEach((k) => (entrada[TECLAS[k]] = 0)); });

  // ------------------------------------------------------------------ toast e card
  let toastT = 0;
  function toast(html) {
    ui.toast.innerHTML = `<p>${html}</p>`; ui.toast.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => ui.toast.classList.remove("on"), 2600);
  }
  function mostrarCard(p) {
    const curso = p.curso === "IA" ? ["#ia", "Conhecer o curso de Inteligência Artificial"] : ["#cd", "Conhecer o curso de Ciência de Dados"];
    ui.card.innerHTML = `
<button type="button" class="bp-cx" data-bp="fcard" aria-label="Fechar este cartão">✕</button>
<p class="bp-card-k"><span class="bp-num">${p.n}</span> Você chegou em</p>
<h3>${escH(p.t)}</h3>
<p class="bp-card-d">${escH(p.d)}</p>
<p class="bp-card-ia"><b>Dados e IA aqui:</b> ${escH(p.ia)}</p>
<ul class="bp-chips">${p.tags.map((t) => `<li>${escH(t)}</li>`).join("")}</ul>
<a class="bp-link" href="${curso[0]}">${curso[1]} →</a>`;
    ui.card.hidden = false;
  }

  function mostrarCardMVV(m, achados) {
    ui.card.innerHTML = `
<button type="button" class="bp-cx" data-bp="fcard" aria-label="Fechar este cartão">✕</button>
<p class="bp-card-k"><span class="bp-num bp-num-mvv" aria-hidden="true">★</span> Faculdade Donaduzzi · ${achados}/3</p>
<h3>${escH(m.t)}</h3>
${m.lista ? `<ul class="bp-mvv-l">${m.lista.map((v) => `<li>${escH(v)}</li>`).join("")}</ul>` : `<p class="bp-card-d bp-mvv-t">“${escH(m.txt)}”</p>`}
<p class="bp-card-ia">${achados < 3 ? "Siga pela Av. Max Planck para encontrar as outras placas." : "Você encontrou a missão, a visão e os valores da faculdade."}</p>`;
    ui.card.hidden = false;
  }

  // ------------------------------------------------------------------ relatório final
  function mostrarRelatorio() {
    if (!jogo) return;
    jogo.pausado = true;
    const r = jogo.estatisticas();
    const max = Math.max(1, ...Object.values(r.porZona).map((z) => z.total));
    const barras = Object.entries(r.porZona).sort((a, b) => b[1].pegos - a[1].pegos).map(([k, z]) =>
      `<li><span class="bp-bl">${escH(NOME_ZONA[k] || k)}</span><span class="bp-bt"><span class="bp-bt-tot" style="width:${(z.total / max) * 100}%"></span><span class="bp-bt-v" style="width:${(z.pegos / max) * 100}%"></span></span><span class="bp-bn">${z.pegos}/${z.total}</span></li>`).join("");
    const completo = r.cubos === CUBOS.length;
    let recorde = "";
    if (completo) {
      const ant = parseFloat(lerLS("bp-recorde") || "0");
      if (!ant || r.tempo < ant) { gravarLS("bp-recorde", String(r.tempo)); recorde = `<p class="bp-recorde">Novo recorde neste navegador: ${fmtTempo(r.tempo)}</p>`; }
      else recorde = `<p class="bp-recorde">Seu recorde neste navegador: ${fmtTempo(ant)}</p>`;
    }
    ui.h.relatorio.innerHTML = `
<p class="bp-k">${completo ? "Todos os dados coletados" : "Relatório parcial"}</p>
<h2>Seu relatório de dados</h2>
<p class="bp-sub">Você coletou, contou e comparou. Isso tem nome: <b>análise exploratória de dados</b>, a primeira coisa que se faz em qualquer projeto de Ciência de Dados.</p>
${recorde}
<dl class="bp-kpis">
  <div><dt>Cubos de dados</dt><dd>${r.cubos}<small>/${CUBOS.length}</small></dd></div>
  <div><dt>Lugares visitados</dt><dd>${r.pontos}<small>/${PONTOS.length}</small></dd></div>
  <div><dt>Tempo</dt><dd>${fmtTempo(r.tempo)}</dd></div>
  <div><dt>Distância</dt><dd>${(r.dist / 1000).toFixed(2).replace(".", ",")}<small> km</small></dd></div>
  <div><dt>Velocidade média</dt><dd>${Math.round(r.velMedia)}<small> km/h</small></dd></div>
  <div><dt>Velocidade máxima</dt><dd>${Math.round(r.velMax)}<small> km/h</small></dd></div>
  <div><dt>Maior salto</dt><dd>${r.saltoMax.toFixed(1).replace(".", ",")}<small> m</small></dd></div>
  <div><dt>Coisas derrubadas</dt><dd>${r.derrubados}</dd></div>
  <div><dt>Missão, visão e valores</dt><dd>${r.mvv}<small>/3</small></dd></div>
</dl>
<h3 class="bp-h3">Cubos coletados por região</h3>
<ul class="bp-barras" aria-label="Cubos coletados por região, do maior para o menor">${barras}</ul>
<p class="bp-legenda"><span class="bp-sw bp-sw-v"></span> coletados <span class="bp-sw bp-sw-t"></span> disponíveis</p>
<div class="bp-acoes">
  ${completo ? "" : `<button type="button" class="bp-btn bp-prim" data-bp="continuar">Continuar coletando</button>`}
  <a class="bp-btn ${completo ? "bp-prim" : ""}" href="#cd">Conhecer Ciência de Dados</a>
  <a class="bp-btn" href="#ia">Conhecer Inteligência Artificial</a>
  <button type="button" class="bp-btn" data-bp="denovo">Jogar de novo</button>
</div>`;
    mostrarTela("fim");
  }

  // ==================================================================== o jogo 3D
  // Visual recriado a partir das técnicas do código aberto (licença MIT) do folio-2019 de Bruno Simon:
  // chão em gradiente preso à tela, materiais matcap, luz indireta vinda do chão, sombras falsas
  // coloridas com borda suave, revelação radial do mundo, áreas com cerca listrada animada,
  // antena com mola e objetos que se derrubam. Todas as texturas são geradas aqui, em tempo real.
  const PALETA = {
    chao: ["#ef8f2c", "#f9a53c", "#fcd89c", "#f3b05a"], // superior esq., superior dir., inferior dir., inferior esq.
    indireta: "#d0581c",
    sombra: "#a43a0b",
    bordaMatcap: "#f0862e",
  };
  function criarJogo() {
    const T = window.THREE;
    const movel = toque();
    const renderer = new T.WebGLRenderer({ antialias: !movel || devicePixelRatio < 2, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, movel ? 1.6 : 2));
    ui.palco.appendChild(renderer.domElement);

    const YAW = 0.66, ELEV = 0.6;
    const cena = new T.Scene();
    const cam = new T.PerspectiveCamera(40, 1, 1, 1400);
    const SOL = { x: 0.667, z: -0.707 }; // direção em que as sombras se deslocam por unidade de altura

    // ---------- chão em gradiente preso à tela (fundo infinito)
    const chao = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
      uniforms: { uTL: { value: new T.Color(PALETA.chao[0]) }, uTR: { value: new T.Color(PALETA.chao[1]) }, uBR: { value: new T.Color(PALETA.chao[2]) }, uBL: { value: new T.Color(PALETA.chao[3]) }, uInvVP: { value: new T.Matrix4() }, uCam: { value: new T.Vector3() } },
      vertexShader: "varying vec2 vUv; varying vec2 vNdc; void main(){ vUv = uv; vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }",
      fragmentShader: "uniform vec3 uTL, uTR, uBR, uBL; uniform mat4 uInvVP; uniform vec3 uCam; varying vec2 vUv; varying vec2 vNdc;" + "AMB_GLSL_AQUI" + "void main(){ vec3 cima = mix(uTL, uTR, vUv.x); vec3 baixo = mix(uBL, uBR, vUv.x); vec3 c = mix(baixo, cima, vUv.y); vec4 p = uInvVP * vec4(vNdc, 1.0, 1.0); p /= p.w; vec3 dir = normalize(p.xyz - uCam); vec3 wp = uCam + dir * (-uCam.y / min(dir.y, -0.001)); gl_FragColor = vec4(ambiente(c, wp, vec3(0.0, 1.0, 0.0), 0.88), 1.0); }",
      depthWrite: false, depthTest: false,
    }));
    chao.frustumCulled = false; chao.renderOrder = -10; cena.add(chao);

    // ---------- matcaps gerados por pixel
    const LD = new T.Vector3(-0.5, 0.62, 0.6).normalize();
    const ENV = new T.Color(PALETA.bordaMatcap);
    const cacheMatcap = {};
    function texMatcap(hex) {
      if (cacheMatcap[hex]) return cacheMatcap[hex];
      const N = 96, c = document.createElement("canvas"); c.width = c.height = N;
      const ctx = c.getContext("2d"), img = ctx.createImageData(N, N), px = img.data, b = new T.Color(hex);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        let nx = ((i + 0.5) / N) * 2 - 1, ny = 1 - ((j + 0.5) / N) * 2; const r2 = nx * nx + ny * ny;
        if (r2 > 1) { const r = Math.sqrt(r2); nx /= r; ny /= r; }
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const k = Math.pow(clamp((nx * LD.x + ny * LD.y + nz * LD.z) * 0.5 + 0.5, 0, 1), 1.4);
        // sombra quente (o ambiente é laranja), luz quase branca
        let R = b.r * lerp(0.8, 1.04, k), G = b.g * lerp(0.6, 1.02, k), B = b.b * lerp(0.5, 1.0, k);
        const brilho = Math.pow(k, 3.2) * 0.22; R = lerp(R, 1, brilho); G = lerp(G, 1, brilho); B = lerp(B, 0.97, brilho);
        const aro = Math.pow(1 - nz, 2) * clamp(-ny * 0.75 + nx * 0.45 + 0.15, 0, 1) * 0.42;
        R = lerp(R, ENV.r, aro); G = lerp(G, ENV.g * 0.85, aro); B = lerp(B, ENV.b * 0.6, aro);
        const o = (j * N + i) * 4; px[o] = clamp(R, 0, 1) * 255; px[o + 1] = clamp(G, 0, 1) * 255; px[o + 2] = clamp(B, 0, 1) * 255; px[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return (cacheMatcap[hex] = new T.CanvasTexture(c));
    }
    // uniformes compartilhados por todos os materiais matcap
    // (o r128 não envia viewMatrix para MeshMatcapMaterial, então a matriz da câmera vai num uniforme próprio)
    const U = { uReveal: { value: 0 }, uCentro: { value: new T.Vector2(66, 22) }, uInd: { value: new T.Color(PALETA.indireta) }, uVista: { value: cam.matrixWorldInverse } };
    // ambiente: noite (com faróis e luz nos lugares), neve no topo das coisas, chão molhado, relâmpago e vento nas árvores
    const AU = {
      uNoite: { value: 0 }, uNeve: { value: 0 }, uMolhado: { value: 0 }, uRelampago: { value: 0 }, uTempo: { value: 0 }, uVento: { value: 0 },
      uFarol: { value: new T.Vector4(0, 0, 0, 1) }, uPostes: { value: PONTOS.slice(0, 11).map((p) => new T.Vector2(p.g[0], p.g[1])).concat([new T.Vector2(66, 22)]) },
    };
    const AMB_GLSL = `
uniform float uNoite, uNeve, uMolhado, uRelampago; uniform vec4 uFarol; uniform vec2 uPostes[12];
vec3 ambiente(vec3 c, vec3 wp, vec3 n, float kNeve) {
  float up = clamp((n.y - 0.35) * 2.5, 0.0, 1.0);
  float baixo = 1.0 - step(0.75, wp.y);
  c = mix(c, vec3(0.95, 0.97, 1.0), uNeve * up * mix(0.9, kNeve, baixo));
  c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))), uMolhado * 0.28) * (1.0 - uMolhado * 0.16);
  vec3 l = c * mix(vec3(1.0), vec3(0.24, 0.28, 0.5), uNoite);
  if (uNoite > 0.01) {
    vec2 d = wp.xz - uFarol.xy; float al = dot(d, uFarol.zw); float lat = length(d - uFarol.zw * al);
    float cone = smoothstep(34.0, 6.0, al) * smoothstep(-1.0, 2.0, al) * (1.0 - smoothstep(1.1 + al * 0.3, 2.6 + al * 0.52, lat));
    float hz = clamp(1.0 - wp.y / 7.0, 0.0, 1.0);
    float pool = 0.0; for (int i = 0; i < 12; i++) { vec2 q = wp.xz - uPostes[i]; pool += exp(-dot(q, q) / 110.0); }
    l += c * (vec3(1.0, 0.93, 0.76) * cone * 1.25 * hz * (1.0 - 0.5 * uNeve) + vec3(1.0, 0.7, 0.4) * min(pool, 1.2) * 0.6) * uNoite;
  }
  return l + uRelampago * vec3(0.5, 0.56, 0.72) * c;
}
`;
    Object.assign(chao.material.uniforms, AU);
    chao.material.fragmentShader = chao.material.fragmentShader.replace("AMB_GLSL_AQUI", AMB_GLSL);
    function injetar(sh) {
      sh.uniforms.uReveal = U.uReveal; sh.uniforms.uCentro = U.uCentro; sh.uniforms.uInd = U.uInd; sh.uniforms.uVista = U.uVista;
      Object.assign(sh.uniforms, AU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uReveal; uniform vec2 uCentro; uniform mat4 uVista; uniform float uTempo, uVento; varying vec3 vWPos; varying vec3 vWNorm;")
        .replace("#include <project_vertex>", [
          "vec4 wp = vec4( transformed, 1.0 );",
          "#ifdef USE_INSTANCING", "wp = instanceMatrix * wp;", "#endif",
          "wp = modelMatrix * wp;",
          "float rd = length( wp.xz - uCentro );",
          "float rp = clamp( ( uReveal * 430.0 - rd ) / 34.0, 0.0, 1.0 );",
          "wp.y -= ( 1.0 - rp ) * ( 1.0 - rp ) * 16.0;",
          "#ifdef VENTO",
          "float bal = uVento * pow( max( wp.y - 0.3, 0.0 ), 1.3 ) * ( 0.07 + 0.05 * sin( uTempo * 2.6 + wp.x * 0.13 + wp.z * 0.11 ) );",
          "wp.x += bal * 0.8; wp.z -= bal * 0.6;",
          "#endif",
          "vWPos = wp.xyz;",
          "vec3 wn = objectNormal;",
          "#ifdef USE_INSTANCING", "wn = mat3( instanceMatrix ) * wn;", "#endif",
          "vWNorm = normalize( mat3( modelMatrix ) * wn );",
          "vec4 mvPosition = uVista * wp;",
          "gl_Position = projectionMatrix * mvPosition;",
        ].join("\n"));
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uInd; varying vec3 vWPos; varying vec3 vWNorm;" + AMB_GLSL)
        .replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", [
          "if ( vWPos.y < -0.02 ) discard;",
          "float iDist = pow( clamp( 1.0 - vWPos.y / 5.5, 0.0, 1.0 ) * 0.5, 2.0 );",
          "float iAng = pow( clamp( ( dot( normalize( vWNorm ), vec3( 0.0, -1.0, 0.0 ) ) + 0.6 ) * 1.5, 0.0, 1.0 ), 1.0 );",
          "outgoingLight = mix( outgoingLight, uInd, clamp( iDist * iAng * 2.2, 0.0, 0.6 ) );",
          "vec3 nW = normalize( vWNorm );",
          "outgoingLight = ambiente( outgoingLight, vWPos, nW, 0.45 );",
          "#ifdef JANELA",
          "if ( uNoite > 0.01 && abs( nW.y ) < 0.2 && vWPos.y > 2.4 ) {",
          "  float u = ( vWPos.x + vWPos.z ) / 2.4, v = vWPos.y / 1.7; vec2 cel = floor( vec2( u, v ) ); vec2 f = fract( vec2( u, v ) );",
          "  float h = fract( sin( dot( cel, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );",
          "  float w = step( 0.22, f.x ) * step( f.x, 0.78 ) * step( 0.28, f.y ) * step( f.y, 0.78 ) * step( 0.42, h );",
          "  outgoingLight = mix( outgoingLight, vec3( 1.0, 0.82, 0.48 ) * ( 0.85 + 0.15 * h ), w * uNoite * 0.92 );",
          "}",
          "#endif",
          "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
        ].join("\n"));
    }
    const mats = {};
    function mat(hex, o = {}) {
      const k = [hex, o.op ?? 1, o.map ? o.map.uuid : "", o.lados ? 1 : 0, o.vento ? 1 : 0, o.janela ? 1 : 0].join("|");
      if (mats[k]) return mats[k];
      const m = new T.MeshMatcapMaterial({ matcap: texMatcap(hex), map: o.map || null, transparent: (o.op ?? 1) < 1, opacity: o.op ?? 1, side: o.lados ? T.DoubleSide : T.FrontSide });
      m.onBeforeCompile = injetar;
      if (o.vento || o.janela) { m.defines = {}; if (o.vento) m.defines.VENTO = ""; if (o.janela) m.defines.JANELA = ""; }
      return (mats[k] = m);
    }
    // materiais que aparecem junto com a revelação do mundo
    const surgem = [];
    function injetarBasica(sh) {
      Object.assign(sh.uniforms, AU);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvec4 bwp = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nbwp = instanceMatrix * bwp;\n#endif\nvWPos = ( modelMatrix * bwp ).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPos;" + AMB_GLSL)
        .replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "gl_FragColor = vec4( ambiente( outgoingLight, vWPos, vec3( 0.0, 1.0, 0.0 ), 0.5 ), diffuseColor.a );");
    }
    function basica(cor, op = 1, extra = {}) { const m = new T.MeshBasicMaterial(Object.assign({ color: cor, transparent: true, opacity: 0, depthWrite: false }, extra)); m.onBeforeCompile = injetarBasica; surgem.push([m, op]); return m; }

    // ---------- sombras falsas (borda suave, cor quente)
    const sombraTex = (() => {
      const N = 64, c = document.createElement("canvas"); c.width = c.height = N;
      const ctx = c.getContext("2d"), img = ctx.createImageData(N, N), px = img.data, sc = new T.Color(PALETA.sombra), F = 0.35;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, v = (j + 0.5) / N;
        const cx = clamp(u, F, 1 - F), cy = clamp(v, F, 1 - F);
        let s = clamp(1 - Math.hypot(u - cx, v - cy) / F, 0, 1);
        s = -0.5 * (Math.cos(Math.PI * s) - 1);
        const o = (j * N + i) * 4; px[o] = sc.r * 255; px[o + 1] = sc.g * 255; px[o + 2] = sc.b * 255; px[o + 3] = s * 255;
      }
      ctx.putImageData(img, 0, 0); return new T.CanvasTexture(c);
    })();
    const sombraG = new T.PlaneGeometry(1, 1); sombraG.rotateX(-Math.PI / 2);
    const sombraEstMat = basica(0xffffff, 0.62, { map: sombraTex });
    const sombraDinMat = basica(0xffffff, 0.68, { map: sombraTex });
    const sombrasEst = [];
    function sombraDin(w, d) { const m = new T.Mesh(sombraG, sombraDinMat); m.scale.set(w, 1, d); m.renderOrder = 1; cena.add(m); return m; }

    const estaticos = []; // colisores: {t:'b', x0,z0,x1,z1} ou {t:'c', x,z,r}
    const reservas = [];
    const FT = [-352, 273, -262, 312]; // quadra da Flor da Terra (bosque e parquinho)
    const animados = [], extrasArv = []; // coisas que se mexem sozinhas; árvores extras
    const carrosParados = [];
    const rampas = [], ressaltos = [], lombadas = [];
    function caixa(w, h, d, hex, x, y, z, o = {}) {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), o.material || mat(hex, { janela: h + y >= 4 && o.janela !== false }));
      m.position.set(x, y + h / 2, z);
      cena.add(m);
      if (o.colide !== false) { estaticos.push({ t: "b", x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2, h: y + h }); reservas.push([x - w / 2 - 3, z - d / 2 - 3, x + w / 2 + 3, z + d / 2 + 3]); }
      if (o.sombra !== false && h + y > 1.2) sombrasEst.push([x, z, w, d, h + y]);
      return m;
    }
    function cilindro(r, h, hex, x, y, z, o = {}) {
      const m = new T.Mesh(new T.CylinderGeometry(o.rt ?? r, r, h, o.seg || 20), mat(hex));
      m.position.set(x, y + h / 2, z); cena.add(m);
      if (o.colide !== false) { estaticos.push({ t: "c", x, z, r, h: y + h }); reservas.push([x - r - 3, z - r - 3, x + r + 3, z + r + 3]); }
      if (o.sombra !== false && h + y > 1.2) sombrasEst.push([x, z, r * 1.6, r * 1.6, h + y]);
      return m;
    }

    // ---------- textos no chão
    function texTexto(linhas, o) {
      const c = document.createElement("canvas"), s = o.escala || 4, ctx = c.getContext("2d");
      const tam = (i) => (i && !o.uniforme ? o.tam * 0.6 : o.tam), peso = (i) => (i && !o.uniforme ? 600 : o.peso || 800);
      const fonte = (i) => `${peso(i)} ${tam(i) * s}px ${o.fonte || "Inter, \"Segoe UI\", system-ui, sans-serif"}`;
      const larg = Math.max(...linhas.map((l, i) => { ctx.font = fonte(i); return ctx.measureText(l).width; }));
      const pad = (o.pad ?? 8) * s;
      c.width = Math.ceil(larg + pad * 2); c.height = Math.ceil(pad * 2 + linhas.reduce((a, l, i) => a + tam(i) * s * 1.12, 0));
      ctx.fillStyle = o.cor || "#fff"; ctx.textBaseline = "top"; ctx.textAlign = o.alinhar || "left";
      let y = pad;
      linhas.forEach((l, i) => { ctx.font = fonte(i); ctx.fillText(l, o.alinhar === "center" ? c.width / 2 : pad, y); y += tam(i) * s * 1.12; });
      const tx = new T.CanvasTexture(c); tx.anisotropy = 4;
      return { tx, w: c.width / s, h: c.height / s };
    }
    function textoChao(linhas, o, x, z, rot = 0) {
      const { tx, w, h } = texTexto(linhas, o);
      const k = o.mundo || 0.2;
      const m = new T.Mesh(new T.PlaneGeometry(w * k, h * k), basica(0xffffff, o.opacidade ?? 0.85, { map: tx }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = rot + YAW; m.position.set(x, o.y ?? 0.4, z); m.renderOrder = 3; cena.add(m); return m;
    }
    function quebrar(t, max) { const out = []; let l = ""; t.split(" ").forEach((p) => { if ((l + " " + p).trim().length > max && l) { out.push(l); l = p; } else l = (l + " " + p).trim(); }); if (l) out.push(l); return out; }

    function faixaPolilinha(pts, larg, material, y) {
      const pos = [], idx = [], nor = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(pts[i][0] - dz * larg / 2, y, pts[i][1] + dx * larg / 2, pts[i][0] + dz * larg / 2, y, pts[i][1] - dx * larg / 2);
        nor.push(0, 1, 0, 0, 1, 0);
        if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
      }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
      const m = new T.Mesh(g, material); cena.add(m); return m;
    }
    const avPts = [];
    // limite do território: linha tracejada no chão
    (() => {
      const m = basica(0xffffff, 0.45); const g = new T.PlaneGeometry(3, 0.5);
      const seg = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 6); for (let i = 0; i <= n; i++) { const t = i / n, s = new T.Mesh(g, m); s.rotation.x = -Math.PI / 2; s.rotation.z = Math.atan2(-(z1 - z0), x1 - x0); s.position.set(lerp(x0, x1, t), 0.05, lerp(z0, z1, t)); cena.add(s); } };
      seg(LIM.x0, LIM.z0, LIM.x1, LIM.z0); seg(LIM.x1, LIM.z0, LIM.x1, LIM.z1); seg(LIM.x1, LIM.z1, LIM.x0, LIM.z1); seg(LIM.x0, LIM.z1, LIM.x0, LIM.z0);
    })();

    // ---------- mapa do masterplan: ruas, calçadas, quadras, lotes e construções
    const R = rng(7);
    const dum = new T.Object3D(), corTmp = new T.Color();
    const pertoDePonto = (x, z, m) => PONTOS.some((p) => Math.hypot(p.g[0] - x, p.g[1] - z) < m);
    const reservado = (x, z, m = 0) => reservas.some((r) => dentro(x, z, r, m));
    const MAPA = (window.__BP_CAMPUS__ && window.__BP_CAMPUS__.mapa) || { ruas: [], calc: [], areas: [], lotes: [], ilhas: [], nomes: [] };
    const anel = (f) => { const p = []; for (let k = 0; k < f.length; k += 2) p.push(new T.Vector2(f[k], -f[k + 1])); return p; };
    function malhaPlana(polis, hex, y, ordem) { // polígonos (com furos) deitados no chão, numa malha só
      const formas = polis.map((rings) => { const sh = new T.Shape(anel(rings[0])); rings.slice(1).forEach((h) => sh.holes.push(new T.Path(anel(h)))); return sh; });
      if (!formas.length) return null;
      const g = new T.ShapeGeometry(formas); g.rotateX(-Math.PI / 2);
      const m = new T.Mesh(g, mat(hex)); m.position.y = y; if (ordem) m.renderOrder = ordem; cena.add(m); return m;
    }
    const COR_AREA = { mata: 0x5f9e4a, praca: 0xe8dcc0, viveiro: 0xa9cf7e, prati: 0xd9d3c4, condominio: 0xd9d3c4, vendas: 0xd9d3c4, campus: 0xbfe0a4, ifpr: 0xb4d99a, hospital: 0xc7e3ad, reservatorio: 0xc7e3ad, ufpr: 0xc7e3ad, tisserand: 0xd9d3c4, queijaria: 0xd9d3c4 };
    const porCor = new Map();
    MAPA.areas.forEach(([t, f]) => { if (t === "base") return; const c = COR_AREA[t] || 0xbfe0a4; (porCor.get(c) || porCor.set(c, []).get(c)).push([f]); });
    malhaPlana(MAPA.areas.filter(([t]) => t === "base").map(([, f]) => [f]), 0xc9e2b0, 0.25); // gramado dentro da rua perimetral
    porCor.forEach((lista, c) => malhaPlana(lista, c, 0.27));
    malhaPlana(MAPA.ruas, 0x60646c, 0.285);
    malhaPlana(MAPA.calc, 0xf3ead8, 0.29);
    // ilhas das rotatórias: gramado elevado (dá para pular por cima)
    MAPA.ilhas.forEach(([x, z, r]) => {
      if (r < 1.2) return;
      cilindro(r, 0.6, 0x3fae5c, x, 0, z, { seg: 28, sombra: false, colide: false });
      if (r > 4) ressaltos.push({ x, z, r, h: 0.9, borda: Math.min(1.6, r * 0.4) });
    });
    // lotes: placas coloridas pela zona do masterplan (universitário, residencial, comércio, indústria)
    construirPredios();
    const COR_LOTE = { univ: 0x9db9e6, resid: 0xe6d23c, com: 0xd8424c, ind: 0xbf4cb3, canteiro: 0x7fbf6a };
    const imLote = new T.InstancedMesh(new T.BoxGeometry(1, 0.1, 1), mat(0xffffff), MAPA.lotes.length);
    const casas = [];
    MAPA.lotes.forEach(([x, z, w, d, a, zn], i) => {
      const noFT = x > FT[0] && x < FT[2] && z > FT[1] && z < FT[3]; dum.position.set(x, 0.255, z); dum.rotation.set(0, -a, 0); dum.scale.set(noFT ? 0.001 : Math.max(0.5, w - 0.5), 1, noFT ? 0.001 : Math.max(0.5, d - 0.5)); dum.updateMatrix(); imLote.setMatrixAt(i, dum.matrix);
      corTmp.setHex(COR_LOTE[zn] || 0x9db9e6).offsetHSL(0, 0, (R() - 0.5) * 0.06); imLote.setColorAt(i, corTmp);
      if (zn === "canteiro" || reservado(x, z, 2) || pertoDePonto(x, z, 12) || CUBOS.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 7)) return;
      if (MVV.some((m) => Math.abs(m.x - x) < 14 && z > -125 && z < -60)) return;
      const r = R(), longo = Math.max(w, d), curto = Math.min(w, d); if (curto < 4.5) return;
      const ang = -a + (w >= d ? Math.PI / 2 : 0); // lado comprido da construção ao longo do lote
      if (zn === "univ" && r < 0.09 && longo > 11) casas.push([x, z, ang, "torre", R()]);
      else if (zn === "ind" && r < 0.42) casas.push([x, z, ang, "galpao", R(), curto, longo]);
      else if (zn === "com" && r < 0.5) casas.push([x, z, ang, "loja", R()]);
      else if ((zn === "univ" || zn === "resid") && r < 0.62) casas.push([x, z, ang, "casa", R()]);
    });
    cena.add(imLote);
    const telhas = [0x9E2238, 0x642032, 0xb0603a, 0x6d7380];
    const tipoCasa = (t) => casas.filter((c) => c[3] === t);
    { // casas: caixa + telhado de duas águas, viradas para a rua
      const lista = tipoCasa("casa"), imCasa = new T.InstancedMesh(new T.BoxGeometry(4.2, 3.2, 5), mat(0xf4ede0), lista.length), imTelh = new T.InstancedMesh(new T.CylinderGeometry(2.7, 2.7, 5.4, 3), mat(0xffffff), lista.length);
      lista.forEach(([x, z, ang, , r], i) => {
        dum.rotation.order = "XYZ"; dum.position.set(x, 1.9, z); dum.rotation.set(0, ang, 0); dum.scale.set(1, 1, 1); dum.updateMatrix(); imCasa.setMatrixAt(i, dum.matrix);
        dum.rotation.order = "YXZ"; dum.position.set(x, 4.1, z); dum.rotation.set(-Math.PI / 2, ang + Math.PI / 2, 0); dum.scale.set(1, 1, 0.45); dum.updateMatrix(); imTelh.setMatrixAt(i, dum.matrix); dum.rotation.order = "XYZ";
        imTelh.setColorAt(i, corTmp.setHex(telhas[Math.floor(r * 4) % 4]));
        estaticos.push({ t: "c", x, z, r: 2.6, h: 5.5 }); sombrasEst.push([x, z, 4.6, 4.6, 5]);
      });
      cena.add(imCasa, imTelh);
    }
    { // prédios de apartamentos no loteamento universitário
      const lista = tipoCasa("torre"), im = new T.InstancedMesh(new T.BoxGeometry(5, 1, 9), mat(0xffffff, { janela: true }), lista.length);
      lista.forEach(([x, z, ang, , r], i) => {
        const h = 10 + r * 16; dum.position.set(x, h / 2 + 0.3, z); dum.rotation.set(0, ang, 0); dum.scale.set(1, h, 1); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
        im.setColorAt(i, corTmp.setHex(0xf4ede0).offsetHSL(0, 0, -r * 0.1));
        estaticos.push({ t: "c", x, z, r: 3.6, h: h + 0.3 }); sombrasEst.push([x, z, 6, 6, h]);
      });
      cena.add(im);
    }
    { // lojas: caixa com toldo colorido
      const lista = tipoCasa("loja"), im = new T.InstancedMesh(new T.BoxGeometry(5, 4, 7), mat(0xf8f0df), lista.length), imT = new T.InstancedMesh(new T.BoxGeometry(5.4, 0.5, 2), mat(0xffffff), lista.length);
      lista.forEach(([x, z, ang, , r], i) => {
        dum.position.set(x, 2.3, z); dum.rotation.set(0, ang, 0); dum.scale.set(1, 1, 1); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
        dum.position.set(x + Math.sin(ang) * 3.8, 3.4, z + Math.cos(ang) * 3.8); dum.updateMatrix(); imT.setMatrixAt(i, dum.matrix);
        imT.setColorAt(i, corTmp.setHex([0xd8424c, 0xfbbd3c, 0x642032, 0x2f6db5][Math.floor(r * 4) % 4]));
        estaticos.push({ t: "c", x, z, r: 3, h: 4.3 }); sombrasEst.push([x, z, 5.5, 7, 4.3]);
      });
      cena.add(im, imT);
    }
    { // galpões industriais com telhado em arco
      const lista = tipoCasa("galpao"), im = new T.InstancedMesh(new T.BoxGeometry(1, 5, 1), mat(0xefeae0), lista.length), imT = new T.InstancedMesh(new T.BoxGeometry(1, 0.7, 1), mat(0x7d8792), lista.length);
      lista.forEach(([x, z, ang, , r, curto, longo], i) => {
        const w = Math.min(curto - 1.2, 9), d = Math.min(longo - 2, 16);
        dum.position.set(x, 2.8, z); dum.rotation.set(0, ang, 0); dum.scale.set(w, 1, d); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
        dum.position.set(x, 5.6, z); dum.scale.set(w + 0.6, 1, d + 0.6); dum.updateMatrix(); imT.setMatrixAt(i, dum.matrix);
        estaticos.push({ t: "c", x, z, r: Math.min(w, d) / 2 + 0.6, h: 7 }); sombrasEst.push([x, z, w, d, 6]);
      });
      cena.add(im, imT);
    }

    // ---------- árvores
    const arvores = [];
    const Ra = rng(11);
    const livre = (x, z, m) => !reservado(x, z, m) && !pertoDePonto(x, z, 9) && !CUBOS.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 4) && !estaticos.some((e) => (e.t === "b" ? dentro(x, z, [e.x0, e.z0, e.x1, e.z1], 1.5) : Math.hypot(e.x - x, e.z - z) < e.r + 1.5));
    const dentroPoli = (x, z, f) => { let c = false; for (let i = 0, j = f.length - 2; i < f.length; j = i, i += 2) { const xi = f[i], zi = f[i + 1], xj = f[j], zj = f[j + 1]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    MAPA.areas.forEach(([t, f]) => { // mata nativa bem fechada e praças arborizadas
      if (t !== "mata" && t !== "praca") return;
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; for (let k = 0; k < f.length; k += 2) { x0 = Math.min(x0, f[k]); x1 = Math.max(x1, f[k]); z0 = Math.min(z0, f[k + 1]); z1 = Math.max(z1, f[k + 1]); }
      const passo = t === "mata" ? 7.5 : 9;
      for (let x = x0 + 3; x < x1; x += passo) for (let z = z0 + 3; z < z1; z += passo) {
        const px = x + (Ra() - 0.5) * passo * 0.8, pz = z + (Ra() - 0.5) * passo * 0.8;
        if (!dentroPoli(px, pz, f) || !livre(px, pz, 1)) continue;
        arvores.push([px, pz, t === "mata" ? 0.85 + Ra() * 0.7 : 0.7 + Ra() * 0.3, Ra()]);
      }
    });
    MAPA.lotes.forEach(([x, z, w, d, a, zn]) => { // árvores nos canteiros centrais das avenidas
      if (zn !== "canteiro" || Math.max(w, d) < 18 || Math.min(w, d) < 1.5) return;
      const L = Math.max(w, d), ux = w >= d ? Math.cos(a) : -Math.sin(a), uz = w >= d ? Math.sin(a) : Math.cos(a);
      for (let k = -L / 2 + 6; k < L / 2 - 4; k += 14) { const px = x + ux * k, pz = z + uz * k; if (livre(px, pz, 0)) arvores.push([px, pz, 0.6 + Ra() * 0.2, Ra()]); }
    });
    if (window.__BP_CAMPUS__) window.__BP_CAMPUS__.arvores.forEach(([x, z, s]) => {
      if (estaticos.some((e) => e.t === "b" && dentro(x, z, [e.x0, e.z0, e.x1, e.z1], 1))) return;
      if (CUBOS.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 4) || PONTOS.some((p) => Math.abs(p.g[0] - x) < 8 && Math.abs(p.g[1] - z) < 8)) return;
      arvores.push([x, z, clamp(s, 0.6, 1.1), Ra()]);
    });
    extrasArv.forEach(([x, z, s]) => { if (estaticos.some((e) => (e.t === "b" ? dentro(x, z, [e.x0, e.z0, e.x1, e.z1], 1.5) : Math.hypot(e.x - x, e.z - z) < e.r + 1.5)) || CUBOS.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 4)) return; arvores.push([x, z, s, Ra()]); });
    const imTronco = new T.InstancedMesh(new T.CylinderGeometry(0.35, 0.5, 2.4, 6), mat(0x8a5a3a, { vento: 1 }), arvores.length);
    const imCopa = new T.InstancedMesh(new T.IcosahedronGeometry(2.4, 0), mat(0xffffff, { vento: 1 }), arvores.length);
    // árvores com física: dá para atropelar (elas tombam na direção do carro)
    const arvs = [], arvMexendo = new Set();
    arvores.forEach(([x, z, s, r], i) => {
      dum.position.set(x, 1.2 * s, z); dum.scale.set(s, s, s); dum.rotation.set(0, r * 6, 0); dum.updateMatrix(); imTronco.setMatrixAt(i, dum.matrix);
      dum.position.set(x, 3.6 * s, z); dum.updateMatrix(); imCopa.setMatrixAt(i, dum.matrix);
      imCopa.setColorAt(i, corTmp.setHSL(0.24 + r * 0.1, 0.55, 0.42 + r * 0.12));
      arvs.push({ x, z, s, r, i, si: sombrasEst.length, a: 0, va: 0, estado: 0, dx: 0, dz: 1 });
      sombrasEst.push([x, z, 4.6 * s, 4.6 * s, 4.5 * s]);
    });
    cena.add(imTronco, imCopa);

    // sombras estáticas numa só malha instanciada
    const imSombras = (() => {
      const im = new T.InstancedMesh(sombraG, sombraEstMat, sombrasEst.length);
      sombrasEst.forEach(([x, z, w, d, h], i) => {
        const off = h * 0.42;
        dum.position.set(x + SOL.x * off, 0.345, z + SOL.z * off); dum.rotation.set(0, 0, 0);
        dum.scale.set(w + 2.2 + h * 0.3, 1, d + 2.2 + h * 0.3); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
      });
      im.renderOrder = 1; cena.add(im); return im;
    })();
    const qA = new T.Quaternion(), qB = new T.Quaternion(), eixo = new T.Vector3(), vTmp = new T.Vector3(), EIXO_Y = new T.Vector3(0, 1, 0);
    function poseArvore(t) {
      eixo.set(t.dz, 0, -t.dx).normalize();
      qA.setFromAxisAngle(eixo, t.a); qB.setFromAxisAngle(EIXO_Y, t.r * 6); qA.multiply(qB);
      dum.scale.set(t.s, t.s, t.s); dum.quaternion.copy(qA);
      vTmp.set(0, 1.2 * t.s, 0).applyQuaternion(qA); dum.position.set(t.x + vTmp.x, vTmp.y, t.z + vTmp.z); dum.updateMatrix(); imTronco.setMatrixAt(t.i, dum.matrix);
      vTmp.set(0, 3.6 * t.s, 0).applyQuaternion(qA); dum.position.set(t.x + vTmp.x, vTmp.y, t.z + vTmp.z); dum.updateMatrix(); imCopa.setMatrixAt(t.i, dum.matrix);
      // a sombra se alonga para o lado em que a árvore caiu
      const k = Math.sin(t.a), off = 4.5 * t.s * 0.42 * (1 - k), base = 4.6 * t.s + 2.2 + 4.5 * t.s * 0.3 * (1 - k);
      dum.quaternion.setFromAxisAngle(EIXO_Y, Math.atan2(t.dx, t.dz));
      dum.position.set(t.x + t.dx * 3.2 * t.s * k + SOL.x * off, 0.345, t.z + t.dz * 3.2 * t.s * k + SOL.z * off);
      dum.scale.set(base * (1 - 0.3 * k), 1, base * (1 + 0.6 * k)); dum.updateMatrix(); imSombras.setMatrixAt(t.si, dum.matrix);
      dum.rotation.set(0, 0, 0); dum.scale.set(1, 1, 1);
    }
    function atualizarArvores() { imTronco.instanceMatrix.needsUpdate = imCopa.instanceMatrix.needsUpdate = imSombras.instanceMatrix.needsUpdate = true; }

    // ---------- nomes das ruas (do masterplan) e dos lugares
    MAPA.nomes.forEach(([n, x, z, rot]) => {
      let r = -rot; while (r - YAW > Math.PI / 2) r -= Math.PI; while (r - YAW < -Math.PI / 2) r += Math.PI; // sempre legível para a câmera
      textoChao([n.toUpperCase()], { tam: 20, cor: "#ffffff", mundo: 0.11, opacidade: 0.78 }, x, z, r - YAW);
    });
    [["HOSPITAL", 165, -128], ["CLÍNICAS", 198, -100], ["IFPR", 370, 2], ["TISSERAND", 151, 194], ["PRAÇA ISAAC NEWTON", 187, 240], ["MATA", -189, -63], ["RESERVATÓRIO", 126, -100], ["VIVEIRO", 205, 50]].forEach(([n, x, z]) =>
      textoChao([n], { tam: 22, cor: "#ffffff", mundo: 0.12, opacidade: 0.88, peso: 800 }, x, z));
    textoChao(["PR-182"], { tam: 26, cor: "#ffffff", pad: 4, mundo: 0.2 }, -45, -160, Math.PI / 2 - YAW);
    textoChao(["PR-182"], { tam: 26, cor: "#ffffff", pad: 4, mundo: 0.2 }, -45, 250, Math.PI / 2 - YAW);
    textoChao(["↑ Palotina 46 km", "Maripá 27 km · Assis Chateaubriand 36 km"], { tam: 18, cor: "#ffffff", mundo: 0.16 }, -10, -318);
    textoChao(["↓ Toledo 11 km", "Aeroporto 5 km · Cascavel 50 km"], { tam: 18, cor: "#ffffff", mundo: 0.16 }, -95, 398);
    textoChao(["5 milhões de metros quadrados · Toledo (PR)"], { tam: 22, cor: "#ffffff", mundo: 0.08, opacidade: 0.85 }, 20 + Math.sin(YAW) * 7, -72 + Math.cos(YAW) * 7);

    // ---------- áreas dos lugares (borda no chão + cerca listrada animada)
    const MEIA = 6.5;
    const bordaG = (() => { const s = new T.Shape(); s.moveTo(-MEIA, -MEIA); s.lineTo(MEIA, -MEIA); s.lineTo(MEIA, MEIA); s.lineTo(-MEIA, MEIA); s.lineTo(-MEIA, -MEIA); const h = new T.Path(); const q = MEIA - 0.5; h.moveTo(-q, -q); h.lineTo(-q, q); h.lineTo(q, q); h.lineTo(q, -q); h.lineTo(-q, -q); s.holes.push(h); const g = new T.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; })();
    const cercaG = (() => {
      const pos = [], uv = [], idx = []; const c = [[-MEIA, -MEIA], [MEIA, -MEIA], [MEIA, MEIA], [-MEIA, MEIA], [-MEIA, -MEIA]];
      for (let i = 0; i < 4; i++) { const b = i * 4; const [ax, az] = c[i], [bx, bz] = c[i + 1]; pos.push(ax, 0, az, bx, 0, bz, bx, 1, bz, ax, 1, az); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
    })();
    const areas = PONTOS.map((p, i) => {
      const grupo = new T.Group(); grupo.position.set(p.g[0], 0, p.g[1]); cena.add(grupo);
      const bordaM = basica(0xffffff, 0.6); const borda = new T.Mesh(bordaG, bordaM); borda.position.y = 0.38; borda.renderOrder = 3; grupo.add(borda);
      const cercaM = new T.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: T.DoubleSide,
        vertexShader: "varying vec3 vP; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: "uniform float uT, uA; varying vec3 vP; varying vec2 vUv; void main(){ float s = mod((vP.x + vP.z + vP.y - uT * 2.0) / 1.4 * 0.5, 1.0); s = step(s, 0.5) * 0.3; float b = max(step(1.0 - vUv.y, 0.1), step(vUv.y, 0.1)) * 0.65; float a = max(s, b) * uA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(1.0), a); }",
      });
      const cerca = new T.Mesh(cercaG, cercaM); cerca.scale.y = 0.01; cerca.position.y = 0.3; cerca.renderOrder = 4; grupo.add(cerca);
      textoChao([String(p.n)], { tam: 46, cor: "#ffffff", mundo: 0.14, opacidade: 0.92, pad: 2, alinhar: "center" }, p.g[0], p.g[1]);
      const nome = quebrar(p.t.replace(" · ", " "), 24);
      textoChao(nome, { tam: 17, cor: "#ffffff", mundo: 0.15, opacidade: 0.92, uniforme: true, alinhar: "center", peso: 800 }, p.g[0] + Math.sin(YAW) * 11.5, p.g[1] + Math.cos(YAW) * 11.5);
      return { p, i, bordaM, cercaM, cerca, alvo: 0, a: 0 };
    });

    // ---------- cubos de dados
    const texCubo = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 64, 64); x.strokeStyle = "#b8742a"; x.lineWidth = 3; x.strokeRect(3, 3, 58, 58);
      x.fillStyle = "#7c2433"; x.font = "700 18px 'IBM Plex Mono', monospace"; x.textAlign = "center"; x.fillText("01", 32, 28); x.fillText("10", 32, 48);
      return new T.CanvasTexture(c);
    })();
    const cuboG = new T.BoxGeometry(2.2, 2.2, 2.2), cuboM = mat(0xfbbd3c, { map: texCubo });
    const discoM = basica(0xffffff, 0.55);
    const cubos = CUBOS.map(([x, z, alto], i) => {
      const m = new T.Mesh(cuboG, cuboM); m.position.set(x, 2.2 + (alto || 0), z); cena.add(m);
      const luz = new T.Mesh(new T.RingGeometry(2.1, 2.6, 28), discoM); luz.rotation.x = -Math.PI / 2; luz.position.set(x, 0.39, z); luz.renderOrder = 3; cena.add(luz);
      const sb = sombraDin(2.8, 2.8);
      return { m, luz, sb, x, z, i, alto: alto || 0, zona: zonaDe(x, z), pego: false, anim: 0 };
    });
    const parts = [];
    const partG = new T.BoxGeometry(0.5, 0.5, 0.5), partM = mat(0xfbbd3c);
    for (let i = 0; i < 24; i++) { const m = new T.Mesh(partG, partM); m.visible = false; cena.add(m); parts.push({ m, vx: 0, vy: 0, vz: 0, v: 0 }); }
    function explodir(x, y, z) {
      let n = 0;
      for (const p of parts) { if (p.v > 0) continue; p.v = 0.9; p.m.visible = true; p.m.position.set(x, y, z); const a = Math.random() * 7, s = 6 + Math.random() * 8; p.vx = Math.cos(a) * s; p.vz = Math.sin(a) * s; p.vy = 6 + Math.random() * 10; if (++n >= 12) break; }
    }

    // ---------- objetos que dá para derrubar
    const props = [];
    const eTmp = new T.Euler(0, 0, 0, "YXZ"), mTmp = new T.Matrix4();
    function extY(p) { eTmp.set(p.rx, p.ry, p.rz, "YXZ"); mTmp.makeRotationFromEuler(eTmp); const e = mTmp.elements; return Math.abs(e[1]) * p.hx + Math.abs(e[5]) * p.hy + Math.abs(e[9]) * p.hz; }
    function mesclar(geos) {
      let n = 0; geos.forEach((g) => (n += g.attributes.position.count));
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      geos.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; });
      const r = new T.BufferGeometry(); r.setAttribute("position", new T.BufferAttribute(pos, 3)); r.setAttribute("normal", new T.BufferAttribute(nor, 3)); r.setAttribute("uv", new T.BufferAttribute(uv, 2)); return r;
    }
    const FONTE = {
      B: ["1111.", "1...1", "1111.", "1...1", "1111."], I: ["11111", "..1..", "..1..", "..1..", "11111"], O: [".111.", "1...1", "1...1", "1...1", ".111."],
      P: ["1111.", "1...1", "1111.", "1....", "1...."], A: [".111.", "1...1", "11111", "1...1", "1...1"], R: ["1111.", "1...1", "1111.", "1..1.", "1...1"], K: ["1...1", "1..1.", "111..", "1..1.", "1...1"],
    };
    const geoLetra = {};
    function letraG(ch) {
      if (geoLetra[ch]) return geoLetra[ch];
      const geos = []; FONTE[ch].forEach((ln, r) => [...ln].forEach((c, k) => { if (c === "1") { const g = new T.BoxGeometry(1.02, 1.02, 1.4).toNonIndexed(); g.translate((k - 2), (2 - r), 0); geos.push(g); } }));
      return (geoLetra[ch] = mesclar(geos));
    }
    const TIPOS = {
      cone: { hx: 0.75, hy: 0.95, hz: 0.75, r: 0.85, massa: 0.3 },
      caixa: { hx: 1, hy: 1, hz: 1, r: 1.15, massa: 0.6 },
      tijolo: { hx: 1.1, hy: 0.55, hz: 0.55, r: 1.05, massa: 0.45 },
      letra: { hx: 2.5, hy: 2.5, hz: 0.7, r: 2.3, massa: 1.3 },
      carrinho: { hx: 0.7, hy: 0.55, hz: 1.3, r: 1.15, massa: 1.5 },
      pino: { hx: 0.45, hy: 1.3, hz: 0.45, r: 0.55, massa: 0.22 },
      bola: { hx: 1.3, hy: 1.3, hz: 1.3, r: 1.35, massa: 1.2 },
      barril: { hx: 0.75, hy: 0.9, hz: 0.75, r: 0.85, massa: 0.5 },
      fardo: { hx: 1.1, hy: 1.1, hz: 1.1, r: 1.2, massa: 0.8 },
      cavalete: { hx: 1.6, hy: 0.6, hz: 0.25, r: 1.5, massa: 0.35 },
    };
    let pinG = null, cavG = null, listrasTex = null;
    const pinoG = () => pinG || (pinG = new T.LatheGeometry([[0, -1.3], [0.36, -1.3], [0.45, -0.85], [0.42, -0.25], [0.26, 0.3], [0.23, 0.6], [0.3, 0.92], [0.27, 1.17], [0.12, 1.29], [0, 1.3]].map(([x, y]) => new T.Vector2(x, y)), 14));
    const cavaleteG = () => cavG || (cavG = mesclar([new T.BoxGeometry(3.2, 0.5, 0.18).translate(0, 0.25, 0).toNonIndexed(), new T.BoxGeometry(0.15, 1.2, 0.5).translate(-1.3, 0, 0).toNonIndexed(), new T.BoxGeometry(0.15, 1.2, 0.5).translate(1.3, 0, 0).toNonIndexed()]));
    function texListras() {
      if (listrasTex) return listrasTex;
      const c = document.createElement("canvas"); c.width = 128; c.height = 32; const x = c.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 128, 32); x.fillStyle = "#d8424c";
      for (let i = -2; i < 8; i++) { x.beginPath(); x.moveTo(i * 24, 32); x.lineTo(i * 24 + 12, 32); x.lineTo(i * 24 + 28, 0); x.lineTo(i * 24 + 16, 0); x.closePath(); x.fill(); }
      return (listrasTex = new T.CanvasTexture(c));
    }
    let carG = null; const carrinhoG = () => carG || (carG = mesclar([new T.BoxGeometry(1.4, 0.6, 2.6).translate(0, -0.25, 0).toNonIndexed(), new T.BoxGeometry(1.2, 0.5, 1.3).translate(0, 0.3, -0.15).toNonIndexed()]));
    const vidroG = new T.BoxGeometry(1.24, 0.3, 1.34).translate(0, 0.33, -0.15);
    const coneG = new T.ConeGeometry(0.75, 1.9, 12), caixaG = new T.BoxGeometry(2, 2, 2), tijoloG = new T.BoxGeometry(2.18, 1.08, 1.08);
    function prop(tipo, x, y, z, o = {}) {
      let m;
      if (tipo === "cone") { m = new T.Mesh(coneG, mat(0xf2711c)); const f = new T.Mesh(new T.CylinderGeometry(0.42, 0.52, 0.35, 12), mat(0xf6f1e4)); m.add(f); }
      else if (tipo === "caixa") m = new T.Mesh(caixaG, mat(0xd29a5a));
      else if (tipo === "tijolo") m = new T.Mesh(tijoloG, mat(o.cor || 0xd0583c));
      else if (tipo === "pino") { m = new T.Mesh(pinoG(), mat(0xf6f1e8)); const f = new T.Mesh(new T.CylinderGeometry(0.235, 0.24, 0.16, 14), mat(0xd8424c)); f.position.y = 0.62; m.add(f); }
      else if (tipo === "bola") m = new T.Mesh(new T.SphereGeometry(1.3, 22, 16), mat(0x7c2433));
      else if (tipo === "barril") { m = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 1.8, 16), mat(o.cor || 0x2f6db5)); [-0.5, 0.5].forEach((y) => { const a = new T.Mesh(new T.CylinderGeometry(0.78, 0.78, 0.1, 16), mat(0x3a3a42)); a.position.y = y; m.add(a); }); }
      else if (tipo === "fardo") { const g = new T.CylinderGeometry(1.1, 1.1, 2.2, 14); g.rotateZ(Math.PI / 2); m = new T.Mesh(g, mat(0xe2bf5a)); }
      else if (tipo === "cavalete") { m = new T.Mesh(cavaleteG(), mat(0xffffff, { map: texListras() })); }
      else if (tipo === "carrinho") { m = new T.Mesh(carrinhoG(), mat(o.cor || 0xf0f0f0)); const v = new T.Mesh(vidroG, mat(0x2a2e38)); m.add(v); }
      else m = new T.Mesh(letraG(o.ch), mat(o.cor || 0xf6efe2));
      m.rotation.order = "YXZ"; cena.add(m);
      const tp = TIPOS[tipo];
      const p = Object.assign({ m, tipo, vx: 0, vy: 0, vz: 0, rx: 0, ry: o.ry || 0, rz: 0, wx: 0, wz: 0, sono: true }, tp);
      p.y = y + p.hy; p.x = x; p.z = z; p.x0 = x; p.y0 = p.y; p.z0 = z; p.ry0 = p.ry;
      p.sb = sombraDin(p.hx * 2 + 1.6, p.hz * 2 + 1.6);
      props.push(p); return p;
    }
    for (let i = 0; i < 10; i++) prop("cone", 176 + i * 5, 0.3, -86.5 + (i % 2) * 4.5); // zigue-zague na Av. Max Planck
    // boliche no gramado leste do campus (venha pelo sul e acerte os pinos)
    for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) prop("pino", 155 + (j - k / 2) * 1.5, 0.3, -36 - k * 1.6);
    prop("bola", 155, 0.3, -24);
    // barris no pátio do centro de distribuição e no condomínio industrial
    [[-86, 176], [-84.2, 176], [-82.4, 176], [-85.1, 177.7], [-83.3, 177.7], [-84.2, 179.4]].forEach(([x, z], i) => prop("barril", x, 0.3, z, { cor: [0x2f6db5, 0xd8424c, 0xfbbd3c][i % 3] }));
    [[-170, 196], [-168.3, 196], [-170, 197.8], [-168.3, 197.8]].forEach(([x, z], i) => prop("barril", x, 0.3, z, { cor: [0xd8424c, 0x2f6db5][i % 2] }));
    // fardos de feno empilhados na Smart Farm
    [[100, 96, 0], [100, 98.3, 0], [100, 100.6, 0], [100, 97.15, 2.2], [100, 99.45, 2.2], [100, 98.3, 4.4]].forEach(([x, z, y]) => prop("fardo", x, 0.3 + y, z));
    // cavaletes de obra na Av. Max Planck e perto da largada
    [[262, 133], [266, 137], [270, 141]].forEach(([x, z]) => prop("cavalete", x, 0.3, z, { ry: Math.PI / 2 })); // obra no Boulevard Peter Drucker

    // ---------- Missão, Visão e Valores: placas no asfalto da Av. Max Planck (passe por cima) e painéis ao lado
    function icone(ctx, k, cx, cy, r) {
      ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = "#2A0F17"; ctx.fillStyle = "#2A0F17"; ctx.lineWidth = r * 0.13; ctx.lineCap = "round";
      if (k === "missao") { [0.62, 0.36].forEach((f) => { ctx.beginPath(); ctx.arc(0, 0, r * f, 0, 7); ctx.stroke(); }); ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, 7); ctx.fill(); }
      else if (k === "visao") { ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(0, -r * 0.62, r * 0.7, 0); ctx.quadraticCurveTo(0, r * 0.62, -r * 0.7, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.28 : r * 0.64; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    function retArred(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function texPlaca(m) {
      const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
      retArred(x, 8, 8, 496, 496, 48); x.fillStyle = "#9E2238"; x.fill();
      retArred(x, 26, 26, 460, 460, 36); x.lineWidth = 10; x.strokeStyle = "#FAA822"; x.stroke();
      x.beginPath(); x.arc(256, 168, 82, 0, 7); x.fillStyle = "#FAA822"; x.fill(); icone(x, m.k, 256, 168, 82);
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "800 92px Inter, system-ui, sans-serif"; x.fillText(m.t.toUpperCase(), 256, 326);
      x.fillStyle = "#FAA822"; x.font = "700 30px Inter, system-ui, sans-serif"; x.fillText("FACULDADE DONADUZZI", 256, 404);
      const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
    }
    function texPainel(m) {
      const W = 1024, H = 600, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
      retArred(x, 0, 0, W, H, 40); x.fillStyle = "#F6F4E7"; x.fill();
      x.save(); retArred(x, 0, 0, W, H, 40); x.clip(); x.fillStyle = "#9E2238"; x.fillRect(0, 0, W, 150); x.restore();
      x.beginPath(); x.arc(92, 75, 50, 0, 7); x.fillStyle = "#FAA822"; x.fill(); icone(x, m.k, 92, 75, 50);
      x.fillStyle = "#fff"; x.textBaseline = "middle"; x.font = "800 74px Inter, system-ui, sans-serif"; x.fillText(m.t, 166, 80);
      x.fillStyle = "#101821"; x.textBaseline = "top";
      if (m.lista) {
        x.font = "700 38px Inter, system-ui, sans-serif";
        m.lista.forEach((v, i) => { const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, px = 60 + col * 490, py = 188 + row * 98;
          x.fillStyle = "#FAA822"; x.beginPath(); x.arc(px + 12, py + 22, 11, 0, 7); x.fill(); x.fillStyle = "#101821";
          quebrar(v, 18).forEach((l, j) => x.fillText(l, px + 36, py + j * 42)); });
      } else {
        x.font = "600 44px Inter, system-ui, sans-serif"; const ls = quebrar(m.txt, 38);
        ls.forEach((l, i) => x.fillText(l, 60, 190 + i * 58));
      }
      const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
    }
    const mvvObjs = MVV.map((m) => {
      // placa no chão
      const borda = new T.Mesh(new T.PlaneGeometry(11.6, 11.6), basica(0xfaa822, 0.35));
      borda.rotation.x = -Math.PI / 2; borda.rotation.z = YAW; borda.position.set(m.x, 0.37, m.z); borda.renderOrder = 3; cena.add(borda);
      const placa = new T.Mesh(new T.PlaneGeometry(10, 10), new T.MeshBasicMaterial({ map: texPlaca(m), transparent: true, depthWrite: false }));
      placa.rotation.x = -Math.PI / 2; placa.rotation.z = YAW; placa.position.set(m.x, 0.39, m.z); placa.renderOrder = 4; cena.add(placa);
      // painel ao lado da avenida, de frente para a câmera (dá para passar por baixo, entre os postes)
      const g = new T.Group(); g.position.set(m.x, 0, m.z - 21); g.rotation.y = YAW; g.scale.setScalar(1.35); cena.add(g);
      [-5.2, 5.2].forEach((dx) => {
        const p = new T.Mesh(new T.CylinderGeometry(0.28, 0.32, 10, 8), mat(0x3a3a42)); p.position.set(dx, 5, -0.7); g.add(p); // postes atrás do painel
        const lz = -0.7 * 1.35, wx = m.x + dx * 1.35 * Math.cos(YAW) + lz * Math.sin(YAW), wz = m.z - 21 - dx * 1.35 * Math.sin(YAW) + lz * Math.cos(YAW);
        estaticos.push({ t: "c", x: wx, z: wz, r: 0.6, h: 13 }); sombrasEst.push([wx, wz, 0.8, 0.8, 10]);
      });
      const fundo = new T.Mesh(new T.BoxGeometry(12, 7.2, 0.35), mat(0x9e2238)); fundo.position.set(0, 6.6, -0.2); g.add(fundo);
      const frente = new T.Mesh(new T.PlaneGeometry(11.6, 6.8), new T.MeshBasicMaterial({ map: texPainel(m) })); frente.position.set(0, 6.6, 0.0); g.add(frente);
      sombrasEst.push([m.x, m.z - 13, 12, 1.2, 10]);
      reservas.push([m.x - 9, m.z - 27, m.x + 9, m.z + 6]);
      return { m, placa, borda, a: 0 };
    });
    carrosParados.forEach(([x, z, rz, cor]) => prop("carrinho", x, 0.3, z, { ry: rz, cor: parseInt(cor.slice(1), 16) }));
    for (let c = 0; c < 4; c++) for (let i = 0; i < 4 - c; i++) for (let j = 0; j < 4 - c; j++) prop("caixa", -164 + i * 2.05 + c * 1.02, 0.3 + c * 2, 296 + j * 2.05 + c * 1.02);
    for (let i = 0; i < 6; i++) prop("cone", -62 + i * 6, 0, 96);
    for (let i = 0; i < 5; i++) prop("cone", 48 + i * 3.4, 0, 30);
    // muro de tijolos (o cubo de dados está atrás dele)
    for (let f = 0; f < 4; f++) for (let i = 0; i < (f % 2 ? 7 : 8); i++) prop("tijolo", 222 + i * 2.22 + (f % 2) * 1.11, 0.3 + f * 1.1, 40, { cor: f % 2 ? 0xc44a34 : 0xd0583c });
    // letras gigantes "BIOPARK" voltadas para a câmera
    const dirX = Math.cos(YAW), dirZ = -Math.sin(YAW);
    [..."BIOPARK"].forEach((ch, i) => { const o = (i - 3) * 5.4; prop("letra", 70 + dirX * o, 0.3, 44 + dirZ * o, { ch, ry: YAW, cor: ch === "I" || ch === "A" ? 0xfbbd3c : 0xf6efe2 }); });

    // ---------- carro
    const carro = new T.Group(), chassi = new T.Group(); carro.add(chassi); cena.add(carro);
    const pc = (g, hex, x, y, z) => { const m = new T.Mesh(g, mat(hex)); m.position.set(x, y, z); chassi.add(m); return m; };
    pc(new T.BoxGeometry(2.5, 0.85, 4.3), 0x9E2238, 0, 0.98, 0);
    pc(new T.BoxGeometry(0.5, 0.87, 4.32), 0xfbbd3c, 0, 0.98, 0);
    pc(new T.BoxGeometry(2.1, 0.95, 2.0), 0xf6efe2, 0, 1.88, -0.4);
    pc(new T.BoxGeometry(2.14, 0.5, 1.7), 0x2a2e38, 0, 1.98, -0.4);
    pc(new T.BoxGeometry(1.86, 0.5, 0.08), 0x2a2e38, 0, 1.98, 0.62);
    pc(new T.BoxGeometry(2.64, 0.36, 0.42), 0x3a3a42, 0, 0.72, 2.2);
    pc(new T.BoxGeometry(2.64, 0.36, 0.42), 0x3a3a42, 0, 0.72, -2.2);
    const farolM = new T.MeshBasicMaterial({ color: 0xfff1c0 });
    [-0.85, 0.85].forEach((x) => { const f = new T.Mesh(new T.BoxGeometry(0.5, 0.26, 0.1), farolM); f.position.set(x, 1.12, 2.16); chassi.add(f); });
    const freioM = new T.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.5 }), reM = new T.MeshBasicMaterial({ color: 0xffe889, transparent: true, opacity: 0.5 });
    [-0.85, 0.85].forEach((x) => { const f = new T.Mesh(new T.BoxGeometry(0.42, 0.24, 0.1), freioM); f.position.set(x, 1.12, -2.16); chassi.add(f); const r = new T.Mesh(new T.BoxGeometry(0.22, 0.24, 0.1), reM); r.position.set(x * 0.55, 1.12, -2.16); chassi.add(r); });
    const antena = new T.Group(); antena.position.set(-0.75, 2.36, -1.15); chassi.add(antena);
    const haste = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 2.4, 6), mat(0x3a3a42)); haste.position.y = 1.2; antena.add(haste);
    const bola = new T.Mesh(new T.SphereGeometry(0.24, 12, 10), mat(0xfbbd3c)); bola.position.y = 2.45; antena.add(bola);
    const rodaG = new T.CylinderGeometry(0.62, 0.62, 0.52, 16); rodaG.rotateZ(Math.PI / 2);
    const calotaG = new T.CylinderGeometry(0.3, 0.3, 0.54, 10); calotaG.rotateZ(Math.PI / 2);
    const rodas = [[-1.22, 1.42], [1.22, 1.42], [-1.22, -1.42], [1.22, -1.42]].map(([x, z]) => {
      const w = new T.Group(); w.position.set(x, 0.62, z); carro.add(w);
      const r = new T.Mesh(rodaG, mat(0x2e2e36)); r.add(new T.Mesh(calotaG, mat(0xf0e9da))); w.add(r);
      return { w, r, frente: z > 0, x, z };
    });
    const carroSombra = sombraDin(3.6, 5.6);

    // drone da Smart Farm
    const drone = new T.Group();
    drone.add(new T.Mesh(new T.BoxGeometry(1.4, 0.4, 1.4), mat(0x2e2e36)));
    const helices = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => { const b = new T.Mesh(new T.BoxGeometry(1.1, 0.12, 0.12), mat(0x2e2e36)); b.position.set(x * 0.5, 0, z * 0.5); b.rotation.y = Math.atan2(z, x); drone.add(b); const h = new T.Mesh(new T.BoxGeometry(1.3, 0.05, 0.18), mat(0xfbbd3c)); h.position.set(x * 0.95, 0.25, z * 0.95); drone.add(h); helices.push(h); });
    cena.add(drone);
    const droneSombra = sombraDin(2.6, 2.6);

    // ---------- chuva, neve e folhas: um só sistema de pontos animado na placa de vídeo
    const NP = 2600, CX = 170, CY = 46;
    const clima = (() => {
      const pos = new Float32Array(NP * 3), rnd = new Float32Array(NP);
      for (let i = 0; i < NP; i++) { pos[i * 3] = Math.random(); pos[i * 3 + 1] = Math.random(); pos[i * 3 + 2] = Math.random(); rnd[i] = Math.random(); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("aRnd", new T.BufferAttribute(rnd, 1));
      const m = new T.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uCentro: { value: new T.Vector3() }, uCaixa: { value: new T.Vector3(CX, CY, CX) }, uVel: { value: new T.Vector3(0, -40, 0) }, uTipo: { value: 0 }, uOp: { value: 0 }, uTam: { value: 1 }, uEsc: { value: 600 }, uNoiteP: { value: 0 } },
        vertexShader: `attribute float aRnd; uniform float uT, uTipo, uTam, uEsc; uniform vec3 uCentro, uCaixa, uVel; varying float vR;
void main(){ vec3 p = position * uCaixa + uVel * uT * (0.75 + 0.5 * aRnd);
  if (uTipo > 0.5 && uTipo < 1.5) { p.x += sin(uT * 1.3 + aRnd * 40.0) * 1.6; p.z += cos(uT * 1.1 + aRnd * 30.0) * 1.6; }
  if (uTipo > 1.5) { p.y += sin(uT * 3.0 + aRnd * 20.0) * 1.2; }
  p = mod(p - uCentro + uCaixa * 0.5, uCaixa) + uCentro - uCaixa * 0.5; p.y = mod(p.y, uCaixa.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = uTam * (0.6 + aRnd * 0.8) * uEsc / -mv.z; vR = aRnd; }`,
        fragmentShader: `uniform float uTipo, uOp, uNoiteP, uT; varying float vR;
void main(){ vec2 pc = gl_PointCoord - 0.5; float a; vec3 cor;
  if (uTipo < 0.5) { a = (1.0 - smoothstep(0.025, 0.06, abs(pc.x + pc.y * 0.12))) * (1.0 - smoothstep(0.3, 0.5, abs(pc.y))); cor = vec3(0.86, 0.92, 1.0); }
  else if (uTipo < 1.5) { a = 1.0 - smoothstep(0.2, 0.5, length(pc)); cor = vec3(1.0); }
  else { float ang = uT * (2.0 + vR * 4.0) + vR * 10.0; vec2 q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * pc; a = 1.0 - smoothstep(0.1, 0.16, length(q * vec2(1.0, 2.4))); cor = mix(vec3(0.95, 0.55, 0.15), vec3(0.45, 0.62, 0.2), vR); }
  if (a < 0.02) discard;
  gl_FragColor = vec4(cor * mix(1.0, 0.55, uNoiteP), a * uOp); }`,
        transparent: true, depthWrite: false,
      });
      const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 6; p.visible = false; cena.add(p);
      return { p, m };
    })();
    // estado do ambiente: cada valor desliza até o alvo
    const AMBV = { noite: 0, neve: 0, molhado: 0, chuva: 0, flocos: 0, folhas: 0, vento: 0 }, AMBA = Object.assign({}, AMBV);
    let climaAtual = "limpo", proxRaio = 6, raio = 0;
    const VENTO_DIR = { x: 0.8, z: -0.6 };

    // ---------- poeira e marcas de pneu (textura dinâmica)
    const poeira = [];
    const poeiraG = new T.IcosahedronGeometry(0.7, 0);
    for (let i = 0; i < 40; i++) { const m = new T.Mesh(poeiraG, new T.MeshBasicMaterial({ color: 0xfff3e0, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; cena.add(m); poeira.push({ m, v: 0, vy: 0 }); }
    let poeiraI = 0, poeiraAc = 0;
    function soltarPoeira(x, z, forca) {
      const p = poeira[poeiraI++ % poeira.length];
      p.v = 1; p.vy = 1.5 + Math.random() * 1.5; p.m.visible = true; p.m.position.set(x + (Math.random() - 0.5), 0.6, z + (Math.random() - 0.5)); p.f = forca; p.m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    }
    const MK = 2; // pixels por unidade
    const marcasC = document.createElement("canvas"); marcasC.width = (LIM.x1 - LIM.x0) * MK; marcasC.height = (LIM.z1 - LIM.z0) * MK;
    const mctx = marcasC.getContext("2d"); mctx.lineCap = "round";
    const marcasTex = new T.CanvasTexture(marcasC);
    const marcas = new T.Mesh(new T.PlaneGeometry(LIM.x1 - LIM.x0, LIM.z1 - LIM.z0), new T.MeshBasicMaterial({ map: marcasTex, transparent: true, depthWrite: false, opacity: 0.55 }));
    marcas.rotation.x = -Math.PI / 2; marcas.position.set((LIM.x0 + LIM.x1) / 2, 0.36, (LIM.z0 + LIM.z1) / 2); marcas.renderOrder = 2; cena.add(marcas);
    let marcasSujas = false, ultimaMarca = -99, fadeAc = 0, texAc = 0;
    const rastro = [null, null];
    function marcar(i, x, z, ativo) {
      const px = (x - LIM.x0) * MK, pz = (z - LIM.z0) * MK, ant = rastro[i];
      if (ativo && ant) { mctx.strokeStyle = "rgba(96,30,8,0.9)"; mctx.lineWidth = 0.5 * MK; mctx.beginPath(); mctx.moveTo(ant[0], ant[1]); mctx.lineTo(px, pz); mctx.stroke(); marcasSujas = true; ultimaMarca = tempoJogo; }
      rastro[i] = ativo ? [px, pz] : null;
    }

    // ---------- estado
    const INICIO = { x: 22, z: -84.5, h: Math.PI / 2 }; // Av. Max Planck, em frente ao campus, rumo ao leste
    const S = { x: INICIO.x, z: INICIO.z, h: INICIO.h, hm: INICIO.h, v: 0, y: 34, vy: 0, noAr: true, tAr: 0, x0Ar: INICIO.x, z0Ar: INICIO.z, vAnt: 0, hAnt: INICIO.h, pit: 0, pitV: 0, rol: 0, rolV: 0, alt: 0, altV: 0, ax: 0, axV: 0, az: 0, azV: 0, acel: 0, giro: 0 };
    const camAlvo = new T.Vector3(S.x, 0, S.z);
    let zoom = 0.45, zoomAlvo = 0.45, tempoJogo = 0, revelar = 0;
    const st = { tempo: 0, dist: 0, velMax: 0, saltoMax: 0, derrubados: 0, cubos: 0, visitados: new Set(), mvv: new Set(), serie: new Array(120).fill(0), iniciouRelogio: false, terminou: false };

    // ---------- minimapa: camada estática
    const ESC = 1.4;
    const mapaFundo = document.createElement("canvas");
    mapaFundo.width = (LIM.x1 - LIM.x0) * ESC; mapaFundo.height = (LIM.z1 - LIM.z0) * ESC;
    (() => {
      const c = mapaFundo.getContext("2d"); const X = (x) => (x - LIM.x0) * ESC, Z = (z) => (z - LIM.z0) * ESC;
      c.fillStyle = "#f3a54e"; c.fillRect(0, 0, mapaFundo.width, mapaFundo.height);
      const caminho = (f) => { c.moveTo(X(f[0]), Z(f[1])); for (let k = 2; k < f.length; k += 2) c.lineTo(X(f[k]), Z(f[k + 1])); c.closePath(); };
      MAPA.areas.forEach(([t, f]) => { c.fillStyle = t === "mata" ? "#4f8f3c" : "#bfe0a4"; c.beginPath(); caminho(f); c.fill(); });
      c.fillStyle = "#60646c"; MAPA.ruas.forEach((rs) => { c.beginPath(); rs.forEach(caminho); c.fill("evenodd"); });
      const CL = { univ: "#9db9e6", resid: "#e6d23c", com: "#d8424c", ind: "#bf4cb3", canteiro: "#7fbf6a" };
      MAPA.lotes.forEach(([x, z, w, d, a, zn]) => { c.save(); c.translate(X(x), Z(z)); c.rotate(a); c.fillStyle = CL[zn] || "#9db9e6"; c.fillRect((-w / 2) * ESC, (-d / 2) * ESC, w * ESC, d * ESC); c.restore(); });
      c.fillStyle = "#fbf6ec"; estaticos.forEach((s) => { if (s.t === "b" && (s.x1 - s.x0) * (s.z1 - s.z0) > 60) c.fillRect(X(s.x0), Z(s.z0), (s.x1 - s.x0) * ESC, (s.z1 - s.z0) * ESC); });
      rampas.forEach((r) => { c.save(); c.translate(X(r.x), Z(r.z)); c.rotate(-r.ry); c.fillStyle = "#c8463c"; c.fillRect((-r.W / 2) * ESC, (-r.L / 2) * ESC, r.W * ESC, r.L * ESC); c.restore(); });
    })();

    // ---------- tamanho e zoom
    function ajustar() {
      const w = ui.palco.clientWidth || innerWidth, h = ui.palco.clientHeight || innerHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      cam.fov = w / h < 0.8 ? 56 : 40; cam.updateProjectionMatrix();
    }
    addEventListener("resize", () => aberto && ajustar());
    ui.palco.addEventListener("wheel", (e) => { e.preventDefault(); zoomAlvo = clamp(zoomAlvo + e.deltaY * 0.001, 0, 1); }, { passive: false });
    let pinca = 0, pincaZ = 0;
    ui.palco.addEventListener("touchstart", (e) => { if (e.touches.length === 2) { pinca = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); pincaZ = zoomAlvo; } }, { passive: true });
    ui.palco.addEventListener("touchmove", (e) => { if (e.touches.length === 2 && pinca) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); zoomAlvo = clamp(pincaZ - (d / pinca - 1), 0, 1); } }, { passive: true });
    ajustar();

    // ---------- física
    const RC = 1.9;
    function colidirEstaticos() {
      let bateu = 0;
      for (const s of estaticos) {
        if (s.h !== undefined && S.y > s.h - 0.2) continue;
        if (s.t === "b") {
          if (S.x < s.x0 - RC || S.x > s.x1 + RC || S.z < s.z0 - RC || S.z > s.z1 + RC) continue;
          const px = clamp(S.x, s.x0, s.x1), pz = clamp(S.z, s.z0, s.z1);
          const dx = S.x - px, dz = S.z - pz, d = Math.hypot(dx, dz);
          if (d === 0) {
            const op = [[S.x - s.x0, -1, 0], [s.x1 - S.x, 1, 0], [S.z - s.z0, 0, -1], [s.z1 - S.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
            S.x += op[1] * (op[0] + RC); S.z += op[2] * (op[0] + RC); bateu = Math.max(bateu, 1); continue;
          }
          if (d < RC) { S.x += (dx / d) * (RC - d); S.z += (dz / d) * (RC - d); bateu = Math.max(bateu, impacto(dx / d, dz / d)); }
        } else {
          const dx = S.x - s.x, dz = S.z - s.z; if (Math.abs(dx) > s.r + RC || Math.abs(dz) > s.r + RC) continue;
          const d = Math.hypot(dx, dz); if (d < s.r + RC && d > 0) { S.x += (dx / d) * (s.r + RC - d); S.z += (dz / d) * (s.r + RC - d); bateu = Math.max(bateu, impacto(dx / d, dz / d)); }
        }
      }
      if (S.x < LIM.x0 + RC) { S.x = LIM.x0 + RC; bateu = Math.max(bateu, impacto(1, 0)); }
      if (S.x > LIM.x1 - RC) { S.x = LIM.x1 - RC; bateu = Math.max(bateu, impacto(-1, 0)); }
      if (S.z < LIM.z0 + RC) { S.z = LIM.z0 + RC; bateu = Math.max(bateu, impacto(0, 1)); }
      if (S.z > LIM.z1 - RC) { S.z = LIM.z1 - RC; bateu = Math.max(bateu, impacto(0, -1)); }
      return bateu;
    }
    function impacto(nx, nz) {
      const fx = Math.sin(S.h), fz = Math.cos(S.h);
      const dot = (fx * nx + fz * nz) * Math.sign(S.v || 1);
      if (dot < -0.2) { const forca = Math.abs(S.v) * -dot; S.v *= 0.35; return forca; }
      S.v *= 0.985; return 0;
    }
    let ultimoBaque = 0;
    function mola(pos, vel, alvo, k, c, dt) { const a = -k * (pos - alvo) - c * vel; vel += a * dt; pos += vel * dt; return [pos, vel]; }

    function fisica(dt) {
      let acel = 0, giro = 0;
      const freio = entrada.freio;
      if (entrada.joy) {
        const ang = Math.atan2(entrada.jx * Math.cos(YAW) - entrada.jy * Math.sin(YAW), -entrada.jx * Math.sin(YAW) - entrada.jy * Math.cos(YAW));
        const dif = angDif(S.h, ang), mag = Math.min(1, Math.hypot(entrada.jx, entrada.jy));
        giro = clamp(dif * 2.2, -1, 1);
        acel = mag * (Math.abs(dif) > 2.3 && S.v < 3 ? -0.6 : Math.abs(dif) > 1.6 ? 0.35 : 1);
        if (acel < 0) giro = -giro;
      } else { acel = entrada.cima - entrada.baixo; giro = entrada.esq - entrada.dir; }
      S.acel = acel; S.giro = giro;
      const VMAX = 30, VRE = -11, noChao = !S.noAr;
      // aderência: na chuva e na neve o carro aponta para um lado e ainda escorrega para o outro
      const tracao = 1 - AMBA.neve * 0.4 - AMBA.molhado * 0.12, aderencia = 30 - AMBA.neve * 27.6 - AMBA.molhado * 22;
      if (!noChao) { /* no ar a roda não tem atrito: mantém a velocidade */ }
      else if (acel > 0) S.v += (S.v < 0 ? 60 : 26) * acel * dt * tracao;
      else if (acel < 0) S.v += (S.v > 0 ? 55 : 18) * acel * dt * tracao;
      else if (noChao) S.v -= Math.sign(S.v) * Math.min(Math.abs(S.v), 9 * dt * tracao);
      if (freio && noChao) S.v -= Math.sign(S.v) * Math.min(Math.abs(S.v), 40 * dt * tracao);
      S.v -= S.v * 0.25 * dt;
      S.v = clamp(S.v, VRE, VMAX);
      const fatorVel = clamp(S.v / 8, -1, 1);
      const taxa = 2.3 * (1 - 0.3 * Math.abs(S.v) / VMAX) * (freio ? 1.5 : 1) * (noChao ? 1 : 0.3);
      S.h += giro * taxa * fatorVel * dt;
      const ox = S.x, oz = S.z;
      if (noChao) S.hm += angDif(S.hm, S.h) * Math.min(1, aderencia * dt);
      S.x += Math.sin(S.hm) * S.v * dt; S.z += Math.cos(S.hm) * S.v * dt;
      if (AMBA.vento > 0.01) { const f = AMBA.vento * (noChao ? 1.1 : 7); S.x += VENTO_DIR.x * f * dt; S.z += VENTO_DIR.z * f * dt; }
      const forca = colidirEstaticos();
      for (const r of rampas) {
        const dx = S.x - r.x, dz = S.z - r.z; if (Math.abs(dx) > r.R + RC || Math.abs(dz) > r.R + RC) continue;
        const u = dx * r.s + dz * r.c, v = dx * r.c - dz * r.s;
        if (u < -r.L / 2 || u > r.L / 2 + RC || Math.abs(v) > r.W / 2 + RC) continue;
        const hU = 0.3 + (r.H - 0.3) * clamp((u + r.L / 2) / r.L, 0, 1);
        if (S.y + 0.9 >= hU) continue; // vem por cima ou subindo pela frente
        const pen = [[r.L / 2 + RC - u, 1, 0], [r.W / 2 + RC - v, 0, 1], [v + r.W / 2 + RC, 0, -1]].sort((a, b) => a[0] - b[0])[0];
        const du = pen[1] * pen[0], dv = pen[2] * pen[0];
        S.x += du * r.s + dv * r.c; S.z += du * r.c - dv * r.s;
        impacto(pen[1] * r.s + pen[2] * r.c, pen[1] * r.c - pen[2] * r.s);
      }
      for (const t of arvs) {
        if (t.estado || S.y > 4.5 * t.s) continue;
        const dx = S.x - t.x, dz = S.z - t.z, rr = 1.1 * t.s + RC;
        if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
        const d = Math.hypot(dx, dz); if (d >= rr || d === 0) continue;
        if (Math.abs(S.v) > 5) { // atropelou: a árvore tomba para onde o carro ia
          const sg = Math.sign(S.v); t.estado = 1; t.dx = Math.sin(S.h) * sg; t.dz = Math.cos(S.h) * sg; t.va = 1.2 + Math.abs(S.v) * 0.1;
          S.v *= 0.82; S.altV -= 1.5; arvMexendo.add(t); st.derrubados++; bip([130, 85], 0.11, "square", 0.08);
          for (let k = 0; k < 5; k++) soltarPoeira(t.x, t.z, 0.9);
        } else { S.x += (dx / d) * (rr - d); S.z += (dz / d) * (rr - d); impacto(dx / d, dz / d); }
      }
      if (forca > 6 && performance.now() - ultimoBaque > 250) { ultimoBaque = performance.now(); bip([90, 70], 0.12, "square", Math.min(0.14, forca / 140)); S.altV -= forca * 0.04; S.pitV += forca * 0.02 * Math.sign(S.v || 1); }
      st.dist += Math.hypot(S.x - ox, S.z - oz);

      // altura do chão e voo: sobe nas rampas, decola no fim delas e aterrissa com a suspensão
      const gH = alturaChao(S.x, S.z);
      if (S.noAr) {
        S.vy -= 48 * dt; S.y += S.vy * dt; S.tAr += dt;
        if (S.y <= gH) {
          const salto = Math.hypot(S.x - S.x0Ar, S.z - S.z0Ar) * (3.2 / 3.6);
          S.y = gH; S.noAr = false;
          if (S.vy < -7) {
            S.altV += S.vy * 0.11; S.pitV += S.vy * 0.03 * Math.sign(S.v || 1);
            bip([70, 55], 0.14, "square", Math.min(0.12, -S.vy / 160));
            for (let i = 0; i < 6; i++) soltarPoeira(S.x + (Math.random() - 0.5) * 4, S.z + (Math.random() - 0.5) * 5, 1);
          }
          S.vy = 0;
          if (S.tAr > 0.35 && salto > 3) {
            if (salto > st.saltoMax + 0.5 && salto > 8 && st.iniciouRelogio) toast(`<b>Salto de ${salto.toFixed(1).replace(".", ",")} m!</b>${st.saltoMax ? " Novo recorde da partida." : ""}`);
            if (st.iniciouRelogio) st.saltoMax = Math.max(st.saltoMax, salto);
          }
        }
      } else if (gH < S.y - 0.12) { S.noAr = true; S.tAr = 0; S.x0Ar = S.x; S.z0Ar = S.z; } // o chão sumiu: decolou com a velocidade da subida
      else { S.vy = clamp((gH - S.y) / dt, -4, 24); S.y = gH; }

      // suspensão e antena (molas)
      const acLong = (S.v - S.vAnt) / dt, acLat = S.v * angDif(S.hAnt, S.h) / dt;
      S.vAnt = S.v; S.hAnt = S.h;
      const fx = Math.sin(S.h), fz = Math.cos(S.h);
      const incl = S.noAr ? clamp(-S.vy * 0.018 * Math.sign(S.v || 1), -0.35, 0.35) : -Math.atan2(alturaChao(S.x + fx * 1.6, S.z + fz * 1.6) - alturaChao(S.x - fx * 1.6, S.z - fz * 1.6), 3.2);
      [S.pit, S.pitV] = mola(S.pit, S.pitV, incl + (S.noAr ? 0 : clamp(-acLong * 0.0028, -0.09, 0.09)), 140, 9, dt);
      [S.rol, S.rolV] = mola(S.rol, S.rolV, clamp(acLat * 0.0035, -0.11, 0.11), 140, 9, dt);
      [S.alt, S.altV] = mola(S.alt, S.altV, 0, 220, 11, dt);
      [S.az, S.azV] = mola(S.az, S.azV, clamp(-acLong * 0.03, -0.7, 0.7), 60, 3.2, dt);
      [S.ax, S.axV] = mola(S.ax, S.axV, clamp(acLat * 0.03, -0.7, 0.7), 60, 3.2, dt);

      // poeira e marcas de pneu
      const derrapa = (Math.abs(angDif(S.hm, S.h)) > 0.22 && Math.abs(S.v) > 7) || (freio && Math.abs(S.v) > 6) || (Math.abs(giro) > 0.6 && Math.abs(S.v) > 18) || (acel > 0.5 && S.v > 0.5 && S.v < 9);
      const cs = Math.cos(S.h), sn = Math.sin(S.h);
      rodas.forEach((r, i) => { if (r.frente) return; const wx = S.x + r.x * cs + r.z * sn, wz = S.z - r.x * sn + r.z * cs; marcar(i - 2, wx, wz, derrapa && !S.noAr && S.y < 0.5); });
      poeiraAc += dt * (derrapa && !S.noAr ? 34 : Math.abs(S.v) > 22 ? 6 : 0);
      while (poeiraAc > 1) { poeiraAc--; const r = rodas[2 + (Math.random() < 0.5 ? 0 : 1)]; soltarPoeira(S.x + r.x * cs + r.z * sn, S.z - r.x * sn + r.z * cs, derrapa ? 1 : 0.6); }

      // objetos empurráveis
      for (const p of props) {
        const dx = p.x - S.x, dz = p.z - S.z, d = Math.hypot(dx, dz);
        if (d < p.r + RC && Math.abs(p.y - (S.y + 1)) < extY(p) + 1.4) {
          const nx = dx / (d || 1), nz = dz / (d || 1);
          const vx = Math.sin(S.h) * S.v, vz = Math.cos(S.h) * S.v;
          const rel = Math.max(0, vx * nx + vz * nz);
          p.x = S.x + nx * (p.r + RC); p.z = S.z + nz * (p.r + RC);
          if (rel > 0.5 || p.sono) {
            const k = 1 / Math.sqrt(p.massa);
            p.vx = (vx * 1.1 + nx * (2 + rel * 0.4)) * k; p.vz = (vz * 1.1 + nz * (2 + rel * 0.4)) * k;
            p.vy = (2 + rel * 0.32) * k;
            // gira para longe do carro, no sistema local do objeto
            const lx = nx * Math.cos(p.ry) - nz * Math.sin(p.ry), lz = nx * Math.sin(p.ry) + nz * Math.cos(p.ry);
            p.wx = lz * rel * 0.35 * k + (Math.random() - 0.5); p.wz = -lx * rel * 0.35 * k + (Math.random() - 0.5);
            if (!p.contado) { p.contado = true; st.derrubados++; }
            acordar(p); S.v *= 1 - 0.08 * p.massa;
            if (rel > 4) bip([160 + Math.random() * 80 / p.massa], 0.07, "triangle", 0.05);
          }
        }
      }
      for (const p of props) {
        if (p.sono) continue;
        p.vy -= 34 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.rx += p.wx * dt; p.rz += p.wz * dt;
        const ep = extY(p);
        let piso = ep;
        for (const q of props) { if (q === p || !q.sono) continue; if (Math.abs(q.x - p.x) < p.r + q.r - 0.6 && Math.abs(q.z - p.z) < p.r + q.r - 0.6 && q.y < p.y) piso = Math.max(piso, q.y + extY(q) + ep - 0.02); }
        if (p.y <= piso) {
          p.y = piso; p.vy = Math.abs(p.vy) > 3 ? -p.vy * (p.tipo === "bola" ? 0.45 : 0.3) : 0;
          if (p.tipo === "bola") { // rola: gira conforme anda e quase não perde velocidade
            const atr = Math.min(1, 0.5 * dt); p.vx -= p.vx * atr; p.vz -= p.vz * atr;
            p.ry = 0; p.rx += (p.vz / p.hy) * dt; p.rz -= (p.vx / p.hy) * dt; p.wx = p.wz = 0;
          } else {
            const atr = Math.min(1, 4 * dt); p.vx -= p.vx * atr; p.vz -= p.vz * atr; p.wx *= 1 - atr; p.wz *= 1 - atr;
            const q = Math.PI / 2; p.rx = lerp(p.rx, Math.round(p.rx / q) * q, atr * 1.5); p.rz = lerp(p.rz, Math.round(p.rz / q) * q, atr * 1.5);
          }
          if (Math.abs(p.vx) + Math.abs(p.vz) + Math.abs(p.vy) < 0.15) p.sono = true;
        }
        for (const e of estaticos) { // não atravessa prédios: rebate
          if (e.t !== "b" || (e.h !== undefined && p.y - ep > e.h)) continue;
          if (p.x < e.x0 - p.r || p.x > e.x1 + p.r || p.z < e.z0 - p.r || p.z > e.z1 + p.r) continue;
          const op = [[p.x - (e.x0 - p.r), -1, 0], [e.x1 + p.r - p.x, 1, 0], [p.z - (e.z0 - p.r), 0, -1], [e.z1 + p.r - p.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
          p.x += op[1] * op[0]; p.z += op[2] * op[0];
          if (op[1]) p.vx = -p.vx * 0.4; else p.vz = -p.vz * 0.4;
        }
        for (const q of props) {
          if (q === p) continue;
          const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), m = p.r + q.r;
          if (d < m && Math.abs(q.y - p.y) < 2) {
            const nx = dx / (d || 1), nz = dz / (d || 1);
            q.x += nx * (m - d) * 0.5; q.z += nz * (m - d) * 0.5; p.x -= nx * (m - d) * 0.5; p.z -= nz * (m - d) * 0.5;
            const rv = (p.vx - q.vx) * nx + (p.vz - q.vz) * nz;
            if (rv > 0.3) { q.vx += nx * rv * 0.8; q.vz += nz * rv * 0.8; q.vy = Math.max(q.vy, rv * 0.15); q.wx += (Math.random() - 0.5) * rv * 0.3; p.vx -= nx * rv * 0.4; p.vz -= nz * rv * 0.4; if (!q.contado && rv > 1) { q.contado = true; st.derrubados++; if (q.tipo === "pino") bip([300 + Math.random() * 200], 0.05, "triangle", 0.04); } acordar(q); }
          }
        }
        p.x = clamp(p.x, LIM.x0, LIM.x1); p.z = clamp(p.z, LIM.z0, LIM.z1);
      }
    }
    function acordar(p) {
      p.sono = false;
      for (const q of props) if (q.sono && q !== p && q.y > p.y && Math.abs(q.x - p.x) < p.r + q.r && Math.abs(q.z - p.z) < p.r + q.r) { q.sono = false; q.vy = 0.1; }
    }

    // ---------- lógica de jogo
    let cardAtual = null;
    function logica(dt) {
      if (!st.iniciouRelogio && Math.abs(S.v) > 0.5) st.iniciouRelogio = true;
      if (st.iniciouRelogio && !st.terminou) st.tempo += dt;
      st.velMax = Math.max(st.velMax, Math.abs(S.v) * 3.2);
      for (const c of cubos) {
        if (c.pego) continue;
        if (Math.abs(c.x - S.x) < 3.6 && Math.abs(c.z - S.z) < 3.6 && Math.abs(c.m.position.y - (S.y + 1.4)) < 3.4) {
          c.pego = true; c.anim = 1; st.cubos++;
          explodir(c.x, 2.2, c.z);
          bip([988, 1319], 0.09, "sine", 0.1);
          const restam = CUBOS.length - st.cubos, zona = NOME_ZONA[c.zona] || c.zona;
          const marcos = { 1: "Primeiro dado coletado! Uma amostra já é um começo.", 10: "10 dados: já dá para calcular uma média.", 20: "20 dados: os padrões começam a aparecer.", [CUBOS.length - 1]: "Falta só um cubo!" };
          toast(`<b>+1 dado</b> · ${escH(zona)}${marcos[st.cubos] ? `<br><span>${marcos[st.cubos]}</span>` : restam ? ` · faltam ${restam}` : ""}`);
          if (!restam) { st.terminou = true; bip([523, 659, 784, 1047], 0.14, "triangle", 0.1); setTimeout(mostrarRelatorio, 900); }
        }
      }
      for (const o of mvvObjs) {
        const dentro = Math.abs(o.m.x - S.x) < 5.8 && Math.abs(o.m.z - S.z) < 6.5 && S.y < 3;
        o.a = dentro ? 1 : 0;
        if (dentro && !st.mvv.has(o.m.k)) {
          st.mvv.add(o.m.k); bip([523, 659, 784, 1047], 0.1, "triangle", 0.09);
          toast(`<b>${escH(o.m.t)}</b> encontrada · ${st.mvv.size}/3`);
        }
        if (dentro && cardAtual !== "mvv-" + o.m.k && jogoObj.cardFechado !== "mvv-" + o.m.k) { cardAtual = "mvv-" + o.m.k; jogoObj.cardAtual = cardAtual; mostrarCardMVV(o.m, st.mvv.size); }
        if (cardAtual === "mvv-" + o.m.k && Math.hypot(o.m.x - S.x, o.m.z - S.z) > 16) { ui.card.hidden = true; cardAtual = null; jogoObj.cardAtual = null; jogoObj.cardFechado = null; }
      }
      let perto = null;
      for (const a of areas) {
        const dentroA = Math.abs(a.p.g[0] - S.x) < MEIA && Math.abs(a.p.g[1] - S.z) < MEIA;
        a.alvo = dentroA ? 1 : 0;
        if (dentroA) perto = a;
        if (dentroA && !st.visitados.has(a.p.n)) { st.visitados.add(a.p.n); a.bordaOp = 1; bip([659, 880], 0.12, "triangle", 0.08); }
      }
      if (perto && cardAtual !== perto.p.n && jogoObj.cardFechado !== perto.p.n) { cardAtual = perto.p.n; jogoObj.cardAtual = cardAtual; mostrarCard(perto.p); }
      if (cardAtual != null && typeof cardAtual === "number") {
        const a = areas.find((x) => x.p.n === cardAtual);
        if (Math.hypot(a.p.g[0] - S.x, a.p.g[1] - S.z) > 16) { ui.card.hidden = true; cardAtual = null; jogoObj.cardAtual = null; jogoObj.cardFechado = null; }
      }
    }

    // ---------- desenho
    let t = 0, hudT = 0;
    const sparkCtx = ui.spark.getContext("2d"), miniCtx = ui.mini.getContext("2d");
    function posSombra(m, x, y, z, ry, w, d, alpha) {
      m.position.set(x + SOL.x * y * 0.42, 0.35, z + SOL.z * y * 0.42); m.rotation.y = ry;
      const s = 1 + y * 0.04; m.scale.set(w * s, 1, d * s);
      m.visible = alpha > 0.02;
    }
    function desenhar(dt) {
      t += dt; tempoJogo += dt;
      for (const f of animados) f(t, dt);
      // revelação radial do mundo
      if (revelar < 1) {
        revelar = Math.min(1, revelar + dt / 2.6);
        U.uReveal.value = reduzMov() ? 2 : 1 - Math.pow(1 - revelar, 2);
        surgem.forEach(([m, op]) => (m.opacity = op * clamp(revelar * 1.6 - 0.4, 0, 1)));
        if (revelar >= 1) U.uReveal.value = 2;
      }
      carro.position.set(S.x, S.y + S.alt, S.z); carro.rotation.y = S.h;
      chassi.rotation.x = S.pit; chassi.rotation.z = S.rol;
      antena.rotation.x = S.az; antena.rotation.z = -S.ax;
      freioM.opacity = entrada.freio || (S.acel < 0 && S.v > 0.5) ? 1 : 0.5; reM.opacity = S.v < -0.3 ? 1 : 0.5;
      const gir = (entrada.joy ? S.giro : (entrada.esq - entrada.dir)) * 0.45;
      rodas.forEach((r) => { r.r.rotation.x += S.v * dt / 0.62; if (r.frente) r.w.rotation.y = lerp(r.w.rotation.y, gir, 0.2); });
      { const gc = alturaChao(S.x, S.z); posSombra(carroSombra, S.x, Math.max(0, S.y - gc), S.z, S.h, 3.6, 5.6, 1); carroSombra.position.y = Math.max(0.35, gc + 0.06); }

      // câmera com suavização (estilo folio-2019) e zoom
      zoom += (zoomAlvo - zoom) * (1 - Math.pow(0.9, dt * 60));
      const dist = ((movel ? 58 : 52) + 62 * zoom + Math.abs(S.v) * 0.5) * (jogoObj.distMul || 1);
      const desv = movel && !ui.card.hidden ? 20 : 0;
      const vx = Math.sin(S.h) * S.v, vz = Math.cos(S.h) * S.v;
      const ax = S.x + vx * 0.3 - Math.sin(YAW) * desv, az = S.z + vz * 0.3 - Math.cos(YAW) * desv;
      const ez = 1 - Math.pow(1 - 0.15, dt * 60);
      camAlvo.x += (ax - camAlvo.x) * ez; camAlvo.z += (az - camAlvo.z) * ez;
      cam.position.set(camAlvo.x + Math.sin(YAW) * Math.cos(ELEV) * dist, Math.sin(ELEV) * dist, camAlvo.z + Math.cos(YAW) * Math.cos(ELEV) * dist);
      camAlvo.y += (S.y * 0.6 - camAlvo.y) * ez;
      cam.position.y += camAlvo.y; cam.lookAt(camAlvo.x, camAlvo.y, camAlvo.z);

      const rm = reduzMov();
      for (const c of cubos) {
        if (c.pego) {
          if (c.anim > 0) { c.anim -= dt * 3; const s = Math.max(0.001, c.anim); c.m.scale.setScalar(s); c.m.position.y += dt * 12; c.luz.scale.setScalar(1 + (1 - s) * 2); if (c.anim <= 0) { c.m.visible = c.luz.visible = c.sb.visible = false; } }
          continue;
        }
        c.m.rotation.y = t * 1.6 + c.i; c.m.rotation.x = 0.4; if (!rm) c.m.position.y = 2.6 + c.alto + Math.sin(t * 2.4 + c.i) * 0.5;
        posSombra(c.sb, c.x, c.m.position.y - 1.1, c.z, c.m.rotation.y, 2.6, 2.6, 1);
      }
      for (const p of parts) { if (p.v <= 0) continue; p.v -= dt; p.vy -= 30 * dt; p.m.position.x += p.vx * dt; p.m.position.y = Math.max(0.3, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt; p.m.scale.setScalar(Math.max(0.01, p.v)); if (p.v <= 0) p.m.visible = false; }
      for (const p of poeira) {
        if (p.v <= 0) continue;
        p.v -= dt * 1.25; p.m.position.y += p.vy * dt; const s = (0.6 + (1 - p.v) * 1.8) * p.f; p.m.scale.setScalar(s); p.m.material.opacity = Math.max(0, p.v) * 0.55;
        if (p.v <= 0) p.m.visible = false;
      }
      for (const p of props) {
        p.m.position.set(p.x, p.y, p.z); p.m.rotation.set(p.rx, p.ry, p.rz);
        const ey = extY(p);
        posSombra(p.sb, p.x, Math.max(0, p.y - ey), p.z, p.ry, p.hx * 2 + 1.6, p.hz * 2 + 1.6 + (ey < p.hy * 0.7 ? p.hy : 0), 1);
      }
      for (const o of mvvObjs) {
        const achou = st.mvv.has(o.m.k);
        o.borda.material.opacity = (o.a ? 0.7 + 0.3 * Math.sin(t * 10) : achou ? 0.85 : 0.35 + 0.25 * Math.sin(t * 2.4 + o.m.x));
        const sc = 1 + (o.a ? 0.06 : 0); o.borda.scale.set(sc, sc, 1);
      }
      for (const a of areas) {
        a.a += (a.alvo - a.a) * (1 - Math.pow(0.88, dt * 60));
        a.cercaM.uniforms.uA.value = a.a; a.cercaM.uniforms.uT.value = t; a.cerca.scale.y = Math.max(0.01, a.a * 2.6); a.cerca.visible = a.a > 0.01;
        if (a.bordaOp) a.bordaM.opacity = lerp(a.bordaM.opacity, 0.95, 0.1);
      }
      if (arvMexendo.size) {
        for (const a of arvMexendo) { a.va += 9 * dt; a.a += a.va * dt; if (a.a >= 1.3) { a.a = 1.3; a.va = -a.va * 0.3; if (Math.abs(a.va) < 0.4) { a.va = 0; arvMexendo.delete(a); } } poseArvore(a); }
        atualizarArvores();
      }
      drone.position.set(55 + Math.cos(t * 0.5) * 18, 9 + Math.sin(t * 1.3) * 0.6, 100 + Math.sin(t * 0.5) * 22); drone.rotation.y = -t * 0.5;
      helices.forEach((h, i) => (h.rotation.y = t * 30 + i));
      posSombra(droneSombra, drone.position.x, drone.position.y, drone.position.z, drone.rotation.y, 2.6, 2.6, 1);

      // marcas de pneu: desbotam aos poucos e a textura sobe a ~12 quadros por segundo
      fadeAc += dt; texAc += dt;
      if (fadeAc > 0.3 && tempoJogo - ultimaMarca < 25) { fadeAc = 0; mctx.globalCompositeOperation = "destination-out"; mctx.fillStyle = "rgba(0,0,0,0.05)"; mctx.fillRect(0, 0, marcasC.width, marcasC.height); mctx.globalCompositeOperation = "source-over"; marcasSujas = true; }
      if (marcasSujas && texAc > 0.08) { texAc = 0; marcasSujas = false; marcasTex.needsUpdate = true; }

      atualizarAmbiente(dt);
      renderer.render(cena, cam);

      hudT += dt;
      if (hudT > 0.066) {
        hudT = 0;
        const kmh = Math.round(Math.abs(S.v) * 3.2);
        st.serie.push(kmh); st.serie.shift();
        ui.h.vel.textContent = kmh; ui.h.cubos.textContent = st.cubos; ui.h.pontos.textContent = st.visitados.size; ui.h.tempo.textContent = fmtTempo(st.tempo);
        desenharSpark(); desenharMini();
      }
    }
    function atualizarAmbiente(dt) {
      const k = 1 - Math.pow(0.35, dt);
      for (const c in AMBV) AMBA[c] += (AMBV[c] - AMBA[c]) * k;
      AU.uNoite.value = AMBA.noite; AU.uNeve.value = AMBA.neve; AU.uMolhado.value = AMBA.molhado; AU.uVento.value = AMBA.vento + 0.12; AU.uTempo.value = t;
      AU.uFarol.value.set(S.x + Math.sin(S.h) * 2.2, S.z + Math.cos(S.h) * 2.2, Math.sin(S.h), Math.cos(S.h));
      cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      chao.material.uniforms.uInvVP.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).invert(); chao.material.uniforms.uCam.value.copy(cam.position);
      // relâmpagos na chuva
      if (climaAtual === "chuva" && !reduzMov()) { proxRaio -= dt; if (proxRaio <= 0) { proxRaio = 7 + Math.random() * 12; raio = 1; Som.trovao(); } }
      raio = Math.max(0, raio - dt * 3.2); AU.uRelampago.value = raio > 0 ? (raio > 0.75 || (raio > 0.35 && raio < 0.5) ? 0.9 : 0.15) * (0.4 + AMBA.noite * 0.6) : 0;
      // partículas
      const pm = clima.m.uniforms, op = Math.max(AMBA.chuva, AMBA.flocos, AMBA.folhas);
      clima.p.visible = op > 0.01;
      if (clima.p.visible) {
        pm.uT.value = t; pm.uOp.value = op * (climaAtual === "chuva" ? 0.42 : climaAtual === "neve" ? 0.9 : 0.95); pm.uNoiteP.value = AMBA.noite;
        pm.uCentro.value.set(camAlvo.x, 0, camAlvo.z); pm.uEsc.value = renderer.domElement.height / 2 / Math.tan((cam.fov * Math.PI) / 360) / (renderer.getPixelRatio() ? 1 : 1);
      }
      Som.vento(dt);
    }
    function definirClima(per, c, instantaneo) {
      climaAtual = c;
      Object.assign(AMBV, { noite: per === "noite" ? 1 : 0, neve: c === "neve" ? 1 : 0, molhado: c === "chuva" ? 1 : 0, chuva: c === "chuva" ? 1 : 0, flocos: c === "neve" ? 1 : 0, folhas: c === "vento" ? 1 : 0, vento: c === "vento" ? 1 : 0 });
      if (instantaneo) Object.assign(AMBA, AMBV);
      const pm = clima.m.uniforms;
      if (c === "chuva") { pm.uTipo.value = 0; pm.uVel.value.set(-3, -44, 2); pm.uTam.value = 1.7; clima.p.geometry.setDrawRange(0, NP); }
      else if (c === "neve") { pm.uTipo.value = 1; pm.uVel.value.set(1.2, -4.2, -0.8); pm.uTam.value = 0.7; clima.p.geometry.setDrawRange(0, Math.round(NP * 0.7)); }
      else if (c === "vento") { pm.uTipo.value = 2; pm.uVel.value.set(VENTO_DIR.x * 16, -0.6, VENTO_DIR.z * 16); pm.uTam.value = 1.6; clima.p.geometry.setDrawRange(0, 700); }
      proxRaio = 4;
    }
    function desenharSpark() {
      const c = sparkCtx, w = 240, h = 56;
      c.clearRect(0, 0, w, h);
      c.strokeStyle = "rgba(246,244,231,.18)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, h - 2); c.lineTo(w, h - 2); c.stroke();
      c.beginPath(); st.serie.forEach((v, i) => { const x = (i / (st.serie.length - 1)) * w, y = h - 3 - (v / 100) * (h - 8); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.strokeStyle = "#FAA822"; c.lineWidth = 3; c.lineJoin = "round"; c.stroke();
      c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fillStyle = "rgba(250,168,34,.14)"; c.fill();
    }
    function desenharMini() {
      const c = miniCtx, W = 300, raio = 150;
      c.save(); c.clearRect(0, 0, W, W);
      c.beginPath(); c.arc(raio, raio, raio - 4, 0, 7); c.clip();
      c.fillStyle = "#f3a54e"; c.fillRect(0, 0, W, W);
      c.translate(raio, raio); c.rotate(YAW);
      const X = (x) => (x - S.x) * ESC, Z = (z) => (z - S.z) * ESC;
      c.drawImage(mapaFundo, X(LIM.x0), Z(LIM.z0));
      for (const cb of cubos) if (!cb.pego) { c.fillStyle = "#fbbd3c"; c.strokeStyle = "#7c2433"; c.lineWidth = 2; c.fillRect(X(cb.x) - 4, Z(cb.z) - 4, 8, 8); c.strokeRect(X(cb.x) - 4, Z(cb.z) - 4, 8, 8); }
      for (const o of mvvObjs) {
        c.save(); c.translate(X(o.m.x), Z(o.m.z)); c.rotate(-YAW);
        c.fillStyle = st.mvv.has(o.m.k) ? "#FAA822" : "#9E2238"; c.strokeStyle = "#F6F4E7"; c.lineWidth = 2;
        c.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 4.5 : 10; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      for (const a of areas) {
        const v = st.visitados.has(a.p.n);
        c.save(); c.translate(X(a.p.g[0]), Z(a.p.g[1])); c.rotate(-YAW);
        c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fillStyle = v ? "#1E7047" : "#fff"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#101821"; c.stroke();
        c.fillStyle = v ? "#fff" : "#101821"; c.font = "700 11px Inter, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(a.p.n, 0, 1); c.restore();
      }
      c.rotate(-YAW);
      c.rotate(Math.PI - S.h + YAW);
      c.beginPath(); c.moveTo(0, -12); c.lineTo(8, 9); c.lineTo(0, 4); c.lineTo(-8, 9); c.closePath();
      c.fillStyle = "#9E2238"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#F6F4E7"; c.stroke();
      c.restore();
      c.beginPath(); c.arc(raio, raio, raio - 4, 0, 7); c.lineWidth = 6; c.strokeStyle = "rgba(246,244,231,.9)"; c.stroke();
      c.fillStyle = "#101821"; c.font = "800 20px Inter, sans-serif"; c.textAlign = "center";
      c.save(); c.translate(raio, raio); c.rotate(YAW); c.fillText("N", 0, -raio + 28); c.restore();
    }

    // ---------- laço
    let raf = 0, ultimo = 0;
    function quadro(ts) {
      raf = requestAnimationFrame(quadro);
      const dt = Math.min(0.05, (ts - (ultimo || ts)) / 1000); ultimo = ts;
      if (jogoObj.pausado || dt <= 0) { renderer.render(cena, cam); return; }
      const passos = Math.max(1, Math.ceil(dt / 0.017));
      for (let i = 0; i < passos; i++) fisica(dt / passos);
      logica(dt);
      desenhar(dt);
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden && jogoObj && !jogoObj.pausado && aberto) { jogoObj.pausado = true; mostrarTela("menu"); } });

    // ---------- construção dos prédios
    // Campus detalhado: geometria exportada do modelo MAPA_ORIENTA.blend (posições em centésimos de unidade)
    function carregarCampus() {
      const C = window.__BP_CAMPUS__; if (!C) return;
      const b64 = (s, T2) => { const r = atob(s), u = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return new T2(u.buffer); };
      C.partes.forEach((pt) => {
        const q = b64(pt.p, Int16Array), idx = b64(pt.i, pt.u32 ? Uint32Array : Uint16Array);
        const pos = new Float32Array(idx.length * 3);
        for (let k = 0; k < idx.length; k++) { const v = idx[k] * 3; pos[k * 3] = q[v] / 100; pos[k * 3 + 1] = q[v + 1] / 100; pos[k * 3 + 2] = q[v + 2] / 100; }
        const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.computeVertexNormals();
        const cor = parseInt(pt.c.slice(1), 16), verde = ((cor >> 8) & 255) > ((cor >> 16) & 255) + 12;
        cena.add(new T.Mesh(g, mat(cor, { lados: true, janela: !verde, vento: verde })));
      });
      C.caixas.forEach(([n, x0, z0, x1, z1, h]) => {
        estaticos.push({ t: "b", x0, z0, x1, z1, h }); reservas.push([x0 - 3, z0 - 3, x1 + 3, z1 + 3]);
        sombrasEst.push([(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, h]);
      });
      // tenda grande: a cobertura veio do modelo; os pilares são feitos aqui (dá para passar por baixo)
      const [tx0, tz0, tx1, tz1, th] = C.tenda;
      [[tx0, tz0], [tx1, tz0], [tx0, tz1], [tx1, tz1], [(tx0 + tx1) / 2, tz0], [(tx0 + tx1) / 2, tz1]].forEach(([x, z]) => cilindro(0.35, th - 0.4, 0xdcd6ca, x + (x < (tx0 + tx1) / 2 ? 0.6 : x > (tx0 + tx1) / 2 ? -0.6 : 0), 0.3, z + (z < (tz0 + tz1) / 2 ? 0.6 : -0.6), { seg: 8, sombra: false }));
      sombrasEst.push([(tx0 + tx1) / 2, (tz0 + tz1) / 2, tx1 - tx0, tz1 - tz0, 2.5]);
      reservas.push([tx0 - 2, tz0 - 2, tx1 + 2, tz1 + 2]);
      // tendas de evento (pirâmides brancas)
      const [ex0, ez0, ex1, ez1] = C.extra.tendas, ezc = (ez0 + ez1) / 2, eq = (ex1 - ex0) / 4;
      [[ex0 + eq, ezc], [ex1 - eq, ezc]].forEach(([x, z]) => {
        const teto = new T.Mesh(new T.ConeGeometry(4.3, 2.4, 4), mat(0xf6f1e8)); teto.rotation.y = Math.PI / 4; teto.position.set(x, 4.1, z); cena.add(teto);
        [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].forEach(([a, b]) => cilindro(0.12, 2.9, 0xcfd2d6, x + a, 0.3, z + b, { colide: false, seg: 6, sombra: false }));
        estaticos.push({ t: "b", x0: x - 3, z0: z - 3, x1: x + 3, z1: z + 3 }); sombrasEst.push([x, z, 6, 6, 4]); reservas.push([x - 4, z - 4, x + 4, z + 4]);
      });
      carrosParados.push(...C.carros);
    }
    // ---------- rampas (dá para saltar), lombadas e a altura do chão
    var chevronTex = null; // var: usada durante a construção, antes desta linha ser alcançada
    function texChevron() {
      if (chevronTex) return chevronTex;
      const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d");
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 64, 128);
      x.fillStyle = "#d9b26a";
      for (let i = 0; i < 4; i++) { const y = 18 + i * 30; x.beginPath(); x.moveTo(8, y + 14); x.lineTo(32, y); x.lineTo(56, y + 14); x.lineTo(56, y + 22); x.lineTo(32, y + 8); x.lineTo(8, y + 22); x.closePath(); x.fill(); }
      chevronTex = new T.CanvasTexture(c); chevronTex.wrapS = chevronTex.wrapT = T.RepeatWrapping; return chevronTex;
    }
    function rampa(x, z, ry, L, W, H) {
      const A = [-W / 2, 0, -L / 2], B = [W / 2, 0, -L / 2], C = [W / 2, H, L / 2], D = [-W / 2, H, L / 2], A2 = [-W / 2, 0, L / 2], B2 = [W / 2, 0, L / 2];
      const topo = new T.BufferGeometry();
      topo.setAttribute("position", new T.Float32BufferAttribute([...A, ...D, ...C, ...A, ...C, ...B], 3));
      topo.setAttribute("uv", new T.Float32BufferAttribute([0, 0, 0, L / 6, 1, L / 6, 0, 0, 1, L / 6, 1, 0], 2)); topo.computeVertexNormals();
      const lados = new T.BufferGeometry();
      lados.setAttribute("position", new T.Float32BufferAttribute([...A2, ...B2, ...C, ...A2, ...C, ...D, ...A, ...A2, ...D, ...B, ...C, ...B2], 3)); lados.computeVertexNormals();
      const g = new T.Group(); g.position.set(x, 0.3, z); g.rotation.y = ry;
      g.add(new T.Mesh(topo, mat(0xc8463c, { map: texChevron() })), new T.Mesh(lados, mat(0xe9dcc3))); cena.add(g);
      const r = { x, z, ry, L, W, H: H + 0.3, s: Math.sin(ry), c: Math.cos(ry), R: Math.hypot(L, W) / 2 };
      rampas.push(r); reservas.push([x - r.R - 3, z - r.R - 3, x + r.R + 3, z + r.R + 3]);
      sombrasEst.push([x + r.s * L * 0.2, z + r.c * L * 0.2, Math.abs(W * r.c) + Math.abs(L * 0.6 * r.s), Math.abs(W * r.s) + Math.abs(L * 0.6 * r.c), H * 0.7]);
    }
    function lombada(x, z, ry, L, W, H) {
      const geo = new T.CylinderGeometry(1, 1, 1, 20); geo.rotateZ(Math.PI / 2);
      const g = new T.Group(); g.position.set(x, 0.32, z); g.rotation.y = ry;
      const m = new T.Mesh(geo, mat(0xfbbd3c)); m.scale.set(W, H, L / 2); g.add(m); cena.add(g);
      lombadas.push({ x, z, s: Math.sin(ry), c: Math.cos(ry), L, W, H, R: Math.hypot(L, W) / 2 });
    }
    function alturaChao(x, z) {
      let h = 0.3;
      for (const r of rampas) {
        const dx = x - r.x, dz = z - r.z; if (Math.abs(dx) > r.R || Math.abs(dz) > r.R) continue;
        const u = dx * r.s + dz * r.c, v = dx * r.c - dz * r.s;
        if (Math.abs(v) <= r.W / 2 && u >= -r.L / 2 && u <= r.L / 2) h = Math.max(h, 0.3 + (r.H - 0.3) * (u + r.L / 2) / r.L);
      }
      for (const b of ressaltos) { const d = Math.hypot(x - b.x, z - b.z); if (d < b.r + b.borda) h = Math.max(h, b.h * clamp((b.r + b.borda - d) / b.borda, 0, 1)); }
      for (const l of lombadas) {
        const dx = x - l.x, dz = z - l.z; if (Math.abs(dx) > l.R || Math.abs(dz) > l.R) continue;
        const u = dx * l.s + dz * l.c, v = dx * l.c - dz * l.s;
        if (Math.abs(v) <= l.W / 2 && Math.abs(u) <= l.L / 2) h = Math.max(h, 0.32 + l.H * Math.cos((Math.PI * u) / l.L));
      }
      return h;
    }
    function construirPredios() {
      // rampas: na largada (Max Planck), na PR-182, no Peter Drucker e em ruas dos loteamentos
      rampa(52, -84.5, Math.PI / 2, 9, 8, 2.6);
      rampa(-48, -220, Math.PI, 10, 8, 3.8);
      rampa(200, 139, Math.PI / 2, 10, 8, 3);
      rampa(-160, -199, -Math.PI / 2, 9, 7, 2.6);
      rampa(400, -19, Math.PI / 2, 9, 7, 2.6);
      rampa(180, 289, -Math.PI / 2, 9, 7, 2.6);
      const B = 0xf6efe2;
      // 8 Central de Vendas (ao lado da PR-182)
      caixa(8.5, 4.4, 8.5, B, -17, 0.3, -61);
      caixa(9.5, 0.7, 9.5, 0x9E2238, -17, 4.7, -61, { colide: false });
      cilindro(0.18, 9, 0xe8e0cf, -12, 0.3, -55.5, { colide: false, seg: 6, sombra: false });
      caixa(0.1, 2, 3.2, 0xfbbd3c, -12, 6.6, -53.9, { colide: false, sombra: false });
      // 2, 3 e 11: campus real, do modelo MAPA_ORIENTA.blend (1 UFPR é o prédio em H)
      carregarCampus();
      // Hospital, clínicas e reservatório de água (quadra da UFPR)
      caixa(40, 15, 26, 0xf4f1ea, 165, 0.3, -150);
      caixa(14, 4, 10, 0xf4f1ea, 165, 15.3, -150);
      caixa(1.2, 7, 0.4, 0xd8424c, 165, 7, -136.8, { colide: false, sombra: false }); caixa(5, 1.4, 0.4, 0xd8424c, 165, 9.8, -136.8, { colide: false, sombra: false });
      caixa(22, 8, 14, 0xeef3f6, 198, 0.3, -116);
      cilindro(5, 18, 0xd9dee2, 126, 0.3, -116, { seg: 28 }); cilindro(5.6, 1.2, 0x2f6db5, 126, 18.3, -116, { seg: 28, colide: false, sombra: false });
      // IFPR
      caixa(46, 10, 16, 0xf1eee6, 372, 0.3, 24); caixa(46.6, 1, 2.4, 0x2f8a4a, 372, 6, 33, { colide: false, sombra: false });
      caixa(30, 8, 14, 0xf1eee6, 372, 0.3, 62);
      { const q = new T.Mesh(new T.PlaneGeometry(22, 14), mat(0x4f7fbf)); q.rotation.x = -Math.PI / 2; q.position.set(415, 0.31, 44); cena.add(q); }
      // Viveiro: estufas em túnel
      for (let k = 0; k < 4; k++) {
        const x = 113 + k * 12, est = new T.Mesh(new T.CylinderGeometry(4, 4, 40, 16, 1, true, 0, Math.PI), mat(0xe9f4ee, { op: 0.85, lados: true }));
        est.rotation.set(Math.PI / 2, 0, -Math.PI / 2); est.position.set(x, 0.3, 82); cena.add(est);
        estaticos.push({ t: "b", x0: x - 4, z0: 62, x1: x + 4, z1: 102, h: 4.3 }); sombrasEst.push([x, 82, 8, 40, 4]); reservas.push([x - 6, 58, x + 6, 106]);
      }
      { const lin = new T.InstancedMesh(new T.BoxGeometry(30, 0.6, 1.1), mat(0x6cc35a), 10); for (let k = 0; k < 10; k++) { dum.position.set(205, 0.6, 62 + k * 4); dum.rotation.set(0, 0, 0); dum.scale.set(1, 1, 1); dum.updateMatrix(); lin.setMatrixAt(k, dum.matrix); } cena.add(lin); reservas.push([188, 58, 222, 104]); }
      // Tisserand e Praça Isaac Newton (com a maçã de Newton)
      caixa(20, 7, 29, 0xf8f0df, 151, 0.3, 175); caixa(20.4, 1.2, 2.5, 0x642032, 151, 5, 160.5, { colide: false, sombra: false });
      { const m = new T.Mesh(new T.SphereGeometry(2.4, 20, 16), mat(0xd8424c)); m.position.set(187, 3.1, 219); cena.add(m); const f = new T.Mesh(new T.ConeGeometry(0.7, 1.6, 6), mat(0x3fae5c)); f.rotation.z = 0.7; f.position.set(188, 5.6, 219); cena.add(f); estaticos.push({ t: "c", x: 187, z: 219, r: 2.4, h: 5.5 }); sombrasEst.push([187, 219, 4, 4, 5]); }
      // 4 Centro de distribuição Prati-Donaduzzi
      caixa(47, 12, 75, 0xeceae6, -118, 0.3, 199);
      for (let k = 0; k < 7; k++) caixa(47.2, 0.4, 3, 0xcfd2d6, -118, 12.3, 170 + k * 10, { colide: false, sombra: false });
      for (let k = 0; k < 7; k++) caixa(0.3, 5, 4, 0x5a6470, -94.4, 0.3, 172 + k * 9, { colide: false, sombra: false });
      caixa(0.3, 2.2, 30, 0x9E2238, -94.35, 9, 199, { colide: false, sombra: false });
      [[-86, 186], [-86, 214]].forEach(([x, z]) => { caixa(9, 3.6, 3, 0xf6efe2, x, 0.6, z); caixa(2.4, 2.4, 3, 0x9E2238, x + 5.8, 0.6, z, { sombra: false }); });
      // 9 Área de expansão (contorno tracejado)
      const contorno = basica(0xffffff, 0.75);
      for (let x = -186; x <= -134; x += 4) [276, 324].forEach((z) => { const sg = new T.Mesh(new T.PlaneGeometry(2.2, 0.5), contorno); sg.rotation.x = -Math.PI / 2; sg.position.set(x, 0.38, z); cena.add(sg); });
      for (let z = 276; z <= 324; z += 4) [-186, -134].forEach((x) => { const sg = new T.Mesh(new T.PlaneGeometry(0.5, 2.2), contorno); sg.rotation.x = -Math.PI / 2; sg.position.set(x, 0.38, z); cena.add(sg); });
      reservas.push([-188, 274, -132, 326]);
      // 5 Condomínio industrial: os dois galpões do masterplan
      [[-201.6, 177.7, 7.5], [-176.7, 180, 12.5]].forEach(([x, z, w]) => {
        caixa(w, 5, 17.5, 0xefeae0, x, 0.3, z);
        caixa(w + 0.6, 0.7, 18.1, 0x7d8792, x, 5.3, z, { colide: false, sombra: false });
      });
      // 6 Flor da Terra Queijos Finos: queijaria com bosque, parquinho e passarinhos
      reservas.push(FT);
      { const gram = new T.Mesh(new T.PlaneGeometry(FT[2] - FT[0] - 4, FT[3] - FT[1] - 4), mat(0x9fd27f)); gram.rotation.x = -Math.PI / 2; gram.position.set((FT[0] + FT[2]) / 2, 0.3, (FT[1] + FT[3]) / 2); cena.add(gram); }
      const chao = (w, d, hex, x, z, y = 0.31) => { const p = new T.Mesh(new T.PlaneGeometry(w, d), mat(hex)); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); cena.add(p); return p; };
      chao(3.2, 15, 0xe9dcc2, -318, 302.5); chao(34, 3, 0xe9dcc2, -318, 294.5); // caminhos de pedra
      const telhado = (d, h, L, hex, x, y, z) => { // duas águas, cumeeira ao longo de x
        const sh = new T.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, h); sh.lineTo(-d / 2, 0);
        const g = new T.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2);
        const m = new T.Mesh(g, mat(hex)); m.rotation.y = Math.PI / 2; m.position.set(x, y, z); cena.add(m); return m;
      };
      const AMAR = 0xf8c94a, AMAR2 = 0xf2b33d, FURO = 0xd99a22, BRIE = 0xf6efdc, MADEIRA = 0x9a6a42;
      const roda = (r, e, hex, x, y, z, deitada = true) => { // roda de queijo
        const m = new T.Mesh(new T.CylinderGeometry(r, r, e, 28), mat(hex)); m.position.set(x, y, z); if (!deitada) m.rotation.x = Math.PI / 2; cena.add(m); return m;
      };
      // prédio principal: creme, telhado terracota, varanda com colunas
      caixa(26, 6, 14, 0xfbf3e0, -318, 0.3, 284);
      telhado(16, 3.6, 28, 0xc0623e, -318, 6.3, 284);
      caixa(26.2, 0.5, 14.2, 0xe7d6b6, -318, 0.3, 284, { colide: false, sombra: false }); // rodapé
      caixa(15, 0.35, 4.2, MADEIRA, -318, 4.2, 293.1, { colide: false, sombra: false }); // telhado da varanda
      [-324.8, -320.3, -315.7, -311.2].forEach((x) => cilindro(0.28, 3.9, 0xfbf3e0, x, 0.3, 294.8, { seg: 10, colide: false, sombra: false }));
      caixa(3, 3.3, 0.2, 0x6e4528, -318, 0.3, 291.1, { colide: false, sombra: false }); // porta
      [-326, -310].forEach((x) => { caixa(3.4, 2.2, 0.15, 0x9fd0e8, x, 1.6, 291.1, { colide: false, sombra: false }); caixa(3.4, 0.5, 0.6, 0x7fbf6a, x, 1.1, 291.4, { colide: false, sombra: false }); }); // janelas com floreira
      caixa(13, 1.7, 0.3, AMAR, -318, 4.7, 291.2, { colide: false, sombra: false }); // letreiro
      for (let k = 0; k < 9; k++) roda(0.42, 0.32, k % 3 === 0 ? BRIE : k % 3 === 1 ? AMAR2 : 0xe8a33a, -323.2 + k * 1.3, 5.55, 291.45, false);
      // roda de queijo gigante em cima do telhado
      { const g = roda(3, 1.7, AMAR, -318, 12.3, 284, false);
        [[0.9, 1.1, 0.55], [-1.3, 0.3, 0.45], [0.3, -1.4, 0.5], [-0.6, 1.9, 0.3], [1.9, -0.4, 0.35]].forEach(([a, b, r]) => [1, -1].forEach((s) => { const f = new T.Mesh(new T.CylinderGeometry(r, r, 0.1, 14), mat(FURO)); f.rotation.x = Math.PI / 2; f.position.set(-318 + a, 12.3 + b, 284 + s * 0.86); cena.add(f); })); }
      // anexo: torre redonda em forma de queijo com uma fatia em cima
      { const x = -341, z = 284;
        cilindro(5, 5, AMAR, x, 0.3, z, { seg: 36 });
        cilindro(5.15, 0.4, AMAR2, x, 5.3, z, { seg: 36, colide: false, sombra: false });
        for (let k = 0; k < 14; k++) { const a = k * 2.399, y = 1.2 + (k * 0.37 % 1) * 3.4, f = new T.Mesh(new T.SphereGeometry(0.35 + (k % 3) * 0.12, 10, 8), mat(FURO)); f.position.set(x + Math.cos(a) * 4.95, y, z + Math.sin(a) * 4.95); cena.add(f); }
        const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(4.6, -1.6); sh.lineTo(4.6, 1.6); sh.lineTo(0, 0);
        const g = new T.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
        const fat = new T.Mesh(g, mat(AMAR)); fat.position.set(x - 2.3, 5.7, z); cena.add(fat);
        [[2.5, 0.3], [3.6, -0.7], [3.2, 0.9]].forEach(([a, b]) => { const f = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), mat(FURO)); f.position.set(x - 2.3 + a, 8.1, z + b); cena.add(f); });
        caixa(4, 0.3, 2, MADEIRA, x + 5.5, 0.3, z + 5.5, { colide: false, sombra: false }); }
      // prateleiras de queijos na varanda e banca na frente
      [[-334, 297], [-302, 297]].forEach(([x, z]) => {
        caixa(8, 0.5, 2.4, MADEIRA, x, 0.3, z);
        [-2.7, -0.9, 0.9, 2.7].forEach((dx, i) => { const cores = [AMAR, AMAR2, BRIE, 0xe8a33a]; let y = 0.8; [1.0, 0.82, 0.62].forEach((r, j) => { roda(r, 0.6, cores[(i + j) % 4], x + dx, y + 0.3, z); y += 0.6; }); });
      });
      { const x = -304, z = 304; // fatia gigante no gramado
        const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(6, -2.4); sh.lineTo(6, 2.4); sh.lineTo(0, 0);
        const g = new T.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
        const m = new T.Mesh(g, mat(AMAR)); m.position.set(x - 3, 0.3, z); cena.add(m);
        [[1.8, 0.2, 3], [3.6, -0.8, 3], [4.6, 1.1, 3], [2.8, 0.9, 3]].forEach(([a, b, y]) => { const f = new T.Mesh(new T.SphereGeometry(0.38, 10, 8), mat(FURO)); f.position.set(x - 3 + a, y + 0.3, z + b); cena.add(f); });
        estaticos.push({ t: "b", x0: x - 3, z0: z - 2.4, x1: x + 3, z1: z + 2.4, h: 3.3 }); sombrasEst.push([x, z, 6, 4.8, 3]); }
      // canteiros de flores ao longo do caminho
      { const cores = [0xff7fa8, 0xffffff, 0xffd23f, 0xb48cff, 0xff5a5a], n = 60, im = new T.InstancedMesh(new T.IcosahedronGeometry(0.32, 0), mat(0xffffff), n);
        for (let k = 0; k < n; k++) { const lado = k % 2 ? 1 : -1, x = -318 + lado * (2.4 + (k % 3) * 0.5), z = 296.5 + (k >> 1) * 0.5; dum.position.set(x, 0.55, z); dum.rotation.set(k, k * 2, 0); dum.scale.set(1, 1, 1); dum.updateMatrix(); im.setMatrixAt(k, dum.matrix); im.setColorAt(k, corTmp.setHex(cores[k % cores.length])); }
        cena.add(im); chao(1.6, 15, 0x6b8f3a, -320.8, 302.5, 0.315); chao(1.6, 15, 0x6b8f3a, -315.2, 302.5, 0.315); }
      // parquinho: areia, balanços, gangorra e escorregador
      chao(24, 22, 0xf1dfb0, -276, 293);
      { const bx = -279, bz = 287, L = 10, H = 4.6;
        [-L / 2, L / 2].forEach((dx) => [-1, 1].forEach((s) => { const p = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, H / Math.cos(0.32), 8), mat(0xd8424c)); p.position.set(bx + dx, 0.3 + H / 2, bz + s * Math.tan(0.32) * H / 2); p.rotation.x = -s * 0.32; cena.add(p); }));
        const barra = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, L + 0.6, 10), mat(0x3a7bd5)); barra.rotation.z = Math.PI / 2; barra.position.set(bx, 0.3 + H, bz); cena.add(barra);
        [-L / 2, L / 2].forEach((dx) => estaticos.push({ t: "c", x: bx + dx, z: bz, r: 0.9, h: H }));
        [[-3, 0xffd23f, 0], [0, 0xd8424c, 1.7], [3, 0x3fae5c, 3.3]].forEach(([dx, cor, fase]) => {
          const piv = new T.Group(); piv.position.set(bx + dx, 0.3 + H, bz); cena.add(piv);
          [-0.45, 0.45].forEach((ox) => { const c = new T.Mesh(new T.BoxGeometry(0.06, 3.5, 0.06), mat(0x6e4528)); c.position.set(ox, -1.75, 0); piv.add(c); });
          const ass = new T.Mesh(new T.BoxGeometry(1.1, 0.14, 0.6), mat(cor)); ass.position.y = -3.5; piv.add(ass);
          animados.push((t) => { piv.rotation.x = Math.sin(t * 1.9 + fase) * (0.35 + 0.15 * Math.sin(t * 0.3 + fase)); });
        });
        sombrasEst.push([bx, bz, L, 3, 4]); }
      { const x = -268, z = 299; // escorregador
        caixa(2.2, 3, 2.2, 0x3a7bd5, x, 0.3, z - 3, { sombra: true });
        const rampa = new T.Mesh(new T.BoxGeometry(1.4, 0.18, 6), mat(0xffd23f)); rampa.position.set(x, 1.9, z + 0.6); rampa.rotation.x = 0.46; cena.add(rampa);
        [-0.7, 0.7].forEach((ox) => { const b = new T.Mesh(new T.BoxGeometry(0.12, 0.4, 6), mat(0xd8424c)); b.position.set(x + ox, 2.1, z + 0.6); b.rotation.x = 0.46; cena.add(b); }); }
      { const x = -284, z = 300; // gangorra
        cilindro(0.35, 0.9, 0x6e4528, x, 0.3, z, { seg: 10 });
        const pr = new T.Group(); pr.position.set(x, 1.3, z); cena.add(pr);
        const tab = new T.Mesh(new T.BoxGeometry(0.7, 0.16, 7), mat(0xd8424c)); pr.add(tab);
        [-3.1, 3.1].forEach((oz) => { const a = new T.Mesh(new T.BoxGeometry(0.9, 0.5, 0.6), mat(0x3a7bd5)); a.position.set(0, 0.3, oz); pr.add(a); });
        animados.push((t) => { pr.rotation.x = Math.sin(t * 1.3) * 0.2; }); }
      [[-292, 304, 0], [-344, 300, 0], [-296, 278, Math.PI / 2]].forEach(([x, z, r]) => { // bancos
        const b = new T.Group(); b.position.set(x, 0.3, z); b.rotation.y = r; cena.add(b);
        const s = new T.Mesh(new T.BoxGeometry(3, 0.18, 0.8), mat(MADEIRA)); s.position.y = 0.75; b.add(s);
        const c = new T.Mesh(new T.BoxGeometry(3, 0.7, 0.14), mat(MADEIRA)); c.position.set(0, 1.25, -0.4); b.add(c);
        [-1.3, 1.3].forEach((ox) => { const p = new T.Mesh(new T.BoxGeometry(0.15, 0.75, 0.7), mat(0x4a4f57)); p.position.set(ox, 0.37, 0); b.add(p); });
      });
      // bosque em volta: muitas árvores
      { const Rf = rng(66);
        for (let x = FT[0] + 3.5; x < FT[2] - 3; x += 5) for (let z = FT[1] + 3.5; z < FT[3] - 3; z += 5) {
          const px = x + (Rf() - 0.5) * 3, pz = z + (Rf() - 0.5) * 3;
          if (px > -348 && px < -303 && pz > 275 && pz < 299.5) continue; // prédio, anexo e varanda
          if (px > -322 && px < -298 && pz > 299) continue; // caminho, flores e fatia gigante
          if (px > -290 && pz > 280 && pz < 307) continue; // parquinho
          if (Math.hypot(px + 327, pz - 304) < 7) continue; // ponto de visita
          extrasArv.push([px, pz, 0.75 + Rf() * 0.4]);
        } }
      // passarinhos voando em volta e ciscando no gramado
      { const cores = [0x3a7bd5, 0xd8424c, 0xffd23f, 0x8a5a3a, 0xff8a3d, 0x2fb7a0];
        const ave = (cor) => { const g = new T.Group(); const corpo = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), mat(cor)); corpo.scale.set(1, 0.85, 1.5); g.add(corpo);
          const cab = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), mat(cor)); cab.position.set(0, 0.2, 0.42); g.add(cab);
          const bico = new T.Mesh(new T.ConeGeometry(0.07, 0.22, 6), mat(0xffa52e)); bico.rotation.x = Math.PI / 2; bico.position.set(0, 0.18, 0.66); g.add(bico);
          const asas = [-1, 1].map((s) => { const p = new T.Group(); p.position.set(s * 0.22, 0.08, 0); const a = new T.Mesh(new T.BoxGeometry(0.75, 0.05, 0.4), mat(cor)); a.position.x = s * 0.37; p.add(a); g.add(p); return p; });
          g.rotation.order = "YXZ"; g.scale.setScalar(1.25); cena.add(g); return { g, asas }; };
        for (let k = 0; k < 12; k++) { const b = ave(cores[k % cores.length]), cx = -312 + Math.sin(k * 1.7) * 14, cz = 292 + Math.cos(k * 2.3) * 6, R = 7 + (k % 4) * 3.5, v = (k % 2 ? 1 : -1) * (0.35 + (k % 5) * 0.07), h = 9 + (k % 4) * 1.8, f = k * 0.9;
          animados.push((t) => { const a = t * v + f; b.g.position.set(cx + Math.cos(a) * R, h + Math.sin(t * 1.3 + f) * 0.8, cz + Math.sin(a) * R); b.g.rotation.y = Math.atan2(-Math.sin(a) * v, Math.cos(a) * v);
            const bate = Math.sin(t * 16 + f) * 0.7; b.asas[0].rotation.z = bate; b.asas[1].rotation.z = -bate; }); }
        [[-312, 300], [-300, 296.5], [-327, 302], [-292, 296], [-337, 307], [-309, 308]].forEach(([x, z], k) => { const b = ave(cores[(k + 2) % cores.length]); b.asas.forEach((a, s) => (a.rotation.z = s ? 0.15 : -0.15));
          animados.push((t) => { const c = Math.max(0, Math.sin(t * 3 + k * 2)) ** 6; const ida = Math.sin(t * 0.4 + k) * 1.2; b.g.position.set(x + ida, 0.55, z); b.g.rotation.set(c * 0.6, Math.cos(t * 0.4 + k) > 0 ? Math.PI / 2 : -Math.PI / 2, 0); }); });
        [[-328, 10.2, 284], [-310, 10.2, 284], [-306.5, 10.2, 284]].forEach(([x, y, z], k) => { const b = ave(cores[(k + 4) % cores.length]); b.g.position.set(x, y - 0.5 + 0.2, z); b.asas.forEach((a, s) => (a.rotation.z = s ? 0.15 : -0.15));
          animados.push((t) => { b.g.rotation.y = Math.sin(t * 0.7 + k * 3) > 0.6 ? 1.2 : -0.4; }); });
      }
      // 10 SANEPAR: reservatórios ao norte
      [[166, -312], [184, -312]].forEach(([x, z]) => { cilindro(6, 9, 0xd9dee2, x, 0.3, z, { seg: 32 }); cilindro(6.3, 0.6, 0x4a8fd6, x, 9.3, z, { seg: 32, colide: false, sombra: false }); });
      // letreiro BIOPARK e muro de tijolos no gramado ao sul do campus
      reservas.push([30, 30, 110, 58]);
      reservas.push([5, -92, 40, -77]); // largada
    }

    // ---------- API
    const jogoObj = {
      pausado: true, cardAtual: null, cardFechado: null,
      rodar() { if (!raf) { ultimo = 0; ajustar(); raf = requestAnimationFrame(quadro); } },
      parar() { cancelAnimationFrame(raf); raf = 0; Object.keys(entrada).forEach((k) => (entrada[k] = typeof entrada[k] === "boolean" ? false : 0)); },
      voltarInicio() { Object.assign(S, { x: INICIO.x, z: INICIO.z, h: INICIO.h, hm: INICIO.h, hAnt: INICIO.h, v: 0, vAnt: 0, y: 18, vy: 0, noAr: true, tAr: 0, x0Ar: INICIO.x, z0Ar: INICIO.z }); rastro[0] = rastro[1] = null; camAlvo.set(S.x, 0, S.z); },
      teleportar(p) {
        Object.assign(S, { x: p.g[0], z: p.g[1] + 2, h: Math.PI, hm: Math.PI, hAnt: Math.PI, v: 0, vAnt: 0, y: 10, vy: 0, noAr: true, tAr: 0, x0Ar: p.g[0], z0Ar: p.g[1] + 2 });
        rastro[0] = rastro[1] = null;
        colidirEstaticos(); camAlvo.set(S.x, 0, S.z); ui.card.hidden = true; cardAtual = null; jogoObj.cardFechado = null;
      },
      reiniciar() {
        Object.assign(st, { tempo: 0, dist: 0, velMax: 0, saltoMax: 0, derrubados: 0, cubos: 0, iniciouRelogio: false, terminou: false }); st.visitados.clear(); st.mvv.clear(); st.serie.fill(0);
        cubos.forEach((c) => { c.pego = false; c.anim = 0; c.m.visible = c.luz.visible = c.sb.visible = true; c.m.scale.setScalar(1); c.luz.scale.setScalar(1); });
        areas.forEach((a) => { a.bordaOp = 0; a.bordaM.opacity = 0.6; });
        props.forEach((p) => Object.assign(p, { x: p.x0, y: p.y0, z: p.z0, ry: p.ry0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, wx: 0, wz: 0, sono: true, contado: false }));
        mctx.clearRect(0, 0, marcasC.width, marcasC.height); marcasTex.needsUpdate = true;
        arvMexendo.clear(); arvs.forEach((a) => { if (a.estado) { a.estado = 0; a.a = 0; a.va = 0; poseArvore(a); } }); atualizarArvores();
        ui.card.hidden = true; cardAtual = null; jogoObj.voltarInicio();
      },
      estatisticas() {
        const porZona = {};
        cubos.forEach((c) => { const z = porZona[c.zona] || (porZona[c.zona] = { total: 0, pegos: 0 }); z.total++; if (c.pego) z.pegos++; });
        const velMedia = st.tempo > 0 ? (st.dist / st.tempo) * 3.2 : 0;
        return { porZona, cubos: st.cubos, pontos: st.visitados.size, tempo: st.tempo, dist: st.dist * (3.2 / 3.6), velMedia, velMax: st.velMax, saltoMax: st.saltoMax, derrubados: st.derrubados, mvv: st.mvv.size };
      },
      ambiente(per, c, instantaneo) { definirClima(per, c, instantaneo); },
      _debug: { AU, AMBA, clima, S, cubos, estaticos, props, entrada, st, colidirEstaticos, U, arvs, rampas, alturaChao },
    };
    return jogoObj;
  }

  // ------------------------------------------------------------------ ganchos no site
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-jogo-abrir]");
    if (!b) return;
    e.preventDefault(); abrir();
  });
  addEventListener("hashchange", () => { if (location.hash === "#explorar-biopark") abrir(); });
  const iniciar = () => {
    preencherCartazes(); ativarPrevias();
    const alvo = document.getElementById("aba-inicio");
    if (alvo) new MutationObserver(() => { preencherCartazes(); ativarPrevias(); }).observe(alvo, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  window.BioparkJogo = { abrir, fechar, get jogo() { return jogo; } };
})();

