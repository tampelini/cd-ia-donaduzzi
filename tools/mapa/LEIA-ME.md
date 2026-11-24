# Como o mapa do jogo foi gerado

Estes scripts registram como o `data/campus.json` (ruas, calçadas, quadras e lotes do jogo) foi produzido a partir do **MASTERPLAN_2025.dwg** da engenharia do Biopark. Eles não rodam no build do site: só servem se o mapa precisar ser refeito.

O DWG e os arquivos intermediários (mais de 1 GB) **não ficam no Git**. Guarde-os no Drive.

Ordem usada:

1. Converter o DWG para JSON com o LibreDWG: `dwgread -O json MASTERPLAN_2025.dwg > mp.json`
2. `extrair.py` lê as entidades do espaço de modelo.
3. `raster.py` rasteriza as barreiras (0,5 m por pixel) e separa os componentes.
4. `zonas.py` classifica rua, calçada, lote, área, ilha e fora.
5. `anel.py` cria a rua perimetral, recorta o conteúdo e transforma em canteiro os lotes cercados de rua.
6. `checar.py`, `scan.py`, `preview*.py`, `plot.py` e `render.py` geram imagens para conferência.

Transformação usada para as coordenadas do jogo: rotação de −0,093 rad em torno de (225487, 7269747), `gx = 16 + rx*0.5`, `gz = −85.5 − ry*0.5`.

Os caminhos dentro dos scripts apontam para a pasta de trabalho original e precisam ser ajustados antes de rodar de novo.
