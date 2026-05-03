# PWA Icons Setup

## Required Icons:

1. **pwa-192x192.png** - 192x192 pixels
2. **pwa-512x512.png** - 512x512 pixels

## How to Generate:

Use `Лого.png` (project root) to create PWA icons:

### Option 1: Online Tool
1. Go to https://realfavicongenerator.net/
2. Upload current brand logo (`Лого.png`)
3. Generate icons
4. Download pwa-192x192.png and pwa-512x512.png
5. Place in `public/` folder

### Option 2: Using ImageMagick (if installed)
```bash
# Generate 192x192
convert "../Лого.png" -resize 192x192 public/pwa-192x192.png

# Generate 512x512
convert "../Лого.png" -resize 512x512 public/pwa-512x512.png
```

### Option 3: Using Photoshop/Figma
1. Open current logo file (`Лого.png`)
2. Resize to 192x192, export as PNG
3. Resize to 512x512, export as PNG
4. Save in public/ folder

## Temporary Placeholder:

For now, you can use the current logo as a placeholder:
```bash
cp "../Лого.png" public/pwa-192x192.png
cp "../Лого.png" public/pwa-512x512.png
```

The icons will work but won't be perfectly sized. Replace with proper icons before production.
