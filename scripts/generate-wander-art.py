from pathlib import Path
import random
from PIL import Image, ImageDraw, ImageEnhance


WIDTH, HEIGHT = 320, 180
OUTPUT_WIDTH, OUTPUT_HEIGHT = 2048, 1152
OUT = Path(__file__).resolve().parents[1] / "public" / "wander" / "dusk"
NIGHT_OUT = Path(__file__).resolve().parents[1] / "public" / "wander" / "night"

PALETTE = {
    "deep": "#1d2038",
    "ink": "#24223c",
    "wall": "#34304b",
    "mid": "#51466b",
    "wood": "#805b4f",
    "wood_light": "#a26c54",
    "rose": "#a55666",
    "sunset": "#e17b58",
    "gold": "#ffb45f",
    "cream": "#ffe0a0",
    "green": "#627b68",
    "teal": "#668897",
    "paper": "#ead7b4",
}


def new_layer(color=(0, 0, 0, 0)):
    return Image.new("RGBA", (WIDTH, HEIGHT), color)


def save(layer, name):
    OUT.mkdir(parents=True, exist_ok=True)
    export = layer.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.NEAREST)
    add_high_res_detail(export, name)
    export.save(OUT / f"{name}.webp", "WEBP", lossless=True, method=6)


def save_night(layer, name):
    NIGHT_OUT.mkdir(parents=True, exist_ok=True)
    export = layer.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.NEAREST)
    add_high_res_detail(export, name, night=True)
    export.save(NIGHT_OUT / f"{name}.webp", "WEBP", lossless=True, method=6)


def save_variant(layer, scene, name):
    target = Path(__file__).resolve().parents[1] / "public" / "wander" / scene
    target.mkdir(parents=True, exist_ok=True)
    export = layer.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.NEAREST)
    add_high_res_detail(export, name, scene=scene)
    export.save(target / f"{name}.webp", "WEBP", lossless=True, method=6)


def load_base(path):
    return Image.open(path).convert("RGBA").resize((WIDTH, HEIGHT), Image.Resampling.NEAREST)


