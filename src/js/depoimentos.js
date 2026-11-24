
(function () {
  var YT = "eR3mpiO97DQ";
  function tocar(t) {
    var v = document.getElementById("dp-v"); if (!v) return;
    v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + YT + '?autoplay=1&rel=0&modestbranding=1&cc_load_policy=0&start=' + (t | 0) + '" title="Depoimentos de alunos de Ciência de Dados e IA" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
    document.querySelectorAll(".dp-cap").forEach(function (b) { b.classList.toggle("is-on", +b.dataset.t === (t | 0)); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".dp-play, .dp-cap"); if (!b) return;
    e.preventDefault(); tocar(+b.dataset.t || 0);
    if (b.classList.contains("dp-cap") && window.matchMedia("(max-width: 860px)").matches) document.getElementById("dp-v").scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
