import fs from 'fs/promises';

// Mapping OSM tags to classification
const TAG_CATEGORY_MAP = {
    'amenity:fast_food': { category: 'fast_food_restaurant', type: 'Food and Drink' },
    'amenity:cafe': { category: 'cafe', type: 'Food and Drink' },
    'amenity:restaurant': { category: 'restaurant', type: 'Food and Drink' },
    'amenity:payment_terminal': { category: 'atm', type: 'Finance' },
    'amenity:atm': { category: 'atm', type: 'Finance' },
    'shop:hairdresser': { category: 'hair_salon', type: 'Services' },
    'shop:deli': { category: 'deli', type: 'Food and Drink' },
    'shop:optician': { category: 'store', type: 'Shopping' },
    'office:company': { category: 'corporate_office', type: 'Business' },
    'office:it': { category: 'corporate_office', type: 'Business' },
    'amenity:internet_cafe': { category: 'cafe', type: 'Food and Drink' },
    'amenity:music_school' : { category: 'school', type: 'Education' },
    'amenity:arts_centre' : { category: 'art_gallery', type: 'Culture' },
    'amenity:pharmacy' : { category: 'pharmacy', type: 'Health and Wellness' },
    'amenity:drugstore' : { category: 'drugstore', type: 'Health and Wellness' },
    'shop:supermarket': { category: 'supermarket', type: 'Shopping' },
    'amenity:bar' : { category: 'bar', type: 'Food and Drink' },
    'shop:clothes': { category: "clothing_store", type: 'Shopping'},
    'shop:convenience' : { category: 'convenience_store', type: 'Shopping' },
    'shop:electronics' : { category: 'electronics_store', type: 'Shopping' },
    'amenity:bureau_de_change' : { category: 'bureau_de_change', type: 'Finance' },
    'shop:computer' : { category: 'electronics_store', type: 'Shopping' },
    'amenity:pub' : { category: 'pub', type: 'Food and Drink' },
    'amenity:fuel' : { category: 'gas_station', type: 'Automotive' },
    'shop:department_store' : { category: 'department_store', type: 'Shopping' },
    'shop:jewelry' : { category: 'jewelry_store', type: 'Shopping' },
    'shop:beauty' : { category: 'beauty_salon', type: 'Services' },
    'amenity:dentist' : { category: 'dentist', type: 'Health and Wellness' },
    'shop:car_repair' : { category: 'car_repair', type: 'Automotive' },
    'shop:farm' : { category: 'farm', type: 'Business' },
    'shop:gift' : { category: 'gift_shop', type: 'Shopping' },
    'amenity:doctors' : { category: 'doctor', type: 'Health and Wellness' },
    'shop:mobile_phone'   : { category: 'cell_phone_store', type: 'Shopping' },
    'shop:furniture'    : { category: 'furniture_store', type: 'Shopping' },
    'amenity:ice_cream'  : { category: 'ice_cream_shop', type: 'Food and Drink'},
    'shop:tattoo'       : { category: 'body_art_service', type: 'Services' },
    'shop:travel_agency'   : { category: 'travel_agency', type: 'Services' },
    'shop:massage':             { category: 'massage', type: 'Health and Wellness' },
    'amenity:bank':             { category: 'bank', type: 'Finance' },
    'shop:shoes':               { category: 'shoe_store', type: 'Shopping' },
    'shop:car':                 { category: 'car_dealer', type: 'Automotive' },
    'amenity:clinic':           { category: 'doctor', type: 'Health and Wellness' }, // generic mapping
    'shop:butcher':             { category: 'butcher_shop', type: 'Shopping' },
    'shop:florist':             { category: 'florist', type: 'Services' },
    'shop:bicycle':             { category: 'bicycle_store', type: 'Shopping' },
    'amenity:taxi':             { category: 'taxi_stand', type: 'Transportation' },
    'shop:car_parts':           { category: 'auto_parts_store', type: 'Shopping' },
    'shop:books':               { category: 'book_store', type: 'Shopping' },
    'shop:hardware':            { category: 'hardware_store', type: 'Shopping' },
    'amenity:marketplace':      { category: 'market', type: 'Shopping' },
    'shop:sports':              { category: 'sporting_goods_store', type: 'Shopping' },
    'shop:wine':                { category: 'liquor_store', type: 'Shopping' },
    'amenity:car_wash':         { category: 'car_wash', type: 'Automotive' },
    'amenity:car_rental':       { category: 'car_rental', type: 'Automotive' },
    'shop:alcohol':             { category: 'liquor_store', type: 'Shopping' },
    'amenity:veterinary':       { category: 'veterinary_care', type: 'Services' },
    'amenity:studio':           { category: 'art_studio', type: 'Culture' },
    'shop:art':                 { category: 'art_gallery', type: 'Culture' },
    'shop:health_food':         { category: 'food_store', type: 'Shopping' },
    'shop:pastry':              { category: 'bakery', type: 'Food and Drink' },
    'shop:kiosk':               { category: 'convenience_store', type: 'Shopping' },
    'shop:pet':                 { category: 'pet_store', type: 'Shopping' },
    'shop:coffee':              { category: 'cafe', type: 'Food and Drink' },
    'amenity:school':           { category: 'school', type: 'Education' },
    'amenity:community_centre': { category: 'community_center', type: 'Entertainment and Recreation' },
    'amenity:hospital':         { category: 'hospital', type: 'Health and Wellness' },
    'shop:cosmetics':           { category: 'beauty_salon', type: 'Services' },
    'amenity:language_school':  { category: 'school', type: 'Education' },
    'shop:confectionery':       { category: 'candy_store', type: 'Food and Drink' },
    'shop:photo':               { category: 'store', type: 'Shopping' },
    'amenity:events_venue':     { category: 'event_venue', type: 'Entertainment and Recreation' },
    'amenity:nightclub':        { category: 'night_club', type: 'Entertainment and Recreation' },
    'shop:music':               { category: 'store', type: 'Shopping' },
    'shop:general':             { category: 'store', type: 'Shopping' },
    'shop:interior_decoration': { category: 'home_goods_store', type: 'Shopping' },
    'shop:laundry':             { category: 'laundry', type: 'Services' },
    'shop:tyres':               { category: 'auto_parts_store', type: 'Shopping' },
    'shop:bed':                 { category: 'furniture_store', type: 'Shopping' },
    'shop:herbalist':           { category: 'drugstore', type: 'Health and Wellness' },
    'shop:tailor':              { category: 'tailor', type: 'Services' }
}

