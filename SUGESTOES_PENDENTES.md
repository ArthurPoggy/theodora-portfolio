# Sugestões e itens pendentes de decisão

Este arquivo lista as alterações do PDF que precisam de mais informação ou escolha antes de implementar.

---

## 1. Cor de acento (o "amarelo dourado")

Você pediu para trocar o dourado por azul claro. As opções que você deu foram:

| Cor | Preview |
|---|---|
| `#f5feff` | Quase branco azulado — mais sutil |
| `#68f7c6` | Verde-água / menta vibrante |
| `#8be8f8` | Azul céu claro — mais próximo do pedido |

**Qual dessas você quer?** (ou me manda um hex diferente)

---

## 2. Fonte do nome "By Theodora D"

Você pediu uma fonte da família **Consolas**. Opções disponíveis via Google Fonts (similares monospace/display):

| Fonte | Estilo |
|---|---|
| **Space Mono** | Monospace moderna, bem legível |
| **Share Tech Mono** | Monospace tech, fina |
| **Courier Prime** | Clássica máquina de escrever |
| **IBM Plex Mono** | Monospace elegante |
| **Inconsolata** | Monospace suave |

> Obs: a Consolas em si é fonte do Windows e não está disponível no Google Fonts. As opções acima são as mais próximas em espírito.

**Qual você prefere?**

---

## 3. Fonte manuscrita para textos do corpo

Você pediu para trocar as fontes de texto por uma **fonte manuscrita**. Opções:

| Fonte | Estilo |
|---|---|
| **Caveat** | Manuscrita casual, muito legível |
| **Kalam** | Handwritten descontraída |
| **Patrick Hand** | Letra de mão limpa |
| **Dancing Script** | Cursiva elegante |
| **Indie Flower** | Lúdica e fofa |

**Qual você prefere para os textos corridos?** (recomendo Caveat ou Patrick Hand por legibilidade)

---

## 4. Sub-páginas dentro de Concept Art

Você pediu seções separadas de **Cenário** e **Personagem** dentro da página de Concept Art.

Opções de layout:
- **Abas (tabs)** no topo da página — clicar alterna entre as galerias
- **Seções com scroll** — uma embaixo da outra com título separando
- **Páginas separadas** — `/concept-art/cenario` e `/concept-art/personagem`

**Qual prefere?**

---

## 5. Novas páginas

Você pediu:
- Página de **Animações**
- Página de **Encomendados**

Posso criar as duas. Só confirme:
- As animações seriam vídeos embeds (YouTube/Vimeo) ou GIFs?
- "Encomendados" = trabalhos que você fez por encomenda de clientes? Ou é uma página de formulário para pedir encomendas?

---

## 6. Seção NSFW com aviso de idade

Você pediu uma área NSFW com **aviso antes de entrar**.

Implementação planejada:
- Página `/nsfw` oculta da nav principal
- Ao tentar acessar, aparece modal com aviso e botão "Sou maior de 18 anos — Entrar"
- Confirmação salva no `localStorage` para não pedir toda vez

**Confirma essa abordagem?**

---

## 7. Imagem de plano de fundo customizado

Você vai mandar uma imagem de fundo.

**Dimensões recomendadas:** `1920 × 1080px` (mínimo), formato `.jpg` ou `.webp` para performance.

A imagem vai ficar como `background-image` com `background-size: cover` cobrindo toda a tela. Quer que ela fique **fixa** (parallax — não rola com a página) ou **normal** (rola junto)?

---

## 8. "Tirar isso aqui" — item não identificado

Na página 2 do PDF havia um print com "tirar isso aqui" mas **não consigo identificar o elemento** pela descrição textual do PDF. Pode me dizer o que era?

---

## 9. Descrição de cada obra na galeria

Você pediu uma **área para colocar texto sobre a obra/projeto** em cada imagem.

Implementação planejada:
- Campo `description` opcional por imagem nos arrays das páginas
- Aparece no **lightbox** (quando clica na imagem) abaixo do título

**Confirma? Ou quer que apareça direto na grade também?**

---

## 10. Scroll horizontal tipo ArtStation

Você pediu uma opção de **scroll horizontal** para ver imagens juntas (especialmente em Concept Art).

Opções:
- **Galeria em fileira horizontal rolável** — alternativa ao grid vertical atual
- **Botão de alternar** entre "grid" e "scroll horizontal" na página

**Qual prefere?**

---

## 11. Hero section como janela de Windows antigo

Você pediu para colocar a primeira parte (nome + foto + texto) **dentro de uma janela estilo Windows 98/XP** — com barra de título, botões minimizar/fechar etc.

Isso é totalmente viável em CSS puro. **Confirma que quer assim mesmo?** (é uma escolha de estética bem específica, só quero garantir)

---

## 12. Carrossel de imagens como janela Windows com scroll horizontal + cursor estático

Similar ao item 11, mas para a seção de carrossel — janela Windows com barra de rolagem horizontal e um cursor de mouse estático no canto superior direito como decoração.

**Confirma?**

---

## 13. Efeito máquina de escrever nos títulos

Você pediu **typewriter effect** nos títulos — na primeira vez que a pessoa entra e scrolla.

Implementação planejada: texto "digita" letra por letra quando o elemento entra na viewport (usando Framer Motion ou uma lib leve como `react-type-animation`).

**Confirma?**

---

## 14. Brilhinhos animados (sparkles)

Você pediu **sparkles animados** espalhados na página.

Opções:
- Sparkles CSS puro — estrelinhas que aparecem e somem aleatoriamente pelo fundo
- Sparkles interativos — aparecem onde o mouse passa
- Sparkles fixos no header/hero apenas

**Qual preferência?**

---

## 15. Cursor customizado

Você pediu para o cursor mudar. Você vai mandar a imagem do cursor?

**Formato recomendado:** `.png` ou `.cur`, tamanho `32×32px` ou `64×64px`.

Quando mandar, só colocar em `public/cursor.png` e ativo automaticamente via CSS.

---

## 16. Banner antes do hero

Você pediu um **banner** antes da seção com seu nome e foto.

O que seria esse banner? Uma imagem de capa? Um texto estilizado? Uma faixa decorativa?

---

## 17. Sidebar

Você pediu para "meter esse sidebar". O que seria o conteúdo da sidebar? Links de navegação? Redes sociais? Informações rápidas sobre você?

---

## 18. Música na página

Sim, **é possível** colocar música! A implementação seria:

- Player discreto fixo no canto inferior (não bloqueia o conteúdo)
- Playlist de múltiplas músicas com botões anterior/próximo
- Autoplay **desativado** por padrão (navegadores bloqueiam autoplay com som)
- Botão play/pause visível

Quando você tiver a playlist de royalty free, me manda os arquivos de áudio (`.mp3` ou `.ogg`) ou os links e implemento.

---

## 19. Contador de visitas

Duas abordagens possíveis:

| Opção | Descrição |
|---|---|
| **localStorage** (já implementado em `/stats`) | Só conta no seu navegador. Simples e privado. |
| **Contador público visível no site** | Precisa de um serviço externo (ex: [countapi.xyz](https://countapi.xyz) gratuito) para contar visitas reais de todos os visitantes. |

**Qual prefere?** Se quiser o contador público, posso integrar um serviço gratuito.

---

*Responda item por item ou pode indicar os números — implemento na sequência que confirmar.*
