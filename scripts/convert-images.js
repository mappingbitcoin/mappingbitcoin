const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_DIR = path.join(process.cwd(), 'public', 'posts', 'nominal-value-fallacy');

const METADATA_MAP = {
    "nominal-value-fallacy": {
        title: "The Nominal Value Fallacy: Time, Currency, and the Truth About Wealth @ MappingBitcoin.com",
        excerpt: "Big numbers don’t mean real wealth. Learn how inflation tricks us into thinking we’re richer than we are—and how Bitcoin breaks the illusion."
    },
    "nominal-value-fallacy-purchase-power": {
        title: "The Decline of Purchasing Power @ MappingBitcoin.com",
        excerpt: "A coin once bought a horse. Now it buys an ice cream. This is the nominal value fallacy in action: thinking numbers stay the same while value slips away."
    },
};


async function convertToWebp(inputPath, outputPath, metadata) {
    const buffer = await sharp(inputPath)
        .webp({ quality: 85 })
        .withMetadata({
            exif: {
                IFD0: {
                    Title: metadata.title,
                    ImageDescription: metadata.excerpt,
                    Copyright: 'MappingBitcoin.com',
                },
            },
        })
        .toBuffer();

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Converted: ${path.basename(outputPath)}`);
}

(async () => {
    const files = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.png'));

    for (const file of files) {
        const inputPath = path.join(IMAGE_DIR, file);
        const outputPath = path.join(IMAGE_DIR, `${path.basename(file, '.png')}.webp`);

        const baseName = path.basename(file, '.png');
        const metadata = METADATA_MAP[baseName];

        if (!metadata) {
            console.warn(`⚠️ No metadata found for: ${file}`);
            continue;
        }

        await convertToWebp(inputPath, outputPath, metadata);
        // Optionally delete original
        fs.unlinkSync(inputPath);
    }
})();
