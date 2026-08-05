from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SIZE = (1920, 1080)
OUT = ROOT / "public" / "wander" / "prototype-dusk-1920.webp"


def tone_grade(scene: Image.Image) -> Image.Image:
    """Dusk tone grading: brighten+warm the window side, darken+cool the interior,
    cast window light on the floor, deepen the floor plane."""
    arr = np.asarray(scene.convert("RGB")).astype(np.float32)
    h, w = arr.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]

    # 1) Window/outside plane: brighter and warmer, strongest near the sun.
    sky = ys < 345
    sun = np.exp(-(((xs - 960) / 420.0) ** 2 + ((ys - 130) / 300.0) ** 2))
    arr[sky, 0] *= 1.18 + 0.30 * sun[sky]
    arr[sky, 1] *= 1.06 + 0.14 * sun[sky]
    arr[sky, 2] *= 0.92 + 0.05 * sun[sky]

    # 2) Interior walls: darker and cooler.
    interior = (ys > 430) & (ys < 820)
    arr[interior, 0] *= 0.80
    arr[interior, 1] *= 0.85
    arr[interior, 2] *= 0.94

    # 3) Floor plane: darkest, receding into shadow.
    floor = ys >= 820
    arr[floor, 0] *= 0.72
    arr[floor, 1] *= 0.78
    arr[floor, 2] *= 0.88

    # 4) Warm window light falling onto the floor (radiates from the window base).
    floor_glow = np.exp(-((xs - 960) / 460.0) ** 2) * np.exp(-((ys - 1060) / 320.0) ** 2)
    floor_glow *= ys > 380
    arr[:, :, 0] += 34 * floor_glow
    arr[:, :, 1] += 20 * floor_glow
    arr[:, :, 2] += 8 * floor_glow

    # 5) Subtle vignette: corners darker for focus.
    vx = (xs - w / 2) / (w / 2)
    vy = (ys - h / 2) / (h / 2)
    vig = 1.0 - 0.16 * np.clip(vx * vx + vy * vy, 0, 1.4)
    arr *= vig[:, :, None]

    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def main():
    scene = Image.new("RGBA", SIZE)
    source_root = ROOT / "public" / "wander" / "dusk"
    for name in ("sky", "outside", "room", "objects", "light"):
        layer = (
            Image.open(source_root / f"{name}.webp")
            .convert("RGBA")
            .resize(SIZE, Image.Resampling.NEAREST)
        )
        scene.alpha_composite(layer)

    draw = ImageDraw.Draw(scene)
    sx, sy = 1920 / 320, 1080 / 180

    def p(x, y):
        return round(x * sx), round(y * sy)

    def r(x, y, w, h, color, outline=None, width=1):
        draw.rectangle(
            (round(x * sx), round(y * sy), round((x + w) * sx), round((y + h) * sy)),
            fill=color,
            outline=outline,
            width=max(1, round(width * sx)),
        )

    def l(points, color, width=1):
        draw.line([p(x, y) for x, y in points], fill=color, width=max(1, round(width * sx)))

    # Floor plane: one perspective system, vanishing point near window center (160,111).
    # NOTE: this opaque redraw covers the full floor rectangle (y=111-180), which
    # would erase the lower half of any furniture leg drawn in the "objects"
    # layer (desk legs, shelf base, chair legs all reach down to the floor).
    draw.polygon([p(0, 111), p(320, 111), p(320, 180), p(0, 180)], fill="#332e44")
    draw.polygon([p(74, 111), p(246, 111), p(320, 180), p(0, 180)], fill="#4a4150")
    for y, x1, x2 in ((121, 59, 261), (132, 44, 276), (145, 26, 294), (160, 4, 316), (174, 0, 320)):
        l([(x1, y), (x2, y)], "#645064", 0.65)
    for x in (35, 72, 111, 151, 190, 229, 269, 306):
        l([(160, 111), (x, 180)], "#45394a", 0.55)

    # Contact shadows anchor shelf, desk and chair.
    # The bookshelf's real base (sampled from objects.webp) sits at y~126, not
    # y~150 - the old shadow position floated 24px below the shelf, landing in
    # empty floor space and reading as "missing"/disconnected grounding.
    r(14, 124, 60, 5, (18, 16, 30, 150))
    r(194, 148, 112, 7, (24, 23, 39, 130))
    r(145, 159, 38, 5, (24, 23, 39, 125))

    # Window highlights and curtain folds.
    r(88, 25, 3, 80, "#e8a87e")
    r(231, 25, 3, 80, "#e8a87e")
    r(157, 25, 5, 80, "#c9856b")
    r(87, 100, 148, 5, "#e0a872")
    for x in (97, 112, 129, 177, 194, 216):
        l([(x, 30), (x + 1, 98)], "#c47770", 0.35)

    # City facade grid with warm apartment windows.
    for x, y, w, h in ((112, 78, 12, 8), (138, 86, 14, 6), (164, 74, 16, 10), (190, 82, 10, 7), (210, 68, 15, 12)):
        r(x, y, w, h, "#5b4058")
        for row in range(y + 2, y + h - 1, 3):
            for col in range(x + 2, x + w - 1, 4):
                if (row + col) % 3:
                    r(col, row, 1.2, 1.2, "#f0a878")
    l([(91, 96), (123, 101), (158, 96), (194, 101), (231, 95)], "#9a6470", 0.45)

    # Left wall: window, sun panel and photos (kept as before).
    for x, y, w in ((25, 52, 4), (31, 49, 4), (37, 54, 5), (44, 50, 4), (50, 53, 5), (57, 51, 4), (25, 72, 6), (34, 70, 5), (42, 74, 5), (50, 70, 5), (58, 73, 5), (26, 91, 4), (33, 89, 5), (41, 93, 5), (50, 90, 5), (58, 92, 5)):
        r(x + 0.7, y + 4.2, max(1.2, w - 1.2), 0.55, "#f7d79e")
        r(x + 0.8, y + 7.1, max(1, w - 1.5), 0.4, "#4d344a")
    r(75, 49, 20, 29, "#24213b", "#d6a16d", 0.45)
    r(78, 52, 14, 22, "#a55666")
    r(81, 55, 8, 7, "#e17b58")
    r(83, 57, 4, 3, "#ffe0a0")
    l([(79, 66), (91, 66)], "#f4c981", 0.5)
    for x, y, c in ((108, 48, "#d78369"), (137, 54, "#8ca5a0"), (166, 46, "#cfaa70"), (122, 76, "#9d6d83")):
        r(x + 2, y + 2, 8, 6, "#efdfbf")
        r(x + 3, y + 3, 3, 3, c)
        r(x + 7, y + 4, 2, 3, "#536477")
        r(x + 5, y - 2, 1, 2, "#d6b075")

    # Re-composite the "objects" layer (bookshelf, hanging photo wall, desk,
    # legs, radio, lamp) LAST among the room-scale overlays. The curtain fold
    # lines and city-facade window grid above are drawn at the same y-range as
    # the hanging photos (y=43-86); drawing objects first meant those strokes
    # sliced straight across the photo frames, shredding them into confetti.
    # Compositing objects after those overlays keeps every framed photo intact
    # and legible, sitting cleanly in front of the window/curtain backdrop.
    objects_layer = (
        Image.open(source_root / "objects.webp")
        .convert("RGBA")
        .resize(SIZE, Image.Resampling.NEAREST)
    )
    scene.alpha_composite(objects_layer)
    draw = ImageDraw.Draw(scene)

    # Desk surface: keyboard, cup, notes, cable.
    for row, count in ((110, 8), (113, 7), (116, 6)):
        for index in range(count):
            r(220 + index * 3, row, 1.5, 1.1, "#b08a8b")
    r(198, 93, 13, 8, "#6d4d5d", "#d6b075", 0.35)
    r(200, 89, 4, 7, "#d6b075")
    r(206, 91, 4, 6, "#7e9a81")
    r(246, 94, 7, 7, "#c77b5e")
    r(247, 92, 5, 2, "#ead7b4")
    l([(261, 108), (267, 112), (273, 112)], "#302942", 0.7)
    r(114, 149, 5, 3, "#dca36b")
    r(122, 153, 3, 3, "#dca36b")

    # Foreground chair slats and rug weave.
    r(149, 143, 26, 4, "#4a4057")
    for x in (153, 160, 167, 173):
        l([(x, 146), (x, 161)], "#716073", 0.65)
    for x, y in ((34, 160), (58, 161), (82, 159), (102, 164), (132, 158), (180, 174), (219, 172)):
        l([(x, y), (x + 9, y)], "#b27b68", 0.65)
    l([(104, 160), (121, 166), (139, 164), (148, 169)], "#28283f", 0.65)

    # Right-side foreground: low cabinet with a small plant to rebalance composition.
    r(311, 152, 9, 24, "#4a3145", "#8f5b63", 0.4)
    r(313, 155, 6, 2, "#6d4d5d")
    r(313, 143, 4, 9, "#5d6b4f")
    r(317, 141, 3, 11, "#77845c")
    for fx in (312, 316):
        l([(fx, 140), (fx - 1, 132)], "#55643f", 0.5)
    for fx in (315, 318):
        l([(fx, 139), (fx + 1, 131)], "#66754a", 0.5)
    # Dedicated contact shadow for the cabinet, aligned to the same floor
    # perspective as the desk/chair shadows above (previously missing, which
    # made the cabinet look pasted on top of the floor instead of resting on it).
    r(309, 174, 13, 4, (24, 23, 39, 130))

    # Foreground composited last.
    foreground = (
        Image.open(source_root / "foreground.webp")
        .convert("RGBA")
        .resize(SIZE, Image.Resampling.NEAREST)
    )
    scene.alpha_composite(foreground)
    draw = ImageDraw.Draw(scene)

    # Room-scale light shafts: coherent wedges from the window, not scattered dots.
    glow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.polygon(
        [(p(91, 101)), (p(157, 101)), (p(201, 151)), (p(69, 151))], fill=(255, 181, 101, 22)
    )
    glow_draw.polygon(
        [(p(162, 101)), (p(231, 101)), (p(303, 180)), (p(214, 180))], fill=(255, 191, 110, 30)
    )
    glow_draw.rectangle(
        (p(15, 154)[0], p(15, 154)[1], p(73, 166)[0], p(73, 166)[1]), fill=(17, 20, 38, 78)
    )
    glow_draw.rectangle(
        (p(197, 153)[0], p(197, 153)[1], p(305, 166)[0], p(305, 166)[1]), fill=(17, 20, 38, 88)
    )
    scene = Image.alpha_composite(scene, glow)

    # Sparse coherent window-light fragments (grouped, not pixel noise).
    draw = ImageDraw.Draw(scene)
    for x, y, w, h in ((103, 119, 12, 3), (125, 134, 8, 5), (148, 146, 13, 3), (181, 127, 8, 5), (210, 150, 11, 3)):
        r(x, y, w, h, (255, 224, 160, 110))

    scene = tone_grade(scene.convert("RGBA"))
    scene.convert("RGB").save(OUT, "WEBP", lossless=True, method=6)
    print(f"generated {OUT} {scene.size}")


if __name__ == "__main__":
    main()
