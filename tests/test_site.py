#!/usr/bin/env python3
"""Teste rápido do site montado em dist/ (roda no GitHub Actions antes de publicar).

Uso:  python3 scripts/build.py && python3 tests/test_site.py
Precisa de:  pip install playwright && python3 -m playwright install chromium
"""
import functools, http.server, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parent.parent / "dist"
falhas = []


def checa(cond, msg):
    print(("ok   " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def servidor():
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Silencioso, directory=str(DIST)))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def main():
    checa((DIST / "index.html").is_file(), "dist/index.html existe (rode scripts/build.py antes)")
    if falhas:
        sys.exit(1)
    srv = servidor()
    url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    with sync_playwright() as p:
        nav = p.chromium.launch()
        for largura, altura, nome in [(1280, 800, "computador"), (390, 844, "celular")]:
            pg = nav.new_page(viewport={"width": largura, "height": altura})
            erros, faltando = [], []
            pg.on("pageerror", lambda e: erros.append(str(e)))
            pg.on("response", lambda r: faltando.append(r.url) if r.status == 404 else None)
            # bloqueia a internet: o site precisa abrir mesmo sem CDNs externos
            pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://127.0.0.1") else r.abort())
            pg.goto(url)
            pg.wait_for_timeout(1500)
            for aba in ["inicio", "cd", "ia", "panorama"]:
                pg.evaluate(f"location.hash = '#{aba}'")
                pg.wait_for_timeout(800)
                checa(pg.locator(f"#{aba}").count() > 0, f"[{nome}] aba #{aba} aparece")
            pg.evaluate("location.hash = '#inicio'")
            pg.wait_for_timeout(800)
            for sec in ["inicio-caminho", "inicio-carreiras", "inicio-depoimentos", "inicio-beneficios", "inicio-biopark", "inicio-coordenador"]:
                checa(pg.locator(f"#{sec}").count() == 1, f"[{nome}] seção #{sec}")
            checa(pg.evaluate("(window.__VAGAS__ && window.__VAGAS__.vagas.length) || 0") > 0, f"[{nome}] dados de vagas carregados")
            checa(pg.evaluate("(window.__CURSOS__ && window.__CURSOS__.comum.periodos.length) || 0") == 8, f"[{nome}] 8 períodos na matriz")
            checa(pg.locator(".cr-emp").count() > 0, f"[{nome}] carreiras mostram empresas")
            pg.locator('.cr-tab[data-p="ia"]').scroll_into_view_if_needed()
            y = pg.evaluate("scrollY")
            pg.locator('.cr-tab[data-p="ia"]').click()
            pg.wait_for_timeout(600)
            checa(abs(pg.evaluate("scrollY") - y) < 400, f"[{nome}] trocar a profissão não pula para o topo")
            checa(not erros, f"[{nome}] sem erros de JavaScript" + (f": {erros[:2]}" if erros else ""))
            checa(not faltando, f"[{nome}] nenhum arquivo faltando (404)" + (f": {faltando[:3]}" if faltando else ""))
            pg.close()
        nav.close()
    srv.shutdown()
    print(f"\n{len(falhas)} falha(s)")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
