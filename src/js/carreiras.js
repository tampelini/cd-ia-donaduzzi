
(function () {
  var P = {{json:data/carreiras-perfis.json}}, S = {{json:data/carreiras-setores.json}}, perfil = "cd", setor = "redes";
  var CORES = ["#642032", "#9E2238", "#B8650A", "#3D1220", "#7A3B52", "#A0522D", "#5B2A3C", "#C27C0E"];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sigla(n) { n = n.replace(/\(.*?\)/g, ""); var p = n.split(/[\s.&-]+/).filter(function (w) { return w && !/^(de|da|do|das|dos|e)$/i.test(w); }); return (p.length > 1 ? p[0][0] + p[1][0] : n.replace(/[^A-Za-zÀ-ú0-9]/g, "").slice(0, 2)).toUpperCase(); }
  function slug(n) { return n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  var LOGOS = {{logos}}; /* gerada no build a partir de assets/logos/ */
  window.crLogoErro = function (im) { im.remove(); };
  function cor(n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return CORES[h % CORES.length]; }
  function vivo(p) {
    var V = (window.__VAGAS__ && window.__VAGAS__.vagas) || [], m = {}, t = 0;
    V.forEach(function (v) { if (v.situacao === "encerrada" || P[p].fam.indexOf(v.cargo_familia) < 0) return; t++;
      var n = (v.organizacao || "").replace(/\s*\(.*?\)\s*/g, " ").replace(/,.*$/, "").replace(/\s+S\/?A\.?$/i, "").trim();
      if (/confidencial|n[aã]o divulgado|Staffing|Recursos Humanos|\bRH\b|Huntin|Talent|Tempor|Terceiriz|Tribunal|banca|Conselho|Marinha|Yapp|Assigna|Scheffel|Luandre|Select|Transcend|Carpediem|A Priori|Work On|Virtus/i.test(n)) return;
      m[n] = (m[n] || 0) + 1; });
    var L = Object.keys(m).sort(function (a, b) { return m[b] - m[a] || a.localeCompare(b); }).slice(0, 8);
    var d = ((window.__VAGAS__ && window.__VAGAS__.meta && window.__VAGAS__.meta.data_coleta) || "").split("-").reverse().join("/");
    return t ? '<p class="cr-vivo"><b>Agora no nosso painel:</b> ' + t + ' vagas abertas para esta profissão (coleta de ' + d + '), em empresas como ' + L.map(esc).join(", ") + '. <a href="#panorama">Ver vagas e salários</a></p>' : "";
  }
  function render(anima) {
    var c = document.getElementById("cr-corpo"); if (!c) return;
    var p = P[perfil], st = S.filter(function (x) { return x[0] === setor; })[0] || S[0], ix = perfil === "cd" ? 2 : 3;
    document.querySelectorAll(".cr-tab").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.p === perfil)); });
    var h = '<div class="cr-top"><div><h3>' + p.ic + ' ' + p.nome + '</h3><p>' + p.frase + '</p></div><p class="cr-curso"><b>' + p.curso + '</b>' + p.curso2 + '</p></div>' +
      '<p class="cr-h4">O que faz</p><ol class="cr-faz">' + p.faz.map(function (f, i) { return '<li style="--i:' + i + '"' + (perfil === "ia" && i === 0 ? ' class="is-base"' : '') + '><span class="fi" aria-hidden="true">' + f[0] + '</span><b>' + f[1] + '</b><span>' + f[2] + '</span><em>Ex.: ' + f[3] + '</em></li>'; }).join("") + '</ol>' +
      '<ul class="cr-como"><li class="k">Pode trabalhar como:</li>' + p.como.map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ul>' +
      '<ul class="cr-como"><li class="k">Nas vagas aparece como:</li>' + p.vagas.map(function (x) { return '<li lang="en">' + x + '</li>'; }).join("") + '</ul>' +
      '<p class="cr-h4">Onde atua</p><ul class="cr-setores">' + S.map(function (x) { return '<li><button type="button" class="cr-set" data-s="' + x[0] + '" aria-pressed="' + (x[0] === st[0]) + '">' + x[1] + ' ' + x[2] + '</button></li>'; }).join("") + '</ul>' +
      '<ul class="cr-emps">' + st[3].map(function (e, k) { return '<li class="cr-emp" style="--k:' + k + '"><span class="cr-mono" style="background:' + cor(e[0]) + '" aria-hidden="true">' + sigla(e[0]) + (LOGOS[slug(e[0])] ? '<img src="logos/' + LOGOS[slug(e[0])] + '" alt="" loading="lazy" onerror="crLogoErro(this)">' : '') + '</span><span class="cr-en">' + esc(e[0]) + '<small>' + esc(e[1]) + '</small></span><span class="cr-eo">' + esc(e[ix]) + '</span></li>'; }).join("") + '</ul>' +
      vivo(perfil) +
      '<p class="cr-nota">Exemplos do tipo de trabalho que essa profissão faz em cada empresa' + (st[0] === "regiao" ? ', com o potencial de aplicação na região' : '') + '. Não indicam parceria com a Faculdade nem vagas abertas.</p>';
    function poe() { c.innerHTML = h; var b = c.querySelector('.cr-set[aria-pressed="true"]'); if (b) b.parentNode.parentNode.scrollLeft = Math.max(0, b.parentNode.offsetLeft - 16); }
    if (!anima) { poe(); return; }
    c.classList.add("is-troca"); setTimeout(function () { poe(); c.classList.remove("is-troca"); }, 160);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".cr-tab, .cr-set"); if (!t) return;
    if (t.classList.contains("cr-tab")) { e.preventDefault(); e.stopPropagation(); if (perfil === t.dataset.p) return; perfil = t.dataset.p; var y = window.scrollY; render(true); window.scrollTo(0, y); }
    else { setor = t.dataset.s; var y = window.scrollY; render(false); window.scrollTo(0, y); }
  });
  function checar() { var c = document.getElementById("cr-corpo"); if (c && !c.firstChild) render(false); }
  checar(); new MutationObserver(checar).observe(document.body, { childList: true, subtree: true });
})();
