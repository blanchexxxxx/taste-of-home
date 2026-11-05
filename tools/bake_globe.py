"""Generate the dotted globe texture used on the home page.

Renders an equirectangular dot map from Natural Earth country polygons:
dark ocean, dotted land in a lime -> yellow gradient, and brighter dots
for the countries listed in HIGHLIGHT.

Usage:
    pip install pillow
    curl -L -o countries.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
    python tools/bake_globe.py countries.geojson assets/img

Outputs globe-2k.jpg (desktop) and globe-1k.jpg (low-end devices) in the output folder.
"""
import argparse
import json
import math
import os

from PIL import Image, ImageDraw

W, H = 4096, 2048                       # work at 4k, then downscale
HIGHLIGHT = {'CHN', 'IDN', 'MMR', 'LKA'}  # ISO A3 codes of the students' countries
OCEAN = (17, 20, 18)
LAND = (30, 36, 30)                     # faint silhouette so coastlines read
LAND_HL = (52, 64, 30)
GREEN, YELLOW = (157, 240, 60), (255, 226, 64)
STEP = 0.75                             # dot spacing in degrees of latitude


def px(lng, lat):
    return ((lng + 180) / 360 * W, (90 - lat) / 180 * H)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('geojson', help='Natural Earth admin-0 countries GeoJSON')
    ap.add_argument('outdir', help='folder to write globe-2k.jpg and globe-1k.jpg into')
    args = ap.parse_args()

    with open(args.geojson, encoding='utf-8') as f:
        gj = json.load(f)

    land = Image.new('L', (W, H), 0)
    hl = Image.new('L', (W, H), 0)
    dl, dh = ImageDraw.Draw(land), ImageDraw.Draw(hl)
    for feat in gj['features']:
        code = feat['properties'].get('ADM0_A3')
        g = feat['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            for i, ring in enumerate(poly):
                pts = [px(x, y) for x, y in ring]
                if len(pts) < 3:
                    continue
                fill = 255 if i == 0 else 0     # outer ring fills, holes cut out
                dl.polygon(pts, fill=fill)
                if code in HIGHLIGHT:
                    dh.polygon(pts, fill=fill)

    img = Image.new('RGB', (W, H), OCEAN)
    img.paste(Image.new('RGB', (W, H), LAND), mask=land)
    img.paste(Image.new('RGB', (W, H), LAND_HL), mask=hl)
    draw = ImageDraw.Draw(img)

    # Dots on a grid that stays evenly spaced on the sphere: longitude spacing
    # widens by 1/cos(lat), and each dot is drawn as an ellipse so it looks round
    # once wrapped onto the globe.
    lat = 90 - STEP / 2
    while lat > -90:
        c = max(math.cos(math.radians(lat)), 0.02)
        lstep = STEP / c
        lng = -180 + lstep / 2
        while lng < 180:
            x, y = px(lng, lat)
            xi, yi = min(int(x), W - 1), min(int(y), H - 1)
            if land.getpixel((xi, yi)):
                t = min(max((lng + 20) / 180 * 0.6 + (lat + 40) / 120 * 0.4, 0), 1)
                col = tuple(int(GREEN[k] + (YELLOW[k] - GREEN[k]) * t) for k in range(3))
                on = hl.getpixel((xi, yi))
                r = (H / 180) * STEP * (0.36 if on else 0.27)
                if not on:
                    col = tuple(int(v * 0.62 + OCEAN[k] * 0.38) for k, v in enumerate(col))
                draw.ellipse([x - r / c, y - r, x + r / c, y + r], fill=col)
            lng += lstep
        lat -= STEP

    os.makedirs(args.outdir, exist_ok=True)
    for name, size in (('globe-2k.jpg', (2048, 1024)), ('globe-1k.jpg', (1024, 512))):
        img.resize(size, Image.LANCZOS).save(os.path.join(args.outdir, name), quality=86, optimize=True, progressive=True)
    print('wrote globe-2k.jpg and globe-1k.jpg to', args.outdir)


if __name__ == '__main__':
    main()
