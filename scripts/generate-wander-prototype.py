from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SIZE = (1920, 1080)
SOURCE_SIZE = (2048, 1152)
OUT = ROOT / "public" / "wander" / "prototype-dusk-1920.webp"


def rect(draw, box, fill, outline=None, width=1):
    draw.rectangle(box, fill=fill, outline=outline, width=width)


def line(draw, points, fill, width=1):
    draw.line(points, fill=fill, width=width)


def main():
    scene = Image.new("RGBA", SIZE)
    source_root = ROOT / "public" / "wander" / "dusk"
    for name in ("sky", "outside", "room", "objects", "light"):
        layer = Image.open(source_root / f"{name}.webp").convert("RGBA").resize(SIZE, Image.Resampling.NEAREST)
        scene.alpha_composite(layer)

    draw = ImageDraw.Draw(scene)
    # 1920-native architectural details: window frame, facade rhythm and cables.
    sx, sy = 1920 / 320, 1080 / 180
    def p(x, y):
        return round(x * sx), round(y * sy)
    def r(x, y, w, h, color, outline=None, width=1):
        rect(draw, (round(x*sx), round(y*sy), round((x+w)*sx), round((y+h)*sy)), color, outline, max(1, round(width*sx)))
    def l(points, color, width=1):
        line(draw, [p(x, y) for x, y in points], color, max(1, round(width*sx)))

    # Rebuild the visible floor plane on one perspective system and remove the old
    # scattered pixels that did not belong to either light source.
    draw.polygon([p(0, 111), p(320, 111), p(320, 180), p(0, 180)], fill="#3a344c")
    draw.polygon([p(74, 111), p(246, 111), p(320, 180), p(0, 180)], fill="#514653")
    for y, x1, x2 in ((121, 59, 261), (132, 44, 276), (145, 26, 294), (160, 4, 316), (174, 0, 320)):
        l([(x1, y), (x2, y)], "#6b5560", .65)
    for x in (35, 72, 111, 151, 190, 229, 269, 306):
        l([(160, 111), (x, 180)], "#493d4d", .55)
    # Contact shadows anchor the shelf, desk and chair to the floor.
    r(5, 150, 72, 6, (24, 23, 39, 105))
    r(194, 148, 112, 7, (24, 23, 39, 125))
    r(145, 159, 38, 5, (24, 23, 39, 120))
    # The broad glow is composited later on its own transparent layer; do not paint alpha directly on the opaque scene.
    for x, y, w, h in ((96, 118, 8, 2), (113, 130, 4, 4), (137, 143, 9, 2), (166, 153, 4, 4), (192, 139, 8, 2)):
        r(x, y, w, h, (255, 224, 160, 105))

    # Foreground is deliberately composited after the floor correction.
    foreground = Image.open(source_root / "foreground.webp").convert("RGBA").resize(SIZE, Image.Resampling.NEAREST)
    scene.alpha_composite(foreground)
    draw = ImageDraw.Draw(scene)

    # Window highlights and curtain folds.
    r(88, 25, 3, 80, "#d69570")
    r(231, 25, 3, 80, "#d69570")
    r(157, 25, 5, 80, "#b87861")
    r(87, 100, 148, 5, "#d29b6d")
    for x in (97, 112, 129, 177, 194, 216):
        l([(x, 30), (x + 1, 98)], "#b86d69", .35)
    # City facade grid and warm apartment windows.
    # The existing outside layer already carries the city pixels. Keep this prototype pass focused on the window frame and interior separation.
    for x, y, w, h in ((112, 78, 12, 8), (138, 86, 14, 6), (164, 74, 16, 10), (190, 82, 10, 7), (210, 68, 15, 12)):
        r(x, y, w, h, "#5b4058")
        for row in range(y + 2, y + h - 1, 3):
            for col in range(x + 2, x + w - 1, 4):
                if (row + col) % 3:
                    r(col, row, 1.2, 1.2, "#e69a73")
    l([(91, 96), (123, 101), (158, 96), (194, 101), (231, 95)], "#8f5b63", .45)
    for x, y, w in ((25,52,4), (31,49,4), (37,54,5), (44,50,4), (50,53,5), (57,51,4), (25,72,6), (34,70,5), (42,74,5), (50,70,5), (58,73,5), (26,91,4), (33,89,5), (41,93,5), (50,90,5), (58,92,5)):
        r(x + .7, y + 4.2, max(1.2, w - 1.2), .55, "#f7d79e")
        r(x + .8, y + 7.1, max(1, w - 1.5), .4, "#4d344a")
    r(75, 49, 20, 29, "#24213b", "#d6a16d", .45)
    r(78, 52, 14, 22, "#a55666")
    r(81, 55, 8, 7, "#e17b58")
    r(83, 57, 4, 3, "#ffe0a0")
    l([(79, 66), (91, 66)], "#f4c981", .5)
    # Photo subjects, clips and paper edges.
    for x, y, c in ((108,48,"#d78369"), (137,54,"#8ca5a0"), (166,46,"#cfaa70"), (122,76,"#9d6d83")):
        r(x + 2, y + 2, 8, 6, "#efdfbf")
        r(x + 3, y + 3, 3, 3, c)
        r(x + 7, y + 4, 2, 3, "#536477")
        r(x + 5, y - 2, 1, 2, "#d6b075")
    # Desk surface: keyboard, cup, notes, cable and camera controls.
    for row, count in ((110, 8), (113, 7), (116, 6)):
        for index in range(count):
            r(220 + index * 3, row, 1.5, 1.1, "#b08a8b")
    r(198, 93, 13, 8, "#6d4d5d", "#d6b075", .35)
    r(200, 89, 4, 7, "#d6b075")
    r(206, 91, 4, 6, "#7e9a81")
    r(246, 94, 7, 7, "#c77b5e")
    r(247, 92, 5, 2, "#ead7b4")
    l([(261,108), (267,112), (273,112)], "#302942", .7)
    r(114,149,5,3,"#dca36b")
    r(122,153,3,3,"#dca36b")
    # Foreground chair slats and layered rug weave.
    r(149,143,26,4,"#4a4057")
    for x in (153,160,167,173):
        l([(x,146),(x,161)], "#716073", .65)
    for x, y in ((34,160),(58,161),(82,159),(102,164),(132,158),(180,174),(219,172)):
        l([(x,y),(x+9,y)], "#b27b68", .65)
    l([(104,160),(121,166),(139,164),(148,169)], "#28283f", .65)
    # Native 1920 dust/light flecks, sparse and intentional.
    for x, y, w, h in ((96,116,7,2),(110,130,3,4),(128,146,8,2),(148,133,3,5),(176,158,9,2),(205,125,4,4),(231,153,7,2),(256,166,3,4)):
        r(x,y,w,h,(255,224,160,115))
    # Room-scale light and contact shadows: use broad translucent shapes, not a global filter.
    glow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.polygon([(p(91, 101)), (p(157, 101)), (p(201, 151)), (p(69, 151))], fill=(255, 181, 101, 18))
    glow_draw.polygon([(p(162, 101)), (p(231, 101)), (p(303, 180)), (p(214, 180))], fill=(255, 191, 110, 24))
    glow_draw.rectangle((p(15, 154)[0], p(15, 154)[1], p(73, 166)[0], p(73, 166)[1]), fill=(17, 20, 38, 75))
    glow_draw.rectangle((p(197, 153)[0], p(197, 153)[1], p(305, 166)[0], p(305, 166)[1]), fill=(17, 20, 38, 82))
    scene = Image.alpha_composite(scene, glow)
    draw = ImageDraw.Draw(scene)
    # Narrow pixel bands break the broad light into window-frame fragments.
    for x, y, w, h in ((103, 119, 8, 2), (121, 134, 4, 5), (145, 147, 9, 2), (179, 128, 4, 4), (207, 151, 8, 2), (235, 164, 4, 4)):
        r(x, y, w, h, (255, 224, 160, 110))
    scene.convert("RGB").save(OUT, "WEBP", lossless=True, method=6)
    print(f"generated {OUT} {scene.size}")


if __name__ == "__main__":
    main()
