# Blog Images Guide

## Overview

Blog posts require images for social media previews (og:image, Twitter cards). SVG files must be converted to JPG because social platforms don't support SVG format.

## Image Specifications

### Featured Image (og:image)
- **Dimensions**: 1200 x 630 pixels
- **Format**: JPG
- **Use**: Social media previews, main blog header

### Preview Image
- **Dimensions**: 600 x 400 pixels
- **Format**: JPG
- **Use**: Blog listing cards, smaller previews

## File Structure

```
public/blog/images/
├── {post-slug}-featured.svg    # Source file (keep for editing)
├── {post-slug}-featured.jpg    # Converted for social previews
├── {post-slug}-preview.svg     # Source file (keep for editing)
└── {post-slug}-preview.jpg     # Converted for blog cards
```

## Converting SVG to JPG

### Prerequisites

Install ImageMagick:
```bash
brew install imagemagick
```

### Conversion Commands

**Featured image (1200x630):**
```bash
magick -background "#0a0a0f" -density 150 \
  public/blog/images/{post-slug}-featured.svg \
  -flatten -resize 1200x630 -depth 8 -quality 90 \
  public/blog/images/{post-slug}-featured.jpg
```

**Preview image (600x400):**
```bash
magick -background "#0a0a0f" -density 150 \
  public/blog/images/{post-slug}-preview.svg \
  -flatten -resize 600x400 -depth 8 -quality 90 \
  public/blog/images/{post-slug}-preview.jpg
```

### Options Explained

| Option | Purpose |
|--------|---------|
| `-background "#0a0a0f"` | Sets background color (matches our dark theme) |
| `-density 150` | Higher DPI for crisp text rendering |
| `-flatten` | Removes transparency (JPG doesn't support it) |
| `-resize WxH` | Ensures correct output dimensions |
| `-depth 8` | Standard 8-bit color (avoid 12-bit) |
| `-quality 90` | High quality JPEG compression |

### Quick Script

Convert all SVGs for a post:
```bash
POST_SLUG="your-post-slug"
BG_COLOR="#0a0a0f"

magick -background "$BG_COLOR" -density 150 \
  "public/blog/images/${POST_SLUG}-featured.svg" \
  -flatten -resize 1200x630 -depth 8 -quality 90 \
  "public/blog/images/${POST_SLUG}-featured.jpg"

magick -background "$BG_COLOR" -density 150 \
  "public/blog/images/${POST_SLUG}-preview.svg" \
  -flatten -resize 600x400 -depth 8 -quality 90 \
  "public/blog/images/${POST_SLUG}-preview.jpg"
```

## Markdown Frontmatter

Reference JPG files in your blog post frontmatter:
```yaml
---
featuredImage: "/blog/images/{post-slug}-featured.jpg"
featuredImageAlt: "Description of the image"
previewImage: "/blog/images/{post-slug}-preview.jpg"
---
```

## Troubleshooting

### Image appears blank or corrupted
- Ensure background color is set (SVG may have transparent background)
- Check that the SVG file is valid

### Text looks blurry
- Increase `-density` value (try 200 or 300)
- SVG may use system fonts not available - use web-safe fonts in SVG

### File size too large
- Reduce `-quality` value (80 is usually acceptable)
- Verify dimensions are correct (not upscaled)

### Colors look wrong
- Check `-depth 8` is set (12-bit can cause issues)
- Verify color space with `magick identify -verbose file.jpg`

## Why Not Use SVG Directly?

Social media platforms (Twitter, Facebook, LinkedIn, etc.) require raster images for previews. They don't render SVG files. The `og:image` meta tag must point to a JPG or PNG file.

Keep the SVG source files for:
- Easy editing (vector graphics scale perfectly)
- Future modifications
- Smaller file size in version control
