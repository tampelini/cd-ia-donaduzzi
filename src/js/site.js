
/* Radar de Vagas em Dados e IA — painel
   Lê window.__VAGAS__ (data/vagas.js) ou data/vagas.json. Sem dependências externas.
   Todos os indicadores, gráficos e textos numéricos são recalculados a partir da base carregada. */
(function () {
  "use strict";
  if (!document.documentElement.lang) document.documentElement.lang = "pt-BR";

  // ------------------------------------------------------------ utilidades
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = new Intl.NumberFormat("pt-BR");
  const money = (v) => (v == null ? "—" : (Math.abs(v) < 100 ? brl2 : brl0).format(v));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const pctTxt = (a, b) => `${pct(a, b)}%`;
  const hojeISO = (() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); })();
  const dataBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
  const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const stats = (vals) => (vals.length ? { n: vals.length, media: mean(vals), mediana: median(vals), min: Math.min(...vals), max: Math.max(...vals) } : { n: 0 });
  const countBy = (arr, fn) => { const m = new Map(); arr.forEach((x) => { const ks = [].concat(fn(x)).filter((k) => k != null && k !== ""); ks.forEach((k) => m.set(k, (m.get(k) || 0) + 1)); }); return m; };
  const emArtifact = () => !!(window.claude && typeof window.claude.use === "function");

  const ICON = {
    ok: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m4.3 7.2 1.8 1.8 3.6-3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    soon: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 3.8V7l2.2 1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5 13 12.5H1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.5v3.2M7 10.4v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    closed: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m4.8 4.8 4.4 4.4m0-4.4-4.4 4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    ext: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8 2h4v4M12 2 6.5 7.5M10.5 8.5V12h-8.5V3.5H6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5 13 12.5H1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.5v3.2M7 10.4v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };

  // ------------------------------------------------------------ rótulos
  const L = {
    regiao: { PR: "Paraná", Sul: "SC e RS", Brasil: "Demais estados", Remota: "Remota (sem sede informada)", NI: "Nacional / não informado" },
    modalidade: { presencial: "Presencial", hibrida: "Híbrida", remota: "Remota", null: "Não informada" },
    situacao: { aberta: "Inscrições abertas", em_breve: "Inscrições em breve", a_confirmar: "A confirmar", encerrada: "Encerrada" },
    exig: { exigida: "Graduação exigida", valorizada: "Graduação valorizada", cursando: "Estar cursando graduação", nao_mencionada: "Não mencionada no anúncio" },
    tipoOrg: { privada: "Empresas privadas", publica: "Órgãos e empresas públicas", academica: "Universidades e institutos", terceiro_setor: "Terceiro setor / institutos de fomento" },
  };
  const NIVEL_ORDEM = ["estagio", "trainee", "junior", "pleno", "senior", "especialista", "pesquisa", "concurso", "nao_informado"];
  const NIVEL_LABEL = { estagio: "Estágio", trainee: "Trainee", junior: "Júnior", pleno: "Pleno", senior: "Sênior", especialista: "Especialista", pesquisa: "Pesquisa / bolsa", concurso: "Concurso / seleção pública", nao_informado: "Não informado" };
  const AREAS = ["Ciência de Dados", "Inteligência Artificial", "Engenharia de Dados", "BI e Analytics", "Análise de Dados", "Correlata"];
  const AREAS_DADOS = ["Ciência de Dados", "Engenharia de Dados", "BI e Analytics", "Análise de Dados"];
  const FAIXAS = [
    { id: "com", label: "Com salário ou bolsa divulgado", test: (v) => !!v.salario },
    { id: "ate3", label: "Até R$ 3.000", test: (v) => salRef(v) != null && salRef(v) <= 3000 },
    { id: "3a6", label: "R$ 3.001 a R$ 6.000", test: (v) => salRef(v) > 3000 && salRef(v) <= 6000 },
    { id: "6a10", label: "R$ 6.001 a R$ 10.000", test: (v) => salRef(v) > 6000 && salRef(v) <= 10000 },
    { id: "10mais", label: "Acima de R$ 10.000", test: (v) => salRef(v) > 10000 },
    { id: "sem", label: "Sem salário divulgado", test: (v) => !v.salario },
  ];

  // ------------------------------------------------------------ estado
  const S = {
    base: null, modo: "real", vagas: [], filtradas: [], mostrar: 20,
    f: { q: "", regiao: new Set(), uf: "", cidade: "", modalidade: new Set(), nivel: new Set(), area: new Set(), faixa: "", contratacao: "", formacao: "", abertas: false, encerradas: false, trilha: null },
    sort: "recentes", escopo: "todas",
  };

  function situacao(v) {
    if (S.modo === "demo") return v.situacao; // base fictícia não expira
    if (v.prazo && v.prazo < hojeISO) return "encerrada";
    if (v.situacao === "em_breve" && v.inscricoes_inicio && v.inscricoes_inicio <= hojeISO) return "aberta";
    return v.situacao;
  }
  function salRef(v) {
    const s = v.salario; if (!s) return null;
    if (s.mensal_ref != null) return s.mensal_ref;
    if (s.periodicidade === "hora") return null;
    const x = s.max != null ? s.max : s.min; if (x == null) return null;
    return s.periodicidade === "anual" ? x / 12 : x;
  }
  const ativos = () => S.vagas.filter((v) => situacao(v) !== "encerrada");
  const profissionais = (arr) => arr.filter((v) => v.salario && v.salario.na_estatistica && v.salario.categoria === "salario");

  // ------------------------------------------------------------ carga
  function carregar() {
    if (window.__VAGAS__) return Promise.resolve(window.__VAGAS__);
    return fetch("data/vagas.json", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function carregarDemo() {
    if (window.__DEMO__) return Promise.resolve(window.__DEMO__);
    return new Promise((ok, erro) => {
      const s = document.createElement("script"); s.src = "data/demo.js";
      s.onload = () => (window.__DEMO__ ? ok(window.__DEMO__) : erro(new Error("demo vazio")));
      s.onerror = () => erro(new Error("Arquivo data/demo.js não encontrado"));
      document.body.appendChild(s);
    });
  }

  function usarBase(base, modo) {
    S.base = base; S.modo = modo; S.vagas = base.vagas.map((v) => Object.assign({}, v, { _busca: semAcento([v.cargo, v.organizacao, v.cidade, v.uf, v.area, v.fonte, (v.tecnologias || []).join(" "), (v.requisitos || []).join(" "), v.formacao, v.cargo_familia].join(" ")) }));
    S.f.trilha = null;
    $("#demo-banner").hidden = modo !== "demo";
    $("#demo-toggle").textContent = modo === "demo" ? "Voltar aos dados reais" : "Ver versão com dados demonstrativos";
    $("#demo-toggle").dataset.action = modo === "demo" ? "real" : "demo";
    montarFiltros(); aplicar(); renderTudo();
  }

  function erroCarga(e) {
    const html = `<div class="state" role="alert"><h3>Não foi possível carregar a base de vagas</h3><p>O arquivo <span class="mono">data/vagas.js</span> ou <span class="mono">data/vagas.json</span> não foi encontrado ou está corrompido (${esc(e.message)}). Rode <span class="mono">python3 scripts/consolidar.py</span> e recarregue a página.</p><button class="btn" type="button" data-action="demo">Ver dados demonstrativos</button></div>`;
    $("#jobs").innerHTML = html; $("#jobs").setAttribute("aria-busy", "false");
    $("#kpis").innerHTML = html; $("#rcount").textContent = "Base indisponível";
    $$('[data-bind]').forEach((el) => (el.textContent = "—"));
  }

  // ------------------------------------------------------------ filtros
  function checks(container, name, opts) {
    container.innerHTML = opts.map((o) => `<label class="check"><input type="checkbox" name="${name}" value="${esc(o.v)}"${S.f[name].has(o.v) ? " checked" : ""}> ${esc(o.l)} <span class="c">${o.n}</span></label>`).join("");
  }
  function montarFiltros() {
    const A = ativos();
    const c = (fn) => countBy(A, fn);
    const cr = c((v) => v.regiao);
    const sul = A.filter((v) => ["PR", "Sul"].includes(v.regiao)).length;
    checks($("#f-regiao"), "regiao", [
      { v: "PR", l: "Paraná", n: cr.get("PR") || 0 },
      { v: "SUL", l: "Região Sul (PR, SC e RS)", n: sul },
      { v: "FORA", l: "Restante do Brasil (fora do Sul)", n: A.filter((v) => v.regiao === "Brasil").length },
      { v: "Remota", l: "Remota, sem sede informada", n: cr.get("Remota") || 0 },
    ]);
    const cm = c((v) => v.modalidade || "null");
    checks($("#f-modalidade"), "modalidade", ["presencial", "hibrida", "remota", "null"].filter((k) => cm.get(k)).map((k) => ({ v: k, l: L.modalidade[k], n: cm.get(k) })));
    const cn = c((v) => v.nivel);
    const nivOpts = [
      { v: "estagio", l: "Estágio" }, { v: "trainee", l: "Trainee" }, { v: "junior", l: "Júnior" }, { v: "pleno", l: "Pleno" },
      { v: "senior", l: "Sênior" }, { v: "especialista", l: "Especialista" }, { v: "pesquisa", l: "Pesquisa / bolsa" },
      { v: "concurso", l: "Concurso / seleção pública" }, { v: "nao_informado", l: "Nível não informado" },
    ].filter((o) => cn.get(o.v)).map((o) => Object.assign(o, { n: cn.get(o.v) }));
    checks($("#f-nivel"), "nivel", nivOpts);
    const ca = c((v) => v.area);
    checks($("#f-area"), "area", AREAS.filter((a) => ca.get(a)).map((a) => ({ v: a, l: a === "Correlata" ? "Áreas relacionadas" : a, n: ca.get(a) })));

    const cu = c((v) => v.uf);
    const ufs = [...cu.keys()].sort((a, b) => (a === "PR" ? -1 : b === "PR" ? 1 : a.localeCompare(b)));
    $("#f-uf").innerHTML = `<option value="">Todos os estados</option>` + ufs.map((u) => `<option value="${u}"${S.f.uf === u ? " selected" : ""}>${u} (${cu.get(u)})</option>`).join("");
    montarCidades();
    $("#f-faixa").innerHTML = `<option value="">Qualquer faixa</option>` + FAIXAS.map((f) => `<option value="${f.id}"${S.f.faixa === f.id ? " selected" : ""}>${f.label} (${A.filter(f.test).length})</option>`).join("");
    const cc = c((v) => v.contratacao);
    $("#f-contratacao").innerHTML = `<option value="">Qualquer tipo</option>` + [...cc.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `<option value="${esc(k)}"${S.f.contratacao === k ? " selected" : ""}>${esc(k)} (${n})</option>`).join("");
    const cf = c((v) => v.formacao_exigencia);
    $("#f-formacao").innerHTML = `<option value="">Qualquer exigência</option>` + ["exigida", "valorizada", "cursando", "nao_mencionada"].filter((k) => cf.get(k)).map((k) => `<option value="${k}"${S.f.formacao === k ? " selected" : ""}>${L.exig[k]} (${cf.get(k)})</option>`).join("");
    $("#f-q").value = S.f.q; $("#f-abertas").checked = S.f.abertas; $("#f-encerradas").checked = S.f.encerradas;
  }
  function montarCidades() {
    const A = ativos().filter((v) => !S.f.uf || v.uf === S.f.uf);
    const cc = countBy(A, (v) => (v.cidade ? `${v.cidade}|${v.uf || ""}` : null));
    const cid = [...cc.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
    if (S.f.cidade && !cc.has(S.f.cidade)) S.f.cidade = "";
    $("#f-cidade").innerHTML = `<option value="">Todas as cidades</option>` + cid.map((k) => { const [c, u] = k.split("|"); return `<option value="${esc(k)}"${S.f.cidade === k ? " selected" : ""}>${esc(c)}${S.f.uf ? "" : " – " + u} (${cc.get(k)})</option>`; }).join("");
  }

  function lerForm() {
    const fm = $("#filter-form");
    S.f.q = $("#f-q").value.trim();
    ["regiao", "modalidade", "nivel", "area"].forEach((n) => { S.f[n] = new Set($$(`input[name="${n}"]:checked`, fm).map((i) => i.value)); });
    S.f.uf = $("#f-uf").value; S.f.cidade = $("#f-cidade").value; S.f.faixa = $("#f-faixa").value;
    S.f.contratacao = $("#f-contratacao").value; S.f.formacao = $("#f-formacao").value;
    S.f.abertas = $("#f-abertas").checked; S.f.encerradas = $("#f-encerradas").checked;
  }

  function passa(v) {
    const f = S.f, sit = situacao(v);
    if (!f.encerradas && sit === "encerrada") return false;
    if (f.abertas && sit !== "aberta") return false;
    if (f.q) { const termos = semAcento(f.q).split(/\s+/).filter(Boolean); if (!termos.every((t) => v._busca.includes(t))) return false; }
    if (f.regiao.size) {
      const ok = [...f.regiao].some((r) => (r === "PR" && v.regiao === "PR") || (r === "SUL" && (v.regiao === "PR" || v.regiao === "Sul")) || (r === "FORA" && v.regiao === "Brasil") || (r === "Remota" && v.regiao === "Remota"));
      if (!ok) return false;
    }
    if (f.uf && v.uf !== f.uf) return false;
    if (f.cidade && `${v.cidade}|${v.uf || ""}` !== f.cidade) return false;
    if (f.modalidade.size && !f.modalidade.has(v.modalidade || "null")) return false;
    if (f.nivel.size && !f.nivel.has(v.nivel)) return false;
    if (f.area.size && !f.area.has(v.area)) return false;
    if (f.faixa) { const fx = FAIXAS.find((x) => x.id === f.faixa); if (fx && !fx.test(v)) return false; }
    if (f.contratacao && v.contratacao !== f.contratacao) return false;
    if (f.formacao && v.formacao_exigencia !== f.formacao) return false;
    if (f.trilha && !f.trilha.test(v)) return false;
    return true;
  }

  const ORD = {
    recentes: (a, b) => (b.publicacao || "0").localeCompare(a.publicacao || "0"),
    maior: (a, b) => (salRef(b) ?? -1) - (salRef(a) ?? -1),
    menor: (a, b) => (salRef(a) ?? 1e12) - (salRef(b) ?? 1e12),
    prazo: (a, b) => (a.prazo && a.prazo >= hojeISO ? a.prazo : "9999").localeCompare(b.prazo && b.prazo >= hojeISO ? b.prazo : "9999"),
    estudante: (a, b) => b.score_estudante - a.score_estudante || (b.publicacao || "0").localeCompare(a.publicacao || "0"),
    local: (a, b) => { const r = (v) => ({ PR: 0, Sul: 1, Brasil: 2, Remota: 3, NI: 4 }[v.regiao] ?? 5); return r(a) - r(b) || (a.uf || "").localeCompare(b.uf || "") || (a.cidade || "").localeCompare(b.cidade || "", "pt-BR"); },
  };

  function aplicar() {
    S.filtradas = S.vagas.filter(passa).sort(ORD[S.sort] || ORD.recentes);
  }

  function nFiltrosAtivos() {
    const f = S.f; let n = 0;
    if (f.q) n++; n += f.regiao.size + f.modalidade.size + f.nivel.size + f.area.size;
    ["uf", "cidade", "faixa", "contratacao", "formacao"].forEach((k) => { if (f[k]) n++; });
    if (f.abertas) n++; if (f.encerradas) n++; if (f.trilha) n++;
    return n;
  }

  function chipsAtivos() {
    const f = S.f, out = [];
    const add = (label, limpar) => out.push({ label, limpar });
    if (f.q) add(`"${f.q}"`, () => (f.q = ""));
    const rl = { PR: "Paraná", SUL: "Região Sul", FORA: "Fora do Sul", Remota: "Remota" };
    f.regiao.forEach((r) => add(rl[r], () => f.regiao.delete(r)));
    if (f.uf) add(`Estado: ${f.uf}`, () => { f.uf = ""; f.cidade = ""; });
    if (f.cidade) add(`Cidade: ${f.cidade.split("|")[0]}`, () => (f.cidade = ""));
    f.modalidade.forEach((m) => add(L.modalidade[m], () => f.modalidade.delete(m)));
    f.nivel.forEach((m) => add(NIVEL_LABEL[m], () => f.nivel.delete(m)));
    f.area.forEach((m) => add(m, () => f.area.delete(m)));
    if (f.faixa) add(FAIXAS.find((x) => x.id === f.faixa).label, () => (f.faixa = ""));
    if (f.contratacao) add(f.contratacao, () => (f.contratacao = ""));
    if (f.formacao) add(L.exig[f.formacao], () => (f.formacao = ""));
    if (f.abertas) add("Inscrições abertas hoje", () => (f.abertas = false));
    if (f.encerradas) add("Incluindo encerradas", () => (f.encerradas = false));
    if (f.trilha) add(`Trilha: ${f.trilha.label}`, () => (f.trilha = null));
    const box = $("#chips-active");
    box.innerHTML = out.map((c, i) => `<button type="button" class="chip-x" data-chip="${i}" aria-label="Remover filtro ${esc(c.label)}">${esc(c.label)} <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m4 4 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>`).join("");
    box._chips = out;
  }

  // ------------------------------------------------------------ cartões de vaga
  function pillSituacao(v) {
    const s = situacao(v);
    const cls = { aberta: "ok", em_breve: "soon", a_confirmar: "check", encerrada: "closed" }[s];
    const ic = { aberta: ICON.ok, em_breve: ICON.soon, a_confirmar: ICON.check, encerrada: ICON.closed }[s];
    let txt = L.situacao[s];
    if (s === "em_breve" && v.inscricoes_inicio) txt += ` (a partir de ${dataBR(v.inscricoes_inicio)})`;
    return `<span class="pill ${cls}">${ic}${esc(txt)}</span>`;
  }
  function pillPrazo(v) {
    if (!v.prazo || situacao(v) === "encerrada") return "";
    const d = diasEntre(hojeISO, v.prazo);
    if (d < 0 || d > 7) return "";
    return `<span class="pill hot">${ICON.warn}${d === 0 ? "Encerra hoje" : d === 1 ? "Encerra amanhã" : `Encerra em ${d} dias`}</span>`;
  }
  function valorTexto(s) {
    if (s.min != null && s.max != null && s.min !== s.max) return `${money(s.min)} a ${money(s.max)}`;
    if (s.min != null && s.max == null) return `Acima de ${money(s.min)}`;
    if (s.min == null && s.max != null) return `Até ${money(s.max)}`;
    return money(s.min != null ? s.min : s.max);
  }
  function salarioHTML(v) {
    const s = v.salario;
    if (!s) return `<div class="pay"><span class="none">Salário não divulgado no anúncio</span></div>`;
    const per = { mensal: "/mês", anual: "/ano", hora: "/hora" }[s.periodicidade] || "";
    const val = valorTexto(s);
    const tipo = s.tipo === "bolsa" ? '<span class="tag">Bolsa</span>' : s.tipo === "estimado" ? '<span class="tag">Estimado</span>' : '<span class="tag">Salário</span>';
    const fora = !s.na_estatistica && s.motivo_fora ? `<span class="tag" title="${esc(s.motivo_fora)}">Fora das médias</span>` : "";
    const origem = /glassdoor/i.test(s.origem || "") ? '<span class="tag">Valor informado pelo empregador no Glassdoor</span>' : "";
    return `<div class="pay"><span class="val">${esc(val)}</span><span class="per">${per}</span>${tipo}${fora}${origem}</div>${!s.na_estatistica && s.motivo_fora ? `<p class="src-note">${esc(s.motivo_fora)}</p>` : ""}`;
  }
  function cardVaga(v) {
    const sit = situacao(v);
    const local = v.cidade ? `${v.cidade}${v.uf ? " – " + v.uf : ""}` : v.uf || (v.modalidade === "remota" ? "Brasil (remota)" : "Local não informado");
    const pub = v.publicacao ? `${v.publicacao_aproximada ? "≈ " : ""}${dataBR(v.publicacao)}` : "Não informada";
    let prazo = v.prazo ? dataBR(v.prazo) : "Não informado";
    if (v.inscricoes_inicio && sit === "em_breve") prazo = `${dataBR(v.inscricoes_inicio)} a ${dataBR(v.prazo)}`;
    const demo = S.modo === "demo" ? '<span class="pill demo">DEMONSTRAÇÃO</span>' : "";
    const tecs = (v.tecnologias || []).slice(0, 5).map((t) => `<span class="tag tech">${esc(t)}</span>`).join("");
    const req = (v.requisitos || []).length ? `<ul>${v.requisitos.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "<p>O anúncio não lista requisitos de forma resumível.</p>";
    const link = S.modo === "demo" ? `<span class="btn small" aria-disabled="true">Link indisponível (demonstração)</span>` :
      `<a class="btn primary small" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${v.nivel === "concurso" || /edital|concurso|chamada/i.test(v.fonte + v.url) ? "Ver edital e inscrição" : "Candidatar-se no anúncio"} ${ICON.ext}<span class="sr-only"> (abre em nova aba)</span></a>` +
      (v.url_fonte_extra ? ` <a class="btn small" href="${esc(v.url_fonte_extra)}" target="_blank" rel="noopener noreferrer">Fonte complementar ${ICON.ext}<span class="sr-only"> (abre em nova aba)</span></a>` : "");
    return `<article class="job${sit === "encerrada" ? " is-closed" : ""}" aria-labelledby="t-${v.id}">
      <div class="job-top">${demo}${pillSituacao(v)}${pillPrazo(v)}<span class="pill lvl">${esc(v.nivel === "nao_informado" ? "Nível não informado" : v.nivel_label)}</span><span class="pill lvl">${esc(v.area)}</span></div>
      <h3 id="t-${v.id}">${esc(v.cargo)}</h3>
      <p class="org"><span>${esc(v.organizacao)}</span><span>${esc(local)}</span><span>${esc(L.modalidade[v.modalidade] || "Modalidade não informada")}</span></p>
      ${salarioHTML(v)}
      ${tecs ? `<div class="tags" aria-label="Tecnologias solicitadas">${tecs}</div>` : ""}
      <details><summary>Detalhes da vaga</summary><dl class="facts">
        <div><dt>Contratação</dt><dd>${esc(v.contratacao)}</dd></div>
        <div><dt>Formação</dt><dd>${esc(L.exig[v.formacao_exigencia] || "—")}</dd></div>
        <div><dt>${sit === "em_breve" ? "Período de inscrição" : "Prazo de candidatura"}</dt><dd class="num">${esc(prazo)}</dd></div>
        <div><dt>Publicação</dt><dd class="num">${esc(pub)}</dd></div>
      </dl>${req}<p><strong>Formação no anúncio:</strong> ${esc(v.formacao)}</p>${v.observacao ? `<p><strong>Observações da verificação:</strong> ${esc(v.observacao)}</p>` : ""}<p class="src-note">Verificado em ${dataBR(v.verificado_em)} · fonte: ${esc(v.fonte)}</p></details>
      <div class="job-actions">${link}<span class="src">${v.prazo ? `Prazo ${esc(prazo)} · ` : ""}${esc(v.fonte)}</span></div>
    </article>`;
  }

  function renderLista() {
    const box = $("#jobs"); box.setAttribute("aria-busy", "false");
    const total = S.filtradas.length;
    const nAt = ativos().length;
    $("#rcount").innerHTML = `${int.format(total)} ${total === 1 ? "oportunidade" : "oportunidades"} <small>de ${int.format(nAt)} ativas na base</small>`;
    const n = nFiltrosAtivos();
    $("#filter-count").textContent = n === 1 ? "1 ativo" : `${n} ativos`;
    chipsAtivos();
    const tf = $("#trilha-filter");
    if (S.f.trilha) { tf.hidden = false; tf.innerHTML = `<p class="notice info"><span>Mostrando as vagas do perfil <strong>${esc(S.f.trilha.label)}</strong>. <button type="button" class="btn ghost small" data-action="limpa-trilha">Remover este filtro</button></span></p>`; }
    else { tf.hidden = true; tf.innerHTML = ""; }
    if (!total) {
      box.innerHTML = `<div class="state"><h3>Nenhuma vaga com esses filtros</h3><p>Tente remover um filtro ou usar uma palavra-chave mais ampla. Se marcou "Somente inscrições abertas hoje", vagas com inscrição prevista para os próximos dias ficam ocultas.</p><button class="btn" type="button" data-action="limpar">Limpar todos os filtros</button></div>`;
      $("#more").hidden = true; return;
    }
    box.innerHTML = S.filtradas.slice(0, S.mostrar).map(cardVaga).join("");
    const resto = total - S.mostrar;
    $("#more").hidden = resto <= 0;
    $("#more").textContent = `Mostrar mais ${Math.min(20, resto)} de ${resto} restantes`;
  }

  // ------------------------------------------------------------ indicadores
  function kpi(label, value, note, cls = "") { return `<div class="kpi ${cls}"><span class="k-label">${label}</span><span class="k-value">${value}</span>${note ? `<span class="k-note">${note}</span>` : ""}</div>`; }
  function kpiPct(label, a, b, note) { return `<div class="kpi"><span class="k-label">${label}</span><span class="k-value">${pctTxt(a, b)}</span><span class="k-note">${a} de ${b} vagas. ${note || ""}</span><div class="bar-inline" aria-hidden="true"><span style="width:${pct(a, b)}%"></span></div></div>`; }

  function renderKPIs() {
    const A = ativos(), N = A.length;
    const pr = A.filter((v) => v.uf === "PR").length;
    const rem = A.filter((v) => v.modalidade === "remota").length;
    const inicial = A.filter((v) => ["estagio", "trainee", "junior"].includes(v.nivel)).length;
    const pub = A.filter((v) => v.nivel === "concurso").length;
    const orgs = new Set(A.map((v) => semAcento(v.organizacao))).size;
    const comSal = A.filter((v) => v.salario).length;
    const P = profissionais(A); const st = stats(P.map(salRef));
    const maior = A.filter((v) => v.salario && v.salario.categoria === "salario" && v.salario.periodicidade !== "hora").reduce((m, v) => { const x = Math.max(v.salario.min || 0, v.salario.max || 0) / (v.salario.periodicidade === "anual" ? 12 : 1); return x > m.x ? { x, v } : m; }, { x: 0, v: null });
    const grad = A.filter((v) => ["exigida", "valorizada", "cursando"].includes(v.formacao_exigencia) && v.nivel_formacao !== "Ensino médio").length;
    const ia = A.filter((v) => v.area === "Inteligência Artificial").length;
    const cd = A.filter((v) => AREAS_DADOS.includes(v.area)).length;
    const cidadesPR = new Set(A.filter((v) => v.uf === "PR" && v.cidade).map((v) => v.cidade)).size;
    const aviso = st.n && st.n < 30 ? ` Amostra pequena: leia como referência, não como média de mercado.` : "";
    $("#kpis").innerHTML = `
      <div class="kpis kpis-main">
        ${kpi("Oportunidades abertas", int.format(N), `Coleta de ${dataBR(S.base.meta.data_coleta)}`, "feature")}
        ${kpi("No Paraná", int.format(pr), `em ${cidadesPR} cidades`)}
        ${kpi("Estágio e nível inicial", int.format(inicial), "estágio, trainee e júnior")}
        ${kpi("Mediana salarial", st.n ? money(st.mediana) : "—", `por mês · ${st.n} vagas com salário`, "money")}
      </div>
      <details class="more-kpis"><summary>Ver todos os indicadores</summary>
      <div class="kpis">
        ${kpi("Vagas remotas", int.format(rem), `${pctTxt(rem, N)} da base. Outras ${A.filter((v) => v.modalidade === "hibrida").length} são híbridas.`)}
        ${kpi("Concursos e seleções públicas", int.format(pub), `Inclui ${A.filter((v) => v.cargo_familia === "Docência (professor/a)").length} vagas de docência.`)}
        ${kpi("Empresas e órgãos contratantes", int.format(orgs), "Agências de RH contam como a organização anunciante.")}
        ${kpi("Média salarial", st.n ? money(st.media) : "—", `n = ${st.n} vagas com salário na estatística.${aviso}`, "money")}
        ${kpi("Maior salário divulgado", maior.v ? valorTexto(maior.v.salario) : "—", maior.v ? `${esc(maior.v.cargo)} · ${esc(maior.v.organizacao)}${maior.v.salario.na_estatistica ? "" : " (fora das médias: " + esc((maior.v.salario.motivo_fora || "").split(":")[0].toLowerCase()) + ")"}` : "", "money")}
        ${kpi("Com salário ou bolsa divulgado", int.format(comSal), `${pctTxt(comSal, N)} da base. ${st.n} entram nas médias de salário; ${A.filter((v) => v.salario && v.salario.tipo === "bolsa").length} são bolsas.`)}
        ${kpiPct("Exigem ou valorizam graduação", grad, N, "Inclui vagas que pedem graduação em curso.")}
        ${kpiPct("Ligadas diretamente à IA", ia, N, "Área principal: Inteligência Artificial.")}
        ${kpiPct("Ligadas à Ciência de Dados", cd, N, "Ciência, análise, engenharia de dados e BI.")}
      </div></details>`;
  }

  // ------------------------------------------------------------ gráficos (SVG próprio)
  const tip = $("#tooltip");
  function mostrarTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; const r = tip.getBoundingClientRect(); let left = x + 14, top = y + 14; if (left + r.width > innerWidth - 8) left = x - r.width - 14; if (top + r.height > innerHeight - 8) top = y - r.height - 14; tip.style.left = Math.max(8, left) + "px"; tip.style.top = Math.max(8, top) + "px"; }
  function esconderTip() { tip.hidden = true; }

  let chartSeq = 0;
  const graficos = []; // {el, draw}

  /**
   * Barras horizontais com rótulo acima de cada barra (legível em celular).
   * rows: [{label, value, text, tip, hatch, color}]
   */
  function hbar(plot, rows, opt) {
    const id = "c" + (++chartSeq);
    const draw = () => {
      const W = Math.max(280, plot.clientWidth || 520);
      const rowH = 40, top = 4, H = top + rows.length * rowH + 4;
      const max = opt.max || Math.max(1, ...rows.map((r) => r.value));
      const maxV = Math.max(...rows.filter((r) => !r.hatch).map((r) => r.value), -1);
      const x = (v) => (v / max) * (W - 2);
      let g = "";
      rows.forEach((r, i) => {
        const y = top + i * rowH;
        const w = Math.max(r.value > 0 ? 3 : 0, x(r.value));
        const fill = r.hatch ? `url(#${id}-h)` : (r.value === maxV ? "var(--bar-hi)" : "var(--bar)");
        g += `<g class="row" data-i="${i}">
          <rect class="hit" x="0" y="${y}" width="${W}" height="${rowH}"></rect>
          <text class="lbl" x="0" y="${y + 13}">${esc(r.label)}</text>
          <text class="val" x="${W}" y="${y + 13}" text-anchor="end">${esc(r.text)}</text>
          <rect x="0" y="${y + 19}" width="${W}" height="12" rx="3" fill="var(--grid)"></rect>
          <rect class="bar" x="0" y="${y + 19}" width="${w}" height="12" rx="3" fill="${fill}" ${r.hatch ? 'stroke="var(--bar-hi)" stroke-width="1"' : ""}></rect>
        </g>`;
      });
      plot.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t" tabindex="0" focusable="true">
        <title id="${id}-t">${esc(opt.title)}. ${esc(opt.desc || "")} Use as setas para percorrer os itens.</title>
        <defs><pattern id="${id}-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"></rect><rect width="3" height="6" fill="var(--bar-hi)"></rect></pattern></defs>
        ${g}</svg><p class="sr-only" aria-live="polite" id="${id}-live"></p>`;
      ligarInteracao(plot, rows, id);
    };
    graficos.push({ el: plot, draw }); draw();
  }

  /** Colunas verticais (histograma / série temporal). */
  function vbar(plot, rows, opt) {
    const id = "c" + (++chartSeq);
    const draw = () => {
      const W = Math.max(280, plot.clientWidth || 520), H = 220, padB = 42, padT = 22, padL = 4;
      const max = Math.max(1, ...rows.map((r) => r.value));
      const bw = (W - padL) / rows.length;
      const y = (v) => H - padB - (v / max) * (H - padB - padT);
      let g = `<line class="baseline" x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}"></line>`;
      const every = Math.ceil(rows.length / Math.floor(W / 64));
      rows.forEach((r, i) => {
        const x0 = padL + i * bw, bwi = Math.max(2, bw - 6);
        const yy = y(r.value);
        g += `<g class="row" data-i="${i}">
          <rect class="hit" x="${x0}" y="0" width="${bw}" height="${H}"></rect>
          <rect class="bar" x="${x0 + 3}" y="${yy}" width="${bwi}" height="${Math.max(0, H - padB - yy)}" rx="4" fill="${r.value === max ? "var(--bar-hi)" : "var(--bar)"}"></rect>
          ${r.value ? `<text class="val" x="${x0 + bw / 2}" y="${yy - 6}" text-anchor="middle">${esc(r.short != null ? r.short : r.value)}</text>` : ""}
          ${i % every === 0 ? `<text class="axis" x="${x0 + bw / 2}" y="${H - padB + 16}" text-anchor="middle">${esc(r.label)}</text>` : ""}
          ${r.sub && i % every === 0 ? `<text class="axis" x="${x0 + bw / 2}" y="${H - padB + 30}" text-anchor="middle">${esc(r.sub)}</text>` : ""}
        </g>`;
      });
      plot.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t" tabindex="0">
        <title id="${id}-t">${esc(opt.title)}. ${esc(opt.desc || "")} Use as setas para percorrer os itens.</title>
        <defs><pattern id="${id}-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"></rect><rect width="3" height="6" fill="var(--bar-hi)"></rect></pattern></defs>
        ${g}</svg><p class="sr-only" aria-live="polite" id="${id}-live"></p>`;
      ligarInteracao(plot, rows, id);
    };
    graficos.push({ el: plot, draw }); draw();
  }

  function ligarInteracao(plot, rows, id) {
    const svg = $("svg", plot), live = $("#" + id + "-live", plot);
    let ativo = -1;
    const marcar = (i, ev) => {
      $$("g.row", svg).forEach((g) => g.classList.toggle("is-active", +g.dataset.i === i));
      ativo = i;
      if (i < 0) { esconderTip(); return; }
      const r = rows[i];
      if (ev && ev.clientX != null) mostrarTip(r.tip, ev.clientX, ev.clientY);
      else { const b = $$("g.row", svg)[i].getBoundingClientRect(); mostrarTip(r.tip, b.left + Math.min(b.width * 0.5, 200), b.top + b.height); }
      live.textContent = r.tip.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    };
    $$("g.row", svg).forEach((g) => {
      g.addEventListener("mousemove", (e) => marcar(+g.dataset.i, e));
      g.addEventListener("mouseleave", () => marcar(-1));
    });
    svg.addEventListener("focus", () => marcar(ativo < 0 ? 0 : ativo));
    svg.addEventListener("blur", () => marcar(-1));
    svg.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); marcar(Math.min(rows.length - 1, ativo + 1)); }
      else if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); marcar(Math.max(0, ativo - 1)); }
      else if (e.key === "Escape") marcar(-1);
    });
  }

  function tabela(caption, cols, linhas) {
    return `<details><summary class="btn ghost small">Ver dados em tabela</summary><div class="tbl-wrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="data"><caption>${esc(caption)}</caption><thead><tr>${cols.map((c, i) => `<th scope="col"${i ? ' class="r"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c, i) => (i ? `<td class="r">${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div></details>`;
  }

  function figura(host, { titulo, desc, wide, small }) {
    const f = document.createElement("figure");
    f.className = "chart" + (wide ? " wide" : "");
    f.innerHTML = `<figcaption><h3>${esc(titulo)}</h3>${desc ? `<p>${desc}</p>` : ""}</figcaption><div class="plot"></div><div class="chart-foot"></div>`;
    host.appendChild(f);
    return { plot: $(".plot", f), foot: $(".chart-foot", f), fig: f };
  }

  /** Gráfico de média salarial por grupo. */
  function graficoSalario(host, titulo, desc, P, chave, ordem, rotulo) {
    const grupos = new Map();
    P.forEach((v) => { const k = chave(v); if (k == null) return; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(salRef(v)); });
    let ks = [...grupos.keys()];
    ks = ordem ? ordem.filter((k) => grupos.has(k)).concat(ks.filter((k) => !ordem.includes(k))) : ks.sort((a, b) => mean(grupos.get(b)) - mean(grupos.get(a)));
    const { plot, foot } = figura(host, { titulo, desc });
    if (!ks.length) { plot.innerHTML = `<div class="state"><p>Nenhuma vaga com salário divulgado neste recorte.</p></div>`; return; }
    const max = Math.max(...ks.map((k) => mean(grupos.get(k))));
    const rows = ks.map((k) => {
      const st = stats(grupos.get(k)), lab = rotulo ? rotulo(k) : k;
      return { label: lab, value: st.media, hatch: st.n < 5, text: `${money(st.media)} · n=${st.n}`,
        tip: `<b>${esc(lab)}</b>Média ${money(st.media)}<br>Mediana ${money(st.mediana)}<br>Mín. ${money(st.min)} · Máx. ${money(st.max)}<br>n = ${st.n} vaga${st.n > 1 ? "s" : ""}${st.n < 5 ? "<br>Amostra pequena (menos de 5)" : ""}`, st };
    });
    hbar(plot, rows, { title: titulo, desc: "Média salarial mensal por grupo; barras hachuradas têm menos de 5 vagas.", max });
    const peq = rows.some((r) => r.hatch);
    foot.innerHTML = `<div class="legend"><span><i style="background:var(--bar)"></i>Média (n ≥ 5)</span><span><i style="background:var(--bar-hi)"></i>Maior média (n ≥ 5)</span><span><i class="hatch"></i>Amostra pequena (n &lt; 5)</span></div>` +
      tabela(titulo, ["Grupo", "n", "Média", "Mediana", "Mínimo", "Máximo"], rows.map((r) => [r.label, r.st.n, money(r.st.media), money(r.st.mediana), money(r.st.min), money(r.st.max)])) +
      (peq ? `<span class="small-n">${ICON.warn} Grupos hachurados têm menos de 5 vagas.</span>` : "");
  }

  function graficoContagem(host, titulo, desc, mapa, opts = {}) {
    let arr = [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    if (opts.ordem) arr = opts.ordem.filter((k) => mapa.has(k)).map((k) => [k, mapa.get(k)]);
    if (opts.top) arr = arr.slice(0, opts.top);
    const total = opts.total;
    const { plot, foot } = figura(host, { titulo, desc, wide: opts.wide });
    if (!arr.length) { plot.innerHTML = `<div class="state"><p>Sem dados neste recorte.</p></div>`; return; }
    const rows = arr.map(([k, n]) => ({ label: opts.rotulo ? opts.rotulo(k) : k, value: n, text: total ? `${n} (${pctTxt(n, total)})` : String(n), color: "var(--s1)",
      tip: `<b>${esc(opts.rotulo ? opts.rotulo(k) : k)}</b>${n} vaga${n > 1 ? "s" : ""}${total ? ` · ${pctTxt(n, total)} de ${total}` : ""}` }));
    hbar(plot, rows, { title: titulo, desc: desc });
    foot.innerHTML = tabela(titulo, total ? ["Categoria", "Vagas", "% do total"] : ["Categoria", "Vagas"], rows.map((r) => (total ? [r.label, r.value, pctTxt(r.value, total)] : [r.label, r.value])));
  }

  function renderDashboard() {
    const host = $("#charts"), mais = $("#charts-mais"); host.innerHTML = ""; mais.innerHTML = ""; graficos.length = 0;
    const base = S.escopo === "filtradas" ? S.filtradas.filter((v) => situacao(v) !== "encerrada") : ativos();
    const N = base.length;
    $("#dash-scope-note").textContent = S.escopo === "filtradas" ? `Gráficos com as ${N} vagas filtradas no painel.` : `Gráficos com todas as ${N} vagas ativas.`;
    const P = profissionais(base);

    // cartões de salário
    const st = stats(P.map(salRef));
    const bolsaEst = base.filter((v) => v.salario && v.salario.categoria === "bolsa_estagio" && v.salario.na_estatistica);
    const bolsaPesq = base.filter((v) => v.salario && v.salario.categoria === "bolsa_pesquisa" && v.salario.na_estatistica);
    const fora = base.filter((v) => v.salario && !v.salario.na_estatistica);
    const estimados = base.filter((v) => v.salario && v.salario.tipo === "estimado").length;
    const card = (t, s, nota) => `<div class="sal-card"><h3>${t}</h3>${s.n ? `<dl class="stats"><div><dt>Média</dt><dd>${money(s.media)}</dd></div><div><dt>Mediana</dt><dd>${money(s.mediana)}</dd></div><div><dt>Mínimo</dt><dd>${money(s.min)}</dd></div><div><dt>Máximo</dt><dd>${money(s.max)}</dd></div></dl>` : `<p>Nenhum valor neste recorte.</p>`}<p class="n">n = ${s.n || 0} ${s.n && s.n < 5 ? "· amostra pequena" : ""}</p>${nota ? `<p class="src-note">${nota}</p>` : ""}</div>`;
    const motivos = countBy(fora, (v) => (v.salario.motivo_fora || "").split(":")[0].split("(")[0].trim());
    $("#salary-cards").innerHTML =
      card("Salários profissionais (R$/mês)", st, `CLT, PJ, estatutário, temporário e autônomo. ${N ? `${P.length} de ${N} vagas (${pctTxt(P.length, N)}) têm salário que entra na conta.` : ""}`) +
      card("Bolsas de estágio (R$/mês)", stats(bolsaEst.map(salRef)), "Sem somar auxílio-transporte e outros benefícios. Valores por hora ficam fora.") +
      card("Bolsas de pesquisa e residência (R$/mês)", stats(bolsaPesq.map(salRef)), "Programas de fomento e institutos (ex.: Inova Talentos, residências em TIC).");
    mais.insertAdjacentHTML("beforeend", `<div class="sal-card wide-card"><h3>Valores fora das médias</h3><p class="n">${fora.length} vaga${fora.length === 1 ? "" : "s"}</p><ul style="margin:0;padding-left:18px;font-size:14px">${[...motivos.entries()].map(([m, n]) => `<li>${esc(m)}: ${n}</li>`).join("") || "<li>Nenhum</li>"}</ul><p class="src-note">Salários estimados na base: ${estimados}. Todos os valores vêm do anúncio ou do edital.</p></div>`);

    // 1. por nível
    graficoSalario(host, "Média salarial por nível profissional", `Somente salários profissionais divulgados. Bolsas ficam de fora. Total na amostra: n = ${P.length}.`, P, (v) => v.nivel, NIVEL_ORDEM, (k) => NIVEL_LABEL[k]);
    // 2. por área
    graficoSalario(mais, "Média salarial por área", "Área principal da vaga, conforme a classificação desta base.", P, (v) => v.area, AREAS);
    // 3. por estado
    graficoSalario(mais, "Média salarial por estado", "Vagas remotas sem sede informada aparecem como “Remota”.", P, (v) => v.uf || (v.modalidade === "remota" ? "Remota" : "Não informado"));
    // 4. Paraná x restante
    graficoSalario(host, "Paraná comparado ao restante do Brasil", "Poucas vagas do Paraná divulgam salário. Compare com cautela.", P, (v) => ({ PR: "Paraná", Sul: "SC e RS", Brasil: "Demais estados", Remota: "Remota", NI: "Nacional" }[v.regiao]), ["Paraná", "SC e RS", "Demais estados", "Remota", "Nacional"]);
    // 5. modalidade
    graficoSalario(mais, "Média salarial por modalidade de trabalho", "Presencial, híbrida ou remota, conforme o anúncio.", P, (v) => L.modalidade[v.modalidade] || "Não informada", ["Presencial", "Híbrida", "Remota", "Não informada"]);
    // 6. distribuição por faixa
    {
      const cortes = [[0, 3000, "Até 3 mil"], [3000, 5000, "3 a 5 mil"], [5000, 7000, "5 a 7 mil"], [7000, 10000, "7 a 10 mil"], [10000, 15000, "10 a 15 mil"], [15000, 1e9, "15 mil ou mais"]];
      const rows = cortes.map(([a, b, l]) => { const n = P.filter((v) => salRef(v) > a && salRef(v) <= b || (a === 0 && salRef(v) <= b)).length; return { label: l, value: n, short: String(n), tip: `<b>${l} (R$/mês)</b>${n} vaga${n === 1 ? "" : "s"} · ${pctTxt(n, P.length)} da amostra` }; });
      const { plot, foot } = figura(host, { titulo: "Distribuição das vagas por faixa salarial", desc: `Salários profissionais mensais (n = ${P.length}). Cada faixa inclui o limite superior.` });
      vbar(plot, rows, { title: "Distribuição por faixa salarial" });
      foot.innerHTML = tabela("Distribuição por faixa salarial", ["Faixa (R$/mês)", "Vagas", "% da amostra"], rows.map((r) => [r.label, r.value, pctTxt(r.value, P.length)]));
    }
    // 7-10 contagens
    graficoContagem(mais, "Vagas por tipo de cargo", "Agrupamento dos títulos dos anúncios em famílias de cargo.", countBy(base, (v) => v.cargo_familia), { total: N });
    graficoContagem(mais, "Vagas por área", "Área principal de cada oportunidade.", countBy(base, (v) => v.area), { total: N, ordem: AREAS });
    graficoContagem(mais, "Vagas por localização", "Estados com mais oportunidades; remotas sem sede aparecem à parte.", countBy(base, (v) => v.uf || (v.modalidade === "remota" ? "Remota" : "Nacional / não informado")), { total: N, top: 12 });
    graficoContagem(mais, "Vagas por modalidade de trabalho", "Conforme informado no anúncio.", countBy(base, (v) => L.modalidade[v.modalidade] || "Não informada"), { total: N, ordem: ["Presencial", "Híbrida", "Remota", "Não informada"] });
    graficoContagem(mais, "Competências técnicas mais pedidas", "Percentual de vagas que mencionam cada competência no título, nos requisitos ou nas tecnologias. Uma vaga pode citar várias.", countBy(base, (v) => v.competencias), { total: N });
    graficoContagem(host, "Tecnologias mais solicitadas", "As 10 ferramentas mais citadas nos anúncios.", countBy(base, (v) => v.tecnologias), { total: N, top: 10 });
    graficoContagem(mais, "Cursos citados como formação aceita", "Quantas vagas citam cada curso ou área de graduação. Anúncios costumam listar vários.", countBy(base, (v) => v.cursos_citados), { total: N, top: 12 });
    graficoContagem(mais, "Nível de formação pedido", "Formação mínima indicada no anúncio.", countBy(base, (v) => v.nivel_formacao), { total: N, ordem: ["Ensino médio", "Graduação em curso", "Graduação completa", "Pós-graduação", "Não informado"] });
    // 15. evolução
    {
      const comData = base.filter((v) => v.publicacao);
      const semana = (iso) => { const d = new Date(iso + "T12:00:00"); const dia = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dia); return d.toISOString().slice(0, 10); };
      const m = countBy(comData, (v) => semana(v.publicacao));
      const ks = [...m.keys()].sort();
      const { plot, foot } = figura(mais, { titulo: "Vagas ativas por semana de publicação", desc: `${comData.length} de ${N} vagas informam a data de publicação. Como só vagas ainda abertas entram na base, semanas antigas aparecem sub-representadas: o gráfico não mede crescimento do mercado.`, wide: true });
      if (ks.length < 3) { plot.innerHTML = `<div class="state"><p>Dados insuficientes para mostrar a evolução (menos de 3 semanas com publicações).</p></div>`; }
      else {
        const all = []; let d = new Date(ks[0] + "T12:00:00"); const fim = new Date(ks[ks.length - 1] + "T12:00:00");
        while (d <= fim) { all.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 7); }
        const recentes = all.slice(-16);
        const antes = all.length - recentes.length;
        const rows = recentes.map((k) => ({ label: dataBR(k).slice(0, 5), value: m.get(k) || 0, tip: `<b>Semana de ${dataBR(k)}</b>${m.get(k) || 0} vaga(s) publicada(s)` }));
        vbar(plot, rows, { title: "Vagas por semana de publicação" });
        const antigas = antes ? comData.filter((v) => semana(v.publicacao) < recentes[0]).length : 0;
        foot.innerHTML = tabela("Vagas por semana de publicação", ["Semana iniciada em", "Vagas"], recentes.map((k) => [dataBR(k), m.get(k) || 0])) + (antigas ? `<span class="src-note">Mais ${antigas} vaga(s) publicadas antes de ${dataBR(recentes[0])} (fora do gráfico).</span>` : "");
      }
    }
  }

  // ------------------------------------------------------------ por que estudar
  function renderWhy() {
    if (!$("#why")) return;
    const A = ativos(), N = A.length;
    const n = (fn) => A.filter(fn).length;
    const cursosCD = n((v) => v.cursos_citados.includes("Ciência de Dados"));
    const cursosIA = n((v) => v.cursos_citados.includes("Inteligência Artificial"));
    const py = n((v) => v.tecnologias.includes("Python")), sql = n((v) => v.tecnologias.includes("SQL"));
    const ml = n((v) => v.competencias.includes("Machine learning e modelagem"));
    const gen = n((v) => v.competencias.includes("IA generativa e LLMs"));
    const est = n((v) => v.competencias.includes("Estatística"));
    const vis = n((v) => v.competencias.includes("Visualização e dashboards"));
    const pr = A.filter((v) => v.uf === "PR");
    const cidPR = countBy(pr, (v) => v.cidade);
    const topCid = [...cidPR.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, k]) => `${c} (${k})`).join(", ");
    const orgTipo = countBy(A, (v) => v.tipo_org);
    const rem = A.filter((v) => v.modalidade === "remota");
    const remIA = rem.filter((v) => v.area === "Inteligência Artificial").length;
    const P = profissionais(A);
    const porForm = new Map();
    P.forEach((v) => { const k = v.nivel_formacao; if (!porForm.has(k)) porForm.set(k, []); porForm.get(k).push(salRef(v)); });
    const formLin = ["Graduação em curso", "Graduação completa", "Pós-graduação", "Não informado"].filter((k) => porForm.has(k)).map((k) => { const s = stats(porForm.get(k)); return `<li>${k}: mediana ${money(s.mediana)} (n = ${s.n}${s.n < 5 ? ", amostra pequena" : ""})</li>`; }).join("");
    const nivelSal = ["junior", "pleno", "senior", "especialista"].map((k) => { const vs = P.filter((v) => v.nivel === k).map(salRef); if (!vs.length) return ""; const s = stats(vs); return `<li>${NIVEL_LABEL[k]}: mediana ${money(s.mediana)} (n = ${s.n}${s.n < 5 ? ", amostra pequena" : ""})</li>`; }).join("");
    const docentes = n((v) => v.cargo_familia === "Docência (professor/a)");
    const pesq = n((v) => v.cargo_familia === "Pesquisa e bolsas");
    const cdVagas = n((v) => AREAS_DADOS.includes(v.area)), iaVagas = n((v) => v.area === "Inteligência Artificial");
    const box = (t, fig, figTxt, corpo) => `<article class="why"><h3>${t}</h3>${fig != null ? `<p><span class="figure">${fig}</span> <span>${figTxt}</span></p>` : ""}${corpo}</article>`;
    $("#why").innerHTML =
      box("Ciência de Dados", pctTxt(cdVagas, N), `das oportunidades (${cdVagas} de ${N}) são de análise, ciência, engenharia de dados ou BI.`,
        `<p>O curso reúne estatística, programação e bancos de dados para transformar dados em decisões. Nesta base, Python aparece em ${py} vagas (${pctTxt(py, N)}), SQL em ${sql} (${pctTxt(sql, N)}) e visualização/dashboards em ${vis} (${pctTxt(vis, N)}). Ciência de Dados é citada como formação aceita em ${cursosCD} anúncios.</p>`) +
      box("Bacharelado em Inteligência Artificial", pctTxt(iaVagas, N), `das oportunidades (${iaVagas} de ${N}) têm a IA como área principal.`,
        `<p>O bacharelado aprofunda aprendizado de máquina, redes neurais, linguagem natural, visão computacional e IA generativa. Machine learning aparece em ${ml} vagas (${pctTxt(ml, N)}) e IA generativa/LLMs em ${gen} (${pctTxt(gen, N)}). O curso de IA é citado nominalmente como formação em ${cursosIA} anúncio${cursosIA === 1 ? "" : "s"}: por ser recente, a maioria das vagas ainda pede “Computação, Engenharia ou áreas afins”, faixa em que os egressos se encaixam.</p>`) +
      box("Carreiras possíveis", null, "", `<ul>${[...countBy(A, (v) => v.cargo_familia).entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => `<li>${esc(k)}: ${c} vaga${c > 1 ? "s" : ""}</li>`).join("")}</ul>`) +
      box("Competências que os cursos ajudam a desenvolver", null, "", `<ul><li>Programação (Python/R): ${pctTxt(n((v) => v.competencias.includes("Programação (Python/R)")), N)} das vagas</li><li>SQL e bancos de dados: ${pctTxt(n((v) => v.competencias.includes("SQL e bancos de dados")), N)}</li><li>Machine learning e modelagem: ${pctTxt(ml, N)}</li><li>Estatística: ${pctTxt(est, N)}</li><li>Engenharia de dados e pipelines: ${pctTxt(n((v) => v.competencias.includes("Engenharia de dados e pipelines")), N)}</li><li>Computação em nuvem: ${pctTxt(n((v) => v.competencias.includes("Computação em nuvem")), N)}</li><li>Comunicação e visão de negócio: ${pctTxt(n((v) => v.competencias.includes("Comunicação e visão de negócio")), N)}</li></ul><p class="src-note">Contagem por palavras-chave nos títulos, requisitos e tecnologias.</p>`) +
      box("Onde essas áreas estão", null, "", `<ul>${Object.keys(L.tipoOrg).filter((k) => orgTipo.get(k)).map((k) => `<li>${L.tipoOrg[k]}: ${orgTipo.get(k)} oportunidades</li>`).join("")}<li>Docência em universidades: ${docentes} vagas</li><li>Pesquisa, bolsas e residências: ${pesq}</li></ul><p>Há vagas em bancos e cooperativas de crédito, agroindústria, saúde, educação, varejo, indústria e governo.</p>`) +
      box("Oportunidades no Paraná", int.format(pr.length), `vagas no estado, em ${cidPR.size} cidades.`, `<p>Cidades com mais vagas: ${esc(topCid) || "—"}. ${n((v) => v.uf === "PR" && v.nivel === "estagio")} são estágios. Cooperativas de crédito e empresas do interior também contratam (Palotina, Francisco Beltrão, Toledo, Cascavel e Cafelândia aparecem na base).</p>`) +
      box("Trabalho remoto", int.format(rem.length), `vagas remotas (${pctTxt(rem.length, N)} da base).`, `<p>${remIA} delas são de IA. Outras ${n((v) => v.modalidade === "hibrida")} são híbridas. O trabalho remoto amplia o alcance para quem mora fora das capitais, mas as vagas remotas nesta base pedem, em geral, experiência: só ${rem.filter((v) => ["estagio", "junior"].includes(v.nivel)).length} são de estágio ou júnior.</p>`) +
      box("Formação, competências e salário", null, "", `<p>Mediana dos salários profissionais divulgados, por formação pedida:</p><ul>${formLin || "<li>Sem dados</li>"}</ul><p>Por nível profissional:</p><ul>${nivelSal || "<li>Sem dados</li>"}</ul><p class="src-note">Amostra total: n = ${P.length}. Associação observada nesta base, não relação de causa.</p>`);
  }

  // ------------------------------------------------------------ comparação
  function renderCompare() {
    if (!$("#compare")) return;
    const A = ativos();
    const grpCD = A.filter((v) => AREAS_DADOS.includes(v.area)), grpIA = A.filter((v) => v.area === "Inteligência Artificial");
    const topK = (arr, fn, k) => [...countBy(arr, fn).entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
    const lista = (pares, tot) => `<ul>${pares.map(([k, n]) => `<li>${esc(k)} <span class="src-note">(${pct(n, tot)}%)</span></li>`).join("")}</ul>`;
    const exemplos = (arr) => `<ul>${arr.filter((v) => situacao(v) === "aberta").sort((a, b) => b.score_estudante - a.score_estudante).slice(0, 4).map((v) => S.modo === "demo" ? `<li>${esc(v.cargo)} · ${esc(v.organizacao)}</li>` : `<li><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.cargo)}</a> · ${esc(v.organizacao)}${v.cidade ? ", " + esc(v.cidade) : ""}</li>`).join("")}</ul>`;
    const faixa = (arr) => { const p = profissionais(arr).map(salRef); if (!p.length) return "Nenhum salário divulgado neste grupo."; const s = stats(p); return `De ${money(s.min)} a ${money(s.max)} por mês; mediana ${money(s.mediana)} (n = ${s.n}${s.n < 5 ? ", amostra pequena" : ""}).`; };
    const tecCD = topK(grpCD, (v) => v.tecnologias, 8), tecIA = topK(grpIA, (v) => v.tecnologias, 8);
    const setCD = new Set(topK(grpCD, (v) => v.tecnologias, 12).map((x) => x[0])), comuns = topK(grpIA, (v) => v.tecnologias, 12).map((x) => x[0]).filter((t) => setCD.has(t));
    const tipos = (arr) => topK(arr, (v) => L.tipoOrg[v.tipo_org], 4);
    const row = (h, a, b, dado) => `<tr><th scope="row">${h}${dado ? '<br><span class="src-note">dados da base</span>' : ""}</th><td>${a}</td><td>${b}</td></tr>`;
    $("#compare tbody").innerHTML =
      row("Competências mais pedidas nas vagas da área", lista(topK(grpCD, (v) => v.competencias, 6), grpCD.length), lista(topK(grpIA, (v) => v.competencias, 6), grpIA.length), true) +
      row("Cargos relacionados", lista(topK(grpCD, (v) => v.cargo_familia, 6), grpCD.length), lista(topK(grpIA, (v) => v.cargo_familia, 6), grpIA.length), true) +
      row("Tecnologias frequentes", lista(tecCD, grpCD.length), lista(tecIA, grpIA.length), true) +
      row("Possibilidades de atuação", lista(tipos(grpCD), grpCD.length) + "<p>Análise de negócio, BI, crédito e risco, saúde, agronegócio, setor público.</p>", lista(tipos(grpIA), grpIA.length) + "<p>Produtos com IA, automação, atendimento, visão computacional, pesquisa e docência.</p>", true) +
      row("Exemplos reais de vagas", exemplos(grpCD), exemplos(grpIA), true) +
      row("Faixas salariais observadas", faixa(grpCD), faixa(grpIA), true) +
      `<tr><th scope="row">Pontos de convergência</th><td class="both" colspan="2">Os dois cursos se apoiam em programação, estatística e aprendizado de máquina. Tecnologias que aparecem entre as mais pedidas nos dois grupos: <strong>${comuns.map(esc).join(", ") || "—"}</strong>. Na Faculdade Donaduzzi os dois cursos têm a mesma matriz nos cinco primeiros semestres. Muitas vagas aceitam as duas formações (“Computação, Estatística, Engenharias ou áreas afins”), e é comum migrar entre as áreas ao longo da carreira.</td></tr>`;
  }

  // ------------------------------------------------------------ trilhas
  const rx = (r) => (v) => r.test(semAcento(v.cargo));
  const TRILHAS = [
    { t: "Dados: da análise à ciência de dados", steps: [
      { l: "Estágio em dados", f: (v) => v.nivel === "estagio" && v.area !== "Inteligência Artificial" },
      { l: "Analista de Dados / BI", f: (v) => ["Análise de Dados", "Business Intelligence"].includes(v.cargo_familia) },
      { l: "Cientista de Dados", f: (v) => v.cargo_familia === "Ciência de Dados" } ] },
    { t: "IA: do desenvolvimento à especialização", steps: [
      { l: "Estágio ou júnior em IA/desenvolvimento", f: (v) => ["estagio", "junior"].includes(v.nivel) && v.area === "Inteligência Artificial" },
      { l: "Engenheiro(a) de Machine Learning / IA", f: (v) => v.cargo_familia === "Engenharia de ML/IA" },
      { l: "Especialista ou liderança em IA", f: (v) => (v.cargo_familia === "Liderança em dados/IA" || (v.area === "Inteligência Artificial" && ["especialista", "senior"].includes(v.nivel))) } ] },
    { t: "Infraestrutura de dados", steps: [
      { l: "Analista de BI", f: (v) => v.cargo_familia === "Business Intelligence" },
      { l: "Engenheiro(a) de Dados", f: (v) => v.cargo_familia === "Engenharia de Dados" },
      { l: "Arquiteto(a) de Dados / liderança", f: (v) => rx(/arquitet|staff|head|lider|gerente|lead/)(v) && v.area !== "Inteligência Artificial" } ] },
    { t: "Pesquisa e docência", steps: [
      { l: "Bolsista de pesquisa ou residência", f: (v) => v.cargo_familia === "Pesquisa e bolsas" },
      { l: "Pesquisador(a) em IA (mestrado/doutorado)", f: (v) => v.cargo_familia === "Pesquisa e bolsas" && /mestr|doutor|pesquis/.test(semAcento(v.cargo + " " + v.formacao)) },
      { l: "Professor(a) em universidade", f: (v) => v.cargo_familia === "Docência (professor/a)" } ] },
    { t: "Setor público", steps: [
      { l: "Graduação: estágios, residências e seleções públicas de ingresso", f: (v) => (v.tipo_org === "publica" || v.tipo_org === "academica") && ["estagio", "pesquisa"].includes(v.nivel) },
      { l: "Concurso público", f: (v) => v.nivel === "concurso" },
      { l: "Especialista em dados no setor público", f: (v) => v.nivel === "concurso" && v.cargo_familia !== "Docência (professor/a)" } ] },
  ];
  function renderTrilhas() {
    if (!$("#paths")) return;
    const A = ativos();
    $("#paths").innerHTML = TRILHAS.map((tr, ti) => `<article class="path"><h3>${esc(tr.t)}</h3><ol class="steps" style="--n:${tr.steps.length}">${tr.steps.map((st, si) => {
      const vs = A.filter(st.f);
      const ex = vs.slice(0, 2).map((v) => esc(v.cargo) + " · " + esc(v.organizacao)).join("; ");
      return `<li><span class="st-name">${esc(st.l)}</span><span class="st-n">${vs.length} vaga${vs.length === 1 ? "" : "s"} nesta base</span>${ex ? `<span class="st-ex">Ex.: ${ex}</span>` : `<span class="st-ex">Nenhuma vaga com esse perfil nesta coleta.</span>`}${vs.length ? `<button type="button" class="btn small" data-trilha="${ti}-${si}">Ver ${vs.length} no painel</button>` : ""}</li>`;
    }).join("")}</ol></article>`).join("") + `<p class="notice"><span>As etapas são ilustrativas. Mudar de etapa costuma exigir experiência prática, portfólio e estudo contínuo. Cargos e salários variam por empresa, região e momento do mercado.</span></p>`;
  }

  // ------------------------------------------------------------ metodologia
  function renderMetodo() {
    const m = S.base.meta, A = ativos();
    const plat = (f) => { const s = semAcento(f); for (const [k, re] of [["Gupy", /gupy/], ["InfoJobs", /infojobs|pandape/], ["Glassdoor", /glassdoor/], ["Greenhouse (sites de carreira)", /greenhouse/], ["Lever (sites de carreira)", /lever/], ["ProgramaThor", /programathor/], ["Remotar", /remotar/], ["Workday", /workday/], ["PCI Concursos e sites de concursos", /pci|concursos|gran|folha dirigida|cne/], ["Sites oficiais de universidades e órgãos", /oficial|ufpr|utfpr|uem|ufrn|ufc|ufsj|progepe|sigrh|unilab|aocp|cnpq|gov/]]) if (re.test(s)) return k; return "Outros"; };
    const cp = countBy(S.vagas, (v) => plat(v.fonte));
    const comSal = A.filter((v) => v.salario).length;
    const nEst = profissionais(A).length;
    const dominios = [...new Set(S.vagas.map((v) => { try { return new URL(v.url).hostname.replace(/^www\./, ""); } catch (e) { return null; } }).filter(Boolean))].sort();
    const desc = (m.descartes || []).map((d) => `<li>${esc(d.cargo)} · ${esc(d.organizacao)}: ${esc(d.motivo)}</li>`).join("");
    const bloco = (t, c) => `<article class="method"><h3>${t}</h3>${c}</article>`;
    $("#method").innerHTML =
      bloco("Coleta", `<ul><li>Data: ${dataBR(m.data_coleta)}, consolidada às ${esc(m.hora_consolidacao)} (horário de Brasília).</li><li>Tipo de dado: ${m.tipo_dados === "real" ? "real, verificado em anúncios e editais" : "<strong>demonstrativo (fictício)</strong>"}.</li><li>Registros coletados: ${m.registros_brutos}. Duplicatas unidas: ${m.duplicatas_unidas}. Descartados: ${(m.descartes || []).length}.</li><li>Oportunidades na base: ${m.total_registros}; ativas hoje (${dataBR(hojeISO)}): ${A.length}.</li><li>Com salário ou bolsa divulgado: ${comSal}; na estatística de salário profissional: ${nEst}.</li></ul>`) +
      bloco("Sites pesquisados", `<ul>${[...cp.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `<li>${esc(k)}: ${n}</li>`).join("")}</ul><p>O LinkedIn e o SmartRecruiters bloqueiam leitura automatizada e não foram usados. Páginas do Indeed retornaram erro. Algumas vagas foram confirmadas pela interface pública de busca da Gupy.</p>`) +
      bloco("Critérios de inclusão e exclusão", `<ul><li>Entram vagas, estágios, bolsas, concursos e seleções em Ciência de Dados, IA/ML, Engenharia de Dados, BI, Análise de Dados e áreas diretamente relacionadas (estatística, banco de dados, docência em dados/IA).</li><li>Cada oportunidade precisa de página aberta e verificada, com link direto para o anúncio ou edital.</li><li>Ficam fora: prazos vencidos, anúncios marcados como encerrados, vagas genéricas de desenvolvimento sem componente de dados/IA e links que não levam à oportunidade.</li><li>Vagas cuja abertura não pôde ser confirmada aparecem como “A confirmar”. Concursos com inscrição prevista aparecem como “Inscrições em breve”.</li></ul>`) +
      bloco("Cálculo de médias e medianas", `<ol><li>Só entram valores escritos no anúncio ou no edital. Nada é estimado.</li><li>Faixa “de X a Y” vira o ponto médio (X+Y)/2. Valor único entra como está.</li><li>Valores anuais são divididos por 12. Valores por hora não são convertidos e ficam fora.</li><li>Faixas abertas (“até X”, “acima de X”), faixas gerais de edital e valores inconsistentes com o cargo ficam visíveis na vaga, mas fora das médias, com o motivo.</li><li>Bolsas de estágio e de pesquisa têm estatística própria e nunca se misturam aos salários profissionais.</li><li>Benefícios (vale-alimentação, auxílios, ajuda de custo) nunca são somados.</li><li>Cada recorte mostra n, média, mediana, mínimo e máximo. Grupos com menos de 5 vagas são marcados como amostra pequena.</li></ol>`) +
      bloco("Limitações", `<ul><li>A base é uma amostra das vagas encontradas nesta coleta, não um censo do mercado.</li><li>Poucas vagas privadas divulgam salário, principalmente no Paraná. Médias por grupo têm amostras pequenas.</li><li>Agências de RH às vezes anunciam sem o nome do contratante.</li><li>Algumas datas de publicação foram aproximadas a partir de “publicada há X dias” (marcadas com ≈).</li><li>Área, nível e família de cargo foram classificados a partir do título e da descrição e podem conter erros.</li><li>Vagas podem ser encerradas antes do prazo informado.</li></ul>`) +
      bloco("Registros descartados na consolidação", desc ? `<ul>${desc}</ul>` : "<p>Nenhum.</p>") +
      bloco("Links das fontes", `<p>Cada cartão de vaga tem o link direto do anúncio. Domínios consultados:</p><ul class="srclist">${dominios.map((d) => `<li class="mono">${esc(d)}</li>`).join("")}</ul>`) +
      bloco("Avisos importantes", `<ul><li>Vagas e salários podem mudar ou ser encerrados a qualquer momento.</li><li>Confirme todas as informações no anúncio oficial antes de se candidatar.</li><li>Esta página não intermedeia candidaturas e não cobra nada. Desconfie de quem peça pagamento para participar de processo seletivo.</li><li>Os números descrevem as vagas encontradas e não garantem emprego, salário ou progressão de carreira.</li></ul>`);
  }

  // ------------------------------------------------------------ cabeçalho / boletim
  function renderBoletim() {
    const m = S.base.meta, A = ativos();
    const bind = (k, v) => $$(`[data-bind="${k}"]`).forEach((el) => (el.textContent = v));
    bind("total", int.format(A.length));
    bind("pr", int.format(A.filter((v) => v.uf === "PR").length));
    bind("comSalario", int.format(A.filter((v) => v.salario).length));
    bind("orgs", int.format(new Set(A.map((v) => semAcento(v.organizacao))).size));
    bind("atualizacao", `${dataBR(m.data_coleta)}, ${m.hora_consolidacao}`);
    bind("tipoDado", m.tipo_dados === "real" ? "Real, verificado" : "Demonstrativo (fictício)");
    bind("stamp", `Coleta de ${dataBR(m.data_coleta)} · ${m.fuso} · ${m.total_registros} registros`);
    const idade = diasEntre(m.data_coleta, hojeISO);
    const sw = $("#stale-wrap");
    if (m.tipo_dados === "real" && idade > 14) { sw.hidden = false; $("#stale-msg").textContent = `Esta base foi coletada há ${idade} dias. Muitas vagas podem ter sido encerradas. Vagas com prazo vencido já foram ocultadas automaticamente.`; }
    else sw.hidden = true;
  }

  function renderTudo() {
    renderBoletim(); renderCursoDados(); renderKPIs(); renderLista(); renderDashboard(); renderWhy(); renderCompare(); renderTrilhas(); renderMetodo();
    requestAnimationFrame(() => dispatchEvent(new CustomEvent("conteudo:pronto")));
  }

  // ------------------------------------------------------------ exportações
  function csvDasFiltradas() {
    const cols = ["situacao", "cargo", "organizacao", "cidade", "uf", "modalidade", "nivel", "contratacao", "area", "salario_min", "salario_max", "periodicidade", "tipo_valor", "valor_mensal_referencia", "entra_nas_medias", "prazo", "publicacao", "fonte", "link", "tecnologias", "formacao", "verificado_em"];
    const q = (x) => { const s = String(x == null ? "" : x); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const linhas = S.filtradas.map((v) => { const s = v.salario || {}; return [L.situacao[situacao(v)], v.cargo, v.organizacao, v.cidade, v.uf, L.modalidade[v.modalidade] || "", v.nivel_label, v.contratacao, v.area, s.min, s.max, s.periodicidade, s.tipo, s.mensal_ref, s.na_estatistica == null ? "" : s.na_estatistica ? "sim" : "não", v.prazo, v.publicacao, v.fonte, v.url, (v.tecnologias || []).join(" | "), v.formacao, v.verificado_em].map(q).join(";"); });
    const aviso = S.modo === "demo" ? "# DADOS DEMONSTRATIVOS (FICTÍCIOS)\n" : "";
    return "﻿" + aviso + cols.join(";") + "\n" + linhas.join("\n") + "\n";
  }
  async function salvarArquivo(nome, conteudo, mime) {
    if (emArtifact()) {
      try {
        const dl = await window.claude.use("downloads");
        if (!dl) { toast("Download indisponível nesta visualização."); return; }
        await dl.save({ filename: nome, data: conteudo });
        toast("Arquivo salvo.");
      } catch (e) { if (e && e.code === "declined") toast("Download cancelado."); else toast("Não foi possível salvar o arquivo aqui."); }
      return;
    }
    const blob = new Blob([conteudo], { type: mime });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("Download iniciado.");
  }
  function relatorioHTML() {
    const m = S.base.meta, A = ativos(), st = stats(profissionais(A).map(salRef));
    const linhas = S.filtradas.map((v) => `<tr><td>${esc(v.cargo)}</td><td>${esc(v.organizacao)}</td><td>${esc(v.cidade || v.uf || (v.modalidade === "remota" ? "Remota" : "—"))}</td><td>${esc(v.nivel_label)}</td><td>${v.salario ? esc(v.salario.texto_original || money(salRef(v))) : "Não divulgado"}</td><td>${dataBR(v.prazo)}</td><td><a href="${esc(v.url)}">${esc(v.url)}</a></td></tr>`).join("");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de vagas em Dados e IA</title><style>body{font:11pt/1.45 system-ui,Arial,sans-serif;color:#111;margin:24px}h1{font-size:18pt;margin:0 0 4px}table{width:100%;border-collapse:collapse;font-size:9pt}th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}a{color:#0d4f37;word-break:break-all}.demo{border:2px solid #7a3fa0;padding:8px;color:#7a3fa0;font-weight:700}@media print{a{color:#000}}</style></head><body onload="setTimeout(function(){window.print()},300)">
      ${S.modo === "demo" ? '<p class="demo">DADOS DEMONSTRATIVOS (FICTÍCIOS). Nenhuma vaga deste relatório existe.</p>' : ""}
      <h1>Relatório de vagas em Ciência de Dados e IA</h1><p>Coleta de ${dataBR(m.data_coleta)} (${esc(m.hora_consolidacao)}, horário de Brasília). Gerado em ${dataBR(hojeISO)}. Vagas neste relatório: ${S.filtradas.length} (filtros ativos: ${nFiltrosAtivos()}).</p>
      <p>Base ativa: ${A.length} oportunidades · Paraná: ${A.filter((v) => v.uf === "PR").length} · remotas: ${A.filter((v) => v.modalidade === "remota").length} · salário profissional: média ${money(st.media)}, mediana ${money(st.mediana)} (n = ${st.n || 0}).</p>
      <table><thead><tr><th>Cargo</th><th>Organização</th><th>Local</th><th>Nível</th><th>Salário/bolsa (anúncio)</th><th>Prazo</th><th>Link</th></tr></thead><tbody>${linhas}</tbody></table>
      <p style="margin-top:12px;font-size:9pt">Metodologia: valores apenas do anúncio/edital; faixas pelo ponto médio; anual ÷ 12; por hora e faixas abertas fora das médias; bolsas separadas; benefícios não somados. Confirme tudo no anúncio oficial antes de se candidatar.</p></body></html>`;
  }

  // ------------------------------------------------------------ compartilhar / toast
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200); }
  async function compartilhar() {
    const base = (S.base && S.base.meta.url_publica) || location.href.split("?")[0].split("#")[0];
    const url = abaAtual === "vagas" ? base + (emArtifact() ? "" : location.search) + "#vagas" : base + "#" + ABAS[abaAtual].topo;
    if (!emArtifact() && navigator.share) { try { await navigator.share({ title: document.title, text: "Vagas e salários verificados em Ciência de Dados e IA", url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); toast("Link copiado."); }
    catch (e) { const fb = $("#share-fallback"); fb.hidden = false; const i = $("#share-url"); i.value = url; i.focus(); i.select(); toast("Selecione e copie o link."); }
  }


  // ------------------------------------------------------------ abas de curso (conteúdo em data/cursos.json)
  const C = window.__CURSOS__ || null;
  const fmtH = (n) => int.format(n);
  function testeAtuacao(spec) {
    if (!spec) return null;
    if (spec.startsWith("fam:")) { const fams = spec.slice(4).split("|"); return (v) => fams.includes(v.cargo_familia); }
    if (spec.startsWith("rx:")) { const re = new RegExp(spec.slice(3), "i"); return (v) => re.test(semAcento(v.cargo)) || re.test(v.cargo); }
    return null;
  }
  function htmlCurso(k) {
    const c = C[k], cm = C.comum, L = c.landing, outro = k === "cd" ? C.ia : C.cd, p = k, isCD = k === "cd";
    const cont = cm.contato;
    const wa = `${cont.wa}?text=${encodeURIComponent(cm.wa_msg[k])}`;
    const camp = cm.campanha && hojeISO <= cm.campanha.ativo_ate ? cm.campanha : null;
    const campHTML = camp ? `<a class="camp" href="${esc(cont.wa)}?text=${encodeURIComponent(camp.wa_msg)}" target="_blank" rel="noopener noreferrer"><span class="camp-k">${esc(camp.rotulo)}</span><strong>${esc(camp.titulo)}</strong><span class="camp-t">${esc(camp.texto)}</span><span class="camp-cta">${esc(camp.cta)} →</span><span class="sr-only">(abre o WhatsApp em nova aba)</span></a>` : "";
    const qz = cm.quiz;
    const quiz = `<form class="quiz" data-quiz="${p}" aria-labelledby="${p}-qz-t">${qz.perguntas.map(([q, ops], i) => `<fieldset class="qz-q"><legend><span class="qz-n">${i + 1}/${qz.perguntas.length}</span> ${esc(q)}</legend>${ops.map(([t, v], j) => `<label class="qz-op"><input type="radio" name="${p}-q${i}" value="${v}" required> <span>${esc(t)}</span></label>`).join("")}</fieldset>`).join("")}<button type="submit" class="btn primary">Ver meu resultado</button><div class="qz-res" aria-live="polite"></div></form>`;
    const pais = cm.pais.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${d}</span></li>`).join("");
    const alt = cm.alternativas;
    const altHTML = `<div class="compare-wrap" tabindex="0" role="region" aria-label="Comparação com outras formas de aprender (role horizontalmente se necessário)"><table class="compare alt"><caption class="sr-only">Graduação comparada a cursos livres e a aprender sozinho</caption><thead><tr><th scope="col"><span class="sr-only">Critério</span></th>${alt.colunas.map((cc, i) => `<th scope="col" class="${i === 0 ? "is-me" : ""}">${esc(cc)}</th>`).join("")}</tr></thead><tbody>${alt.linhas.map(([r, ...v]) => `<tr><th scope="row">${esc(r)}</th>${v.map((x, i) => `<td class="${i === 0 ? "is-me" : ""}" data-l="${esc(alt.colunas[i])}">${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    const dep = (cm.depoimentos || []).filter((x) => !x.curso || x.curso === k);
    const depHTML = dep.length ? `<section class="block" id="${p}-depoimentos" aria-labelledby="${p}-dep-t"><div class="wrap"><h2 id="${p}-dep-t" class="big-h">Quem estuda aqui</h2><div class="deps">${dep.map((x) => `<figure class="dep">${x.video ? `<video controls preload="none" playsinline ${x.poster ? `poster="${esc(x.poster)}"` : ""} src="${esc(x.video)}"></video>` : x.foto ? `<img src="${esc(x.foto)}" alt="${esc(x.nome)}">` : ""}<blockquote>${esc(x.texto)}</blockquote><figcaption><strong>${esc(x.nome)}</strong> · ${esc(x.periodo || "")}${x.onde ? ` · ${esc(x.onde)}` : ""}</figcaption></figure>`).join("")}</div></div></section>` : "";
    const inv = cm.investimento;
    const invHTML = inv ? `<section class="block" id="${p}-investimento" aria-labelledby="${p}-inv-t"><div class="wrap"><h2 id="${p}-inv-t" class="big-h">Investimento</h2><p class="inv-v">a partir de <strong>${esc(inv.a_partir_de)}</strong> por mês</p>${inv.observacao ? `<p class="sec-lede">${esc(inv.observacao)}</p>` : ""}${(inv.bolsas || []).length ? `<ul class="elet">${inv.bolsas.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</div></section>` : "";
    const seg = cm.periodos.map((pe, i) => `<li><button type="button" class="sg ${pe.so_ia ? "sg-ia" : "sg-base"}${isCD && pe.so_ia ? " is-off" : ""}" data-per="${p}-${pe.n}" aria-controls="${p}-per" aria-pressed="${i === 0}"><span class="sg-n">${pe.n}º</span><span class="sg-l">${esc(cm.segmentos[i][1])}</span></button></li>`).join("");
    const fatos = L.fatos.map(([v, l]) => `<li><span class="pv">${esc(v)}</span><span class="pl">${esc(l)}</span></li>`).join("");
    const faz = L.faz.map(([t, d, tools], i) => `<article class="faz"><span class="faz-n" aria-hidden="true">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><div class="tags">${tools.map((x) => `<span class="tag tech">${esc(x)}</span>`).join("")}</div></article>`).join("");
    const carr = L.carreiras.map((i) => { const [t, d] = c.atuacao[i]; return `<li class="car"><div><h3>${esc(t)}</h3><p>${esc(d.split(". ")[0].replace(/\.$/, ""))}.</p></div><p class="atu-data" data-atu="${p}-${i}"></p></li>`; }).join("");
    const pq = cm.porque_curto.map(([t, d, ref]) => `<article class="pq"><h3>${esc(t)}</h3><p>${esc(d)}<a class="ref" href="#${p}-fontes" aria-label="Ver fonte ${ref}">${ref}</a></p></article>`).join("");
    const resumoMat = c.matriz_resumo.map(([x, y]) => `<div><dt>${esc(x)}</dt><dd>${esc(y)}</dd></div>`).join("");
    const eletivas = cm.eletivas.map(([n, d]) => `<li><strong>${esc(n)}</strong>${d ? ` · ${esc(d)}` : ""}</li>`).join("");
    const faq = L.faq.map((i) => { const [q, a] = c.faq[i]; return `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`; }).join("")
      + cm.faq_extra.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}${/custa/i.test(q) ? ` <a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Perguntar sobre bolsas no WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>` : ""}</p></details>`).join("");
    const fontes = cm.fontes.map(([o, f, u]) => `<li>${esc(o)}: ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(f)}</a>` : esc(f)}.</li>`).join("");
    const co = cm.coordenacao;
    return `
<section class="hero hx" id="${p}" aria-labelledby="${p}-t">
  <canvas class="hx-beam" aria-hidden="true"></canvas>
  <div class="wrap hx-in">
    ${campHTML}
    <p class="hx-k">Faculdade Donaduzzi · ${isCD ? "Graduação tecnológica" : "Bacharelado"}</p>
    <h1 id="${p}-t" class="hx-nome"><span class="hx-pre">Curso de</span> ${esc(c.nome)}</h1>
    <p class="hx-grau">${esc(L.kicker)} · Biopark, Toledo (PR)</p>
    <p class="hx-h" aria-hidden="false"><span>${esc(L.h1[0])}</span> <span class="hl">${esc(L.h1[1])}</span></p>
    <p class="hx-lede">${esc(L.lede)}</p>
    <div class="hero-actions">
      <a class="btn primary" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Quero me inscrever <span class="sr-only">(abre o site da faculdade em nova aba)</span></a>
      <a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Falar no WhatsApp <span class="sr-only">(abre em nova aba)</span></a>
    </div>
    <ul class="hx-facts" aria-label="${esc(c.nome)} em números">${fatos}</ul>
  </div>
</section>

<section class="block" id="${p}-caminho" aria-labelledby="${p}-cam-t">
  <div class="wrap">
    <p class="hx-k">Faculdade Donaduzzi · ${isCD ? "Ciência de Dados" : "Inteligência Artificial"}</p>
    <h2 id="${p}-cam-t" class="big-h">Uma matriz.<br>Duas graduações.</h2>
    <p class="sec-lede">${isCD ? "Em cinco semestres você domina os dados, do primeiro código ao modelo em produção, e sai cientista de dados. Eles são os cinco primeiros do bacharelado em IA: se quiser, você continua por mais três e passa a construir sistemas de IA." : "Os cinco primeiros semestres são a matriz completa de Ciência de Dados: é ali que você domina os dados e os modelos de aprendizado de máquina. Os três últimos são só de IA: algoritmos, IoT, deep learning, visão computacional, IA generativa e agentes inteligentes."}</p>
    <p class="per-hint">Toque em um período para ver o que você estuda nele.</p>
    <ol class="segbar" aria-label="Períodos do curso: do 1º ao 5º em comum, do 6º ao 8º só no bacharelado">${seg}</ol>
    <div class="per-panel" id="${p}-per" aria-live="polite"></div>
    <div class="exits">
      <article class="exit exit-here"><p class="ex-k">${isCD ? "Você conclui aqui" : "Etapa 1 · 5º semestre"}</p><h3>Tecnólogo em Ciência de Dados</h3><p>2.100 h · 2 anos e meio</p></article>
      <article class="exit exit-next${isCD ? "" : " is-on"}"><p class="ex-k">${isCD ? "Se quiser continuar" : "Etapa 2 · 8º semestre"}</p><h3>Bacharel em Inteligência Artificial</h3><p>+ 1.200 h · mais 1 ano e meio</p></article>
    </div>
    <p class="src-note">O aproveitamento de estudos entre os cursos segue as normas acadêmicas e depende de análise da Secretaria Acadêmica.</p>
  </div>
</section>

<section class="block" id="${p}-quiz" aria-labelledby="${p}-qz-t">
  <div class="wrap">
    <h2 id="${p}-qz-t" class="big-h">${esc(qz.titulo)}</h2>
    ${quiz}
  </div>
</section>

<section class="block" id="${p}-faz" aria-labelledby="${p}-faz-t">
  <div class="wrap">
    <h2 id="${p}-faz-t" class="big-h">${esc(L.faz_t)}</h2>
    <div class="fazes">${faz}</div>
    <p class="cmp-cta"><a class="btn" href="#inicio-lab">Experimente uma rede neural no laboratório</a></p>
  </div>
</section>

<section class="block" id="${p}-pratica" aria-labelledby="${p}-pr-t">
  <div class="wrap">
    <h2 id="${p}-pr-t" class="big-h">Na prática</h2>
    <p class="sec-lede">Hackathons, congressos e feiras: os projetos dos alunos saem da sala de aula.</p>
    <div class="galeria">${FOTOS[k].map((x) => fig(x)).join("")}</div>
  </div>
</section>

<section class="block" id="${p}-carreiras" aria-labelledby="${p}-car-t">
  <div class="wrap">
    <h2 id="${p}-car-t" class="big-h">Onde você pode trabalhar</h2>
    <p class="sec-lede">Ao lado de cada carreira, o número de vagas abertas agora no nosso painel.</p>
    <ul class="cars">${carr}</ul>
    <div class="perto" data-perto="${p}"></div>
    <p class="cmp-cta"><a class="btn" href="#panorama">Ver todas as vagas e salários</a></p>
  </div>
</section>

<section class="block" id="${p}-porque" aria-labelledby="${p}-pq-t">
  <div class="wrap">
    <h2 id="${p}-pq-t" class="big-h">Por que na Donaduzzi</h2>
    <div class="pqs">${pq}</div>
    <h3 class="sub-h">Graduação, curso livre ou aprender sozinho?</h3>
    ${altHTML}
  </div>
</section>

<section class="block pais-band" id="${p}-pais" aria-labelledby="${p}-pais-t">
  <div class="wrap">
    <p class="hx-k">Para pais e responsáveis</p>
    <h2 id="${p}-pais-t" class="big-h">Uma escolha segura para o futuro</h2>
    <ul class="pais">${pais}</ul>
  </div>
</section>
${depHTML}
${invHTML}

<section class="block" id="${p}-matriz" aria-labelledby="${p}-mat-t">
  <div class="wrap two-col">
    <div>
      <h2 id="${p}-mat-t" class="big-h">Matriz e dúvidas</h2>
      <p class="sec-lede">${isCD ? "Cinco períodos de 420 horas, com um projeto integrador por período a partir do 2º." : "Oito períodos: cinco em comum com Ciência de Dados e três só de IA, com TCC em dois semestres."} <a href="#${p}-caminho">Explorar período a período</a></p>
      <dl class="mat-rod">${resumoMat}</dl>
      <details class="acc-all"><summary>Disciplinas eletivas e optativas</summary><ul class="elet">${eletivas}</ul></details>
      <p class="src-note">${esc(cm.matriz_fonte)}</p>
    </div>
    <div class="faq">${faq}</div>
  </div>
</section>

<section class="block cta-band" id="${p}-inscricao" aria-labelledby="${p}-cta-t">
  <div class="wrap">
    <div class="cta-box">
      <div>
        <h2 id="${p}-cta-t" class="big-h">${esc(L.cta_t)}</h2>
        <p>Inscrições pelo Seletiva+, pela nota do Enem, por transferência ou como diplomado. Aulas no Biopark, em Toledo (PR).</p>
        <div class="hero-actions"><a class="btn primary" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Quero me inscrever <span class="sr-only">(abre em nova aba)</span></a><a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp ${esc(cont.whatsapp)} <span class="sr-only">(abre em nova aba)</span></a></div>
      </div>
      <p class="cta-coord">Coordenação: <strong>${esc(co.nome)}</strong>, mestre em Ciência da Computação pela Unicamp. · Telefone <span class="sel">${esc(cont.telefone)}</span> · ${esc(cont.endereco)}</p>
    </div>
    <p class="cmp-cta"><a class="btn ghost" href="#${outro.id}">Conhecer também ${esc(outro.nome)}</a></p>
    <details class="fontes" id="${p}-fontes"><summary>Fontes das informações</summary><ol>${fontes}</ol></details>
  </div>
</section>
${htmlProximo(isCD ? "ia" : "vagas")}
<div class="mcta" role="region" aria-label="Ações rápidas"><a class="btn primary" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Inscreva-se<span class="sr-only"> (abre em nova aba)</span></a><a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp<span class="sr-only"> (abre em nova aba)</span></a></div>`;
  }

  // feixe de "pixels" decorativo no topo das abas de curso (canvas, estático)
  function desenharFeixes() {
    $$("canvas.hx-beam").forEach((cv, idx) => {
      if (cv.dataset.anim) return; // motion.js anima este canvas
      const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
      let seed = 1234 + idx * 77; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const cell = Math.max(10, Math.round(r.width / 34)), cols = Math.ceil(r.width / cell), rows = Math.ceil(r.height / cell);
      const cx = cols * 0.58;
      for (let y = 0; y < rows; y++) {
        const t = y / rows, spread = 1.2 + t * t * 9;
        for (let x = 0; x < cols; x++) {
          const d = Math.abs(x - cx) / spread;
          const p = Math.exp(-d * d) * (1 - t * 0.85);
          if (rnd() > p * 0.9) continue;
          const a = Math.min(0.9, 0.12 + p * 0.8 * rnd());
          g.fillStyle = `rgba(250, 168, 34, ${(a * 0.85).toFixed(3)})`;
          if (a > 0.6) { g.shadowColor = "rgba(250, 168, 34, .8)"; g.shadowBlur = 10; } else g.shadowBlur = 0;
          const pad = cell * 0.12;
          g.fillRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2);
        }
      }
    });
  }

  function mostrarPeriodo(k, n, foco) {
    const cm = C.comum, pe = cm.periodos.find((x) => x.n === n); if (!pe) return;
    const isCD = k === "cd", painel = $(`#${k}-per`); if (!painel) return;
    $$(`[data-per^="${k}-"]`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.per === `${k}-${n}`)));
    const tag = pe.so_ia ? (isCD ? "Só no bacharelado em IA" : "Exclusivo do bacharelado") : "Comum a Ciência de Dados e IA";
    const extra = isCD && pe.so_ia ? `<p class="per-note">Este período não faz parte do tecnólogo. Quem conclui Ciência de Dados pode seguir para o bacharelado em IA e cursar os períodos 6 a 8. <a href="#ia">Conhecer o bacharelado</a></p>`
      : pe.n === 5 ? `<p class="per-note is-end">${isCD ? "Fim do curso: você se forma tecnólogo em Ciência de Dados." : "Ao fim deste período, a matriz completa de Ciência de Dados está cumprida (63% do bacharelado)."}</p>`
      : pe.n === 8 && !isCD ? `<p class="per-note is-end">Fim do curso: você se forma bacharel em Inteligência Artificial.</p>` : "";
    const item = (x) => `<li class="per-d t-${x.tipo}"><div class="per-dh"><strong>${esc(x.n)}</strong><span class="per-h">${x.h} h</span></div><p>${esc(x.d)}</p>${x.tipo === "pie" ? '<span class="per-tag">extensão</span>' : x.tipo === "tcc" ? '<span class="per-tag">TCC</span>' : x.tipo === "eletiva" ? '<span class="per-tag">eletiva</span>' : ""}</li>`;
    painel.innerHTML = `<div class="per-head${pe.so_ia ? " is-ia" : ""}"><p class="per-k">${pe.n}º período · ${pe.h} horas · ${esc(tag)}</p><h3>${esc(pe.titulo)}</h3><p class="per-res">${esc(pe.resumo)}</p></div>${extra}<ul class="per-list">${pe.disc.map(item).join("")}</ul>`;
    if (foco) painel.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-per]"); if (!b) return;
    const [k, n] = b.dataset.per.split("-"); mostrarPeriodo(k, +n, true);
  });
  document.addEventListener("keydown", (e) => {
    const b = e.target.closest && e.target.closest("[data-per]"); if (!b || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const [k, n] = b.dataset.per.split("-"); const nn = Math.min(8, Math.max(1, +n + (e.key === "ArrowRight" ? 1 : -1)));
    const alvo = $(`[data-per="${k}-${nn}"]`); if (alvo) { e.preventDefault(); alvo.focus(); mostrarPeriodo(k, nn, false); }
  });

  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-quiz]"); if (!f) return;
    e.preventDefault();
    const k = f.dataset.quiz, qz = C.comum.quiz;
    const votos = { cd: 0, ia: 0 };
    qz.perguntas.forEach((_, i) => { const r = f.querySelector(`input[name="${k}-q${i}"]:checked`); if (r) votos[r.value]++; });
    const res = votos.ia > votos.cd ? "ia" : "cd", curso = C[res];
    const msg = `Olá! Fiz o teste no site e deu ${curso.nome}. Quero saber sobre inscrição e bolsas.`;
    f.querySelector(".qz-res").innerHTML = `<div class="qz-card is-${res}"><p class="hx-k">Seu resultado</p><h3>${esc(curso.nome)}</h3><p>${esc(qz.resultado[res])}</p><p class="src-note">${esc(qz.nota)}</p><div class="hero-actions"><a class="btn primary" href="${esc(C.comum.contato.wa)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener noreferrer">Falar sobre ${esc(curso.nome)} no WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>${res !== k ? `<a class="btn" href="#${res}">Ver o curso de ${esc(curso.nome)}</a>` : `<a class="btn" href="#${k}-caminho">Ver a matriz</a>`}</div></div>`;
  });

  // ------------------------------------------------------------ aba Início: "um caminho, dois diplomas"
  const FOTOS = {
    pratica: [
      ["hackatour-galera", 1000, 666, "Dezenas de estudantes comemoram com os braços para cima diante do painel do Hackatour", "Hackatour Cataratas 2026"],
      ["hackathon-palco", 900, 562, "Equipes de estudantes no palco de um hackathon, diante de um painel iluminado escrito Hackaton", "Hackathon, maio de 2026"],
      ["hackatour-premiacao", 900, 675, "Equipe de estudantes recebe a premiação de 3º lugar no palco do Hackatour Cataratas", "Hackatour Cataratas 2026: 3º lugar"],
      ["latinoware-pesquisa", 900, 675, "Estudante apresenta pesquisa com microfone diante de um slide, no Latinoware", "Latinoware 2026: apresentação de pesquisa"],
      ["cipi-premiacao", 900, 562, "Estudantes seguram um cheque simbólico de premiação no palco do CIPI", "CIPI 2025: premiação"],
      ["laboratorio", 900, 562, "Equipe de estudantes posa ao lado de notebooks com painéis de dados em um laboratório", "Projeto integrador em laboratório"],
      ["pi-saude-bucal", 1000, 563, "Estudantes apresentam o projeto Análise de Dados de Saúde Bucal do Brasil em sala", "Projeto integrador: saúde bucal em dados"],
      ["pesquisa-guarani", 1000, 625, "Estudante apresenta pesquisa sobre IA na preservação da língua Guarani", "Pesquisa: IA e a língua Guarani"],
      ["hackatour-codando", 1000, 666, "Estudantes programam em notebooks durante a maratona do Hackatour", "Hackatour 2026: mão na massa"],
    ],
    cd: [["turma-2026", 1200, 675, "Turma de Ciência de Dados e Inteligência Artificial reunida em sala de aula", "Turma na Retrospectiva 2026"], ["laboratorio", 900, 562, "Equipe de estudantes ao lado de notebooks com painéis de dados", "Projeto integrador em laboratório"], ["latinoware-apresentacao", 900, 675, "Estudante apresenta trabalho com microfone no Latinoware 2026", "Latinoware 2026"], ["pi-saude-bucal", 1000, 563, "Estudantes apresentam projeto de análise de dados de saúde bucal", "Projeto integrador"]],
    ia: [["hackathon-palco", 900, 562, "Equipes no palco de um hackathon", "Hackathon, maio de 2026"], ["latinoware-pesquisa", 900, 675, "Estudante apresenta pesquisa no Latinoware 2026", "Latinoware 2026: pesquisa"], ["arduino", 900, 562, "Protótipo com placa Arduino, protoboard e LEDs ligado a um notebook", "Prototipagem com Arduino"], ["cipi-premiacao", 900, 562, "Estudantes com cheque simbólico de premiação no CIPI", "CIPI 2025: premiação"]],
  };
  const imgSrc = (f, ext) => (window.__IMG__ && window.__IMG__[f]) || `assets/img/${f}.${ext || "webp"}`;
  const fig = ([f, w, h, alt, cap], cls) => `<figure class="${cls || ""}"><img src="${imgSrc(f)}" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"><figcaption>${esc(cap)}</figcaption></figure>`;
  function htmlInicio() {
    const cm = C.comum, cont = cm.contato;
    const msg = "Olá! Vi o site e quero entender como funcionam os dois diplomas (Ciência de Dados + Inteligência Artificial), a inscrição e as bolsas.";
    const wa = `${cont.wa}?text=${encodeURIComponent(msg)}`;
    const nb = (t) => `${t}<span class="sr-only"> (abre em nova aba)</span>`;
    const segs = cm.periodos.map((pe, i) => `<li class="tl-s ${pe.so_ia ? "is-ia" : "is-cd"}" style="--s:${i}"><span class="tl-sn">${pe.n}º</span><span class="tl-sl">${esc(cm.segmentos[i][1])}</span><span class="tl-st">${esc(cm.segmentos[i][2] || "")}</span>${pe.n >= 2 && pe.n <= 6 ? `<span class="tl-pi">Projeto integrador</span>` : pe.n >= 7 ? `<span class="tl-pi">TCC</span>` : `<span class="tl-pi tl-pi-0">Primeiros projetos</span>`}</li>`).join("");
    const pais = cm.pais.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${d}</span></li>`).join("");
    return `
<section class="sp escuro" id="inicio" aria-labelledby="sp-t">
  <canvas class="sp-cv" aria-hidden="true"></canvas>
  <h1 id="sp-t" class="sr-only">Graduação em Ciência de Dados e Inteligência Artificial na Faculdade Donaduzzi</h1>
  <div class="sp-lados">
    <a class="sp-lado sp-cd" href="#cd" data-lado="cd">
      <span class="sp-k">Tecnólogo · 5 semestres · noturno</span>
      <span class="sp-nome">Ciência<br>de Dados</span>
      <span class="sp-frase">Do dado <em>à decisão.</em></span>
      <span class="sp-ir">Conhecer o curso <i aria-hidden="true">→</i></span>
    </a>
    <a class="sp-lado sp-ia" href="#ia" data-lado="ia">
      <span class="sp-k">Bacharelado · 8 semestres · noturno</span>
      <span class="sp-nome">Inteligência<br>Artificial</span>
      <span class="sp-frase">Não só use IA. <em>Construa.</em></span>
      <span class="sp-ir">Conhecer o curso <i aria-hidden="true">→</i></span>
    </a>
  </div>
  <div class="sp-caminho">
    <p class="sp-cam-t">Um caminho. <em>Dois diplomas.</em></p>
    <ol class="sp-marcos" aria-label="Linha do tempo dos dois diplomas">
      <li class="m-ini" style="--x:0%"><b>1º semestre</b><span>Você começa pelos dados</span></li>
      <li class="m-cd" style="--x:62.5%"><b>2 anos e meio</b><span><span class="m-l">Tecnólogo em Ciência de Dados</span><span class="m-c">Tecnólogo em CD</span></span></li>
      <li class="m-ia" style="--x:100%"><b>4 anos</b><span><span class="m-l">Bacharel em Inteligência Artificial</span><span class="m-c">Bacharel em IA</span></span></li>
    </ol>
    <div class="sp-acao">
      <a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${nb("Falar com a gente no WhatsApp")}</a>
      <ul class="sp-provas" aria-label="Por que a Donaduzzi">
        <li><b>5</b><span>nota máxima do MEC nos dois cursos</span></li>
        <li><b>1º</b><span>bacharelado presencial em IA do Paraná</span></li>
        <li><b>94%</b><span>dos alunos de IA trabalhando ou estagiando em 2025<a class="ref" href="#ia-fontes" aria-label="Ver fonte 2">2</a></span></li>
        <li><b data-live="total">—</b><span>vagas abertas hoje no nosso painel</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="in-hero" id="inicio-sobre" aria-labelledby="in-t">
  <canvas class="in-net" aria-hidden="true"></canvas>
  <div class="wrap in-hero-g">
    <div class="in-hero-txt">
      <p class="in-sub-k">Do primeiro dado à IA</p>
      <h2 id="in-t" class="in-h1">Comece pelos dados.<br><span class="hl">Termine construindo IA.</span></h2>
      <p class="in-lede">Aulas à noite, dentro do Biopark, com projetos integradores a partir do 2º semestre. Nos <strong>cinco primeiros semestres</strong>, você domina os dados e se torna cientista de dados. Nos <strong>três últimos</strong>, vai além dos dados e dos modelos de aprendizado de máquina: você constrói sistemas de IA.</p>
      <div class="hero-actions">
        <a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${nb("Falar com a gente no WhatsApp")}</a>
        <a class="btn" href="#inicio-caminho">Como funcionam os 2 diplomas</a>
        <a class="btn ghost" href="#inicio-biopark">Jogar: dirija pelo Biopark</a>
        <a class="btn ghost" href="#inicio-beneficios">Até 90% de desconto</a>
        <a class="btn ghost" href="#inicio-depoimentos">Ver depoimentos</a>
      </div>

    </div>
    <figure class="in-hero-fig">
      <img src="${imgSrc("hero-hackathon")}" width="958" height="719" alt="Estudante sorri diante do notebook durante um hackathon" fetchpriority="high" decoding="async">
      <p class="in-badge"><b>1º</b> bacharelado presencial em IA do Paraná</p>
    </figure>
  </div>
</section>

<div class="marquee" role="region" aria-label="Tecnologias usadas no curso">
  <div class="mq-track"><ul class="mq-list"><li>Python</li><li>SQL</li><li>Power BI</li><li>pandas</li><li>scikit-learn</li><li>TensorFlow</li><li>PyTorch</li><li>LLMs</li><li>Visão computacional</li><li>Agentes de IA</li><li>IoT</li><li>Docker</li><li>Nuvem</li><li>MLOps</li><li>Git</li></ul><ul class="mq-list" aria-hidden="true"><li>Python</li><li>SQL</li><li>Power BI</li><li>pandas</li><li>scikit-learn</li><li>TensorFlow</li><li>PyTorch</li><li>LLMs</li><li>Visão computacional</li><li>Agentes de IA</li><li>IoT</li><li>Docker</li><li>Nuvem</li><li>MLOps</li><li>Git</li></ul></div>
  <button type="button" class="mq-btn" data-marquee-toggle aria-pressed="false"><span class="mq-ic" aria-hidden="true"></span><span class="mq-l sr-only">Pausar animação</span></button>
</div>
<section class="block in-bp" id="inicio-biopark" aria-labelledby="in-bp-t">
  <div class="wrap">
    <div class="in-bp-top">
      <div>
        <p class="in-k">Jogue antes de visitar</p>
        <h2 id="in-bp-t" class="in-h2">Conheça o Biopark <span class="t-ia">dirigindo por ele</span></h2>
      </div>
      <p class="in-sub">Uma simulação breve do Território do Biopark em 3D, para você ter uma ideia do lugar antes da visita presencial. Pegue o carro, colete cubos de dados e descubra, em cada prédio, como a Ciência de Dados e a IA aparecem ali.</p>
    </div>
    <button type="button" class="bp-poster bp-vitrine" data-jogo-abrir aria-label="Abrir o jogo: conheça o Biopark dirigindo por ele">
      <video class="bp-video" muted loop playsinline preload="none" poster="{{asset:assets/img/previa-jogo-capa.webp}}" aria-hidden="true" tabindex="-1"><source src="previa.webm" type="video/webm"><source src="previa.mp4" type="video/mp4"></video>
      <span class="bp-selo" aria-hidden="true">Jogo 3D · grátis, no navegador</span>
      <span class="bp-centro" aria-hidden="true">
        <span class="bp-play-g"><span class="bp-anel"></span><span class="bp-anel"></span><svg viewBox="0 0 24 24" width="34" height="34"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span>
        <span class="bp-cta-t">Clique e dirija</span>
      </span>
      <span class="bp-teclas-anim" aria-hidden="true"><kbd class="k-up">↑</kbd><kbd class="k-le">←</kbd><kbd class="k-dn">↓</kbd><kbd class="k-ri">→</kbd></span>
      <span class="bp-cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 3l14 8-6.2 1.6L16 20l-2.8 1.3-3.3-7.3L5 18z" fill="#fff" stroke="#101821" stroke-width="1.6" stroke-linejoin="round"/></svg></span>
    </button>
    <div class="bp-rodape">
      <ul class="bp-feats" aria-label="O que tem no jogo">
        <li><b>34</b> cubos de dados</li>
        <li><b>11</b> lugares do Biopark</li>
        <li>Missão, visão e valores</li>
        <li>Dia, noite, chuva, vento e neve</li>
      </ul>
      <p class="bp-dica">No computador: setas ou W, A, S, D. No celular: joystick na tela.</p>
    </div>
  </div>
</section>

<div class="in-ponte" aria-hidden="true"><canvas class="in-net"></canvas></div>
<section class="block escuro in-cam" id="inicio-caminho" aria-labelledby="in-cam-t">
  <div class="wrap">
    <p class="in-k">Como funciona</p>
    <h2 id="in-cam-t" class="in-h2">8 semestres. 2 diplomas.</h2>
    <p class="in-sub">Os cinco primeiros semestres formam a matriz completa de Ciência de Dados e são os mesmos do bacharelado em Inteligência Artificial. Você conclui o 5º já com o primeiro diploma e segue mais três semestres para o segundo.</p>
    <div class="tl">
      <ol class="tl-bar" aria-label="Os 8 semestres: do 1º ao 5º em comum com Ciência de Dados, do 6º ao 8º só no bacharelado em IA">${segs}</ol>
      <div class="tl-marks" aria-hidden="true">
        <div class="tl-m tl-m1"><span class="tl-ic">🎓</span><b>Diploma 1</b><span>Tecnólogo em Ciência de Dados · 2,5 anos</span></div>
        <div class="tl-m tl-m2"><span class="tl-ic">🎓</span><b>Diploma 2</b><span>Bacharel em Inteligência Artificial · 4 anos</span></div>
      </div>
    </div>
    <ol class="tl-steps">
      <li><span class="tl-n">1º ao 5º semestre</span><h3>Você domina os dados</h3><p>Programação, estatística, bancos de dados, engenharia de dados, nuvem e machine learning, do primeiro código ao modelo em produção.</p></li>
      <li class="is-gold"><span class="tl-n">Fim do 5º semestre</span><h3>Primeiro diploma</h3><p>Tecnólogo em Ciência de Dados (2.100 h), reconhecido pelo MEC. Você sai cientista de dados, pronto para atuar também como analista ou engenheiro de dados.</p></li>
      <li><span class="tl-n">6º ao 8º semestre</span><h3>Você constrói sistemas de IA</h3><p>Algoritmos, IoT e apps, deep learning, visão computacional, IA generativa e agentes inteligentes, com TCC. Você conclui Bacharel em Inteligência Artificial (3.300 h).</p></li>
    </ol>
    <p class="src-note">O aproveitamento de estudos entre os cursos segue as normas acadêmicas e depende de análise da Secretaria Acadêmica.</p>
    <p class="cmp-cta"><a class="btn" href="#ia-caminho">Ver o que se estuda em cada período</a></p>
  </div>
</section>

<section class="block in-carr" id="inicio-carreiras" aria-labelledby="in-cr-t">
  <div class="wrap">
    <p class="in-k">Carreiras</p>
    <h2 id="in-cr-t" class="in-h2">Em que áreas você pode trabalhar e atuar?</h2>
    <p class="in-sub">Toque em uma profissão e veja, em poucos segundos, o que ela faz e onde trabalha.</p>
    <div class="cr-tabs" role="group" aria-label="Escolha a profissão">
      <button type="button" class="cr-tab" data-p="cd" aria-pressed="true" aria-controls="cr-corpo"><span class="cr-tic" aria-hidden="true">📊</span><span><b>Cientista de dados</b><small>Curso de Ciência de Dados</small></span></button>
      <button type="button" class="cr-tab" data-p="ia" aria-pressed="false" aria-controls="cr-corpo"><span class="cr-tic" aria-hidden="true">🤖</span><span><b>Bacharel em Inteligência Artificial</b><small>Curso de Inteligência Artificial</small></span></button>
    </div>
    <div class="cr-corpo" id="cr-corpo" aria-live="polite"></div>
  </div>
</section>

<section class="block in-pratica" id="inicio-pratica" aria-labelledby="in-pr-t">
  <div class="wrap">
    <p class="in-k">Na prática</p>
    <h2 id="in-pr-t" class="in-h2">Aprender fazendo, do laboratório ao palco</h2>
    <p class="in-sub">Os projetos saem da sala de aula e vão para hackathons, congressos de tecnologia e feiras de inovação.</p>
    <div class="mosaic">${FOTOS.pratica.map((x, i) => fig(x, i === 0 ? "m-big" : "")).join("")}</div>
    <aside class="in-case"><p class="in-k">Projeto de estudantes</p><p><strong>Peso na Granja:</strong> alunos de Ciência de Dados e IA criaram um sistema que estima o peso de suínos por câmera e redes neurais. Foi premiado no Hackathon do Show Rural Digital 2026 e entrou na trilha de incubação do Biopark.<a class="ref" href="#ia-fontes" aria-label="Ver fonte 3">3</a></p></aside>
  </div>
</section>

<div class="in-ponte in-ponte-lab" aria-hidden="true"><canvas class="in-net"></canvas></div>
<section class="block in-depo" id="inicio-depoimentos" aria-labelledby="in-dp-t">
  <div class="wrap">
    <p class="in-k">Quem estuda aqui conta</p>
    <h2 id="in-dp-t" class="in-h2">Depoimentos de alunos de Ciência de Dados e IA</h2>
    <p class="in-sub">Estudantes dos dois cursos falam sobre a escolha, os projetos, os hackathons e o que mudou desde que entraram. Vídeo com legendas, cerca de 10 minutos.</p>
    <div class="dp-g">
      <div class="dp-v" id="dp-v">
        <button type="button" class="dp-play" data-t="0" aria-label="Assistir ao vídeo de depoimentos no YouTube">
          <img src="{{asset:assets/img/depoimentos-capa.webp}}" width="1280" height="720" alt="Estudantes de Ciência de Dados e IA conversam em um estúdio de podcast da Faculdade Donaduzzi" loading="lazy" decoding="async">
          <span class="dp-ic" aria-hidden="true"></span><span class="dp-lbl">Assistir aos depoimentos</span>
        </button>
      </div>
      <div class="dp-side">
        <p class="dp-k">Pule direto para</p>
        <ol class="dp-caps"><li><button type="button" class="dp-cap" data-t="0"><span>0:00</span>Seu futuro começa com uma escolha</button></li><li><button type="button" class="dp-cap" data-t="78"><span>1:18</span>Aprender fazendo</button></li><li><button type="button" class="dp-cap" data-t="237"><span>3:57</span>A maior transformação</button></li><li><button type="button" class="dp-cap" data-t="321"><span>5:21</span>Além da sala de aula</button></li><li><button type="button" class="dp-cap" data-t="445"><span>7:25</span>Um conselho para quem está no terceirão</button></li></ol>
        <p class="dp-yt"><a href="https://youtu.be/eR3mpiO97DQ" target="_blank" rel="noopener noreferrer">Abrir no YouTube<span class="sr-only"> (abre em nova aba)</span></a></p>
      </div>
    </div>
  </div>
</section>

<section class="block escuro in-lab" id="inicio-lab" aria-labelledby="lab-t">
  <div class="wrap">
    <p class="in-k">Laboratório</p>
    <h2 id="lab-t" class="in-h2">Veja uma IA pensando</h2>
    <p class="in-sub">Desenhe um número de 0 a 9. Uma rede neural de verdade, treinada com 10 mil dígitos escritos à mão, tenta adivinhar, e você vê cada camada trabalhar. Depois, ensine a sua própria IA usando a câmera.</p>
    <div class="lab" data-lab-app></div>
  </div>
</section>

<section class="block in-mercado" id="inicio-mercado" aria-labelledby="in-me-t">
  <div class="wrap">
    <p class="in-k">Mercado</p>
    <h2 id="in-me-t" class="in-h2">Tem vaga. E paga bem.</h2>
    <ul class="in-nums">
      <li><b data-live="total">—</b><span>vagas abertas hoje em dados e IA, no Paraná e no Brasil</span></li>
      <li><b data-live="mediana">—</b><span>mediana salarial mensal dos anúncios que informam salário</span></li>
      <li><b data-live="perto">—</b><span>vagas no oeste e sudoeste do Paraná, perto de Toledo</span></li>
    </ul>
    <p class="src-note">Fonte: painel de vagas desta página, com anúncios verificados um a um (coleta de <span data-live="coleta">—</span>).</p>
    <p class="cmp-cta"><a class="btn" href="#panorama">Ver vagas e salários</a></p>
  </div>
</section>

<section class="block in-escolha" id="inicio-escolha" aria-labelledby="in-es-t">
  <div class="wrap">
    <p class="in-k">Por onde começar</p>
    <h2 id="in-es-t" class="in-h2">Escolha a porta de entrada</h2>
    <div class="in-cards">
      <article class="in-card is-cd"><p class="in-ck">Tecnólogo · 5 semestres · noturno</p><h3>Ciência de Dados</h3><p>Para quem quer chegar rápido ao mercado: análise, engenharia e ciência de dados em 2 anos e meio.</p><a class="btn primary" href="#cd">Conhecer Ciência de Dados</a></article>
      <article class="in-card is-ia"><p class="in-ck">Bacharelado · 8 semestres · noturno</p><h3>Inteligência Artificial</h3><p>Inclui toda a Ciência de Dados e vai além: visão computacional, IA generativa, agentes e TCC.</p><a class="btn primary" href="#ia">Conhecer Inteligência Artificial</a></article>
    </div>
    <p class="in-quiz">Em dúvida? <a href="#cd-quiz">Faça o teste de 3 perguntas</a>.</p>
  </div>
</section>

<section class="block in-ben" id="inicio-beneficios" aria-labelledby="in-bn-t">
  <div class="wrap">
    <p class="in-k">Bolsas e benefícios · Vestibular de Verão 2027.1</p>
    <h2 id="in-bn-t" class="in-h2">Até 90% de desconto na mensalidade</h2>
    <p class="in-sub">Quem ingressa no 1º semestre de 2027 sem atividade remunerada começa com 90% de desconto. Se passar a trabalhar durante o curso, o desconto é reajustado no semestre seguinte, conforme a renda.</p>
    <div class="bn-faixas" role="table" aria-label="Desconto na matrícula e reajuste por renda mensal bruta durante o curso">
      <div role="row" class="bn-f bn-top"><span role="cell">Na matrícula, sem atividade remunerada</span><b role="cell">90%</b></div>
      <div role="row" class="bn-f"><span role="cell">Se começar estágio ou renda até R$ 1.741</span><b role="cell">65%</b></div>
      <div role="row" class="bn-f"><span role="cell">R$ 1.742 a R$ 2.500</span><b role="cell">55%</b></div>
      <div role="row" class="bn-f"><span role="cell">R$ 2.501 a R$ 3.500</span><b role="cell">40%</b></div>
      <div role="row" class="bn-f"><span role="cell">R$ 3.501 a R$ 4.999</span><b role="cell">10%</b></div>
    </div>
    <p class="bn-nota">As faixas de 65% a 10% valem no reajuste semestral de quem começa a trabalhar durante o curso. O desconto é revalidado a cada semestre para quem mantém média 7, frequência e documentos em dia.</p>
    <ul class="bn-cards">
      <li><span class="bn-ic" aria-hidden="true">🎓</span><h3>Bolsas de estudo</h3><p>Editais de bolsas CEBAS, integrais ou parciais, e concursos de bolsas ao longo do ano.</p></li>
      <li><span class="bn-ic" aria-hidden="true">💼</span><h3>Entrevistas de emprego</h3><p>Programa de Empregabilidade: até 3 entrevistas durante o curso, de preferência em empresas do Biopark.</p></li>
      <li><span class="bn-ic" aria-hidden="true">🏠</span><h3>Ajuda no aluguel</h3><p>Benefício Locatício: reembolso de parte do aluguel de imóveis cadastrados no Território do Biopark.</p></li>
      <li><span class="bn-ic" aria-hidden="true">🏛️</span><h3>FIES</h3><p>Financiamento estudantil do governo federal, com orientação da faculdade para a inscrição.</p></li>
    </ul>
    <p class="src-note">Fonte: <a href="https://faculdadedonaduzzi.com.br/wp-content/uploads/2026/10/Regulamento-de-Concessao-de-Beneficios-revisado-Faculdade-2027docx-assinado34446714.pdf" target="_blank" rel="noopener noreferrer">Regulamento de Concessão de Benefícios, Vestibular de Verão 2027.1<span class="sr-only"> (abre em nova aba)</span></a>. Vale para novos ingressantes, com concessão de 2/10/2026 a 5/3/2027; os benefícios não são cumulativos e dependem de disponibilidade. Veja também os <a href="https://faculdadedonaduzzi.com.br/editais-e-regulamentos-candidatos/" target="_blank" rel="noopener noreferrer">editais de bolsas<span class="sr-only"> (abre em nova aba)</span></a>.</p>
    <p class="cmp-cta"><a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${nb("Simular meu desconto no WhatsApp")}</a></p>
  </div>
</section>

<section class="block pais-band" id="inicio-pais" aria-labelledby="in-pa-t">
  <div class="wrap in-pais-g">
    <div>
      <p class="in-k">Para pais e responsáveis</p>
      <h2 id="in-pa-t" class="in-h2">Uma escolha segura para o futuro</h2>
      <ul class="pais">${pais}</ul>
    </div>
    <figure class="in-pais-fig">${fig(FOTOS.cd[0]).replace(/^<figure class="">|<\/figure>$/g, "")}</figure>
  </div>
</section>

<section class="block in-coord" id="inicio-coordenador" aria-labelledby="in-co-t">
  <div class="wrap">
    <div class="co-card">
      <img class="co-foto" src="{{asset:assets/img/coordenador-leonardo.webp}}" width="360" height="360" alt="Foto do professor Leonardo Garcia Tampelini, coordenador dos cursos" loading="lazy" decoding="async">
      <div class="co-txt">
        <p class="in-k">Fale com o coordenador</p>
        <h2 id="in-co-t" class="co-nome">Prof. Leonardo Garcia Tampelini</h2>
        <p class="co-cargo">Coordenador dos cursos de Ciência de Dados e Inteligência Artificial</p>
        <ul class="co-cv">
          <li>Mestre em Ciência da Computação pela <b>Unicamp</b></li>
          <li>Especialista em Mineração de Dados Complexos pela <b>Unicamp</b></li>
          <li>Bacharel em Informática pela <b>Unioeste</b></li>
          <li>Professor no ensino superior desde <b>2013</b>, com experiência em autorização e reconhecimento de cursos junto ao MEC e em consultoria de projetos de tecnologia</li>
        </ul>
        <p class="co-convite">Ficou com dúvida sobre os cursos, a matriz, os projetos ou a carreira? Mande uma mensagem direto para o coordenador.</p>
        <div class="hero-actions">
          <a class="btn primary co-wa" href="https://wa.me/5545998068562?text=Ol%C3%A1%2C%20professor%20Leonardo%21%20Vim%20pelo%20site%20dos%20cursos%20de%20Ci%C3%AAncia%20de%20Dados%20e%20IA%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida." target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💬</span> WhatsApp do coordenador: (45) 99806-8562<span class="sr-only"> (abre em nova aba)</span></a>
          <a class="btn" href="http://lattes.cnpq.br/8859478385930696" target="_blank" rel="noopener noreferrer">Currículo Lattes<span class="sr-only"> (abre em nova aba)</span></a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="block cta-band" id="inicio-inscricao" aria-labelledby="in-cta-t">
  <div class="wrap">
    <div class="cta-box escuro">
      <div>
        <img class="cta-logo" src="${imgSrc("logo-donaduzzi-branco", "svg")}" width="487" height="137" alt="Faculdade Donaduzzi">
        <h2 id="in-cta-t" class="big-h">Seu primeiro diploma em 2 anos e meio. O segundo, em 4.</h2>
        <p>Ingresso pelo Seletiva+, pela nota do Enem, por transferência ou como diplomado. Descontos de até 90%, bolsas e ajuda no aluguel: a equipe tira suas dúvidas pelo WhatsApp.</p>
        <div class="hero-actions"><a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${nb("Falar no WhatsApp " + esc(cont.whatsapp))}</a><a class="btn" href="${esc(C.cd.url)}" target="_blank" rel="noopener noreferrer">${nb("Inscrição em Ciência de Dados")}</a><a class="btn" href="${esc(C.ia.url)}" target="_blank" rel="noopener noreferrer">${nb("Inscrição em IA")}</a></div>
      </div>
      <p class="cta-coord">Coordenação: <strong>${esc(cm.coordenacao.nome)}</strong>, mestre em Ciência da Computação pela Unicamp. · Telefone <span class="sel">${esc(cont.telefone)}</span> · ${esc(cont.endereco)}</p>
    </div>
  </div>
</section>
${htmlProximo("cd")}
<div class="mcta" role="region" aria-label="Ações rápidas"><a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${nb("WhatsApp")}</a><a class="btn" href="#inicio-escolha">Ver cursos</a></div>`;
  }


  // ------------------------------------------------------------ passagem automática para a próxima aba
  const PROXIMA = { inicio: "cd", cd: "ia", ia: "vagas" };
  const NOME_ABA = { inicio: "Início", cd: "Curso de Ciência de Dados", ia: "Curso de Inteligência Artificial", vagas: "Vagas e salários" };
  const TITULO_ABA = { inicio: "Ciência de Dados e IA · Faculdade Donaduzzi: um caminho, dois diplomas", cd: "Curso de Ciência de Dados · Faculdade Donaduzzi", ia: "Curso de Inteligência Artificial · Faculdade Donaduzzi", vagas: "Vagas e salários em Dados e IA · Faculdade Donaduzzi" };
  function htmlProximo(alvo) {
    const sub = { cd: "Tecnólogo · 5 semestres · o primeiro diploma", ia: "Bacharelado · 8 semestres · o segundo diploma", vagas: "Vagas abertas e salários da área, verificados" }[alvo];
    return `<section class="proximo" data-proximo="${alvo}" aria-label="Próxima parte do site">
  <div class="wrap">
    <a class="px-a" href="#${alvo === "vagas" ? "panorama" : alvo}">
      <span class="px-k">Próximo</span>
      <strong class="px-t">${esc(NOME_ABA[alvo])}</strong>
      <span class="px-s">${esc(sub)}</span>
      <span class="px-bar" aria-hidden="true"><i></i></span>
      <span class="px-h" aria-hidden="true">Continue rolando para seguir</span>
    </a>
  </div>
</section>`;
  }

  function renderCursos() {
    const bi = $("#aba-inicio");
    if (bi) bi.innerHTML = C && C.comum ? htmlInicio() : `<div class="wrap" style="padding-block:48px"><div class="state" role="alert"><h3>Conteúdo indisponível</h3><p>O arquivo <span class="mono">data/cursos.js</span> não foi carregado.</p></div></div>`;
    ["cd", "ia"].forEach((k) => {
      const box = $("#aba-" + k);
      if (!C || !C[k]) { box.innerHTML = `<div class="wrap" style="padding-block:48px"><div class="state" role="alert"><h3>Conteúdo do curso indisponível</h3><p>O arquivo <span class="mono">data/cursos.js</span> não foi carregado.</p></div></div>`; return; }
      box.innerHTML = htmlCurso(k);
      mostrarPeriodo(k, 1, false);
    });
    requestAnimationFrame(() => dispatchEvent(new CustomEvent("conteudo:pronto")));
  }
  function renderCursoDados() {
    if (!C) return;
    const A = ativos();
    const st = stats(profissionais(A).map(salRef));
    $$('[data-live="mediana"]').forEach((el) => (el.textContent = st.n ? money(st.mediana) : "—"));
    $$('[data-live="total"]').forEach((el) => (el.textContent = String(A.length)));
    $$('[data-live="coleta"]').forEach((el) => (el.textContent = S.base && S.base.meta && S.base.meta.data_coleta ? dataBR(S.base.meta.data_coleta) : "—"));
    const nml = A.filter((v) => (v.competencias || []).some((x) => x === "Machine learning e modelagem" || x === "IA generativa e LLMs")).length;
    $$('[data-live="ml"]').forEach((el) => (el.textContent = String(nml)));
    const oeste = new Set(C.comum.oeste_pr.map(semAcento));
    const perto = A.filter((v) => v.uf === "PR" && oeste.has(semAcento(v.cidade || "")));
    $$('[data-live="perto"]').forEach((el) => (el.textContent = String(perto.length)));
    const cid = [...countBy(perto, (v) => v.cidade).entries()].sort((a, b) => b[1] - a[1]);
    $$("[data-perto]").forEach((el) => {
      el.innerHTML = perto.length ? `<div class="perto-in"><p class="hx-k">Perto de casa</p><h3><span class="perto-n">${perto.length}</span> vaga${perto.length === 1 ? "" : "s"} abertas no oeste e sudoeste do Paraná</h3><p class="perto-c">${cid.map(([c2, n]) => `<span class="tag">${esc(c2)} · ${n}</span>`).join(" ")}</p><ul class="perto-l">${perto.slice(0, 3).map((v) => `<li><strong>${esc(v.cargo)}</strong> · ${esc(v.organizacao)}, ${esc(v.cidade)}</li>`).join("")}</ul><button type="button" class="btn small" data-perto-go="1">Ver essas vagas</button></div>` : "";
    });
    ["cd", "ia"].forEach((k) => C[k].atuacao.forEach(([t, , , spec], i) => {
      const el = $(`[data-atu="${k}-${i}"]`); if (!el) return;
      const f = testeAtuacao(spec); const n = f ? A.filter(f).length : 0;
      el.innerHTML = n ? `<button type="button" class="car-n" data-atu-go="${k}-${i}"><b>${n}</b> <span>vaga${n === 1 ? "" : "s"}</span><span class="sr-only"> de ${esc(t)}: ver no painel</span></button>` : `<span class="car-n is-zero"><b>0</b><span>nesta coleta</span></span>`;
    }));
  }
  renderCursos();
  document.body.dataset.aba = "inicio";
  requestAnimationFrame(desenharFeixes);
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-atu-go]");
    if (g) {
      const [k, i] = g.dataset.atuGo.split("-"); const [t, , , spec] = C[k].atuacao[+i];
      Object.assign(S.f, { q: "", regiao: new Set(), uf: "", cidade: "", modalidade: new Set(), nivel: new Set(), area: new Set(), faixa: "", contratacao: "", formacao: "", abertas: false });
      S.f.trilha = { label: t, test: testeAtuacao(spec) }; montarFiltros(); ativarAba("vagas"); reaplicar(true); return;
    }
    if (e.target.closest("[data-perto-go]")) {
      const oeste = new Set(C.comum.oeste_pr.map(semAcento));
      Object.assign(S.f, { q: "", regiao: new Set(), uf: "", cidade: "", modalidade: new Set(), nivel: new Set(), area: new Set(), faixa: "", contratacao: "", formacao: "", abertas: false });
      S.f.trilha = { label: "oeste e sudoeste do Paraná", test: (v) => v.uf === "PR" && oeste.has(semAcento(v.cidade || "")) }; montarFiltros(); ativarAba("vagas"); reaplicar(true); return;
    }
    const a = e.target.closest("[data-acc]");
    if (a) { $$(`#${a.dataset.alvo} details.acc`).forEach((d) => (d.open = a.dataset.acc === "abrir")); }
  });

  // ------------------------------------------------------------ abas
  const ABAS = {
    inicio: { tab: "#tab-inicio", painel: "#aba-inicio", topo: "inicio" },
    cd: { tab: "#tab-cd", painel: "#aba-cd", topo: "cd" },
    ia: { tab: "#tab-ia", painel: "#aba-ia", topo: "ia" },
    vagas: { tab: "#tab-vagas", painel: "#aba-vagas", topo: "panorama" },
  };
  const ORDEM_ABAS = ["inicio", "cd", "ia", "vagas"];
  let abaAtual = "inicio";
  function ativarAba(nome, foco) {
    if (!ABAS[nome]) return;
    const mudou = nome !== abaAtual;
    abaAtual = nome;
    document.body.dataset.aba = nome;
    if (TITULO_ABA[nome]) document.title = TITULO_ABA[nome];
    Object.entries(ABAS).forEach(([k, a]) => {
      const t = $(a.tab), p = $(a.painel), on = k === nome;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; p.hidden = !on;
    });
    $$(".nav a[data-aba]").forEach((l) => (l.hidden = l.dataset.aba !== nome));
    esconderTip();
    if (foco) $(ABAS[nome].tab).focus();
    if (mudou && nome === "vagas") requestAnimationFrame(() => graficos.forEach((g) => g.draw()));
    if (nome !== "vagas") requestAnimationFrame(desenharFeixes);
    if (mudou) requestAnimationFrame(() => dispatchEvent(new CustomEvent("aba:mudou", { detail: { aba: nome } })));
    return mudou;
  }
  function abaDoPainel(p) { return p.id.replace("aba-", ""); }
  function irPara(id, suave) {
    const el = document.getElementById(id); if (!el) return false;
    const p = el.closest('[role="tabpanel"]');
    if (p) ativarAba(abaDoPainel(p));
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ehTopo = Object.values(ABAS).some((a) => a.topo === id);
    requestAnimationFrame(() => { if (ehTopo) window.scrollTo({ top: 0 }); else el.scrollIntoView({ behavior: suave && !reduz ? "smooth" : "auto", block: "start" }); });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignora */ }
    return true;
  }
  $$('[role="tab"]').forEach((t) => {
    t.addEventListener("click", () => { const nome = t.id.replace("tab-", ""); ativarAba(nome); window.scrollTo({ top: 0 }); try { history.replaceState(null, "", "#" + ABAS[nome].topo); } catch (e) { /* ignora */ } });
    t.addEventListener("keydown", (e) => {
      const i = ORDEM_ABAS.indexOf(abaAtual); let n = null;
      const N = ORDEM_ABAS.length;
      if (e.key === "ArrowRight") n = ORDEM_ABAS[(i + 1) % N]; else if (e.key === "ArrowLeft") n = ORDEM_ABAS[(i + N - 1) % N];
      else if (e.key === "Home") n = ORDEM_ABAS[0]; else if (e.key === "End") n = ORDEM_ABAS[N - 1];
      if (n) { e.preventDefault(); ativarAba(n, true); window.scrollTo({ top: 0 }); }
    });
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1); if (!id) return;
    if (id === "conteudo") { const p = $(ABAS[abaAtual].painel); setTimeout(() => p.focus(), 0); return; }
    if (irPara(id, true)) e.preventDefault();
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Copiado."); }
    catch (err) { const s = b.previousElementSibling; if (s) { const r = document.createRange(); r.selectNodeContents(s); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } toast("Texto selecionado: copie com Ctrl+C."); }
  });
  function abrirPeloEndereco() { const h = (location.hash || "").slice(1); if (h && /^[A-Za-z0-9._~-]+$/.test(h)) irPara(h, false); }
  // Ao abrir o link, a página sempre começa no topo da aba Início (o endereço com # é ignorado na abertura).
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* ignora */ }
  if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignora */ } }
  window.scrollTo(0, 0);
  addEventListener("load", () => window.scrollTo(0, 0));
  addEventListener("hashchange", abrirPeloEndereco);

  let avanco = null, bloqueioAte = 0, travaTopoAte = 0, empurrao = 0;
  const noFim = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;
  const faixa = () => $(`${ABAS[abaAtual].painel} .proximo`);
  function cancelarAvanco() {
    if (!avanco) return; cancelAnimationFrame(avanco); avanco = null; empurrao = 0;
    $$(".proximo").forEach((b) => { b.classList.remove("is-armed"); b.style.setProperty("--px", "0"); const h = $(".px-h", b); if (h) h.textContent = "Continue rolando para seguir"; });
  }
  function avancar() {
    const prox = PROXIMA[abaAtual]; if (!prox) return;
    cancelarAvanco(); ativarAba(prox); window.scrollTo({ top: 0, behavior: "instant" });
    try { history.replaceState(null, "", "#" + ABAS[prox].topo); } catch (e) { /* ignora */ }
    bloqueioAte = performance.now() + 900; travaTopoAte = performance.now() + 700; toast(`Agora: ${NOME_ABA[prox]}`);
  }
  function armarAvanco() {
    if (avanco || !PROXIMA[abaAtual] || performance.now() < bloqueioAte) return;
    const b = faixa(); if (!b) return;
    b.classList.add("is-armed"); const h = $(".px-h", b); if (h) h.textContent = `Indo para ${NOME_ABA[PROXIMA[abaAtual]]}… role para cima para ficar aqui`;
    const t0 = performance.now(), dur = 1600;
    const passo = (t) => {
      if (!noFim()) { cancelarAvanco(); return; }
      const pr = Math.min(1, (t - t0) / dur + empurrao);
      b.style.setProperty("--px", pr.toFixed(3));
      if (pr >= 1) { avancar(); return; }
      avanco = requestAnimationFrame(passo);
    };
    avanco = requestAnimationFrame(passo);
  }
  addEventListener("scroll", () => {
    if (performance.now() < travaTopoAte) { if (window.scrollY) window.scrollTo(0, 0); return; } // a rodinha que sobrou não desce a aba nova
    if (noFim()) armarAvanco(); else cancelarAvanco();
  }, { passive: true });
  addEventListener("wheel", (e) => { if (e.deltaY > 0 && noFim()) { armarAvanco(); empurrao = Math.min(1, empurrao + e.deltaY / 900); } }, { passive: true });
  let toqueY = null;
  addEventListener("touchstart", (e) => { toqueY = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", (e) => { if (toqueY == null || !noFim()) return; const d = toqueY - e.touches[0].clientY; if (d > 0) { armarAvanco(); empurrao = Math.min(1, d / 500); } }, { passive: true });
  addEventListener("keydown", (e) => { if (["PageDown", "ArrowDown", " ", "End"].includes(e.key) && noFim() && !e.target.closest("input, textarea, select, canvas")) { armarAvanco(); empurrao = Math.min(1, empurrao + 0.35); } });


  // ------------------------------------------------------------ filtros no endereço (link compartilhável)
  const URL_SETS = ["regiao", "modalidade", "nivel", "area"], URL_STR = ["q", "uf", "cidade", "faixa", "contratacao", "formacao"];
  function filtrosDaURL() {
    let qs; try { qs = new URLSearchParams(location.search); } catch (e) { return; }
    URL_STR.forEach((k) => { if (qs.has(k)) S.f[k] = qs.get(k).slice(0, 80); });
    URL_SETS.forEach((k) => { if (qs.has(k)) S.f[k] = new Set(qs.get(k).split(",").filter(Boolean).slice(0, 12)); });
    if (qs.get("abertas") === "1") S.f.abertas = true;
    if (qs.get("encerradas") === "1") S.f.encerradas = true;
    if (qs.has("ordem") && ORD[qs.get("ordem")]) { S.sort = qs.get("ordem"); const so = $("#f-sort"); if (so) so.value = S.sort; }
  }
  function filtrosNaURL() {
    const qs = new URLSearchParams();
    URL_STR.forEach((k) => { if (S.f[k]) qs.set(k, S.f[k]); });
    URL_SETS.forEach((k) => { if (S.f[k].size) qs.set(k, [...S.f[k]].join(",")); });
    if (S.f.abertas) qs.set("abertas", "1"); if (S.f.encerradas) qs.set("encerradas", "1");
    if (S.sort && S.sort !== "recentes") qs.set("ordem", S.sort);
    const q = qs.toString();
    try { history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash); } catch (e) { /* ambiente sem history (ex.: iframe) */ }
  }
  const QUICK = {
    pr: { on: () => S.f.regiao.has("PR"), set: (v) => (v ? S.f.regiao.add("PR") : S.f.regiao.delete("PR")) },
    inicio: { on: () => ["estagio", "trainee", "junior"].every((n) => S.f.nivel.has(n)), set: (v) => ["estagio", "trainee", "junior"].forEach((n) => (v ? S.f.nivel.add(n) : S.f.nivel.delete(n))) },
    remota: { on: () => S.f.modalidade.has("remota"), set: (v) => (v ? S.f.modalidade.add("remota") : S.f.modalidade.delete("remota")) },
    sal: { on: () => S.f.faixa === "com", set: (v) => (S.f.faixa = v ? "com" : "") },
  };
  function syncQuick() { $$("[data-quick]").forEach((b) => b.setAttribute("aria-pressed", String(QUICK[b.dataset.quick].on()))); }

  // ------------------------------------------------------------ eventos
  function reaplicar(voltarTopo) {
    S.mostrar = 20; aplicar(); renderLista(); syncQuick(); filtrosNaURL();
    if (S.escopo === "filtradas") renderDashboard();
    if (voltarTopo) $("#vagas").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function limparTudo() {
    Object.assign(S.f, { q: "", regiao: new Set(), uf: "", cidade: "", modalidade: new Set(), nivel: new Set(), area: new Set(), faixa: "", contratacao: "", formacao: "", abertas: false, encerradas: false, trilha: null });
    montarFiltros(); reaplicar();
  }

  let debounce;
  $("#filter-form").addEventListener("input", (e) => {
    if (e.target.id === "f-q") { clearTimeout(debounce); debounce = setTimeout(() => { lerForm(); reaplicar(); }, 180); return; }
  });
  $("#filter-form").addEventListener("change", (e) => {
    if (e.target.id === "f-q") return;
    lerForm();
    if (e.target.id === "f-uf") { S.f.cidade = ""; montarCidades(); }
    reaplicar();
  });
  $("#filter-form").addEventListener("submit", (e) => { e.preventDefault(); lerForm(); reaplicar(); });
  $("#filter-form").addEventListener("reset", (e) => { e.preventDefault(); limparTudo(); });
  $("#f-sort").addEventListener("change", (e) => { S.sort = e.target.value; reaplicar(); });
  $("#more").addEventListener("click", () => { const antes = S.mostrar; S.mostrar += 20; renderLista(); const cards = $$("#jobs .job"); if (cards[antes]) { const h = $("h3", cards[antes]); h.setAttribute("tabindex", "-1"); h.focus(); } });
  $$("[data-quick]").forEach((b) => b.addEventListener("click", () => { const q = QUICK[b.dataset.quick]; q.set(!q.on()); S.f.trilha = null; montarFiltros(); reaplicar(); }));
  $("#chips-active").addEventListener("click", (e) => { const b = e.target.closest("[data-chip]"); if (!b) return; const c = $("#chips-active")._chips[+b.dataset.chip]; c.limpar(); montarFiltros(); reaplicar(); });

  $$(".seg button").forEach((b) => b.addEventListener("click", () => { S.escopo = b.dataset.scope; $$(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderDashboard(); }));

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action], [data-trilha]");
    if (!t) return;
    if (t.dataset.trilha) {
      const [ti, si] = t.dataset.trilha.split("-").map(Number); const st = TRILHAS[ti].steps[si];
      Object.assign(S.f, { q: "", regiao: new Set(), uf: "", cidade: "", modalidade: new Set(), nivel: new Set(), area: new Set(), faixa: "", contratacao: "", formacao: "", abertas: false });
      S.f.trilha = { label: st.l, test: st.f }; montarFiltros(); ativarAba("vagas"); reaplicar(true); return;
    }
    const a = t.dataset.action;
    if (a === "csv") { if (!S.base) return; salvarArquivo(`vagas-dados-ia-${S.modo === "demo" ? "DEMO-" : ""}${hojeISO}.csv`, csvDasFiltradas(), "text/csv;charset=utf-8"); }
    else if (a === "report") { if (!S.base) return; if (emArtifact()) { salvarArquivo(`relatorio-vagas-dados-ia-${hojeISO}.html`, relatorioHTML(), "text/html"); toast("Abra o arquivo salvo: ele já chama a impressão (escolha Salvar como PDF)."); } else window.print(); }
    else if (a === "share") compartilhar();
    else if (a === "limpar") limparTudo();
    else if (a === "limpa-trilha") { S.f.trilha = null; reaplicar(); }
    else if (a === "demo") { carregarDemo().then((b) => { usarBase(b, "demo"); ativarAba("vagas"); window.scrollTo({ top: 0 }); toast("Dados demonstrativos ativados."); }).catch((err) => toast("Não foi possível carregar a demonstração: " + err.message)); }
    else if (a === "real") { carregar().then((b) => { usarBase(b, "real"); toast("Dados reais restaurados."); }).catch(erroCarga); }
  });

  // redesenha gráficos quando a largura muda
  let rw, ultimaLargura = innerWidth;
  addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => { if (Math.abs(innerWidth - ultimaLargura) < 20) return; ultimaLargura = innerWidth; graficos.forEach((g) => g.draw()); desenharFeixes(); }, 150); });
  addEventListener("scroll", esconderTip, { passive: true });
  const dm = $("#mais-graficos"); if (dm) dm.addEventListener("toggle", () => { if (dm.open) requestAnimationFrame(() => graficos.forEach((g) => g.draw())); });

  // filtros abertos por padrão só em telas largas
  if (matchMedia("(max-width: 1023px)").matches) $("#filters").open = false;

  filtrosDaURL();
  carregar().then((b) => { usarBase(b, b.meta && b.meta.tipo_dados === "demonstracao" ? "demo" : "real"); syncQuick(); }).catch(erroCarga);
})();

