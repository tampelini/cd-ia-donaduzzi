# Ciência de Dados e IA · Faculdade Donaduzzi

Site dos cursos de **Ciência de Dados** (tecnólogo, 5 semestres) e **Inteligência Artificial** (bacharelado, 8 semestres) da Faculdade Donaduzzi, no Biopark, em Toledo (PR). Os dois cursos fazem um caminho só: quem cursa os 5 primeiros semestres de IA já se forma em Ciência de Dados, e por isso o site fala em "um caminho, dois diplomas".

**Site no ar:** https://tampelini.github.io/cd-ia-donaduzzi/

O site é uma página única, sem servidor e sem banco de dados. Tudo roda no navegador do visitante.

## O que tem no site

### Abas

| Aba | Conteúdo |
|---|---|
| **Início** | Abertura dividida ao meio (Ciência de Dados à esquerda, IA à direita, cada lado acende ao passar o mouse), a linha do tempo "um caminho, dois diplomas", o laboratório interativo, a chamada do jogo e a galeria de fotos dos estudantes |
| **Ciência de Dados** | O curso em detalhe: o que se aprende, matriz curricular, mercado de trabalho e perguntas frequentes |
| **Inteligência Artificial** | O curso em detalhe: o que se aprende, matriz curricular, mercado de trabalho e perguntas frequentes |
| **Vagas e salários** | Painel com vagas reais da região e faixas salariais, com as fontes indicadas |

Os grafos animados (os pontinhos ligados por linhas) aparecem como fundo das seções e como transição entre os blocos.

### Laboratório "Treine sua IA"

Fica na aba Início e tem dois modos:

- **Reconhecer números:** a pessoa desenha um algarismo e uma rede neural, que roda no próprio navegador, tenta adivinhar qual é.
- **Treine sua IA:** no estilo do Teachable Machine do Google. A pessoa liga a câmera, segura o botão de cada classe para gravar exemplos (por exemplo "mão aberta", "joinha" e "só o fundo"), treina e vê o palpite ao vivo. Por baixo, a rede pronta **MobileNet** (TensorFlow.js) transforma cada quadro em 256 números e uma rede pequena aprende a separar as classes. É a transferência de aprendizado.
  - **Privacidade:** a imagem e o treino ficam no aparelho e nenhuma foto é enviada para a internet.
  - Quem não quiser ou não puder usar a câmera tem o botão **Prefiro desenhar**.
  - A câmera só funciona com o site aberto em HTTPS, como no GitHub Pages. Dentro de pré-visualizações em iframe o navegador costuma bloquear.

### Jogo "Dirija pelo Biopark"

Um mundo 3D do Território do Biopark, inspirado no portfólio de Bruno Simon. Abre pela chamada animada da aba Início, com o vídeo de prévia, ou pelo endereço `#explorar-biopark`.

- **Carro com física:** rampas, saltos, árvores que dá para derrubar, cones, barris, pinos de boliche e outros objetos para trombar.
- **Ciência de Dados no jogo:**
  - 34 **cubos de dados** para coletar;
  - 11 **lugares do Biopark**, cada um com um cartão que mostra como dados e IA aparecem ali;
  - no fim, um **relatório** com gráficos, que é uma análise exploratória do próprio passeio.
- **Missão, Visão e Valores:** três placas no asfalto da Av. Max Planck, com painéis ao lado. Ao passar por cima, abre um cartão com o texto oficial do site institucional da faculdade.
- **Ambiente:** botão ☀ ou teclas `N` (dia ou noite) e `C` (limpo, chuva, vento ou neve).
  - À noite os faróis e as janelas acendem.
  - Na chuva e na neve a pista fica escorregadia.
  - O vento empurra o carro.
- **Música:** botão ♫ ou tecla `B`. Começa desligada. Cada ambiente tem a sua peça para piano, cordas e sininhos, no espírito das trilhas calmas de jogos de mundo aberto. As peças são originais, escritas no próprio código nota por nota e tocadas pela Web Audio API. Não há arquivo de áudio nem música de terceiros.
- **Controles:**
  - no computador: setas ou W, A, S, D; `Espaço` para o freio de mão, `R` para voltar ao início e `M` para o menu;
  - no celular: joystick na tela.

O mapa do jogo foi redesenhado a partir do **MASTERPLAN_2025** (arquivo DWG da engenharia do Biopark):

- ruas, calçadas, quadras, lotes, rotatórias e nomes de ruas vêm do desenho oficial;
- a escala é 1 unidade do jogo = 2 m, com o mapa girado 5,3° para a Av. Max Planck ficar na horizontal;
- os lotes têm a cor do zoneamento do masterplan: universitário (azul), residencial (amarelo), comércio e serviços (vermelho) e indústria (roxo);
- os prédios em detalhe do campus (Charles Darwin, Blocos Educacionais, Colégio e UFPR) vêm do modelo `MAPA_ORIENTA.blend`.

