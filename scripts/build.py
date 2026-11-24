#!/usr/bin/env python3
"""Monta o site em dist/ a partir de src/, data/ e assets/.

Uso:  python3 scripts/build.py
Depois, para ver localmente:  python3 -m http.server -d dist 8000

Marcadores aceitos nos arquivos de src/:
  {{include:caminho}}            insere o conteúdo de outro arquivo (css/js)
  {{json:caminho}}               insere um JSON de data/ (compacto, com acentos)
  {{json:caminho|compacto}}      idem, sem espaços depois de vírgulas e dois-pontos
  {{asset:caminho}}              insere imagem/fonte de assets/ embutida (data URI)
  {{logos}}                      lista dos logos presentes em assets/logos/
Só usa a biblioteca padrão do Python 3.
"""
import base64, json, re, shutil, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist"
MIME = {".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2"}
TOKEN = re.compile(r"\{\{(include|json|asset):([^}|]+)(\|compacto)?\}\}")


def ler(caminho):
    p = RAIZ / caminho
    if not p.is_file():
        sys.exit(f"ERRO: arquivo não encontrado: {caminho}")
    return p


def montar(texto, profundidade=0):
    if profundidade > 5:
        sys.exit("ERRO: includes aninhados demais")

    def troca(m):
        tipo, caminho, compacto = m.group(1), m.group(2).strip(), bool(m.group(3))
        p = ler(caminho)
        if tipo == "include":
            return montar(p.read_text(encoding="utf-8"), profundidade + 1)
        if tipo == "json":
            try:
                dados = json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                sys.exit(f"ERRO: JSON inválido em {caminho}: {e}")
            return json.dumps(dados, ensure_ascii=False, **({"separators": (",", ":")} if compacto else {}))
        mime = MIME.get(p.suffix.lower())
        if not mime:
            sys.exit(f"ERRO: tipo de arquivo não suportado: {caminho}")
        return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"

    return TOKEN.sub(troca, texto).replace("{{logos}}", lista_logos())


def lista_logos():
    """Logos presentes em assets/logos/: {"nubank": "nubank.svg", ...}. SVG tem preferência sobre PNG."""
    achados = {}
    for p in sorted((RAIZ / "assets/logos").glob("*")):
        if p.suffix.lower() in (".svg", ".png") and (p.stem not in achados or p.suffix.lower() == ".svg"):
            achados[p.stem] = p.name
    return json.dumps(achados, ensure_ascii=False)


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    html = montar(ler("src/index.html").read_text(encoding="utf-8"))
    (DIST / "index.html").write_text(html, encoding="utf-8")
    shutil.copy(ler("data/campus.json"), DIST / "campus.json")
    for v in (RAIZ / "assets/video").glob("*"):
        shutil.copy(v, DIST / v.name)
    shutil.copytree(RAIZ / "assets/logos", DIST / "logos", ignore=shutil.ignore_patterns("*.md"))
    (DIST / ".nojekyll").write_text("")
    print(f"dist/index.html: {len(html.encode()) / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
