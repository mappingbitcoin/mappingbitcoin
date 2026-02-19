# Overview

MappingBitcoin is a comprehensive platform for discovering Bitcoin-accepting businesses worldwide.

## What We Do

We aggregate, enrich, and display Bitcoin merchant data from **OpenStreetMap (OSM)** - the world's largest open geographic database. Our platform makes it easy to find places where you can spend your Bitcoin.

## Core Features

### Real-time OSM Sync
We continuously sync with OpenStreetMap to capture new Bitcoin-accepting venues as they're added by the global community.

### Data Enrichment
Raw OSM data is enhanced with geographic information, standardized categories, and URL-friendly identifiers.

### Trust-Weighted Reviews
Leave reviews as Nostr events. Reviews are weighted by Web of Trust (WoT) to prioritize trusted community members and resist Sybil attacks.

### Web of Trust
Reviews show WoT badges indicating the reviewer's connection to the trust network. Filter reviews by trust level to see feedback from close connections.

### Community Contributions
Users can submit new venues directly through our platform, with changes reflected in OpenStreetMap.

### Decentralized Images
Venue images are stored on Blossom servers using the Nostr protocol for decentralized, censorship-resistant hosting.

### Ownership Verification
Business owners can verify their venues through email or domain verification. Verified owners can respond to reviews.

## Technology Stack

- **Next.js** - React framework for the frontend
- **OpenStreetMap** - Source of truth for venue data
- **Nostr** - Authentication, reviews, and social features
- **Blossom** - Decentralized image storage
- **Hetzner Object Storage** - Data persistence

## Getting Started

- [OSM Sync](/docs/osm-sync) - Learn how we sync with OpenStreetMap
- [Data Enrichment](/docs/data-enrichment) - Understand our enrichment pipeline
- [Reviews](/docs/reviews) - How reviews and ratings work
- [Web of Trust](/docs/web-of-trust) - Understanding trust scores
- [Creating Venues](/docs/venue-creation) - Submit new Bitcoin venues
- [Image Uploads](/docs/blossom-images) - Upload venue images
- [Verification](/docs/verification) - Verify your business