def add_high_res_detail(image, name, night=False, scene="dusk"):
    """Add deliberate 2K-scale pixel clusters instead of merely enlarging a low-res image."""
    draw = ImageDraw.Draw(image)
    scale = OUTPUT_WIDTH / WIDTH

    def p(value):
        return round(value * scale)

    def rect(box, fill):
        draw.rectangle(tuple(p(value) for value in box), fill=fill)

    def line(points, fill, width=1):
        draw.line(tuple(p(value) for pair in points for value in pair), fill=fill, width=max(1, p(width)))

    if name == "sky":
        # fine cloud bands, sun bloom pixels and distant birds
        for x, y, w in ((8, 27, 28), (42, 31, 18), (94, 58, 31), (184, 45, 25), (270, 66, 20)):
            rect((x, y, x + w, y + 1), "#b7626e" if not night else "#353554")
            rect((x + 4, y - 2, x + w - 7, y), "#d17870" if not night else "#403b62")
        for x, y in ((147, 22), (158, 24), (169, 21), (178, 25), (188, 23)):
            rect((x, y, x + 1, y + 1), "#ffdca0" if not night else "#a9d4e0")
        line(((121, 39), (125, 37), (129, 39)), "#55405a")
        line(((133, 45), (137, 43), (141, 45)), "#55405a")
    elif name == "outside":
        # individual windows, balconies, roof equipment and cable lines
        buildings = ((7, 75, 25, 113), (29, 84, 47, 113), (52, 68, 70, 113), (75, 82, 91, 113), (110, 76, 126, 113), (135, 84, 153, 113), (159, 71, 181, 113), (187, 80, 202, 113), (208, 64, 229, 113), (237, 79, 258, 113), (266, 70, 286, 113), (291, 86, 319, 113))
        for index, (left, top, right, bottom) in enumerate(buildings):
            for row in range(top + 7, bottom - 3, 10):
                for col in range(left + 4, right - 1, 7):
                    if (col + row + index) % 4 != 0:
                        rect((col, row, col + 2, row + 2), "#e69470" if not night else "#e6a35f")
                    if (col + row) % 7 == 0:
                        rect((col + 3, row, col + 4, row + 1), "#9a6c78" if not night else "#66739e")
            line(((left + 2, top + 4), (right - 2, top + 4)), "#51415a")
        line(((0, 96), (67, 104), (124, 103)), "#3a3048")
        line(((171, 85), (244, 94), (319, 104)), "#3a3048")
        for x, y in ((18, 101), (96, 105), (204, 98), (282, 104)):
            rect((x, y, x + 10, y + 1), "#875467")
        # façade depth: awnings, balconies, rooftop rails and a tiny street sign
        for x, y, width in ((9, 88, 14), (34, 96, 10), (55, 80, 11), (113, 91, 9), (162, 85, 13), (213, 78, 12), (241, 91, 14), (273, 82, 10)):
            rect((x, y, x + width, y + 1), "#744e61" if not night else "#47476e")
            line(((x + 1, y + 2), (x + 1, y + 6)), "#5a435c" if not night else "#3a3b60")
            line(((x + width - 1, y + 2), (x + width - 1, y + 6)), "#5a435c" if not night else "#3a3b60")
        rect((145, 106, 157, 108), "#a35b67" if not night else "#555278")
        rect((148, 103, 154, 106), "#e09b72" if not night else "#9c7690")
        line(((236, 62), (236, 77)), "#29283f" if not night else "#20233c")
        line(((233, 65), (241, 65)), "#29283f" if not night else "#20233c")
    elif name == "room":
        # window mullion highlights, wall seams and floor plank grain
        rect((87, 25, 235, 27), "#d18b67" if not night else "#5e557b")
        rect((88, 102, 234, 104), "#d6a06d" if not night else "#65587a")
        for x in (104, 128, 181, 207, 222):
            line(((x, 29), (x, 99)), "#695267" if not night else "#343550")
        for x, y, length in ((9, 120, 18), (49, 133, 11), (79, 151, 22), (121, 128, 14), (162, 145, 17), (214, 119, 26), (265, 140, 13), (292, 157, 20)):
            line(((x, y), (x + length, y + 1)), "#7c5a66" if not night else "#4b4767")
        for x, y in ((14, 20), (47, 37), (68, 82), (251, 45), (299, 31)):
            rect((x, y, x + 1, y + 1), "#756070" if not night else "#4f4c6d")
        # a wall clock, taped print and small cable hooks
        rect((75, 35, 89, 49), "#24223c" if not night else "#1c2038")
        rect((77, 37, 87, 47), "#d6b075" if not night else "#656486")
        rect((81, 39, 82, 43), "#47364c" if not night else "#292943")
        line(((82, 43), (85, 45)), "#47364c" if not night else "#292943")
        rect((70, 67, 83, 82), "#a55666" if not night else "#4f476b")
        rect((72, 69, 81, 79), "#d6b075" if not night else "#7880a0")
        rect((74, 71, 79, 73), "#668897" if not night else "#485a80")
        for x in (72, 79, 86):
            rect((x, 95, x + 1, 97), "#d6b075" if not night else "#5f5e83")
    elif name == "objects":
        # books: title bars, page edges, photo subjects, keyboard and radio hardware
        books = ((25, 52, 29, 66), (31, 49, 35, 66), (37, 54, 42, 66), (44, 50, 48, 66), (50, 53, 55, 66), (57, 51, 61, 66), (25, 72, 31, 85), (34, 70, 39, 85), (42, 74, 47, 85), (50, 70, 55, 85), (58, 73, 63, 85), (26, 91, 30, 104), (33, 89, 38, 104), (41, 93, 46, 104), (50, 90, 55, 104), (58, 92, 63, 104))
        for index, (left, top, right, bottom) in enumerate(books):
            rect((left + 1, top + 4, right - 1, top + 4.5), "#f4d7a0" if not night else "#76759a")
            if index % 3 == 0:
                rect((left + 1, top + 8, right - 1, top + 8.5), "#47364c" if not night else "#282743")
        for x, y, color in ((108, 48, "#d78369"), (137, 54, "#8ca5a0"), (166, 46, "#cfaa70"), (122, 76, "#9d6d83")):
            rect((x + 3, y + 3, x + 5, y + 5), color)
            rect((x + 7, y + 4, x + 9, y + 7), "#536477")
        for row, count in ((110, 8), (113, 7), (116, 6)):
            for index in range(count):
                rect((220 + index * 3, row, 221 + index * 3, row + 1), "#b08a8b" if not night else "#5d5b83")
        for x in (271, 275, 279, 283, 287):
            rect((x, 120, x + 1, 129), "#a48391" if not night else "#5f6088")
        rect((296, 119, 299, 122), "#ffbd68" if not night else "#ffbb60")
        line(((261, 108), (267, 112), (273, 112)), "#302942")
        # anime poster and desk organizers in the unused gaps
        rect((75, 49, 95, 78), "#292640" if not night else "#20233c")
        rect((78, 52, 92, 75), "#a55666" if not night else "#51557d")
        rect((80, 54, 90, 62), "#e17b58" if not night else "#7987a3")
        rect((82, 56, 88, 60), "#ffe0a0" if not night else "#bdc9cd")
        line(((79, 66), (91, 66)), "#f0c47c" if not night else "#7a7698", width=1)
        rect((198, 93, 211, 101), "#6d4d5d" if not night else "#3a3b5d")
        rect((200, 89, 204, 96), "#d6b075" if not night else "#82769a")
        rect((206, 91, 210, 97), "#7e9a81" if not night else "#566b80")
        rect((294, 103, 302, 108), "#a26c54" if not night else "#5a4d72")
        rect((296, 100, 300, 104), "#d6b075" if not night else "#877c99")
    elif name == "foreground":
        # leaf veins, desk grain, camera controls and scattered page marks
        for x, y, end_x, end_y in ((17, 136, 11, 128), (25, 138, 23, 123), (29, 139, 37, 130), (21, 143, 12, 143), (28, 142, 39, 120)):
            line(((x, y), (end_x, end_y)), "#91a078" if not night else "#526179")
        for x, y in ((45, 168), (71, 168), (132, 169), (180, 174), (219, 172), (267, 159), (302, 146)):
            rect((x, y, x + 2, y + 1), "#b77b61" if not night else "#665270")
        rect((114, 149, 118, 151), "#dca36b" if not night else "#776783")
        rect((122, 153, 124, 155), "#dca36b" if not night else "#776783")
        # chair slats, rug weave, loose cable and page corners
        rect((149, 143, 175, 146), "#4a4057" if not night else "#292b47")
        for x in (153, 160, 167, 173):
            line(((x, 146), (x, 161)), "#716073" if not night else "#454668", width=1)
        for x, y in ((34, 160), (58, 161), (82, 159), (102, 164), (132, 158)):
            line(((x, y), (x + 8, y)), "#b27b68" if not night else "#5b506e")
        line(((104, 160), (121, 166), (139, 164), (148, 169)), "#2a2942" if not night else "#1f223b", width=1)
        rect((42, 156, 45, 158), "#fff0c9" if not night else "#8b8399")
        rect((65, 158, 68, 160), "#fff0c9" if not night else "#8b8399")
    elif name == "light":
        # high-resolution broken window-light flecks
        for x, y, w, h in ((96, 116, 7, 2), (110, 130, 3, 4), (128, 146, 8, 2), (148, 133, 3, 5), (176, 158, 9, 2), (205, 125, 4, 4), (231, 153, 7, 2), (256, 166, 3, 4)):
            rect((x, y, x + w, y + h), (255, 224, 160, 125 if not night else 70))


