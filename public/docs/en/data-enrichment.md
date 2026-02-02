# Data Enrichment

Raw OSM data undergoes several enrichment processes to make it more useful and searchable.

## Geographic Enrichment

Each venue is enriched with location information:

| Field | Description |
|-------|-------------|
| City | Nearest city using spatial indexing |
| State | Administrative region |
| Country | Country code and name |
| Address | Human-readable formatted address |

For OSM **ways** (areas), we calculate the center point from node coordinates.

### Spatial Indexing

We use **KDBush** for fast nearest-city lookups. This spatial index allows sub-millisecond queries even with thousands of cities.

## Category Assignment

Venues are categorized using a two-tier system.

### Tier 1: OSM Tag Mapping

OSM tags are mapped to standardized categories:

| OSM Tag | Category | Subcategory |
|---------|----------|-------------|
| `amenity=cafe` | Food & Drink | Cafe |
| `amenity=restaurant` | Food & Drink | Restaurant |
| `amenity=bar` | Food & Drink | Bar |
| `shop=electronics` | Shopping | Electronics |
| `shop=clothes` | Shopping | Clothes |
| `tourism=hotel` | Accommodation | Hotel |
| `office=company` | Services | Company |

We support **100+ subcategory mappings** across all place types.

### Tier 2: Custom Category Tag

User-submitted venues include a custom `category` tag that provides fallback categorization when OSM tags don't match our dictionary.

## Slug Generation

URL-friendly slugs are generated from venue names and locations:

- `cafe-downtown-new-york`
- `bitcoin-bar-berlin`
- `lightning-pizza-miami`

### Collision Handling

Duplicate slugs are detected and handled:

1. Check if slug exists
2. If duplicate, append location suffix
3. If still duplicate, append numeric counter

## Batch Processing

Enrichment runs in batches:

| Queue | Purpose |
|-------|---------|
| `geo-enrichment-*.json` | Venues needing location data |

Changed venues are processed periodically with timestamps recorded.

## Data Model

```
EnrichedVenue {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
  slug: string
  country: string
  state: string
  city: string
  formattedAddress: string
  category: string
  subcategory: string
  enrichedAt: string
}
```

## Related

- [OSM Sync](/docs/osm-sync) - Where the data comes from
- [Creating Venues](/docs/venue-creation) - How categories are set
