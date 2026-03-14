---
title: "Por que construímos o Mapping Bitcoin"
description: "Diretórios de comerciantes Bitcoin existem, mas são mantidos por voluntários dedicados com ferramentas desatualizadas. Construímos uma infraestrutura que respeita tanto os colaboradores quanto os comerciantes."
date: "2026-02-19"
author: "Equipe MappingBitcoin"
tags:
  - anúncio
  - visão
  - nostr
featuredImage: "/blog/images/why-we-built-mapping-bitcoin-featured.svg"
featuredImageAlt: "MappingBitcoin - Construindo uma melhor descoberta de comerciantes Bitcoin"
ogImage: "/blog/images/why-we-built-mapping-bitcoin-featured.jpg"
previewImage: "/blog/images/why-we-built-mapping-bitcoin-preview.jpg"
slugs:
  en: "why-we-built-mapping-bitcoin"
  es: "por-que-construimos-mapping-bitcoin"
  pt: "por-que-construimos-mapping-bitcoin"
---

# Por que construímos o Mapping Bitcoin

Todos nós já passamos por isso. Você está viajando, quer gastar alguns sats, e abre um daqueles mapas de comerciantes Bitcoin. A experiência que se segue é quase sempre a mesma: listagens desatualizadas, busca que não funciona, nenhuma forma de saber se um lugar ainda aceita Bitcoin, e zero participação da comunidade.

> "As ferramentas foram construídas para entrada de dados, não para realmente gastar Bitcoin."

Isso não é uma crítica às pessoas que mantêm esses diretórios. Elas estão fazendo um trabalho heroico com recursos limitados. Mas a infraestrutura em si cria atrito em cada etapa — para os usuários tentando gastar, para os colaboradores tentando ajudar, e para os comerciantes tentando ser descobertos.

Decidimos construir algo diferente.

---

## O verdadeiro problema não são os dados — é a confiança

A maioria dos mapas Bitcoin trata a verificação como uma caixa de seleção. Algum administrador verificou um local uma vez, talvez anos atrás, e isso deveria te dar confiança para entrar e perguntar sobre pagamentos com Bitcoin.

Mas a confiança não funciona assim. A confiança é social. É dinâmica. Vem de pessoas que você conhece atestando algo, não de uma entrada estática em um banco de dados.

> "Se eu confio em você, e você verifica um comerciante, eu confio nesse comerciante."

Essa é a ideia central por trás do Mapping Bitcoin. Construímos sobre o [Nostr](https://nostr.com) porque ele já tem a infraestrutura social que precisávamos. Seus seguidos, sua rede, sua web of trust — estes se tornam sua camada de verificação.

Quando você abre o Mapping Bitcoin, não está vendo o que alguma autoridade central aprovou. Está vendo o que sua rede verificou. Dezessete pessoas no seu grafo social estendido visitaram uma cafeteria este mês e confirmaram que pagaram com Lightning. Essa é uma verificação que realmente significa algo.

---

## Tornando a contribuição simples

Veja como é adicionar um comerciante na maioria das plataformas: fazer login no OpenStreetMap, aprender sua taxonomia de tags, descobrir as categorias corretas, enviar alterações, esperar aprovação. O atrito é tão alto que apenas os colaboradores mais dedicados se dão ao trabalho.

Queríamos uma experiência diferente. Você entra em uma loja, percebe que aceitam Bitcoin, pega seu celular, coloca um pin, adiciona o nome, pronto. Trinta segundos, e você ajudou outra pessoa a encontrar esse lugar.

> "Se manter o mapa é doloroso, só os mártires fazem. Se é fácil, todos fazem."

As alterações são publicadas instantaneamente via Nostr. Sem intermediários, sem espera, sem burocracia. A web of trust lida com spam naturalmente — contribuições de membros confiáveis da rede se destacam, enquanto o ruído desaparece no fundo.

---

## Avaliações que realmente funcionam

Em algumas plataformas, deixar um feedback custa 500 sats. Em outras, não há sistema de feedback algum. O resultado é o mesmo: a informação permanece errada porque atualizá-la tem atrito.

Nossas avaliações são assinadas no Nostr. São gratuitas, verificáveis e resistentes à censura. Os comerciantes podem responder. Os usuários podem ver quem atestou um lugar e decidir quanto peso dar à opinião.

O ciclo de feedback que deveria ter existido desde o início — finalmente funciona.

---

## O que está disponível hoje

**Integração com Nostr** — Avaliações, classificações e verificações vivem no Nostr. Seus dados não estão trancados no nosso banco de dados.

**Filtragem por Web of Trust** — Seu grafo social determina o que você vê. Spam é filtrado sem moderação central.

**Base no OpenStreetMap** — Localizações de comerciantes em infraestrutura aberta sobre a qual qualquer um pode construir.

**API aberta** — Endpoints disponíveis para integração. Construa sobre nós.

---

## O que vem por aí

Estamos trabalhando em integrações com carteiras, plugins para clientes Nostr, extensões de navegador e painéis para comerciantes. O objetivo é tornar a descoberta de comerciantes Bitcoin uma parte nativa do ecossistema, não algo secundário.

Mas não podemos fazer isso sozinhos.

---

## Junte-se a nós

O Mapping Bitcoin é um projeto aberto, e estamos procurando pessoas que queiram ajudar a moldá-lo.

### Contribua com código

Somos de código aberto e estamos ativamente procurando desenvolvedores. Seja React, protocolo Nostr, dados geoespaciais ou design de API, há trabalho significativo a ser feito. Confira nosso [GitHub](https://github.com/mappingbitcoin/mappingbitcoin) ou entre em contato diretamente.

### Adicione lugares

Toda vez que você encontrar um comerciante que aceita Bitcoin, pode ajudar outra pessoa a descobri-lo também. Quanto mais pessoas contribuírem, melhores ficam os dados para todos.

### Torne-se um embaixador

Em breve lançaremos um programa de embaixadores comunitários. Se você é ativo na sua comunidade local de Bitcoin e quer ajudar a expandir a adoção de comerciantes na sua região, queremos ouvir de você.

Os embaixadores ajudarão a integrar comerciantes, verificar listagens, organizar eventos locais de mapeamento e representar o Mapping Bitcoin em suas regiões.

---

## Entre em contato

Tem ideias? Quer colaborar? Só quer dizer oi?

- **Nostr**: [npub1mappingbitcoin...](https://nostr-wot.com/profile/npub1sadk0snzs0zk2vq96w7d88sag6292dfwzh4pycaf3uxs8r0dgm8qklrmdh)
- **GitHub**: [github.com/mappingbitcoin/mappingbitcoin](https://github.com/mappingbitcoin/mappingbitcoin)
- **Email**: [satoshi@mappingbitcoin.com](mailto:satoshi@mappingbitcoin.com)

Lemos tudo. Respondemos à maioria. Estamos animados para construir isso com você.

---

*Construído sobre [Nostr](https://nostr.com). Filtrado por [Web of Trust](https://nostr-wot.com). Pronto para usar.*