def pixel_specks(draw, box, colors, count, seed):
    rng = random.Random(seed)
    left, top, right, bottom = box
    for _ in range(count):
        x = rng.randrange(left, max(left + 1, right))
        y = rng.randrange(top, max(top + 1, bottom))
        color = colors[rng.randrange(len(colors))]
        size = 1 if rng.random() < .86 else 2
        draw.rectangle((x, y, x + size, y + size), fill=color)


def draw_sky():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    bands = ["#34304b", "#51466b", "#8b5269", "#c96562", "#e17b58", "#f49b5d"]
    for y in range(HEIGHT):
        index = min(len(bands) - 1, y * len(bands) // HEIGHT)
        draw.line((0, y, WIDTH, y), fill=bands[index])
    draw.rectangle((0, 92, WIDTH, 112), fill="#d67967")
    draw.rectangle((0, 104, WIDTH, 116), fill="#e88b68")
    draw.rectangle((244, 34, 263, 53), fill=PALETTE["cream"])
    draw.rectangle((248, 30, 259, 57), fill=PALETTE["gold"])
    draw.rectangle((241, 39, 266, 49), fill=PALETTE["cream"])
    draw.rectangle((33, 38, 86, 42), fill="#6e4964")
    draw.rectangle((42, 34, 75, 46), fill="#6e4964")
    draw.rectangle((12, 65, 58, 68), fill="#9f5d6b")
    draw.rectangle((20, 61, 47, 71), fill="#9f5d6b")
    draw.rectangle((178, 70, 226, 73), fill="#a95c68")
    draw.rectangle((188, 66, 214, 76), fill="#a95c68")
    # pixel cloud wisps and distant birds add depth without noisy texture
    draw.rectangle((92, 51, 121, 53), fill="#a95c68")
    draw.rectangle((98, 48, 114, 55), fill="#a95c68")
    draw.rectangle((273, 76, 286, 78), fill="#8f5268")
    draw.rectangle((277, 74, 282, 80), fill="#8f5268")
    draw.line((154, 57, 158, 55), fill="#51405c", width=1)
    draw.line((158, 55, 162, 57), fill="#51405c", width=1)
    pixel_specks(draw, (0, 22, WIDTH, 112), ["#9f5d6b", "#c96562", "#e17b58"], 32, 11)
    return image


def draw_outside():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    draw.polygon([(0, 113), (0, 104), (18, 99), (31, 107), (48, 96), (68, 105), (83, 98), (99, 113)], fill="#51405c")
    draw.polygon([(131, 113), (145, 103), (159, 108), (176, 94), (197, 106), (216, 98), (236, 113)], fill="#68435a")
    draw.rectangle((0, 113, WIDTH, 126), fill="#493b55")
    buildings = [(7, 75, 25, 113), (29, 84, 47, 113), (52, 68, 70, 113), (75, 82, 91, 113), (110, 76, 126, 113), (135, 84, 153, 113), (159, 71, 181, 113), (187, 80, 202, 113), (208, 64, 229, 113), (237, 79, 258, 113), (266, 70, 286, 113), (291, 86, 319, 113)]
    for left, top, right, bottom in buildings:
        draw.rectangle((left, top, right, bottom), fill="#39334b")
        for x in range(left + 4, right - 2, 7):
            for y in range(top + 6, bottom - 4, 9):
                if (x + y) % 3:
                    draw.rectangle((x, y, x + 2, y + 2), fill="#d27a63")
    draw.rectangle((0, 115, WIDTH, 123), fill="#2d2c43")
    draw.line((0, 121, WIDTH, 121), fill="#8c5862", width=2)
    draw.line((14, 88, 124, 107), fill="#28263f", width=1)
    draw.line((172, 83, 310, 104), fill="#28263f", width=1)
    draw.rectangle((18, 111, 25, 127), fill="#24223c")
    draw.rectangle((14, 108, 29, 112), fill="#24223c")
    draw.rectangle((284, 107, 291, 127), fill="#24223c")
    draw.rectangle((280, 104, 295, 108), fill="#24223c")
    # balcony rails, rooftop antennae and a tiny warm street crossing
    draw.line((96, 104, 96, 122), fill="#24223c", width=1)
    draw.line((96, 108, 126, 108), fill="#8c5862", width=1)
    draw.rectangle((201, 92, 204, 113), fill="#24223c")
    draw.line((202, 92, 207, 85), fill="#24223c", width=1)
    draw.rectangle((117, 117, 123, 119), fill="#f0a15d")
    draw.rectangle((126, 117, 132, 119), fill="#d27a63")
    # rooftop water tanks, balconies and irregular window clusters
    for x, y in ((54, 70), (160, 75), (214, 69), (271, 76)):
        draw.rectangle((x, y, x + 5, y + 3), fill="#51466b")
        draw.rectangle((x + 1, y - 2, x + 4, y), fill="#51466b")
    for x, y in ((33, 91), (56, 76), (114, 90), (165, 82), (217, 78), (271, 83), (300, 95)):
        draw.line((x, y, x + 9, y), fill="#6a5265", width=1)
        draw.line((x, y + 4, x + 9, y + 4), fill="#6a5265", width=1)
    pixel_specks(draw, (0, 73, WIDTH, 119), ["#5c4a63", "#7a5263", "#d27a63"], 26, 19)
    return image


def draw_room():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, 113), fill=PALETTE["wall"])
    draw.rectangle((0, 111, WIDTH, 180), fill="#40374f")
    for y in range(119, HEIGHT, 13):
        draw.line((0, y, WIDTH, y), fill="#5c4b5c", width=1)
    for x in range(-20, WIDTH + 20, 39):
        draw.line((x, 112, x + 10, HEIGHT), fill="#5b4658", width=1)
    draw.rectangle((0, 108, WIDTH, 114), fill=PALETTE["deep"])
    draw.rectangle((76, 16, 246, 113), fill=PALETTE["wood"])
    draw.rectangle((82, 21, 240, 108), fill=PALETTE["deep"])
    image.paste((0, 0, 0, 0), (87, 25, 235, 104))
    draw.rectangle((87, 25, 235, 29), fill=PALETTE["wood_light"])
    draw.rectangle((87, 100, 235, 106), fill=PALETTE["wood_light"])
    draw.rectangle((87, 25, 91, 106), fill=PALETTE["wood_light"])
    draw.rectangle((231, 25, 235, 106), fill=PALETTE["wood_light"])
    draw.rectangle((157, 25, 162, 104), fill=PALETTE["wood"])
    draw.rectangle((91, 61, 231, 66), fill=PALETTE["wood"])
    draw.rectangle((87, 101, 235, 115), fill=PALETTE["wood_light"])
    draw.rectangle((92, 103, 230, 108), fill=PALETTE["cream"])
    draw.rectangle((0, 105, 76, 111), fill=PALETTE["wood"])
    draw.rectangle((246, 105, WIDTH, 111), fill=PALETTE["wood"])
    draw.rectangle((276, 25, 284, 80), fill="#2b2944")
    draw.rectangle((272, 25, 288, 29), fill=PALETTE["gold"])
    draw.rectangle((273, 72, 287, 77), fill=PALETTE["gold"])
    # wall grain and a tiny pinned note keep the room from reading as flat blocks
    for x, y in ((11, 18), (46, 31), (67, 78), (252, 44), (302, 28), (12, 91)):
        draw.rectangle((x, y, x + 2, y + 1), fill="#423952")
    draw.rectangle((67, 49, 73, 60), fill="#d6b075")
    draw.rectangle((68, 50, 72, 52), fill="#a55666")
    # wall panels and floor grain
    for x, y in ((5, 23), (39, 52), (58, 92), (252, 86), (300, 57)):
        draw.line((x, y, x + 7, y), fill="#4a4057", width=1)
    for x, y in ((7, 126), (48, 142), (92, 121), (173, 136), (221, 124), (280, 151)):
        draw.line((x, y, x + 12, y + 1), fill="#745465", width=1)
    pixel_specks(draw, (0, 0, WIDTH, 106), ["#403852", "#49405a", "#5b4a60"], 22, 23)
    return image


