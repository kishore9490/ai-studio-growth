"""Generates the letterhead artwork (300 dpi) and the print-ready logo for JCH Business Solutions LLP."""
from PIL import Image, ImageDraw, ImageFilter
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SS = 2                      # supersample for smooth edges
DPI = 300
MM = DPI / 25.4
W, H = round(210 * MM), round(297 * MM)

NAVY = (11, 46, 111)
BLUE = (0, 80, 170)
SKY = (30, 150, 218)
SKY2 = (58, 174, 224)
RULE = (200, 213, 234)


def P(x_mm, y_mm):
    return (x_mm * MM * SS, y_mm * MM * SS)


def gradient_poly(img, pts, c1, c2):
    """Fill polygon `pts` with a left-to-right gradient c1 -> c2."""
    xs = [p[0] for p in pts]
    x0, x1 = int(min(xs)), int(max(xs)) + 1
    grad = Image.new('RGBA', (max(1, x1 - x0), img.height))
    gd = ImageDraw.Draw(grad)
    for i in range(grad.width):
        t = i / max(1, grad.width - 1)
        gd.line([(i, 0), (i, img.height)], fill=tuple(round(a + (b - a) * t) for a, b in zip(c1, c2)) + (255,))
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    layer.paste(grad, (x0, 0))
    img.paste(layer, (0, 0), mask)


def ribbon_strip(img, y0, h, segs, slant):
    """segs: list of (x_start_mm, x_end_mm, colour or (c1, c2)). Parallelogram segments with slanted joins."""
    d = ImageDraw.Draw(img)
    for xs, xe, col in segs:
        pts = [P(xs, y0), P(xe, y0), P(xe - slant, y0 + h), P(xs - slant, y0 + h)]
        if isinstance(col[0], tuple):
            gradient_poly(img, pts, col[0], col[1])
        else:
            d.polygon(pts, fill=col + (255,))


def background():
    img = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # top ribbon strip
    ribbon_strip(img, 0, 7, [(-10, 128, NAVY), (130.2, 170, BLUE), (172.2, 225, (SKY, SKY2))], slant=7)
    # header divider: hairline with a slanted gradient accent on the left
    y = 43
    d.rectangle([P(18, y - 0.18), P(192, y + 0.18)], fill=RULE + (255,))
    gradient_poly(img, [P(18, y - 0.6), P(52, y - 0.6), P(51.2, y + 0.6), P(18, y + 0.6)], BLUE, SKY)
    # footer hairline
    d.rectangle([P(18, 276 - 0.15), P(192, 276 + 0.15)], fill=RULE + (255,))
    # bottom ribbon strip (mirrored order)
    ribbon_strip(img, 290, 7, [(-10, 40, (SKY2, SKY)), (42.2, 82, BLUE), (84.2, 225, NAVY)], slant=-7)
    return img.resize((W, H), Image.LANCZOS)


def clear_outside_oval(src):
    """The source icon has opaque white outside its oval ring; flood-fill it to transparent from the corners."""
    from collections import deque
    w, h = src.size
    px = src.load()
    def bg(x, y):
        r, g, b, a = px[x, y]
        return a < 10 or (r > 225 and g > 225 and b > 225)
    seen = set()
    q = deque((x, y) for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not bg(x, y):
            continue
        seen.add((x, y))
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    for x, y in seen:
        px[x, y] = (255, 255, 255, 0)
    # soften: light pixels touching the cleared area become partly transparent (anti-aliased ring edge)
    for x, y in list(seen):
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                r, g, b, a = px[nx, ny]
                light = min(r, g, b)
                if light > 150:
                    px[nx, ny] = (r, g, b, round(a * (255 - light) / 105))
    return src


def logo():
    src = Image.open(os.path.join(HERE, 'logo-source.png')).convert('RGBA')
    src = clear_outside_oval(src)
    src = src.crop(src.getbbox())
    big = src.resize((src.width * 4, src.height * 4), Image.LANCZOS)
    # sharpen colour only; keep the clean alpha so no halo appears around the badge
    rgb = big.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    out = rgb.convert('RGBA')
    out.putalpha(big.getchannel('A'))
    return out


if __name__ == '__main__':
    background().save(os.path.join(HERE, 'background.png'), optimize=True)
    logo().save(os.path.join(HERE, 'logo.png'), optimize=True)
    print('artwork written')
