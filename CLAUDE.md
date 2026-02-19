# Claude Instructions for MappingBitcoin

## Blog Images

When creating or converting blog images:

1. **Never try to view/process images directly** - this causes API errors
2. **Use ImageMagick CLI** for SVG to JPG conversion:

```bash
# Featured image (1200x630)
magick -background "#0a0a0f" -density 150 \
  public/blog/images/{slug}-featured.svg \
  -flatten -resize 1200x630 -depth 8 -quality 90 \
  public/blog/images/{slug}-featured.jpg

# Preview image (600x400)
magick -background "#0a0a0f" -density 150 \
  public/blog/images/{slug}-preview.svg \
  -flatten -resize 600x400 -depth 8 -quality 90 \
  public/blog/images/{slug}-preview.jpg
```

3. **Keep SVG source files** - they're easier to edit
4. **Reference JPG in markdown** - social platforms require raster formats

Full documentation: `docs/BLOG_IMAGES.md`