Tudo isso fica em `campus.json`.

## Como o projeto está organizado

O site publicado é um `index.html` único, montado automaticamente a partir dos arquivos abaixo. **Não edite o `index.html` final**: edite os arquivos de origem.

```
cd-ia-donaduzzi/
├─ src/
│  ├─ index.html          estrutura da página (com marcadores {{...}} para o build)
│  ├─ css/site.css        todo o visual (cores, fontes, seções, jogo, laboratório)
│  └─ js/
│     ├─ site.js          abas, páginas dos cursos, painel de vagas e textos das seções
│     ├─ abertura.js      abertura dividida da aba Início
│     ├─ carreiras.js     seção "O que você vai fazer, e onde"
│     ├─ depoimentos.js   vídeo de depoimentos (YouTube)
│     ├─ laboratorio.js   laboratório "Treine sua IA"
│     ├─ jogo.js          jogo "Dirija pelo Biopark"
│     ├─ movimento.js     animações decorativas
│     └─ imagens.js       lista das fotos usadas no site
├─ data/
│  ├─ cursos.json                 matriz, disciplinas e textos dos cursos
│  ├─ vagas.json                  vagas reais do painel "Vagas e salários"
│  ├─ vagas-demo.json             dados fictícios de demonstração do painel
│  ├─ carreiras-perfis.json        o que faz o cientista de dados e o bacharel em IA
│  ├─ carreiras-setores.json      empresas por setor e o que cada profissional faz nelas
│  ├─ lab-rede-neural.json        rede neural treinada do laboratório
│  └─ campus.json                 mapa 3D do jogo (ruas, quadras, prédios)
├─ assets/
│  ├─ img/        fotos e logos da faculdade (webp/svg)
│  ├─ fonts/      fonte Sarun Pro (títulos)
│  ├─ video/      prévia do jogo (mp4/webm)
│  └─ logos/      logos autorizados das empresas (ver assets/logos/LEIA-ME.md)
├─ scripts/build.py        monta o site em dist/
├─ tests/test_site.py      teste automático do site montado
├─ tools/mapa/             como o mapa do jogo foi gerado a partir do masterplan
└─ .github/workflows/publicar.yml   monta, testa e publica no GitHub Pages
```

## Como alterar o site

1. Edite o arquivo de origem no GitHub (clique no arquivo → ícone de lápis) ou envie um arquivo novo pela pasta certa (**Add file → Upload files**).
2. Ao salvar (commit na `main`), o GitHub Actions monta o site, roda os testes e publica sozinho em 2 a 3 minutos. Acompanhe na aba **Actions**.
3. Se um teste falhar, o site anterior continua no ar e a aba Actions mostra o motivo.

Exemplos comuns:

| Quero mudar... | Edite |
|---|---|
| Uma disciplina, ementa ou texto de período | `data/cursos.json` |
| As vagas do painel | `data/vagas.json` |
| Empresas ou exemplos da seção de carreiras | `data/carreiras-setores.json` e `data/carreiras-perfis.json` |
| Um texto fixo de alguma seção (benefícios, depoimentos, hero) | `src/js/site.js` (procure o texto com Ctrl+F) |
| Uma foto | substitua o arquivo em `assets/img/` mantendo o mesmo nome |
| Um logo de empresa | envie para `assets/logos/` com o nome indicado no LEIA-ME de lá |

Os arquivos JSON precisam continuar válidos (aspas, vírgulas e chaves). Se o JSON quebrar, o build para com uma mensagem dizendo o arquivo e a linha.

## Rodar no computador

Precisa só do Python 3.

```bash
python3 scripts/build.py                 # monta o site em dist/
python3 -m http.server -d dist 8000      # abra http://localhost:8000
```

O jogo busca o `campus.json`, por isso o site precisa de um servidor local e não abre com duplo clique.

Para rodar os testes:

```bash
pip install playwright && python3 -m playwright install chromium
python3 tests/test_site.py
```

## Dados com validade

- **Vagas** (`data/vagas.json`): coletadas em 17/11/2026. Atualize periodicamente.
- **Benefícios** (texto em `src/js/site.js`): seguem o Regulamento de Concessão de Benefícios do Vestibular de Verão 2027.1, com concessão até 5/3/2027.

## Créditos e licenças

- **Conteúdo, fotos e marcas:** Faculdade Donaduzzi e Biopark Educação.
- **Missão, Visão e Valores:** texto do site institucional, em https://faculdadedonaduzzi.com.br/institucional/.
- **Música do jogo:** composição original gerada pelo código do site.
- **Bibliotecas:** Three.js (MIT), TensorFlow.js e MobileNet (Apache 2.0).

Coordenação dos cursos: Prof. Leonardo Garcia Tampelini.
