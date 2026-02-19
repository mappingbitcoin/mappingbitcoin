---
title: "Why We Built Mapping Bitcoin"
description: "Bitcoin merchant directories exist, but they're maintained by dedicated volunteers using outdated tools. We built infrastructure that respects both contributors and merchants."
date: "2026-02-19"
author: "MappingBitcoin Team"
tags:
  - announcement
  - vision
  - nostr
featuredImage: "/blog/images/why-we-built-mapping-bitcoin-featured.svg"
featuredImageAlt: "MappingBitcoin - Building better Bitcoin merchant discovery"
ogImage: "/blog/images/why-we-built-mapping-bitcoin-featured.jpg"
previewImage: "/blog/images/why-we-built-mapping-bitcoin-preview.jpg"
---

# Why We Built Mapping Bitcoin

We've all been there. You're traveling, you want to spend some sats, and you pull up one of those Bitcoin merchant maps. The experience that follows is almost always the same: outdated listings, broken search, no way to know if a place still accepts Bitcoin, and zero community input.

> "The tools were built for data entry, not for actually spending Bitcoin."

This isn't a criticism of the people maintaining these directories. They're doing heroic work with limited resources. But the infrastructure itself creates friction at every turn — for users trying to spend, for contributors trying to help, and for merchants trying to be discovered.

We decided to build something different.

---

## The Real Problem Isn't Data — It's Trust

Most Bitcoin maps treat verification as a checkbox. Some admin checked a location once, maybe years ago, and that's supposed to give you confidence to walk in and ask about Bitcoin payments.

But trust doesn't work that way. Trust is social. It's dynamic. It comes from people you know vouching for something, not from a static database entry.

> "If I trust you, and you verify a merchant, I trust that merchant."

This is the core insight behind Mapping Bitcoin. We built on [Nostr](https://nostr.com) because it already has the social infrastructure we needed. Your follows, your network, your web of trust — these become your verification layer.

When you open Mapping Bitcoin, you're not seeing what some central authority approved. You're seeing what your network has verified. Seventeen people in your extended social graph visited a coffee shop this month and confirmed they paid with Lightning. That's verification that actually means something.

---

## Making Contribution Effortless

Here's what adding a merchant looks like on most platforms: log into OpenStreetMap, learn their tagging taxonomy, figure out the right categories, submit changes, wait for approval. The friction is so high that only the most dedicated contributors bother.

We wanted a different experience. Walk into a shop, notice they accept Bitcoin, pull out your phone, drop a pin, add the name, done. Thirty seconds, and you've helped someone else find this place.

> "If maintaining the map is painful, only martyrs do it. If it's easy, everyone does it."

Changes publish instantly via Nostr. No gatekeepers, no waiting, no bureaucracy. The web of trust handles spam naturally — contributions from trusted network members surface, while noise fades into the background.

---

## Reviews That Actually Work

On some platforms, leaving feedback costs 500 sats. On others, there's no feedback system at all. The result is the same: information stays wrong because updating it has friction.

Our reviews are signed on Nostr. They're free to leave, verifiable, and censorship-resistant. Merchants can respond. Users can see who vouched for a place and decide how much weight to give their opinion.

The feedback loop that should have existed all along — it finally works.

---

## What's Live Today

**Nostr Integration** — Reviews, ratings, and verifications all live on Nostr. Your data isn't locked in our database.

**Web of Trust Filtering** — Your social graph shapes what you see. Spam gets filtered without central moderation.

**OpenStreetMap Foundation** — Merchant locations on open infrastructure that anyone can build on.

**Open API** — Endpoints available for integration. Build on top of us.

---

## What's Coming

We're working on wallet integrations, Nostr client plugins, browser extensions, and merchant dashboards. The goal is to make Bitcoin merchant discovery a native part of the ecosystem, not an afterthought.

But we can't do this alone.

---

## Join Us

Mapping Bitcoin is an open project, and we're looking for people who want to help shape it.

### Contribute Code

We're open source and actively looking for developers. Whether you're into React, Nostr protocol, geospatial data, or API design, there's meaningful work to do. Check out our [GitHub](https://github.com/mappingbitcoin) or reach out directly.

### Add Places

Every time you find a Bitcoin-accepting merchant, you can help someone else discover it too. The more people contributing, the better the data gets for everyone.

### Become an Ambassador

We're launching a community ambassador program soon. If you're active in your local Bitcoin community and want to help grow merchant adoption in your area, we want to hear from you.

Ambassadors will help onboard merchants, verify listings, organize local mapping events, and represent Mapping Bitcoin in their regions.

---

## Get in Touch

Have ideas? Want to collaborate? Just want to say hi?

- **Nostr**: [npub1mappingbitcoin...](https://nostr-wot.com/profile/npub1sadk0snzs0zk2vq96w7d88sag6292dfwzh4pycaf3uxs8r0dgm8qklrmdh)
- **GitHub**: [github.com/mappingbitcoin](https://github.com/mappingbitcoin)
- **Email**: [satoshi@mappingbitcoin.com](mailto:satoshi@mappingbitcoin.com)

We read everything. We respond to most things. We're excited to build this with you.

---

*Built on [Nostr](https://nostr.com). Filtered by [Web of Trust](https://nostr-wot.com). Ready to use.*
