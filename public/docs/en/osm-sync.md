# OSM Synchronization

The platform continuously synchronizes Bitcoin-related venues from OpenStreetMap using the **Overpass API** and **OSM Replication feeds**.

## How It Works

### Initial Data Load

At startup, we query the Overpass API for all venues tagged with Bitcoin-related tags:

| Tag | Description |
|-----|-------------|
| `payment:bitcoin` | Accepts Bitcoin payments |
| `payment:lightning` | Accepts Lightning Network |
| `bitcoin` | Bitcoin-related business |
| `currency:XBT` | Uses XBT currency code |

We search across OSM **nodes**, **ways**, and **relations** with these tags.

### Incremental Updates

A cron job runs **every minute** to capture changes:

1. **State Sync** - Syncs OSM replication state from storage
2. **Diff Processing** - Parses XML diff files from OSM replication API
3. **Change Detection** - Tracks created, modified, and deleted venues
4. **Queue Management** - Adds changed venues to enrichment queue
5. **Data Persistence** - Updates the master venue dataset

## OSM Diff Processing

When processing diffs, we:

- Parse XML diff files for changes
- Sanitize tags (remove control characters)
- Queue changed venues for geo-enrichment
- Handle deletions gracefully

## Data Storage

Venue data is stored in two formats:

| File | Contents |
|------|----------|
| `BitcoinVenues.json` | Raw OSM data |
| `EnrichedVenues.json` | Enhanced venue data |

Both are persisted to **Hetzner Object Storage** (S3-compatible).

## Sync Schedule

| Task | Frequency |
|------|-----------|
| OSM diff processing | Every minute |
| Slug generation | Every 5 minutes |
| Statistics rebuild | Every 5 minutes |

## Related

- [Data Enrichment](/docs/data-enrichment) - What happens after sync
- [Creating Venues](/docs/venue-creation) - Adding new venues
