# Creating Venues

Users can submit new Bitcoin-accepting businesses directly through the platform.

## Submission Process

1. **Authentication** - Login via OSM OAuth
2. **Form Completion** - Fill out venue details
3. **CAPTCHA** - reCAPTCHA v3 validation (score >= 0.5)
4. **OSM Upload** - Data uploaded to OpenStreetMap
5. **Announcement** - New venue announced on Nostr

## Form Fields

### Basic Information

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Venue name |
| Category | Yes | Primary category |
| Subcategory | Yes | Specific type |
| Description | No | About the venue |
| Role | Yes | Your relation to venue |

### Location

| Field | Required | Description |
|-------|----------|-------------|
| Coordinates | Yes | Lat/lon from map picker |
| Street | No | Street address |
| City | No | City name |
| State | No | State/province |
| Country | No | Country |
| Postal Code | No | ZIP/postal code |

### Payment Methods

| Option | OSM Tag |
|--------|---------|
| On-chain Bitcoin | `payment:onchain=yes` |
| Lightning Network | `payment:lightning=yes` |
| Lightning Contactless | `payment:lightning_contactless=yes` |

### Contact Information

| Field | OSM Tag |
|-------|---------|
| Website | `contact:website` |
| Phone | `contact:phone` |
| Email | `contact:email` |
| Instagram | `contact:instagram` |
| Facebook | `contact:facebook` |
| Twitter | `contact:twitter` |

### Operating Details

| Field | OSM Tag |
|-------|---------|
| Opening Hours | `opening_hours` |
| Notes | `note` |

## OSM Tag Mapping

Form fields are converted to standard OSM tags:

### Required Tags

All submitted venues include:

```
currency:XBT = yes
check_date:currency:XBT = [today's date]
source = MappingBitcoin.com user submission
```

These tags ensure compatibility with BTC Map and other Bitcoin mapping services.

### Category Mapping

Subcategories map to OSM tag keys:

| Subcategory | OSM Tag |
|-------------|---------|
| cafe | `amenity=cafe` |
| restaurant | `amenity=restaurant` |
| hotel | `tourism=hotel` |
| electronics | `shop=electronics` |

## Editing Venues

Existing venues can be updated:

1. Fetch current OSM data
2. Merge new tags with existing
3. Upload as modify operation
4. Original unmapped tags preserved

## Changeset Flow

```
1. Open changeset → Get changeset ID
2. Build OSM XML with node data
3. Upload diff to OSM API
4. Close changeset
5. Parse returned node ID
```

## Related

- [Image Uploads](/docs/blossom-images) - Add venue images
- [Verification](/docs/verification) - Verify ownership
- [Data Enrichment](/docs/data-enrichment) - How venues are enhanced
