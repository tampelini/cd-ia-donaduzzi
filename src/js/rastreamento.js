/* Eventos para o Google Tag Manager (GTM-WC3R45MP).
   Cada clique importante vira um evento no dataLayer; o marketing cria os acionadores no GTM.
   Nenhum dado pessoal é enviado: só o tipo de clique e a seção da página.
   Eventos:
     clique_whatsapp   destino: "coordenador" ou "faculdade"; secao: id da seção
     clique_inscricao  curso: "cd", "ia" ou "geral"; secao
     video_depoimentos inicio: segundo em que o vídeo começou
     carreiras_perfil  perfil: "cd" ou "ia"
*/
(function () {
  window.dataLayer = window.dataLayer || [];
  var COORD = "5545998068562";
  function secao(el) { var s = el.closest("section[id]"); return s ? s.id : "topo"; }
  function envia(o) { try { window.dataLayer.push(o); } catch (e) {} }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a, button");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/wa\.me|api\.whatsapp|whatsapp\.com/.test(href)) {
      envia({ event: "clique_whatsapp", destino: href.indexOf(COORD) >= 0 ? "coordenador" : "faculdade", secao: secao(a) });
    } else if (/faculdadedonaduzzi\.com\.br/.test(href) && !/regulamento|editais|institucional|\.pdf/i.test(href)) {
      envia({ event: "clique_inscricao", curso: /ciencia-de-dados/.test(href) ? "cd" : /inteligencia-artificial/.test(href) ? "ia" : "geral", secao: secao(a) });
    } else if (a.classList.contains("dp-play") || a.classList.contains("dp-cap")) {
      envia({ event: "video_depoimentos", inicio: +a.dataset.t || 0 });
    } else if (a.classList.contains("cr-tab")) {
      envia({ event: "carreiras_perfil", perfil: a.dataset.p });
    }
  }, true);
})();
