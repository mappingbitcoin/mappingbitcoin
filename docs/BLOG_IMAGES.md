# Blog Images Guide

## Overview

Blog posts use different image formats for different purposes:
- **SVG** for website display (scalable, small file size)
- **JPG** for social media previews (required by platforms)

## Image Types

### Featured Image (website display)
- **Format**: SVG (preferred) or any web format
- **Dimensions**: 1200 x 630 (aspect ratio)
- **Use**: Displayed at the top of blog articles on the website

### OG Image (social media)
- **Dimensions**: 1200 x 630 pixels
- **Format**: JPG (required by social platforms)
- **Use**: og:image, Twitter cards, link previews

### Preview Image (blog listing)
- **Dimensions**: 600 x 400 pixels
- **Format**: JPG
- **Use**: Blog listing cards, thumbnails

## File Structure

```
public/blog/images/
├── {post-slug}-featured.svg    # Website display (vector)
├── {post-slug}-featured.jpg    # Social media preview (derived from SVG)
├── {post-slug}-preview.svg     # Source for preview (optional)
└── {post-slug}-preview.jpg     # Blog listing cards
```

## Markdown Frontmatter

```yaml
---
featuredImage: "/blog/images/{post-slug}-featured.svg"    # Displayed on website
featuredImageAlt: "Description of the image"
ogImage: "/blog/images/{post-slug}-featured.jpg"          # Social media preview
previewImage: "/blog/images/{post-slug}-preview.jpg"      # Blog listing cards
---
```

**Note**: If `ogImage` is not specified, it's automatically derived by replacing `.svg` with `.jpg` in the `featuredImage` path.

## Converting SVG to JPG

### Prerequisites

Install ImageMagick:
```bash
brew install imagemagick
```

### Conversion Commands

**OG Image (1200x630):**
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

Convert all images for a post:
```bash
POST_SLUG="your-post-slug"
BG_COLOR="#0a0a0f"

# OG Image (for social media)
magick -background "$BG_COLOR" -density 150 \
  "public/blog/images/${POST_SLUG}-featured.svg" \
  -flatten -resize 1200x630 -depth 8 -quality 90 \
  "public/blog/images/${POST_SLUG}-featured.jpg"

# Preview Image (for blog listing)
magick -background "$BG_COLOR" -density 150 \
  "public/blog/images/${POST_SLUG}-preview.svg" \
  -flatten -resize 600x400 -depth 8 -quality 90 \
  "public/blog/images/${POST_SLUG}-preview.jpg"
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

## Why This Structure?

**SVG for website:**
- Scales perfectly on all screen sizes
- Smaller file size
- Crisp text and graphics
- Easy to edit and maintain

**JPG for social media:**
- Required by Twitter, Facebook, LinkedIn, etc.
- These platforms don't render SVG
- The `og:image` meta tag must point to a raster image
