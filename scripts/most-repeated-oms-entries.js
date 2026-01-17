import fs from 'fs/promises';

async function countAmenityShopTags(filePath, topN = 100) {
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const venues = JSON.parse(raw);

        const counts = {};

        for (const venue of venues) {
            const tags = venue?.osm_json?.tags;
            if (!tags) continue;

            for (const [key, value] of Object.entries(tags)) {
                if (key === 'amenity' || key === 'shop') {
                    const typed = `${key}:${value}`;
                    counts[typed] = (counts[typed] || 0) + 1;
                }
            }
        }

        const topTags = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([tag, count]) => ({ Tag: tag, Count: count }));

        console.log(`📊 Top ${topN} amenity/shop tags:\n`);
        console.table(topTags);
    } catch (err) {
        console.error('❌ Error reading or parsing JSON:', err);
    }
}

countAmenityShopTags('./map/venues.json');