const classifyEntry = (entry) => {
    const tags = entry?.osm_json?.tags || {};
    for (const [key, value] of Object.entries(tags)) {
        const compoundKey = `${key}:${value}`;
        if (TAG_CATEGORY_MAP.hasOwnProperty(compoundKey)) {
            const classification = TAG_CATEGORY_MAP[compoundKey];
            return {
                id: entry.id,
                category: classification.category,
                type: classification.type
            };
        }
    }
    return null;
};

const loadExistingClassifiedTags = async (filepath) => {
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
};
async function countOSMVenues(inputPath) {
    try {
        const data = await fs.readFile(inputPath, 'utf-8');
        const venues = JSON.parse(data);

        // Only count venues that contain osm_json data (OSM-sourced)
        const osmVenuesCount = venues.filter(v => v.osm_json).length;
        return osmVenuesCount;
    } catch (error) {
        console.error('❌ Error reading or parsing venues.json while counting:', error);
        return 0; // Return 0 in case of error to prevent [object Promise] issues
    }
}

const main = async () => {
    const inputPath = 'venues_deleted_excluded.json';
    const outputPath = 'classified_tags_deleted_excluded.json';

    let venues;
    try {
        const raw = await fs.readFile(inputPath, 'utf-8');
        venues = JSON.parse(raw);
    } catch (err) {
        console.error('❌ Failed to read or parse venues.json:', err);
        return;
    }

    const existingEntries = await loadExistingClassifiedTags(outputPath);
    const existingIds = new Set(existingEntries.map(e => e.id));

    let newCount = 0;
    let skippedCount = 0;
    const updatedEntries = [...existingEntries];

    for (const venue of venues) {
        if (existingIds.has(venue.id)) {
            console.log(`🔁 Skipping ${venue.id} — already classified`);
            skippedCount++;
            continue;
        }
        const classified = classifyEntry(venue);
        if (classified) {
            console.log(`✅ ${venue.id} → ${classified.category}`);
            updatedEntries.push(classified);
            existingIds.add(venue.id);
            newCount++;
        } else {
            console.log(`⏭️  Skipping ${venue.id} — no matching tag`);
        }
    }

    // Optional: sort by id
    updatedEntries.sort((a, b) => a.id.localeCompare(b.id));
    const totalOSMEntries = await countOSMVenues(inputPath)

    try {
        await fs.writeFile(outputPath, JSON.stringify(updatedEntries, null, 2), 'utf-8');
        console.log(`\n📊 Classification Summary:`);
        console.log(`✅ Newly classified entries: ${newCount}`);
        console.log(`🔁 Skipped (already classified): ${skippedCount}`);
        console.log(`💾 Total entries now in ${outputPath}: ${updatedEntries.length}`);
        console.log(`📊 Total entries in ${inputPath}: ${totalOSMEntries}`);
    } catch (err) {
        console.error(`❌ Failed to write ${outputPath}:`, err);
    }
};

main();