def draw_objects():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    # bookshelf
    draw.rectangle((14, 42, 72, 126), fill=PALETTE["deep"])
    draw.rectangle((19, 46, 68, 121), fill=PALETTE["wood"])
    draw.rectangle((23, 50, 64, 117), fill="#4b3c52")
    for y in (68, 87, 106):
        draw.rectangle((21, y, 66, y + 3), fill=PALETTE["wood_light"])
    books = [(25, 52, 29, 66, "#c56b62"), (31, 49, 35, 66, "#f0a15d"), (37, 54, 42, 66, "#698e91"), (44, 50, 48, 66, "#a96a86"), (50, 53, 55, 66, "#d9c177"), (57, 51, 61, 66, "#64816f"), (25, 72, 31, 85, "#7994a0"), (34, 70, 39, 85, "#d07a63"), (42, 74, 47, 85, "#e2ac60"), (50, 70, 55, 85, "#8e6880"), (58, 73, 63, 85, "#6f957c"), (26, 91, 30, 104, "#e4a65c"), (33, 89, 38, 104, "#b95d6c"), (41, 93, 46, 104, "#7599a1"), (50, 90, 55, 104, "#d7c170"), (58, 92, 63, 104, "#9e6680")]
    for left, top, right, bottom, color in books:
        draw.rectangle((left, top, right, bottom), fill=color)
        draw.line((left + 1, top + 2, right - 1, top + 2), fill="#f6c67a")
        if right - left >= 4:
            draw.line((left + 1, top + 5, right - 1, top + 5), fill="#3b3149", width=1)
    draw.rectangle((22, 111, 64, 119), fill=PALETTE["wood_light"])
    draw.rectangle((26, 43, 62, 46), fill="#a26c54")
    draw.rectangle((29, 44, 39, 45), fill="#d6b075")
    # photo wall
    draw.line((102, 43, 190, 43), fill="#d6b075", width=1)
    for x, y, color in ((108, 48, "#d78369"), (137, 54, "#8ca5a0"), (166, 46, "#cfaa70"), (122, 76, "#9d6d83")):
        draw.line((x + 5, 43, x + 5, y), fill="#d6b075", width=1)
        draw.rectangle((x, y, x + 12, y + 10), fill="#efdfbf")
        draw.rectangle((x + 2, y + 2, x + 10, y + 8), fill=color)
        draw.rectangle((x + 3, y + 6, x + 7, y + 8), fill="#536477")
        draw.line((x + 3, y + 3, x + 9, y + 3), fill="#fff0c9", width=1)
    # desk and monitor
    # A dark separator line reads as the boundary between the window sill above
    # and the desk surface below, so the two planes never blend into one shape.
    draw.rectangle((196, 98, 307, 101), fill="#161428")
    draw.rectangle((198, 101, 305, 108), fill=PALETTE["wood_light"])
    draw.rectangle((198, 106, 305, 108), fill="#6f4a3f")
    draw.rectangle((224, 73, 270, 101), fill=PALETTE["deep"])
    draw.rectangle((228, 77, 266, 96), fill="#416b7b")
    draw.rectangle((233, 81, 257, 84), fill="#7fb6a0")
    draw.rectangle((232, 88, 263, 91), fill="#6d99a4")
    draw.rectangle((242, 101, 252, 106), fill=PALETTE["deep"])
    draw.rectangle((232, 106, 262, 109), fill=PALETTE["deep"])
    draw.rectangle((217, 104, 242, 108), fill=PALETTE["paper"])
    draw.rectangle((220, 101, 239, 104), fill="#c58a7a")
    draw.rectangle((252, 102, 259, 107), fill="#bd725e")
    # lamp
    draw.rectangle((275, 62, 278, 100), fill=PALETTE["wood_light"])
    draw.rectangle((265, 59, 287, 65), fill=PALETTE["gold"])
    draw.rectangle((269, 65, 283, 68), fill=PALETTE["cream"])
    draw.rectangle((270, 99, 283, 103), fill=PALETTE["wood"])
    # radio
    draw.rectangle((264, 114, 302, 137), fill="#743f52")
    draw.rectangle((268, 118, 290, 131), fill=PALETTE["deep"])
    for x in range(271, 289, 4):
        draw.rectangle((x, 120, x + 1, 129), fill="#806b7c")
    draw.rectangle((294, 119, 298, 123), fill=PALETTE["gold"])
    draw.rectangle((294, 128, 299, 132), fill="#c77b5e")
    draw.rectangle((274, 109, 276, 115), fill=PALETTE["wood_light"])
    draw.rectangle((273, 106, 277, 110), fill=PALETTE["gold"])
    # cable, cup and a small note on the desk
    draw.line((261, 108, 267, 112), fill="#28263f", width=1)
    draw.rectangle((246, 96, 253, 101), fill="#c77b5e")
    draw.rectangle((247, 94, 252, 96), fill="#ead7b4")
    draw.rectangle((201, 96, 211, 100), fill="#ead7b4")
    draw.line((203, 98, 209, 98), fill="#a55666", width=1)
    # keyboard keys, monitor pixels and a cup handle
    for row, count in ((110, 8), (113, 7), (116, 6)):
        for index in range(count):
            draw.rectangle((220 + index * 3, row, 221 + index * 3, row + 1), fill="#92727a")
    draw.rectangle((252, 84, 258, 85), fill="#b8d0bd")
    draw.rectangle((260, 90, 264, 91), fill="#9bc0ae")
    draw.line((253, 96, 256, 98), fill="#c77b5e", width=1)
    draw.line((253, 97, 257, 97), fill="#c77b5e", width=1)
    # Desk legs: drawn last so radio/lamp/monitor never clip them. Left leg
    # sits clear of all clutter; right leg is pushed past the radio's right
    # edge (302) into open floor space. Highlight/shadow edges read as a
    # solid post rather than a flat silhouette blending into the void below.
    draw.rectangle((207, 108, 213, 151), fill=PALETTE["wood"])
    draw.rectangle((207, 108, 208, 151), fill="#c08a6e")
    draw.rectangle((211, 108, 213, 151), fill="#4a3630")
    draw.rectangle((305, 108, 311, 151), fill=PALETTE["wood"])
    draw.rectangle((305, 108, 306, 151), fill="#c08a6e")
    draw.rectangle((309, 108, 311, 151), fill="#4a3630")
    # Narrow contact-shadow slivers right at floor level only, so the leg's
    # highlight/shadow gradient stays visible above the shadow.
    draw.ellipse((204, 150, 216, 153), fill=(10, 8, 20, 130))
    draw.ellipse((302, 150, 314, 153), fill=(10, 8, 20, 130))
    pixel_specks(draw, (24, 49, 64, 116), ["#c77b5e", "#d6b075", "#6f957c"], 18, 31)
    return image


