# Overview

MappingBitcoin.com is a comprehensive platform for discovering Bitcoin-accepting businesses worldwide.

## What We Do

We aggregate, enrich, and display Bitcoin merchant data from **OpenStreetMap (OSM)** - the world's largest open geographic database. Our platform makes it easy to find places where you can spend your Bitcoin.

## Core Features

### Real-time OSM Sync
We continuously sync with OpenStreetMap to capture new Bitcoin-accepting venues as they're added by the global community.

### Data Enrichment
Raw OSM data is enhanced with geographic information, standardized categories, and URL-friendly identifiers.

### Community Contributions
Users can submit new venues directly through our platform, with changes reflected in OpenStreetMap.

### Decentralized Images
Venue images are stored on Blossom servers using the Nostr protocol for decentralized, censorship-resistant hosting.

### Ownership Verification
Business owners can verify their venues through email or domain verification to establish trust.

## Technology Stack

- **Next.js** - React framework for the frontend
- **OpenStreetMap** - Source of truth for venue data
- **Nostr** - Authentication and social announcements
- **Blossom** - Decentralized image storage
- **Hetzner Object Storage** - Data persistence

## Getting Started

- [OSM Sync](/docs/osm-sync) - Learn how we sync with OpenStreetMap
- [Data Enrichment](/docs/data-enrichment) - Understand our enrichment pipeline
- [Creating Venues](/docs/venue-creation) - Submit new Bitcoin venues
- [Image Uploads](/docs/blossom-images) - Upload venue images
- [Verification](/docs/verification) - Verify your business
