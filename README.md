# MappingBitcoin

**Mapping the Bitcoin ecosystem worldwide** — merchants, meetups, communities, developers, educators, and everyone building on Bitcoin.

[mappingbitcoin.com](https://mappingbitcoin.com)

## Overview

MappingBitcoin is an open-source platform for discovering and connecting with the global Bitcoin ecosystem. While we started with Bitcoin-accepting merchants, our vision extends far beyond commerce to map the entire Bitcoin community: meetups, hackerspaces, educators, developers, artists, and anyone contributing to the Bitcoin movement.

Built on [Nostr](https://nostr.com) for decentralized identity and censorship-resistant data, MappingBitcoin puts the community in control.

## Features

### Interactive Map
- Browse Bitcoin venues worldwide with an intuitive map interface
- Filter by category, payment methods, and verification status
- Real-time location-based discovery
- Clustered markers for dense areas

### Trust-Weighted Reviews
- Submit reviews as Nostr events (decentralized, portable, yours forever)
- Star ratings with text and image support
- Reviews weighted by community trust scores
- Spam filtering and moderation tools

### Business Verification
- Multiple verification methods: Email, Domain DNS, Physical visit
- Verified badge for legitimate businesses
- Ownership claims with proof-of-control

### Web of Trust
- Nostr-based social graph analysis
- Community seeders define trust network
- Trust scores propagate through follow relationships
- Sybil-resistant rating system

### Decentralized Identity
- Login with Nostr: browser extension, nsec, or NIP-46 bunker
- No email/password accounts — your keys, your identity
- Portable reputation across the Nostr ecosystem

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Maps | MapLibre GL, React Map GL |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Protocol | Nostr (NIP-01, NIP-02, NIP-46, custom kinds) |
| Storage | Hetzner Object Storage, Blossom Protocol |
| i18n | next-intl (English, Spanish) |

## Getting Started

### Prerequisites

- Node.js 20.x
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ArcadeLabsInc/mappingbitcoin.git
cd mappingbitcoin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

See `.env.example` for all required variables. Key ones include:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Session encryption key
- `HETZNER_STORAGE_*` — Object storage for images
- `RESEND_API_KEY` — Email delivery

## Project Structure

```
app/
├── [locale]/           # Localized routes (en, es)
│   ├── map/            # Interactive map
│   ├── places/         # Venue pages
│   ├── countries/      # Browse by region
│   └── admin/          # Admin dashboard
├── api/                # API routes

components/
├── ui/                 # Base components
├── reviews/            # Review system
├── verification/       # Business verification
└── place/              # Venue components

lib/
├── nostr/              # Nostr protocol
├── db/                 # Database services
├── trust/              # Trust graph
└── storage/            # File storage

scripts/
├── reviewListener.ts   # Nostr relay listener
└── map/                # OSM data pipeline
```

## Nostr Integration

MappingBitcoin uses custom Nostr event kinds:

| Kind | Purpose |
|------|---------|
| 38381 | Venue Reviews |
| 38382 | Review Replies |
| 38383 | Venue Claims |

Reviews are published to Nostr relays, making them portable and censorship-resistant. Your reviews belong to you, not the platform.

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run ESLint

# Data Pipeline
npm run maps:update      # Sync OSM venue data

# Background Services
npm run listen:reviews   # Start review indexer
```

## Roadmap

MappingBitcoin is evolving from a merchant directory into a comprehensive map of the entire Bitcoin ecosystem:

### Current
- [x] Bitcoin-accepting merchants worldwide
- [x] Trust-weighted review system
- [x] Business verification
- [x] Multi-language support (EN, ES)

### In Progress
- [ ] Community meetups and events
- [ ] Bitcoin ATM locations
- [ ] Lightning Network node operators

### Future Vision
- [ ] **Bitcoin Meetups** — Regular community gatherings worldwide
- [ ] **Hackerspaces & Makerspaces** — Where builders create
- [ ] **Bitcoin Educators** — Teachers, course creators, content producers
- [ ] **Developer Communities** — Open source contributors, companies building on Bitcoin
- [ ] **Artists & Creators** — Musicians, visual artists, writers accepting Bitcoin
- [ ] **Bitcoin-friendly Coworking** — Spaces welcoming to Bitcoiners
- [ ] **Nostr Relays** — Map the Nostr infrastructure
- [ ] **Mining Operations** — Educational tours and facilities
- [ ] **Bitcoin Conferences & Events** — Past and upcoming gatherings
- [ ] **Historical Sites** — Places significant to Bitcoin history
- [ ] **Community Hubs** — Bitcoin centers, embassies, social clubs

**The goal: map every corner of the Bitcoin ecosystem, connecting people with their local and global Bitcoin community.**

## Contributing

We welcome contributions! Whether it's code, translations, or adding venues to the map.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding Venues

The easiest way to contribute is by adding Bitcoin-accepting places:
1. Visit [mappingbitcoin.com/map](https://mappingbitcoin.com/map)
2. Click "Add Place"
3. Submit venue details (requires OSM account)

## Documentation

- [Reviews System](docs/REVIEWS_SYSTEM.md) — How reviews, ratings, and trust work
- [AGENTS.md](AGENTS.md) — Development guidelines and patterns
- [.env.example](.env.example) — Environment configuration

## License

This project is open source. See [LICENSE](LICENSE) for details.

## Links

- **Website**: [mappingbitcoin.com](https://mappingbitcoin.com)
- **Nostr**: Follow us on Nostr (coming soon)
- **GitHub**: [github.com/ArcadeLabsInc/mappingbitcoin](https://github.com/ArcadeLabsInc/mappingbitcoin)

---

*Built with Bitcoin, for Bitcoiners, by Bitcoiners.*
