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
  - 11 **lugares do mapa oficial**, cada um com um cartão que mostra como dados e IA aparecem ali;
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

O campus detalhado vem do modelo `MAPA_ORIENTA.blend`, exportado para `campus.json`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site inteiro: textos, estilos, scripts e fotos (embutidas em base64) |
| `campus.json` | Geometria 3D dos prédios do campus para o jogo, carregada só quando o jogo abre |
| `previa.webm`, `previa.mp4` | Vídeo curto em repetição da chamada do jogo. O WebM é para a maioria dos navegadores e o MP4 é para o Safari |

Bibliotecas carregadas de CDN só quando são usadas:

- **Three.js r128**, quando o jogo abre;
- **TensorFlow.js** e **MobileNet**, quando a pessoa liga a câmera no laboratório.

## Como atualizar

1. No GitHub, clique em **Add file → Upload files** e envie o arquivo novo com o mesmo nome (por exemplo `index.html`).
2. Clique em **Commit changes**.
3. Em um ou dois minutos o GitHub Pages publica a versão nova no mesmo endereço.

Os quatro arquivos precisam ficar juntos na raiz do repositório.

## Como abrir no próprio computador

O jogo busca o `campus.json`, e o navegador bloqueia essa busca quando o arquivo é aberto com duplo clique (`file://`). Por isso é preciso um servidor local simples:

```bash
python3 -m http.server 8000
```

Depois, abra http://localhost:8000.

## Créditos e licenças

- **Conteúdo, fotos e marcas:** Faculdade Donaduzzi e Biopark Educação.
- **Missão, Visão e Valores:** texto do site institucional, em https://faculdadedonaduzzi.com.br/institucional/.
- **Música do jogo:** composição original gerada pelo código do site.
- **Bibliotecas:** Three.js (MIT), TensorFlow.js e MobileNet (Apache 2.0).

Coordenação dos cursos: Prof. Leonardo Garcia Tampelini.
