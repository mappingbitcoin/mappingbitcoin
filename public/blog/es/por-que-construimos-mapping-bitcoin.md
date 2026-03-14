---
title: "Por qué construimos Mapping Bitcoin"
description: "Los directorios de comercios Bitcoin existen, pero son mantenidos por voluntarios dedicados con herramientas obsoletas. Construimos una infraestructura que respeta tanto a los colaboradores como a los comercios."
date: "2026-02-19"
author: "Equipo MappingBitcoin"
tags:
  - anuncio
  - visión
  - nostr
featuredImage: "/blog/images/why-we-built-mapping-bitcoin-featured.svg"
featuredImageAlt: "MappingBitcoin - Construyendo un mejor descubrimiento de comercios Bitcoin"
ogImage: "/blog/images/why-we-built-mapping-bitcoin-featured.jpg"
previewImage: "/blog/images/why-we-built-mapping-bitcoin-preview.jpg"
slugs:
  en: "why-we-built-mapping-bitcoin"
  es: "por-que-construimos-mapping-bitcoin"
  pt: "por-que-construimos-mapping-bitcoin"
---

# Por qué construimos Mapping Bitcoin

Todos hemos pasado por eso. Estás viajando, quieres gastar algunos sats, y abres uno de esos mapas de comercios Bitcoin. La experiencia que sigue es casi siempre la misma: listados desactualizados, búsqueda que no funciona, ninguna manera de saber si un lugar todavía acepta Bitcoin, y cero participación de la comunidad.

> "Las herramientas fueron construidas para la entrada de datos, no para gastar Bitcoin realmente."

Esto no es una crítica a las personas que mantienen estos directorios. Están haciendo un trabajo heroico con recursos limitados. Pero la infraestructura en sí crea fricción en cada paso — para los usuarios que intentan gastar, para los colaboradores que intentan ayudar, y para los comercios que intentan ser descubiertos.

Decidimos construir algo diferente.

---

## El verdadero problema no son los datos — es la confianza

La mayoría de los mapas Bitcoin tratan la verificación como una casilla de verificación. Algún administrador revisó una ubicación una vez, quizás hace años, y se supone que eso debe darte la confianza para entrar y preguntar sobre pagos con Bitcoin.

Pero la confianza no funciona así. La confianza es social. Es dinámica. Proviene de personas que conoces respaldando algo, no de una entrada estática en una base de datos.

> "Si confío en ti, y tú verificas un comercio, confío en ese comercio."

Esta es la idea central detrás de Mapping Bitcoin. Construimos sobre [Nostr](https://nostr.com) porque ya tiene la infraestructura social que necesitábamos. Tus seguidos, tu red, tu web of trust — estos se convierten en tu capa de verificación.

Cuando abres Mapping Bitcoin, no estás viendo lo que alguna autoridad central aprobó. Estás viendo lo que tu red ha verificado. Diecisiete personas en tu grafo social extendido visitaron una cafetería este mes y confirmaron que pagaron con Lightning. Esa es una verificación que realmente significa algo.

---

## Hacer que contribuir sea sencillo

Así es como se ve agregar un comercio en la mayoría de las plataformas: iniciar sesión en OpenStreetMap, aprender su taxonomía de etiquetas, averiguar las categorías correctas, enviar cambios, esperar la aprobación. La fricción es tan alta que solo los colaboradores más dedicados se molestan.

Queríamos una experiencia diferente. Entras a una tienda, notas que aceptan Bitcoin, sacas tu teléfono, pones un pin, agregas el nombre, listo. Treinta segundos, y has ayudado a alguien más a encontrar este lugar.

> "Si mantener el mapa es doloroso, solo los mártires lo hacen. Si es fácil, todos lo hacen."

Los cambios se publican instantáneamente a través de Nostr. Sin intermediarios, sin esperas, sin burocracia. La web of trust maneja el spam de forma natural — las contribuciones de miembros confiables de la red se destacan, mientras que el ruido se desvanece en el fondo.

---

## Reseñas que realmente funcionan

En algunas plataformas, dejar un comentario cuesta 500 sats. En otras, no hay sistema de comentarios en absoluto. El resultado es el mismo: la información permanece incorrecta porque actualizarla tiene fricción.

Nuestras reseñas están firmadas en Nostr. Son gratuitas, verificables y resistentes a la censura. Los comercios pueden responder. Los usuarios pueden ver quién respaldó un lugar y decidir cuánto peso darle a su opinión.

El ciclo de retroalimentación que debería haber existido desde siempre — finalmente funciona.

---

## Qué está disponible hoy

**Integración con Nostr** — Reseñas, calificaciones y verificaciones viven en Nostr. Tus datos no están encerrados en nuestra base de datos.

**Filtrado por Web of Trust** — Tu grafo social determina lo que ves. El spam se filtra sin moderación central.

**Base en OpenStreetMap** — Ubicaciones de comercios sobre infraestructura abierta sobre la que cualquiera puede construir.

**API abierta** — Endpoints disponibles para integración. Construye sobre nosotros.

---

## Qué viene

Estamos trabajando en integraciones con billeteras, plugins para clientes Nostr, extensiones de navegador y paneles para comercios. El objetivo es hacer que el descubrimiento de comercios Bitcoin sea una parte nativa del ecosistema, no algo secundario.

Pero no podemos hacerlo solos.

---

## Únete

Mapping Bitcoin es un proyecto abierto, y estamos buscando personas que quieran ayudar a darle forma.

### Contribuye con código

Somos de código abierto y estamos buscando activamente desarrolladores. Ya sea que te interese React, el protocolo Nostr, datos geoespaciales o diseño de API, hay trabajo significativo por hacer. Visita nuestro [GitHub](https://github.com/mappingbitcoin/mappingbitcoin) o contáctanos directamente.

### Agrega lugares

Cada vez que encuentres un comercio que acepte Bitcoin, puedes ayudar a que alguien más lo descubra también. Cuantas más personas contribuyan, mejores serán los datos para todos.

### Conviértete en embajador

Pronto lanzaremos un programa de embajadores comunitarios. Si eres activo en tu comunidad local de Bitcoin y quieres ayudar a crecer la adopción de comercios en tu zona, queremos saber de ti.

Los embajadores ayudarán a incorporar comercios, verificar listados, organizar eventos locales de mapeo y representar a Mapping Bitcoin en sus regiones.

---

## Ponte en contacto

¿Tienes ideas? ¿Quieres colaborar? ¿Solo quieres saludar?

- **Nostr**: [npub1mappingbitcoin...](https://nostr-wot.com/profile/npub1sadk0snzs0zk2vq96w7d88sag6292dfwzh4pycaf3uxs8r0dgm8qklrmdh)
- **GitHub**: [github.com/mappingbitcoin/mappingbitcoin](https://github.com/mappingbitcoin/mappingbitcoin)
- **Email**: [satoshi@mappingbitcoin.com](mailto:satoshi@mappingbitcoin.com)

Leemos todo. Respondemos a la mayoría. Estamos emocionados de construir esto contigo.

---

*Construido sobre [Nostr](https://nostr.com). Filtrado por [Web of Trust](https://nostr-wot.com). Listo para usar.*