def draw_light():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    draw.polygon([(91, 101), (158, 101), (213, 180), (42, 180)], fill=(255, 180, 95, 30))
    draw.polygon([(162, 101), (231, 101), (301, 180), (212, 180)], fill=(255, 190, 103, 18))
    draw.rectangle((244, 130, 298, 173), fill=(255, 180, 95, 16))
    draw.rectangle((279, 118, 289, 126), fill=(255, 224, 160, 42))
    for x, y in ((89, 126), (108, 144), (139, 132), (176, 157), (205, 126), (244, 148), (260, 168)):
        draw.rectangle((x, y, x + 2, y + 2), fill=(255, 224, 160, 120))
    for x, y in ((116, 128), (128, 153), (153, 143), (184, 132), (232, 159), (273, 139)):
        draw.rectangle((x, y, x + 1, y + 1), fill=(255, 224, 160, 86))
    return image


def draw_foreground():
    image = new_layer()
    draw = ImageDraw.Draw(image)
    # foreground desk edge and books
    draw.rectangle((0, 163, WIDTH, 180), fill=PALETTE["deep"])
    draw.rectangle((0, 163, WIDTH, 168), fill="#805b4f")
    draw.rectangle((38, 156, 76, 164), fill="#6b4758")
    draw.polygon([(42, 156), (71, 156), (67, 160), (45, 160)], fill=PALETTE["paper"])
    draw.rectangle((80, 151, 104, 164), fill="#a55666")
    draw.rectangle((83, 148, 105, 151), fill="#e6c486")
    # plant silhouette
    draw.rectangle((18, 143, 36, 164), fill="#6f4e54")
    draw.rectangle((20, 141, 34, 146), fill="#a26c54")
    for box in ((9, 126, 24, 143), (17, 119, 31, 141), (27, 128, 42, 146), (4, 136, 18, 148), (32, 116, 47, 140)):
        draw.ellipse(box, fill=PALETTE["green"])
    draw.line((25, 143, 25, 119), fill="#7e8069", width=2)
    for x, y in ((15, 128), (22, 123), (31, 132), (11, 141), (36, 120)):
        draw.line((25, 143, x + 6, y + 8), fill="#7e8069", width=1)
    # chair edge
    draw.rectangle((147, 143, 177, 165), fill="#2d2943")
    draw.rectangle((153, 138, 171, 145), fill="#5f5064")
    # tiny camera
    draw.rectangle((111, 151, 126, 158), fill="#25243e")
    draw.rectangle((115, 148, 121, 152), fill="#b67a60")
    draw.rectangle((121, 153, 125, 156), fill="#d7a86d")
    # foreground light specks
    for x, y in ((190, 155), (219, 172), (267, 159), (302, 146)):
        draw.rectangle((x, y, x + 1, y + 1), fill=PALETTE["gold"])
    draw.rectangle((132, 169, 139, 171), fill="#6f5364")
    draw.rectangle((136, 166, 143, 169), fill="#a26c54")
    draw.line((45, 168, 72, 168), fill="#a26c54", width=1)
    draw.line((180, 174, 201, 174), fill="#40374f", width=1)
    pixel_specks(draw, (0, 168, WIDTH, 180), ["#2d2943", "#51466b", "#805b4f"], 18, 47)
    return image


def make_night_layers():
    """Derive a genuinely separate night palette, then add local light sources."""
    NIGHT_OUT.mkdir(parents=True, exist_ok=True)
    for source in sorted(OUT.glob("*.webp")):
        image = load_base(source)
        pixels = image.load()
        for y in range(HEIGHT):
            for x in range(WIDTH):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                # blue-violet night grade while retaining warm objects
                pixels[x, y] = (int(r * .34 + b * .16), int(g * .38 + b * .12), int(b * .72 + r * .08), a)
        image = ImageEnhance.Contrast(image).enhance(1.08)
        save_night(image, source.stem)
    sky = load_base(NIGHT_OUT / "sky.webp")
    draw = ImageDraw.Draw(sky)
    draw.rectangle((244, 34, 263, 53), fill="#d8e8ed")
    draw.rectangle((248, 30, 259, 57), fill="#b8d9e3")
    draw.rectangle((241, 39, 266, 49), fill="#d8e8ed")
    for x, y in ((38, 35), (71, 52), (106, 27), (151, 41), (212, 30), (286, 48)):
        draw.rectangle((x, y, x + 1, y + 1), fill="#d8e8ed")
    save_night(sky, "sky")
    outside = load_base(NIGHT_OUT / "outside.webp")
    draw = ImageDraw.Draw(outside)
    for x, y in ((13, 88), (37, 96), (59, 79), (116, 87), (166, 80), (216, 73), (246, 90), (276, 81), (301, 96)):
        draw.rectangle((x, y, x + 3, y + 2), fill="#ffc36f")
    draw.rectangle((201, 117, 210, 119), fill="#f07c64")
    draw.rectangle((214, 117, 223, 119), fill="#f6b85e")
    save_night(outside, "outside")
    light = load_base(NIGHT_OUT / "light.webp")
    draw = ImageDraw.Draw(light)
    draw.rectangle((265, 59, 287, 74), fill=(255, 184, 95, 38))
    draw.rectangle((294, 119, 299, 124), fill=(255, 190, 95, 180))
    draw.rectangle((228, 77, 266, 96), fill=(92, 185, 190, 35))
    save_night(light, "light")


def make_day_variants():
    """Make real dawn/day assets so time states are not only CSS filters."""
    for scene in ("dawn", "day"):
        for source in sorted(OUT.glob("*.webp")):
            image = load_base(source)
            if scene == "dawn":
                image = ImageEnhance.Color(image).enhance(.82)
                image = ImageEnhance.Brightness(image).enhance(.92)
                overlay = Image.new("RGBA", image.size, (94, 128, 158, 24))
            else:
                image = ImageEnhance.Color(image).enhance(.9)
                image = ImageEnhance.Brightness(image).enhance(1.12)
                overlay = Image.new("RGBA", image.size, (255, 232, 178, 16))
            image = Image.alpha_composite(image, overlay)
            save_variant(image, scene, source.stem)
        sky_path = Path(__file__).resolve().parents[1] / "public" / "wander" / scene / "sky.webp"
        sky = load_base(sky_path)
        draw = ImageDraw.Draw(sky)
        if scene == "dawn":
            draw.rectangle((245, 36, 261, 52), fill="#ffd19b")
            draw.rectangle((248, 32, 258, 55), fill="#f0b98e")
            draw.rectangle((20, 70, 75, 72), fill="#9d93af")
        else:
            draw.rectangle((239, 29, 264, 54), fill="#fff0b5")
            draw.rectangle((244, 25, 260, 58), fill="#ffe3a2")
            draw.rectangle((31, 38, 88, 42), fill="#d4d0c0")
        save_variant(sky, scene, "sky")


def main():
    save(draw_sky(), "sky")
    save(draw_outside(), "outside")
    save(draw_room(), "room")
    save(draw_objects(), "objects")
    save(draw_light(), "light")
    save(draw_foreground(), "foreground")
    make_night_layers()
    make_day_variants()
    print(f"Generated {len(list(OUT.glob('*.webp')))} layers in {OUT}")


if __name__ == "__main__":
    main()
