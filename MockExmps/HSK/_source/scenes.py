"""Original SVG scene library for the offline HSK 1 mock pack.

Every drawing is authored for this pack.  The drawings contain no Chinese
words, so a candidate cannot read an answer from the artwork.  Scenes are
composed from simple flat-vector primitives and are rendered deterministically.

The public entry point is ``render(scene, variant)``; it returns a complete
480x360 SVG document.  ``variant`` (0-3) changes clothing and object colours so
the three forms do not reuse visually identical files.
"""

from __future__ import annotations

W, H = 480, 360

INK = "#26323F"
MUTED = "#6F7C89"
SKIN = "#F0C9A8"
SKIN_DARK = "#D9A77F"
HAIR = "#2E2A28"
WHITE = "#FFFFFF"
PAPER = "#FBF8F0"
LINE = "#D8D1C1"

PALETTES = [
    {
        "shirt": "#3E8E7E", "shirt2": "#D9695F", "shirt3": "#4F7CAC",
        "pants": "#3D4A57", "accent": "#E3B23C", "soft": "#DDEBE4",
        "wall": "#F4EEE2", "floor": "#E8DFCC", "sky": "#E8F1F3",
        "ground": "#DCE7D1", "taxi": "#E8B93F", "car2": "#5D8FA8",
    },
    {
        "shirt": "#C9655C", "shirt2": "#4F7CAC", "shirt3": "#6A9A5B",
        "pants": "#414C58", "accent": "#E0A83E", "soft": "#F1E4D8",
        "wall": "#F5EFE5", "floor": "#E7DDC9", "sky": "#E9F0F5",
        "ground": "#DDE6D2", "taxi": "#D96B5F", "car2": "#6B8E6B",
    },
    {
        "shirt": "#6B7FB5", "shirt2": "#D98B4F", "shirt3": "#4C8B7A",
        "pants": "#3B4652", "accent": "#D9A441", "soft": "#E4E8F2",
        "wall": "#F2EEE6", "floor": "#E5DCCB", "sky": "#EDF1F4",
        "ground": "#D9E4D3", "taxi": "#5E97A8", "car2": "#C96B5B",
    },
    {
        "shirt": "#8B6BB1", "shirt2": "#3E8E7E", "shirt3": "#D9695F",
        "pants": "#3D4A57", "accent": "#E3B23C", "soft": "#EEE6F2",
        "wall": "#F5F0E6", "floor": "#E8DFCC", "sky": "#EAF2F4",
        "ground": "#DDE7D0", "taxi": "#E8B93F", "car2": "#4F7CAC",
    },
]

HAIR_STYLES = ("short", "long", "bun", "curly")


def _p(v: int) -> dict:
    return PALETTES[v % len(PALETTES)]


def svg_start(v: int, room: bool = False) -> str:
    p = _p(v)
    bg = p["wall"] if room else p["sky"]
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">',
        f'<rect width="{W}" height="{H}" rx="18" fill="{bg}"/>',
    ]
    if room:
        out.append(f'<rect y="278" width="{W}" height="{H-278}" fill="{p["floor"]}"/>')
        out.append(f'<rect y="278" width="{W}" height="4" fill="#D8CDBA"/>')
    else:
        out.append(f'<rect y="286" width="{W}" height="{H-286}" fill="{p["ground"]}"/>')
        out.append(f'<path d="M0 288 Q120 278 240 288 T480 286 L480 292 L0 292 Z" fill="#C9D8BC" opacity=".55"/>')
    out.append(f'<rect x="1.5" y="1.5" width="{W-3}" height="{H-3}" rx="16.5" fill="none" stroke="{LINE}" stroke-width="2"/>')
    return "\n".join(out)


def svg_end() -> str:
    return "</svg>\n"


def shadow(cx: float, cy: float, rx: float = 80, ry: float = 11, opacity: float = 0.12) -> str:
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#1F2933" opacity="{opacity}"/>'


def _rounded(x, y, w, h, r, fill, stroke=None, sw=0, opacity=1.0):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1.0 else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{s}{o}/>'


def _circle(cx, cy, r, fill, stroke=None, sw=0, opacity=1.0):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1.0 else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}{o}/>'


def _ellipse(cx, cy, rx, ry, fill, stroke=None, sw=0, opacity=1.0):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1.0 else ""
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{s}{o}/>'


def _line(x1, y1, x2, y2, stroke=INK, sw=5, cap="round"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}"/>'


def _path(d, fill="none", stroke=None, sw=0, cap="round", join="round", opacity=1.0):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="{join}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1.0 else ""
    return f'<path d="{d}" fill="{fill}"{s}{o}/>'


def _poly(points, fill, stroke=None, sw=0, opacity=1.0):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1.0 else ""
    pts = " ".join(f"{x},{y}" for x, y in points)
    return f'<polygon points="{pts}" fill="{fill}"{s}{o}/>'


def _cloud(x, y, s=1.0, fill="#FFFFFF", opacity=0.9):
    return (
        f'<g transform="translate({x} {y}) scale({s})" opacity="{opacity}">'
        f'{_ellipse(0, 0, 42, 20, fill)}'
        f'{_circle(-26, -4, 18, fill)}'
        f'{_circle(2, -14, 24, fill)}'
        f'{_circle(30, -2, 17, fill)}'
        f'</g>'
    )


def _bulb(x, y, r=8, fill="#F6D36B"):
    return _circle(x, y, r, fill, INK, 2) + _line(x, y + r, x, y + r + 5, INK, 2)


def person(
    x: float,
    ground: float,
    scale: float = 1.0,
    p: dict | None = None,
    shirt: str | None = None,
    pants: str | None = None,
    skin: str = SKIN,
    hair: str = HAIR,
    pose: str = "stand",
    hair_style: str = "short",
    flip: bool = False,
    child: bool = False,
    opacity: float = 1.0,
) -> str:
    """Draw a simple flat person with feet at ``(x, ground)``.

    Poses: stand, read, phone, point, wave, carry, write, eat, umbrella, fan,
    shiver, hands.
    """
    p = p or _p(0)
    shirt = shirt or p["shirt"]
    pants = pants or p["pants"]
    s = scale * (0.78 if child else 1.0)
    sx = -s if flip else s
    out = [f'<g transform="translate({x} {ground}) scale({sx} {s})" opacity="{opacity}">']

    # legs and shoes
    out.append(_line(-8, -50, -10, -6, pants, 13))
    out.append(_line(8, -50, 10, -6, pants, 13))
    out.append(_ellipse(-13, -3, 11, 5, INK))
    out.append(_ellipse(13, -3, 11, 5, INK))

    # torso
    out.append(_path("M -17 -112 Q -20 -80 -16 -48 L 16 -48 Q 20 -80 17 -112 Z", shirt, INK, 3))
    # neck and head
    out.append(_rounded(-5, -126, 10, 15, 4, skin))
    out.append(_circle(0, -143, 18, skin, INK, 3))
    # ears
    out.append(_circle(-18, -142, 4, skin, INK, 2))
    out.append(_circle(18, -142, 4, skin, INK, 2))
    # face
    out.append(_circle(-6, -146, 2.0, INK))
    out.append(_circle(6, -146, 2.0, INK))
    out.append(_path("M -5 -137 Q 0 -132 5 -137", "none", INK, 2))

    # hair
    if hair_style == "long":
        out.append(_path("M -18 -146 Q -22 -170 0 -169 Q 22 -170 18 -146 L 20 -120 L 12 -122 L 13 -145 Q 0 -158 -13 -145 L -12 -122 L -20 -120 Z", hair, INK, 2))
    elif hair_style == "bun":
        out.append(_circle(0, -166, 9, hair, INK, 2))
        out.append(_path("M -18 -146 Q -18 -166 0 -166 Q 18 -166 18 -146 Q 8 -154 0 -153 Q -8 -154 -18 -146 Z", hair, INK, 2))
    elif hair_style == "curly":
        for cx, cy, r in [(-14, -155, 8), (-6, -163, 8), (5, -163, 8), (14, -155, 8), (0, -166, 9)]:
            out.append(_circle(cx, cy, r, hair, INK, 2))
    else:
        out.append(_path("M -18 -146 Q -18 -167 0 -167 Q 18 -167 18 -146 Q 10 -155 0 -154 Q -10 -155 -18 -146 Z", hair, INK, 2))

    # arms
    def arm(sx1, sy1, mx, my, ex, ey, width=10):
        out.append(_path(f"M {sx1} {sy1} Q {mx} {my} {ex} {ey}", "none", shirt, width))
        out.append(_circle(ex, ey, width / 2, shirt, INK, 2))

    if pose == "stand":
        arm(-16, -103, -26, -74, -23, -52)
        arm(16, -103, 26, -74, 23, -52)
    elif pose == "read":
        arm(-16, -103, -30, -82, -13, -80)
        arm(16, -103, 30, -82, 13, -80)
        out.append(_path("M -20 -88 L 0 -96 L 20 -88 L 20 -72 L 0 -64 L -20 -72 Z", WHITE, INK, 2))
        out.append(_line(0, -95, 0, -65, INK, 2))
    elif pose == "phone":
        arm(-16, -103, -25, -76, -23, -55)
        arm(16, -103, 29, -88, 20, -136)
        out.append(_rounded(13, -150, 11, 22, 3, "#3A4652", INK, 2))
        out.append(_rounded(15, -147, 7, 12, 1.5, "#A9D3DF"))
    elif pose == "point":
        arm(-16, -103, -25, -75, -23, -52)
        arm(16, -103, 34, -104, 48, -108)
    elif pose == "wave":
        arm(-16, -103, -25, -75, -23, -52)
        arm(16, -103, 32, -127, 27, -158)
        out.append(_circle(26, -163, 6, skin, INK, 2))
    elif pose == "carry":
        arm(-16, -103, -27, -88, -12, -86)
        arm(16, -103, 27, -88, 12, -86)
        out.append(_rounded(-18, -94, 36, 24, 5, "#C98B4B", INK, 2))
    elif pose == "write":
        arm(-16, -103, -22, -76, -17, -55)
        arm(16, -103, 27, -86, 13, -62)
        out.append(_line(12, -62, 27, -52, INK, 2))
    elif pose == "eat":
        arm(-16, -103, -24, -79, -20, -58)
        arm(16, -103, 28, -84, 15, -68)
        out.append(_line(14, -68, 27, -64, "#8B5A2B", 2))
    elif pose == "umbrella":
        arm(-16, -103, -25, -75, -23, -52)
        arm(16, -103, 30, -115, 25, -158)
        out.append(_line(25, -158, 25, -188, INK, 3))
        out.append(_path("M -26 -188 Q 25 -224 76 -188 Q 54 -196 25 -190 Q -4 -196 -26 -188 Z", "#D9695F", INK, 3))
        out.append(_path("M 25 -190 Q 25 -178 33 -178", "none", INK, 3))
    elif pose == "fan":
        arm(-16, -103, -25, -75, -23, -52)
        arm(16, -103, 24, -126, 19, -146)
        out.append(_path("M 18 -146 Q 30 -160 38 -146 Q 30 -140 18 -146 Z", "#F2D27A", INK, 2))
    elif pose == "shiver":
        arm(-16, -103, -27, -92, -7, -88)
        arm(16, -103, 27, -92, 7, -88)
    elif pose == "hands":
        arm(-16, -103, -27, -80, -8, -74)
        arm(16, -103, 27, -80, 8, -74)
    else:
        arm(-16, -103, -26, -74, -23, -52)
        arm(16, -103, 26, -74, 23, -52)

    out.append("</g>")
    return "\n".join(out)


def table(x=240, y=300, w=230, h=16, color="#B98A57"):
    return (
        _rounded(x - w / 2, y - h, w, h, 6, color, INK, 3)
        + _line(x - w / 2 + 18, y, x - w / 2 + 18, y + 42, color, 10)
        + _line(x + w / 2 - 18, y, x + w / 2 - 18, y + 42, color, 10)
    )


def chair(x, y, color="#B98A57", flip=False):
    s = -1 if flip else 1
    return (
        f'<g transform="translate({x} {y}) scale({s} 1)">'
        + _rounded(-34, -96, 14, 96, 5, color, INK, 3)
        + _rounded(-34, -40, 70, 12, 4, color, INK, 3)
        + _line(-30, -30, -30, 4, color, 9)
        + _line(26, -30, 26, 4, color, 9)
        + "</g>"
    )


# ---------------------------------------------------------------------------
# Objects
# ---------------------------------------------------------------------------

def taxi(v: int) -> str:
    p = _p(v)
    body = p["taxi"]
    out = [svg_start(v), shadow(240, 306, 120, 13)]
    # road
    out.append(_rounded(34, 290, 412, 8, 4, "#C9C0AF"))
    # body
    out.append(_path("M 72 268 Q 76 224 116 216 L 158 214 L 190 174 Q 200 162 218 162 L 304 162 Q 322 162 333 176 L 360 214 L 396 220 Q 416 224 416 250 L 416 272 Q 416 284 404 284 L 84 284 Q 72 284 72 272 Z", body, INK, 4))
    # windows
    out.append(_path("M 182 210 L 205 178 Q 210 170 220 170 L 236 170 L 236 210 Z", "#CFE6EA", INK, 3))
    out.append(_path("M 248 170 L 300 170 Q 310 170 316 178 L 338 210 L 248 210 Z", "#CFE6EA", INK, 3))
    out.append(_line(242, 168, 242, 212, INK, 3))
    # doors
    out.append(_line(196, 214, 196, 280, INK, 3))
    out.append(_line(344, 214, 344, 280, INK, 3))
    out.append(_rounded(202, 238, 10, 4, 2, INK))
    out.append(_rounded(330, 238, 10, 4, 2, INK))
    # lights and bumper
    out.append(_rounded(74, 246, 12, 14, 4, "#F7E6A6", INK, 2))
    out.append(_rounded(394, 246, 12, 14, 4, "#F7E6A6", INK, 2))
    out.append(_rounded(84, 278, 312, 8, 3, "#7C8792"))
    # wheels
    for cx in (144, 340):
        out.append(_circle(cx, 284, 27, "#3D4650", INK, 4))
        out.append(_circle(cx, 284, 12, "#B9C1C8", INK, 2))
    # roof sign
    out.append(_rounded(208, 140, 58, 22, 6, "#FFF4CE", INK, 3))
    for i in range(4):
        out.append(_rounded(216 + i * 13, 147, 7, 7, 1.5, INK if i % 2 == 0 else "#D9695F"))
    # simple speed lines
    out.append(_line(30, 246, 58, 246, MUTED, 3, "round"))
    out.append(_line(24, 262, 56, 262, MUTED, 3, "round"))
    out.append(svg_end())
    return "\n".join(out)


def plane(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    out.append(_cloud(92, 96, 0.9))
    out.append(_cloud(390, 132, 0.7))
    out.append(_cloud(280, 62, 0.55))
    out.append(shadow(240, 318, 120, 8, 0.08))
    # fuselage
    out.append(_path("M 92 220 Q 90 196 120 188 L 330 150 Q 390 140 412 166 Q 424 180 404 194 L 352 220 Q 330 232 300 232 L 128 232 Q 98 232 92 220 Z", "#F4F6F8", INK, 4))
    # nose and cockpit
    out.append(_path("M 330 150 Q 388 140 412 166 Q 398 174 380 176 L 330 184 Z", "#8FB8CE", INK, 3))
    out.append(_path("M 120 188 Q 100 200 98 220 L 150 220 L 174 188 Z", "#8FB8CE", INK, 3))
    # wing
    out.append(_poly([(196, 218), (252, 218), (196, 286), (150, 286)], "#DCE3E8", INK, 3))
    out.append(_poly([(286, 210), (338, 204), (382, 260), (326, 260)], "#DCE3E8", INK, 3))
    # tail
    out.append(_poly([(108, 190), (92, 132), (126, 138), (148, 188)], "#D9695F", INK, 3))
    out.append(_poly([(110, 190), (150, 186), (164, 220), (116, 220)], "#D9695F", INK, 3))
    # windows
    for i in range(9):
        out.append(_circle(158 + i * 24, 196 - i * 3, 4.6, "#5F7F92", INK, 1.5))
    # engine
    out.append(_rounded(230, 230, 54, 22, 9, "#C9D2D8", INK, 3))
    out.append(_circle(226, 241, 9, "#6F7C89", INK, 2))
    # motion lines
    out.append(_line(30, 250, 66, 250, MUTED, 3))
    out.append(_line(22, 270, 60, 270, MUTED, 3))
    out.append(svg_end())
    return "\n".join(out)


def train(v: int) -> str:
    p = _p(v)
    out = [svg_start(v), shadow(240, 310, 150, 11)]
    # rails
    out.append(_line(28, 306, 452, 306, "#8B8F94", 6))
    out.append(_line(28, 316, 452, 316, "#8B8F94", 6))
    for x in range(40, 450, 34):
        out.append(_line(x, 300, x, 322, "#A9A397", 3))
    # engine body
    out.append(_rounded(76, 146, 322, 136, 18, p["shirt3"], INK, 4))
    out.append(_rounded(76, 146, 322, 34, 16, "#E8EDF0", INK, 3))
    # front cab
    out.append(_path("M 76 184 L 76 146 Q 76 132 92 132 L 156 132 Q 172 132 172 148 L 172 184 Z", "#DCE6EA", INK, 3))
    out.append(_path("M 92 146 L 156 146 L 156 174 L 92 174 Z", "#A9CFD8", INK, 2))
    out.append(_line(124, 146, 124, 174, INK, 2))
    # side windows
    for i in range(5):
        out.append(_rounded(192 + i * 38, 158, 28, 30, 5, "#CBE3EA", INK, 2))
    # stripe
    out.append(_rounded(78, 206, 318, 12, 4, p["accent"]))
    # door
    out.append(_rounded(300, 190, 44, 84, 5, "#E7EDF0", INK, 3))
    out.append(_line(322, 192, 322, 272, INK, 2))
    # wheels
    for cx in (132, 210, 330):
        out.append(_circle(cx, 288, 20, "#3D4650", INK, 4))
        out.append(_circle(cx, 288, 8, "#B9C1C8", INK, 2))
    # headlight
    out.append(_circle(86, 236, 8, "#F7E6A6", INK, 2))
    # smoke
    out.append(_cloud(72, 112, 0.55, "#FFFFFF", 0.8))
    out.append(_cloud(40, 88, 0.4, "#FFFFFF", 0.7))
    out.append(svg_end())
    return "\n".join(out)


def train_station(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    # platform
    out.append(_rounded(0, 276, 480, 84, 0, "#D7D0BF"))
    out.append(_line(0, 276, 480, 276, INK, 3))
    # building
    out.append(_rounded(54, 98, 286, 178, 8, "#F0E6D2", INK, 4))
    out.append(_poly([(42, 100), (352, 100), (330, 70), (66, 70)], "#C96B5B", INK, 3))
    out.append(_rounded(78, 118, 238, 22, 4, "#7C8B99", INK, 2))
    # clock
    out.append(_circle(292, 154, 27, WHITE, INK, 4))
    out.append(_line(292, 154, 292, 138, INK, 3))
    out.append(_line(292, 154, 304, 160, INK, 3))
    # windows
    for i in range(4):
        out.append(_rounded(82 + i * 44, 164, 28, 34, 4, "#CFE6EA", INK, 2))
    out.append(_rounded(238, 164, 36, 68, 4, "#C98B4B", INK, 2))
    out.append(_line(256, 166, 256, 230, INK, 2))
    # sign
    out.append(_rounded(118, 210, 120, 24, 5, "#3E8E7E", INK, 2))
    # train on right
    out.append(_rounded(352, 218, 108, 58, 10, p["shirt3"], INK, 3))
    out.append(_rounded(362, 228, 26, 18, 3, "#CFE6EA", INK, 2))
    out.append(_rounded(396, 228, 26, 18, 3, "#CFE6EA", INK, 2))
    out.append(_rounded(430, 228, 20, 18, 3, "#CFE6EA", INK, 2))
    for cx in (372, 414, 448):
        out.append(_circle(cx, 278, 9, "#3D4650", INK, 2))
    # person with suitcase
    out.append(person(390, 300, 0.62, p, shirt=p["shirt2"], pose="carry", hair_style="short"))
    out.append(_rounded(424, 270, 28, 30, 4, "#C98B4B", INK, 2))
    out.append(_line(438, 270, 438, 258, INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def tea(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 298, 112, 10)]
    out.append(_ellipse(240, 294, 112, 18, "#E4D8C2", INK, 3))
    out.append(_rounded(178, 214, 124, 78, 16, "#F7F2E7", INK, 4))
    out.append(_ellipse(240, 214, 62, 14, "#D9B36C", INK, 3))
    out.append(_path("M 184 250 Q 146 250 146 274 Q 146 294 184 292", "none", INK, 5))
    out.append(_path("M 192 226 Q 178 198 196 176", "none", "#B9A58A", 4))
    out.append(_path("M 232 222 Q 218 190 238 164", "none", "#B9A58A", 4))
    out.append(_path("M 270 224 Q 260 198 278 178", "none", "#B9A58A", 4))
    out.append(_ellipse(240, 258, 44, 8, "#C98B4B", 0.35))
    out.append(_path("M 196 262 Q 240 286 284 262", "none", INK, 2, opacity=0.2))
    out.append(svg_end())
    return "\n".join(out)


def water(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 300, 88, 9)]
    out.append(_path("M 188 186 L 292 186 L 278 292 Q 276 302 264 302 L 216 302 Q 204 302 202 292 Z", "#DCEFF3", INK, 4))
    out.append(_path("M 198 228 L 282 228 L 276 290 Q 275 296 266 296 L 214 296 Q 205 296 204 290 Z", "#8FC7D9", INK, 2))
    out.append(_ellipse(240, 188, 52, 10, "#F4FAFB", INK, 3))
    for cx, cy, r in [(220, 250, 4), (252, 266, 3), (232, 278, 2.5), (264, 242, 2.5)]:
        out.append(_circle(cx, cy, r, "#E8F6F8", 0.7))
    out.append(_path("M 206 196 Q 212 208 206 218", "none", WHITE, 3, opacity=0.8))
    out.append(svg_end())
    return "\n".join(out)


def rice(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 300, 105, 10)]
    out.append(_path("M 158 224 Q 240 212 322 224 L 300 292 Q 296 302 282 302 L 198 302 Q 184 302 180 292 Z", "#F7F2E7", INK, 4))
    out.append(_path("M 172 232 Q 240 222 308 232 L 300 252 Q 240 266 180 252 Z", "#E9E1D2", INK, 2))
    # rice mound
    out.append(_path("M 180 244 Q 190 208 214 204 Q 240 198 266 204 Q 290 210 300 244 Q 240 262 180 244 Z", "#FFFDF7", INK, 3))
    for x, y in [(206, 226), (232, 216), (258, 224), (280, 238), (220, 240)]:
        out.append(_ellipse(x, y, 4, 2, "#E8E1D2", 0.9))
    # chopsticks
    out.append(_line(318, 178, 262, 218, "#A9703D", 4))
    out.append(_line(330, 186, 274, 226, "#A9703D", 4))
    out.append(svg_end())
    return "\n".join(out)


def apple(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 304, 82, 9)]
    out.append(_path("M 240 192 Q 208 174 180 198 Q 150 224 166 264 Q 182 300 218 292 Q 232 288 240 296 Q 248 288 262 292 Q 298 300 314 264 Q 330 224 300 198 Q 272 174 240 192 Z", "#D95F55", INK, 4))
    out.append(_path("M 240 190 Q 238 168 250 158", "none", "#7A5A3A", 6))
    out.append(_path("M 250 166 Q 270 150 284 164 Q 270 184 250 178 Z", "#6A9A5B", INK, 3))
    out.append(_path("M 188 220 Q 194 198 214 192", "none", "#F29A90", 5, opacity=0.8))
    out.append(_circle(268, 214, 5, "#F29A90", 0.55))
    out.append(svg_end())
    return "\n".join(out)


def fruit(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 300, 130, 10)]
    out.append(_path("M 116 244 Q 240 224 364 244 L 340 286 Q 334 300 318 300 L 162 300 Q 146 300 140 286 Z", "#E8D6B8", INK, 4))
    out.append(_ellipse(240, 246, 124, 16, "#F4E8D0", INK, 2))
    # apples
    out.append(_circle(188, 228, 30, "#D95F55", INK, 3))
    out.append(_circle(242, 218, 34, "#D95F55", INK, 3))
    out.append(_circle(298, 228, 30, "#E3B23C", INK, 3))
    out.append(_path("M 242 186 Q 240 172 250 164", "none", "#7A5A3A", 4))
    out.append(_path("M 250 172 Q 266 158 276 170 Q 264 184 248 180 Z", "#6A9A5B", INK, 2))
    # grapes
    for x, y in [(160, 244), (176, 254), (148, 260), (170, 272), (190, 264)]:
        out.append(_circle(x, y, 9, "#8B6BB1", INK, 2))
    out.append(_path("M 166 230 Q 170 218 182 216", "none", "#7A5A3A", 3))
    out.append(svg_end())
    return "\n".join(out)


def tv(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 302, 126, 10)]
    out.append(_rounded(120, 112, 240, 160, 14, "#3E4750", INK, 4))
    out.append(_rounded(132, 124, 216, 136, 9, "#BFDDE4", INK, 3))
    # simple landscape on screen
    out.append(_path("M 136 238 L 194 174 L 236 214 L 272 164 L 344 238 Z", "#6A9A5B", INK, 2))
    out.append(_circle(306, 154, 17, "#F6D36B", INK, 2))
    out.append(_path("M 132 240 L 348 240 L 348 260 L 132 260 Z", "#8FB8CE", INK, 2))
    # stand
    out.append(_rounded(204, 272, 72, 12, 4, "#3E4750", INK, 3))
    out.append(_rounded(156, 284, 168, 10, 4, "#3E4750", INK, 3))
    # remote
    out.append(_rounded(382, 214, 18, 48, 6, "#3E4750", INK, 3))
    out.append(_circle(391, 226, 3, "#D9695F"))
    out.append(_circle(391, 238, 3, "#E3B23C"))
    out.append(svg_end())
    return "\n".join(out)


def computer(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 306, 130, 10)]
    out.append(_rounded(126, 104, 228, 156, 10, "#3E4750", INK, 4))
    out.append(_rounded(138, 116, 204, 130, 6, "#CFE6EA", INK, 2))
    out.append(_rounded(146, 124, 188, 114, 3, "#EAF3F4"))
    # code lines
    for i, w in enumerate([96, 128, 76, 140, 110, 60]):
        out.append(_rounded(158, 134 + i * 16, w, 6, 3, "#8FB8CE" if i % 2 == 0 else "#A9C9A0"))
    out.append(_rounded(196, 260, 88, 10, 4, "#3E4750", INK, 2))
    out.append(_rounded(226, 270, 28, 26, 5, "#3E4750", INK, 2))
    # keyboard
    out.append(_poly([(112, 296), (368, 296), (392, 330), (88, 330)], "#DCE3E8", INK, 3))
    for row in range(2):
        for col in range(8):
            out.append(_rounded(122 + col * 30 + row * 8, 304 + row * 12, 20, 7, 2, "#8A98A4"))
    # mouse
    out.append(_ellipse(404, 316, 16, 22, "#DCE3E8", INK, 3))
    out.append(_line(404, 300, 404, 312, INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def book(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 306, 110, 8)]
    out.append(_path("M 108 266 Q 178 250 238 268 Q 300 250 372 266 L 372 294 Q 300 278 238 296 Q 176 278 108 294 Z", "#B98A57", INK, 4))
    out.append(_path("M 116 262 Q 180 248 238 264 L 238 288 Q 180 272 116 286 Z", "#FFFDF7", INK, 3))
    out.append(_path("M 360 262 Q 296 248 238 264 L 238 288 Q 296 272 360 286 Z", "#FFFDF7", INK, 3))
    for i in range(5):
        out.append(_line(134, 264 + i * 4.5, 220, 256 + i * 4.5, "#8A98A4", 2, "round"))
        out.append(_line(256, 256 + i * 4.5, 342, 264 + i * 4.5, "#8A98A4", 2, "round"))
    out.append(_line(238, 264, 238, 290, INK, 3))
    # bookmark
    out.append(_poly([(310, 252), (326, 252), (326, 276), (318, 270), (310, 276)], "#D9695F", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def phone(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 306, 70, 8)]
    out.append(_rounded(188, 76, 104, 216, 18, "#3E4750", INK, 4))
    out.append(_rounded(197, 94, 86, 166, 8, "#CFE6EA", INK, 2))
    out.append(_rounded(214, 104, 52, 8, 4, "#8FB8CE"))
    for i in range(4):
        out.append(_rounded(206, 126 + i * 26, 68, 14, 5, "#EAF3F4"))
    out.append(_circle(240, 276, 8, "#8A98A4", INK, 2))
    # speech bubbles
    out.append(_path("M 316 116 Q 316 92 348 92 L 400 92 Q 426 92 426 116 Q 426 138 400 138 L 368 138 L 348 156 L 352 136 L 348 136 Q 316 136 316 116 Z", "#F7F2E7", INK, 3))
    out.append(_circle(350, 114, 3, INK))
    out.append(_circle(368, 114, 3, INK))
    out.append(_circle(386, 114, 3, INK))
    out.append(svg_end())
    return "\n".join(out)


def cat(v: int) -> str:
    p = _p(v)
    fur = ["#D9954F", "#8A98A4", "#C96B5B", "#5B6670"][v % 4]
    out = [svg_start(v, room=True), shadow(240, 306, 92, 9)]
    # tail
    out.append(_path("M 318 272 Q 366 268 348 222 Q 340 202 322 210", "none", fur, 14))
    # body
    out.append(_ellipse(240, 248, 70, 58, fur, INK, 4))
    # head
    out.append(_circle(240, 172, 54, fur, INK, 4))
    # ears
    out.append(_poly([(198, 142), (190, 98), (228, 128)], fur, INK, 4))
    out.append(_poly([(282, 142), (290, 98), (252, 128)], fur, INK, 4))
    out.append(_poly([(203, 136), (199, 112), (220, 128)], "#F4C9C2"))
    out.append(_poly([(277, 136), (281, 112), (260, 128)], "#F4C9C2"))
    # eyes
    out.append(_ellipse(220, 168, 8, 11, "#2F7D5C"))
    out.append(_ellipse(260, 168, 8, 11, "#2F7D5C"))
    out.append(_ellipse(220, 168, 3, 10, INK))
    out.append(_ellipse(260, 168, 3, 10, INK))
    # nose and mouth
    out.append(_poly([(236, 186), (244, 186), (240, 192)], "#D9695F", INK, 1.5))
    out.append(_path("M 240 192 Q 234 200 228 196 M 240 192 Q 246 200 252 196", "none", INK, 2))
    # whiskers
    for dy in (-6, 2, 10):
        out.append(_line(204, 188 + dy, 164, 182 + dy, INK, 1.8))
        out.append(_line(276, 188 + dy, 316, 182 + dy, INK, 1.8))
    # paws
    out.append(_ellipse(206, 292, 22, 10, "#F4D8B0", INK, 2))
    out.append(_ellipse(274, 292, 22, 10, "#F4D8B0", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def dog(v: int) -> str:
    p = _p(v)
    fur = ["#B98A57", "#8A6A4A", "#D9B36C", "#7C8792"][v % 4]
    out = [svg_start(v, room=True), shadow(240, 306, 96, 9)]
    # tail
    out.append(_path("M 316 254 Q 360 246 344 210", "none", fur, 13))
    # body
    out.append(_ellipse(240, 250, 74, 54, fur, INK, 4))
    # head
    out.append(_circle(240, 170, 52, fur, INK, 4))
    # ears
    out.append(_path("M 194 144 Q 168 132 174 180 Q 178 202 200 190 Z", "#8A5A3A", INK, 3))
    out.append(_path("M 286 144 Q 312 132 306 180 Q 302 202 280 190 Z", "#8A5A3A", INK, 3))
    # muzzle
    out.append(_ellipse(240, 190, 34, 24, "#F4D8B0", INK, 2))
    out.append(_ellipse(240, 184, 10, 7, INK))
    out.append(_path("M 240 191 Q 232 202 224 198 M 240 191 Q 248 202 256 198", "none", INK, 2))
    # eyes
    out.append(_circle(218, 162, 6, INK))
    out.append(_circle(262, 162, 6, INK))
    out.append(_circle(216, 160, 2, WHITE))
    out.append(_circle(260, 160, 2, WHITE))
    # tongue
    out.append(_path("M 232 206 Q 240 224 248 206 Z", "#E77C7C", INK, 2))
    # paws
    out.append(_ellipse(204, 292, 24, 10, "#F4D8B0", INK, 2))
    out.append(_ellipse(276, 292, 24, 10, "#F4D8B0", INK, 2))
    # collar
    out.append(_path("M 198 206 Q 240 224 282 206", "none", "#D9695F", 8))
    out.append(_circle(240, 220, 7, "#E3B23C", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def clock(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 306, 80, 8)]
    out.append(_circle(240, 190, 92, "#F7F2E7", INK, 5))
    out.append(_circle(240, 190, 80, WHITE, INK, 2))
    for i in range(12):
        import math
        a = math.radians(i * 30)
        r1, r2 = 68, 76
        out.append(_line(240 + r1 * math.sin(a), 190 - r1 * math.cos(a), 240 + r2 * math.sin(a), 190 - r2 * math.cos(a), INK, 3))
    out.append(_line(240, 190, 240, 136, INK, 5))
    out.append(_line(240, 190, 282, 208, INK, 4))
    out.append(_circle(240, 190, 6, "#D9695F"))
    out.append(_rounded(214, 284, 52, 12, 5, "#B98A57", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# People / actions
# ---------------------------------------------------------------------------

def writing(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(shadow(240, 318, 130, 9))
    # desk
    out.append(_rounded(92, 240, 296, 16, 6, "#B98A57", INK, 3))
    out.append(_line(116, 256, 116, 314, "#B98A57", 10))
    out.append(_line(364, 256, 364, 314, "#B98A57", 10))
    # paper and pencil
    out.append(_poly([(244, 218), (326, 208), (334, 236), (252, 246)], "#FFFDF7", INK, 2))
    for i in range(4):
        out.append(_line(254, 224 + i * 5, 318, 216 + i * 5, "#A9B4BE", 1.6))
    out.append(_line(286, 210, 330, 190, "#E3B23C", 4))
    out.append(_poly([(330, 190), (338, 186), (334, 196)], INK))
    # person
    out.append(person(196, 318, 0.96, p, shirt=p["shirt"], pose="write", hair_style="short"))
    # chair
    out.append(chair(176, 318, "#B98A57"))
    out.append(svg_end())
    return "\n".join(out)


def reading(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 120, 9)]
    # armchair
    out.append(_rounded(112, 214, 256, 96, 28, p["shirt2"], INK, 4))
    out.append(_rounded(104, 250, 34, 70, 14, p["shirt2"], INK, 4))
    out.append(_rounded(342, 250, 34, 70, 14, p["shirt2"], INK, 4))
    out.append(_rounded(140, 290, 200, 16, 8, "#8A5A3A", INK, 3))
    # person seated (upper body)
    out.append(person(240, 300, 0.92, p, shirt=p["shirt"], pose="read", hair_style="long"))
    # book is drawn by pose; add pages
    out.append(svg_end())
    return "\n".join(out)


def sleeping(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 150, 9)]
    # bed
    out.append(_rounded(66, 238, 348, 66, 12, "#E8D6B8", INK, 4))
    out.append(_rounded(58, 230, 22, 86, 8, "#B98A57", INK, 3))
    out.append(_rounded(400, 248, 22, 68, 8, "#B98A57", INK, 3))
    # mattress and blanket
    out.append(_rounded(78, 246, 324, 30, 10, "#FFFDF7", INK, 2))
    out.append(_path("M 180 250 Q 250 232 344 250 L 344 286 Q 250 298 180 286 Z", p["shirt3"], INK, 3))
    # pillow and head
    out.append(_rounded(96, 224, 86, 34, 14, "#F7F2E7", INK, 3))
    out.append(_circle(140, 222, 25, SKIN, INK, 3))
    out.append(_path("M 118 216 Q 118 198 140 198 Q 162 198 162 216 Q 150 208 140 208 Q 130 208 118 216 Z", HAIR, INK, 2))
    out.append(_path("M 132 222 Q 136 220 140 222 M 146 222 Q 150 220 154 222", "none", INK, 2))
    out.append(_path("M 138 232 Q 143 235 148 232", "none", INK, 2))
    # Zzz
    out.append(_path("M 182 190 L 204 190 L 182 210 L 204 210", "none", INK, 3))
    out.append(_path("M 212 170 L 228 170 L 212 186 L 228 186", "none", INK, 2.5))
    out.append(_path("M 234 154 L 246 154 L 234 166 L 246 166", "none", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def eating(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 128, 9)]
    # table
    out.append(_rounded(94, 246, 292, 16, 6, "#B98A57", INK, 3))
    out.append(_line(120, 262, 120, 318, "#B98A57", 10))
    out.append(_line(360, 262, 360, 318, "#B98A57", 10))
    # bowl and chopsticks
    out.append(_path("M 196 232 Q 240 222 284 232 L 272 262 Q 240 270 208 262 Z", "#F7F2E7", INK, 3))
    out.append(_path("M 204 238 Q 240 230 276 238", "none", "#E9E1D2", 4))
    out.append(_line(292, 206, 258, 236, "#A9703D", 4))
    out.append(_line(304, 214, 270, 244, "#A9703D", 4))
    # person
    out.append(person(162, 318, 0.96, p, shirt=p["shirt"], pose="eat", hair_style="short"))
    out.append(chair(142, 318, "#B98A57", flip=True))
    # small dish
    out.append(_ellipse(320, 238, 28, 9, "#FFFDF7", INK, 2))
    out.append(_circle(320, 232, 9, "#6A9A5B", INK, 1.5))
    out.append(svg_end())
    return "\n".join(out)


def sun_hot(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    # sun
    out.append(_circle(378, 82, 48, "#F6D36B", INK, 4))
    for i in range(8):
        import math
        a = math.radians(i * 45)
        out.append(_line(378 + 58 * math.cos(a), 82 + 58 * math.sin(a), 378 + 74 * math.cos(a), 82 + 74 * math.sin(a), "#E3B23C", 5))
    # ground
    out.append(_rounded(0, 286, 480, 74, 0, "#DCE7D1"))
    # person fanning
    out.append(person(218, 310, 1.0, p, shirt=p["shirt2"], pose="fan", hair_style="short"))
    # sweat drops
    out.append(_path("M 186 142 Q 178 154 186 158 Q 194 154 186 142 Z", "#8FC7D9", INK, 1.5))
    out.append(_path("M 252 150 Q 246 160 252 164 Q 258 160 252 150 Z", "#8FC7D9", INK, 1.5))
    out.append(_line(170, 174, 162, 166, "#8FC7D9", 3))
    out.append(_line(264, 178, 272, 170, "#8FC7D9", 3))
    # heat lines
    for i in range(3):
        out.append(_path(f"M {300 + i * 18} 300 Q {306 + i * 18} 286 {300 + i * 18} 272", "none", "#E8A95C", 3, opacity=0.7))
    out.append(svg_end())
    return "\n".join(out)


def rain(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    out.append(_cloud(120, 100, 1.0, "#D9E1E6"))
    out.append(_cloud(300, 80, 1.1, "#D9E1E6"))
    out.append(_cloud(400, 138, 0.8, "#D9E1E6"))
    for i in range(14):
        x = 60 + i * 28
        y = 130 + (i % 3) * 10
        out.append(_line(x, y, x - 8, y + 24, "#6FA8C4", 4))
    out.append(_rounded(0, 286, 480, 74, 0, "#D3E0CF"))
    # puddles
    out.append(_ellipse(140, 318, 54, 8, "#9BC3D6", 0.8))
    out.append(_ellipse(340, 330, 68, 8, "#9BC3D6", 0.8))
    out.append(person(240, 312, 1.0, p, shirt=p["shirt"], pose="umbrella", hair_style="short"))
    out.append(svg_end())
    return "\n".join(out)


def cold(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    # snowflakes
    for x, y, s in [(70, 70, 1.0), (126, 120, 0.7), (360, 70, 0.9), (416, 140, 0.6), (300, 50, 0.6)]:
        out.append(f'<g transform="translate({x} {y}) scale({s})" stroke="#8FB8CE" stroke-width="3" stroke-linecap="round">'
                   + _line(-12, 0, 12, 0) + _line(0, -12, 0, 12) + _line(-8, -8, 8, 8) + _line(-8, 8, 8, -8) + "</g>")
    out.append(_rounded(0, 286, 480, 74, 0, "#E4EDF0"))
    # person in coat and scarf
    out.append(person(240, 312, 1.0, p, shirt="#4F6B86", pose="shiver", hair_style="short"))
    out.append(_path("M 206 190 Q 240 204 274 190 L 274 208 Q 240 222 206 208 Z", "#D9695F", INK, 3))
    out.append(_path("M 250 220 Q 260 244 248 252", "none", "#D9695F", 7))
    # breath
    out.append(_path("M 262 160 Q 280 150 278 136", "none", WHITE, 4, opacity=0.8))
    out.append(_path("M 270 166 Q 292 158 290 142", "none", WHITE, 3, opacity=0.6))
    out.append(svg_end())
    return "\n".join(out)


def doctor(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 100, 9)]
    # hospital wall detail
    out.append(_rounded(60, 48, 128, 84, 8, "#F7F2E7", INK, 2))
    out.append(_rounded(84, 64, 80, 10, 4, "#D9695F"))
    out.append(_rounded(119, 30, 10, 76, 4, "#D9695F"))
    # person with white coat
    out.append(person(240, 318, 1.06, p, shirt="#F7F2E7", pose="stand", hair_style="short"))
    # coat lapels
    out.append(_path("M 222 208 L 240 240 L 258 208 L 250 200 L 240 220 L 230 200 Z", "#DCE3E8", INK, 2))
    # stethoscope
    out.append(_path("M 222 204 Q 206 246 226 266 Q 240 278 254 266 Q 274 246 258 204", "none", "#3E4750", 4))
    out.append(_circle(240, 274, 9, "#B9C1C8", INK, 3))
    out.append(_circle(240, 274, 4, "#6F7C89"))
    # clipboard
    out.append(_rounded(304, 222, 62, 82, 6, "#E8D6B8", INK, 3))
    out.append(_rounded(316, 232, 38, 10, 3, WHITE, INK, 2))
    for i in range(4):
        out.append(_line(318, 252 + i * 12, 352, 252 + i * 12, "#8A98A4", 3))
    out.append(svg_end())
    return "\n".join(out)


def teacher(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 110, 9)]
    # blackboard
    out.append(_rounded(80, 60, 320, 180, 8, "#3E5A4E", INK, 5))
    out.append(_rounded(92, 72, 296, 156, 4, "#4F6F60", INK, 2))
    # chalk marks (abstract, no readable words)
    for i, (x, y, w) in enumerate([(112, 96, 86), (216, 96, 64), (112, 122, 120), (250, 122, 60), (112, 148, 72), (202, 148, 106)]):
        out.append(_line(x, y, x + w, y, "#E8EDE8", 4))
    out.append(_line(112, 178, 210, 178, "#E8EDE8", 4))
    # teacher
    out.append(person(240, 318, 1.02, p, shirt=p["shirt3"], pose="point", hair_style="bun"))
    # pointer
    out.append(_line(288, 212, 350, 170, "#8A5A3A", 4))
    out.append(svg_end())
    return "\n".join(out)


def student(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 120, 9)]
    # desk
    out.append(_rounded(114, 254, 252, 14, 6, "#B98A57", INK, 3))
    out.append(_line(136, 268, 136, 318, "#B98A57", 9))
    out.append(_line(344, 268, 344, 318, "#B98A57", 9))
    # open book
    out.append(_path("M 196 232 Q 240 222 284 232 L 284 254 Q 240 244 196 254 Z", "#FFFDF7", INK, 2))
    out.append(_line(240, 228, 240, 252, INK, 2))
    # person
    out.append(person(160, 318, 0.96, p, shirt=p["shirt"], pose="read", hair_style="short"))
    # backpack
    out.append(_rounded(108, 206, 34, 54, 10, p["shirt2"], INK, 3))
    out.append(_path("M 116 206 Q 126 190 136 206", "none", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def mom_reading(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 120, 9)]
    # armchair
    out.append(_rounded(112, 214, 256, 96, 28, p["shirt3"], INK, 4))
    out.append(_rounded(104, 250, 34, 70, 14, p["shirt3"], INK, 4))
    out.append(_rounded(342, 250, 34, 70, 14, p["shirt3"], INK, 4))
    out.append(_rounded(140, 290, 200, 16, 8, "#8A5A3A", INK, 3))
    out.append(person(240, 300, 0.98, p, shirt=p["shirt2"], pose="read", hair_style="long"))
    # lamp
    out.append(_line(400, 190, 400, 300, "#6F7C89", 5))
    out.append(_path("M 374 190 L 426 190 L 414 160 L 386 160 Z", "#F6D36B", INK, 3))
    out.append(_line(400, 300, 374, 318, "#6F7C89", 4))
    out.append(_line(400, 300, 426, 318, "#6F7C89", 4))
    out.append(svg_end())
    return "\n".join(out)


def cinema(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True)]
    # screen
    out.append(_rounded(70, 54, 340, 170, 8, "#3E4750", INK, 5))
    out.append(_rounded(82, 66, 316, 146, 3, "#DCEFF3", INK, 2))
    out.append(_circle(300, 112, 28, "#F6D36B", INK, 2))
    out.append(_path("M 84 208 L 170 128 L 226 184 L 286 116 L 398 208 Z", "#6A9A5B", INK, 2))
    out.append(_path("M 84 208 L 132 174 L 180 208 Z", "#4F7CAC", INK, 2))
    # projector beam
    out.append(_poly([(360, 232), (470, 186), (470, 300)], "#F7E6A6", 0, opacity=0.18))
    # audience
    out.append(_rounded(44, 296, 392, 54, 22, "#3E4750", INK, 4))
    out.append(_circle(120, 276, 24, "#5B6670", INK, 3))
    out.append(_circle(120, 294, 12, "#4A5560", INK, 2))
    out.append(_circle(240, 270, 28, "#5B6670", INK, 3))
    out.append(_circle(240, 292, 14, "#4A5560", INK, 2))
    out.append(_circle(356, 278, 24, "#5B6670", INK, 3))
    out.append(_circle(356, 296, 12, "#4A5560", INK, 2))
    # popcorn
    out.append(_poly([(184, 262), (210, 262), (204, 292), (190, 292)], "#F7F2E7", INK, 2))
    out.append(_rounded(186, 254, 22, 10, 4, "#E3B23C", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def handshake(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 110, 9)]
    out.append(person(174, 318, 0.96, p, shirt=p["shirt"], pose="hands", hair_style="short"))
    out.append(person(306, 318, 0.96, p, shirt=p["shirt2"], pose="hands", hair_style="long", flip=True))
    # joined hands
    out.append(_ellipse(240, 222, 18, 12, SKIN, INK, 3))
    out.append(_line(226, 216, 248, 230, INK, 2))
    out.append(_line(254, 216, 232, 230, INK, 2))
    # speech marks
    out.append(_circle(200, 116, 4, INK))
    out.append(_circle(216, 108, 5, INK))
    out.append(_circle(234, 116, 4, INK))
    out.append(_circle(262, 116, 4, INK))
    out.append(_circle(280, 108, 5, INK))
    out.append(_circle(296, 116, 4, INK))
    out.append(svg_end())
    return "\n".join(out)


def phone_call(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 100, 9)]
    # small side table
    out.append(_rounded(320, 240, 100, 12, 5, "#B98A57", INK, 3))
    out.append(_line(338, 252, 338, 316, "#B98A57", 8))
    out.append(_line(402, 252, 402, 316, "#B98A57", 8))
    out.append(_rounded(348, 210, 44, 28, 5, "#3E4750", INK, 3))
    out.append(_rounded(356, 216, 28, 10, 2, "#CFE6EA"))
    # person
    out.append(person(220, 318, 1.06, p, shirt=p["shirt"], pose="phone", hair_style="long"))
    # sound arcs
    for r in (22, 34, 46):
        out.append(_path(f"M 286 116 Q {300 + r} 142 286 168", "none", "#6F7C89", 3, opacity=0.7))
    out.append(_path("M 256 148 Q 268 160 256 172", "none", "#6F7C89", 3, opacity=0.5))
    out.append(svg_end())
    return "\n".join(out)


def shop_scene(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True)]
    # shelves
    out.append(_rounded(56, 46, 220, 12, 4, "#B98A57", INK, 3))
    out.append(_rounded(56, 112, 220, 12, 4, "#B98A57", INK, 3))
    out.append(_rounded(56, 178, 220, 12, 4, "#B98A57", INK, 3))
    for i in range(5):
        out.append(_rounded(68 + i * 40, 64, 28, 44, 4, ["#D9695F", "#E3B23C", "#6A9A5B", "#8B6BB1", "#4F7CAC"][i], INK, 2))
        out.append(_rounded(68 + i * 40, 128, 28, 44, 4, ["#8B6BB1", "#4F7CAC", "#D9695F", "#6A9A5B", "#E3B23C"][i], INK, 2))
    # counter
    out.append(_rounded(34, 242, 412, 18, 6, "#B98A57", INK, 4))
    out.append(_rounded(64, 260, 352, 58, 4, "#C98B4B", INK, 3))
    # fruit crate
    out.append(_rounded(72, 206, 92, 36, 5, "#E8D6B8", INK, 3))
    for i in range(5):
        out.append(_circle(84 + i * 16, 206, 10, ["#D95F55", "#E3B23C", "#6A9A5B", "#D95F55", "#E3B23C"][i], INK, 2))
    # shopkeeper and customer
    out.append(person(344, 318, 0.94, p, shirt=p["shirt3"], pose="stand", hair_style="bun"))
    out.append(person(196, 318, 0.94, p, shirt=p["shirt2"], pose="point", hair_style="short", flip=True))
    # bag
    out.append(_rounded(224, 252, 34, 42, 5, "#F7F2E7", INK, 2))
    out.append(_path("M 232 252 Q 240 240 248 252", "none", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def doctor_scene(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 130, 9)]
    # examination bed
    out.append(_rounded(56, 254, 210, 28, 12, "#E8F1F3", INK, 3))
    out.append(_line(76, 282, 76, 318, "#8A98A4", 7))
    out.append(_line(246, 282, 246, 318, "#8A98A4", 7))
    # patient seated
    out.append(person(160, 300, 0.92, p, shirt=p["shirt2"], pose="stand", hair_style="short"))
    out.append(_path("M 116 250 Q 160 236 204 250 L 204 274 Q 160 286 116 274 Z", p["shirt2"], INK, 3))
    # doctor
    out.append(person(330, 318, 1.02, p, shirt="#F7F2E7", pose="stand", hair_style="bun"))
    out.append(_path("M 312 208 L 330 240 L 348 208 L 340 200 L 330 220 L 320 200 Z", "#DCE3E8", INK, 2))
    out.append(_path("M 312 204 Q 298 246 316 266 Q 330 278 344 266 Q 362 246 348 204", "none", "#3E4750", 4))
    out.append(_circle(330, 274, 8, "#B9C1C8", INK, 3))
    # stethoscope chest piece on patient
    out.append(_circle(202, 230, 9, "#B9C1C8", INK, 3))
    out.append(_path("M 202 230 Q 230 220 250 204", "none", "#3E4750", 3))
    # wall cross
    out.append(_rounded(70, 50, 100, 70, 8, "#F7F2E7", INK, 2))
    out.append(_rounded(110, 58, 20, 54, 4, "#D9695F"))
    out.append(_rounded(94, 76, 54, 20, 4, "#D9695F"))
    out.append(svg_end())
    return "\n".join(out)


def restaurant_scene(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True)]
    # window
    out.append(_rounded(300, 50, 130, 92, 8, "#CFE6EA", INK, 3))
    out.append(_line(365, 50, 365, 142, INK, 3))
    out.append(_line(300, 96, 430, 96, INK, 3))
    # hanging lamps
    for x in (120, 230):
        out.append(_line(x, 0, x, 70, INK, 3))
        out.append(_path(f"M {x-24} 70 L {x+24} 70 L {x+16} 98 L {x-16} 98 Z", "#E3B23C", INK, 3))
    # table
    out.append(_rounded(88, 238, 304, 18, 7, "#B98A57", INK, 4))
    out.append(_line(118, 256, 118, 318, "#B98A57", 10))
    out.append(_line(362, 256, 362, 318, "#B98A57", 10))
    # dishes
    for x, color in [(150, "#D95F55"), (210, "#6A9A5B"), (330, "#E3B23C")]:
        out.append(_ellipse(x, 238, 34, 10, "#FFFDF7", INK, 2))
        out.append(_circle(x, 232, 13, color, INK, 2))
    out.append(_path("M 236 224 Q 268 214 300 224 L 292 248 Q 268 256 244 248 Z", "#F7F2E7", INK, 3))
    out.append(_path("M 244 230 Q 268 222 292 230", "none", "#E9E1D2", 4))
    # diners
    out.append(person(160, 318, 0.94, p, shirt=p["shirt"], pose="eat", hair_style="long"))
    out.append(person(330, 318, 0.94, p, shirt=p["shirt2"], pose="eat", hair_style="short", flip=True))
    out.append(chair(138, 318, "#B98A57", flip=True))
    out.append(chair(352, 318, "#B98A57"))
    out.append(svg_end())
    return "\n".join(out)


def school_scene(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    # building
    out.append(_rounded(54, 100, 300, 190, 6, "#F0E6D2", INK, 4))
    out.append(_poly([(42, 100), (366, 100), (342, 72), (66, 72)], "#C96B5B", INK, 3))
    # door
    out.append(_rounded(202, 214, 54, 76, 4, "#B98A57", INK, 3))
    out.append(_line(229, 216, 229, 288, INK, 2))
    # windows
    for row in range(2):
        for col in range(4):
            out.append(_rounded(82 + col * 54, 122 + row * 46, 34, 30, 4, "#CFE6EA", INK, 2))
            out.append(_line(99 + col * 54, 122 + row * 46, 99 + col * 54, 152 + row * 46, INK, 1.5))
    # sign
    out.append(_rounded(120, 72, 168, 22, 4, "#3E8E7E", INK, 2))
    # flag
    out.append(_line(402, 70, 402, 300, "#8A98A4", 6))
    out.append(_path("M 402 74 Q 442 60 456 82 L 456 116 Q 430 100 402 110 Z", "#D9695F", INK, 3))
    # students
    out.append(person(360, 318, 0.82, p, shirt=p["shirt"], pose="carry", hair_style="short"))
    out.append(person(414, 318, 0.78, p, shirt=p["shirt2"], pose="read", hair_style="long"))
    # tree
    out.append(_line(442, 290, 442, 240, "#8A5A3A", 7))
    out.append(_circle(442, 218, 28, "#6A9A5B", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def home_tv(v: int) -> str:
    p = _p(v)
    out = [svg_start(v, room=True)]
    # window
    out.append(_rounded(48, 54, 116, 86, 6, "#CFE6EA", INK, 3))
    out.append(_line(106, 54, 106, 140, INK, 3))
    out.append(_line(48, 98, 164, 98, INK, 3))
    # TV
    out.append(_rounded(252, 86, 158, 106, 8, "#3E4750", INK, 4))
    out.append(_rounded(262, 96, 138, 86, 4, "#BFDDE4", INK, 2))
    out.append(_path("M 264 162 L 298 132 L 322 152 L 346 124 L 398 162 Z", "#6A9A5B", INK, 2))
    out.append(_rounded(310, 192, 42, 8, 3, "#3E4750", INK, 2))
    # sofa
    out.append(_rounded(54, 220, 270, 70, 18, p["shirt2"], INK, 4))
    out.append(_rounded(54, 206, 26, 54, 12, p["shirt2"], INK, 4))
    out.append(_rounded(298, 206, 26, 54, 12, p["shirt2"], INK, 4))
    out.append(_rounded(74, 286, 230, 14, 6, "#8A5A3A", INK, 3))
    # person on sofa
    out.append(person(188, 292, 0.86, p, shirt=p["shirt"], pose="point", hair_style="short"))
    # remote
    out.append(_rounded(218, 208, 12, 28, 4, "#3E4750", INK, 2))
    out.append(_circle(224, 216, 2, "#D9695F"))
    # rug
    out.append(_ellipse(240, 322, 180, 18, "#E8D6B8", 0.8))
    out.append(svg_end())
    return "\n".join(out)


def hospital(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    out.append(_rounded(58, 96, 300, 200, 8, "#F7F2E7", INK, 4))
    out.append(_rounded(58, 96, 300, 28, 8, "#DCE3E8", INK, 3))
    # cross
    out.append(_rounded(190, 146, 36, 92, 6, "#D9695F", INK, 3))
    out.append(_rounded(162, 174, 92, 36, 6, "#D9695F", INK, 3))
    # windows
    for col in range(3):
        out.append(_rounded(82 + col * 80, 132, 44, 36, 4, "#CFE6EA", INK, 2))
        out.append(_line(104 + col * 80, 132, 104 + col * 80, 168, INK, 2))
    # entrance
    out.append(_rounded(180, 246, 58, 50, 4, "#B98A57", INK, 3))
    out.append(_line(209, 248, 209, 294, INK, 2))
    # ambulance
    out.append(_rounded(318, 244, 120, 52, 8, "#F7F2E7", INK, 3))
    out.append(_rounded(334, 254, 48, 24, 4, "#CFE6EA", INK, 2))
    out.append(_rounded(392, 254, 34, 24, 4, "#CFE6EA", INK, 2))
    out.append(_rounded(348, 262, 16, 8, 2, "#D9695F"))
    out.append(_rounded(344, 254, 24, 8, 2, "#D9695F"))
    out.append(_circle(342, 298, 11, "#3D4650", INK, 2))
    out.append(_circle(414, 298, 11, "#3D4650", INK, 2))
    # tree
    out.append(_line(440, 298, 440, 240, "#8A5A3A", 7))
    out.append(_circle(440, 218, 28, "#6A9A5B", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def shop(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    out.append(_rounded(58, 92, 300, 196, 8, "#F0E6D2", INK, 4))
    # awning
    for i in range(6):
        out.append(_poly([(52 + i * 52, 92), (104 + i * 52, 92), (96 + i * 52, 132), (60 + i * 52, 132)], "#D9695F" if i % 2 == 0 else "#F7F2E7", INK, 2))
    # windows
    out.append(_rounded(78, 150, 118, 92, 4, "#CFE6EA", INK, 3))
    out.append(_line(137, 150, 137, 242, INK, 2))
    out.append(_rounded(218, 190, 118, 98, 4, "#B98A57", INK, 3))
    out.append(_line(277, 190, 277, 288, INK, 2))
    # produce
    for i in range(4):
        out.append(_circle(96 + i * 24, 236, 10, ["#D95F55", "#E3B23C", "#6A9A5B", "#D95F55"][i], INK, 2))
    # sign
    out.append(_rounded(152, 58, 112, 24, 4, "#3E8E7E", INK, 2))
    # customer
    out.append(person(392, 318, 0.86, p, shirt=p["shirt2"], pose="carry", hair_style="long"))
    out.append(svg_end())
    return "\n".join(out)


def restaurant(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    out.append(_rounded(58, 96, 300, 192, 8, "#F0E6D2", INK, 4))
    # awning
    for i in range(5):
        out.append(_poly([(52 + i * 62, 96), (114 + i * 62, 96), (106 + i * 62, 132), (60 + i * 62, 132)], "#E3B23C" if i % 2 == 0 else "#F7F2E7", INK, 2))
    # window with tables
    out.append(_rounded(78, 148, 142, 96, 4, "#CFE6EA", INK, 3))
    out.append(_ellipse(120, 214, 26, 8, "#B98A57", INK, 2))
    out.append(_ellipse(178, 214, 26, 8, "#B98A57", INK, 2))
    out.append(_circle(120, 206, 7, "#D95F55", INK, 1.5))
    out.append(_circle(178, 206, 7, "#6A9A5B", INK, 1.5))
    # door
    out.append(_rounded(242, 196, 80, 92, 4, "#B98A57", INK, 3))
    out.append(_line(282, 198, 282, 286, INK, 2))
    # bowl sign
    out.append(_rounded(196, 54, 100, 30, 6, "#D9695F", INK, 2))
    out.append(_path("M 216 68 Q 246 56 276 68 L 268 80 Q 246 86 224 80 Z", "#F7F2E7", INK, 2))
    # people
    out.append(person(384, 318, 0.88, p, shirt=p["shirt"], pose="stand", hair_style="short"))
    out.append(person(430, 318, 0.84, p, shirt=p["shirt2"], pose="stand", hair_style="long"))
    out.append(svg_end())
    return "\n".join(out)


def home(v: int) -> str:
    p = _p(v)
    out = [svg_start(v)]
    # house
    out.append(_rounded(96, 130, 260, 166, 8, "#F0E6D2", INK, 4))
    out.append(_poly([(78, 132), (240, 54), (402, 132)], "#C96B5B", INK, 4))
    out.append(_rounded(214, 214, 58, 82, 4, "#B98A57", INK, 3))
    out.append(_line(243, 216, 243, 294, INK, 2))
    for col in range(2):
        out.append(_rounded(130 + col * 96, 168, 42, 38, 4, "#CFE6EA", INK, 2))
        out.append(_line(151 + col * 96, 168, 151 + col * 96, 206, INK, 2))
    # chimney
    out.append(_rounded(330, 70, 28, 58, 4, "#B98A57", INK, 3))
    out.append(_cloud(360, 58, 0.5, "#FFFFFF", 0.75))
    # tree
    out.append(_line(60, 300, 60, 220, "#8A5A3A", 8))
    out.append(_circle(60, 196, 34, "#6A9A5B", INK, 3))
    # path
    out.append(_path("M 214 300 Q 240 320 266 300 L 292 340 L 188 340 Z", "#E8D6B8", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def station_scene(v: int) -> str:
    # A busier variant of train_station, with a train and platform clock.
    return train_station(v)


def taxi_scene(v: int) -> str:
    # Taxi with a passenger in the back seat; used when a dialogue is about taking a taxi.
    p = _p(v)
    out = [svg_start(v), shadow(240, 306, 120, 13), _rounded(34, 290, 412, 8, 4, "#C9C0AF")]
    body = p["taxi"]
    out.append(_path("M 72 268 Q 76 224 116 216 L 158 214 L 190 174 Q 200 162 218 162 L 304 162 Q 322 162 333 176 L 360 214 L 396 220 Q 416 224 416 250 L 416 272 Q 416 284 404 284 L 84 284 Q 72 284 72 272 Z", body, INK, 4))
    out.append(_path("M 182 210 L 205 178 Q 210 170 220 170 L 236 170 L 236 210 Z", "#CFE6EA", INK, 3))
    out.append(_path("M 248 170 L 300 170 Q 310 170 316 178 L 338 210 L 248 210 Z", "#CFE6EA", INK, 3))
    out.append(_line(242, 168, 242, 212, INK, 3))
    out.append(_line(196, 214, 196, 280, INK, 3))
    out.append(_line(344, 214, 344, 280, INK, 3))
    out.append(_rounded(202, 238, 10, 4, 2, INK))
    out.append(_rounded(330, 238, 10, 4, 2, INK))
    out.append(_rounded(74, 246, 12, 14, 4, "#F7E6A6", INK, 2))
    out.append(_rounded(394, 246, 12, 14, 4, "#F7E6A6", INK, 2))
    out.append(_rounded(84, 278, 312, 8, 3, "#7C8792"))
    for cx in (144, 340):
        out.append(_circle(cx, 284, 27, "#3D4650", INK, 4))
        out.append(_circle(cx, 284, 12, "#B9C1C8", INK, 2))
    out.append(_rounded(208, 140, 58, 22, 6, "#FFF4CE", INK, 3))
    for i in range(4):
        out.append(_rounded(216 + i * 13, 147, 7, 7, 1.5, INK if i % 2 == 0 else "#D9695F"))
    # passenger heads visible through windows
    out.append(_circle(214, 202, 12, SKIN, INK, 2))
    out.append(_path("M 202 196 Q 202 184 214 184 Q 226 184 226 196 Q 220 190 214 190 Q 208 190 202 196 Z", HAIR, INK, 1.5))
    out.append(_circle(292, 198, 12, SKIN, INK, 2))
    out.append(_path("M 280 192 Q 280 180 292 180 Q 304 180 304 192 Q 298 186 292 186 Q 286 186 280 192 Z", HAIR, INK, 1.5))
    out.append(svg_end())
    return "\n".join(out)


def plane_scene(v: int) -> str:
    # Plane on the ground with a traveller and suitcase.
    p = _p(v)
    out = [svg_start(v)]
    out.append(_cloud(90, 88, 0.8))
    out.append(_cloud(388, 120, 0.6))
    out.append(_rounded(0, 286, 480, 74, 0, "#DCE7D1"))
    out.append(_rounded(28, 286, 424, 8, 4, "#B9B1A1"))
    # fuselage
    out.append(_path("M 92 236 Q 92 212 122 204 L 320 174 Q 376 166 400 190 Q 410 202 392 214 L 346 238 Q 326 248 300 248 L 128 248 Q 98 248 92 236 Z", "#F4F6F8", INK, 4))
    out.append(_path("M 320 174 Q 376 166 400 190 Q 388 198 372 200 L 320 208 Z", "#8FB8CE", INK, 3))
    out.append(_poly([(196, 238), (248, 238), (198, 286), (154, 286)], "#DCE3E8", INK, 3))
    out.append(_poly([(108, 214), (94, 166), (126, 172), (146, 212)], "#D9695F", INK, 3))
    for i in range(8):
        out.append(_circle(158 + i * 24, 216 - i * 3, 4.2, "#5F7F92", INK, 1.5))
    # traveller with suitcase
    out.append(person(408, 318, 0.8, p, shirt=p["shirt2"], pose="carry", hair_style="short"))
    out.append(_rounded(430, 274, 28, 34, 4, "#C98B4B", INK, 2))
    out.append(_line(444, 274, 444, 262, INK, 3))
    out.append(svg_end())
    return "\n".join(out)


SCENES = {
    "taxi": taxi,
    "plane": plane,
    "train": train,
    "train_station": train_station,
    "station_scene": station_scene,
    "taxi_scene": taxi_scene,
    "plane_scene": plane_scene,
    "tea": tea,
    "water": water,
    "rice": rice,
    "apple": apple,
    "fruit": fruit,
    "tv": tv,
    "computer": computer,
    "book": book,
    "phone": phone,
    "clock": clock,
    "cat": cat,
    "dog": dog,
    "writing": writing,
    "reading": reading,
    "sleeping": sleeping,
    "eating": eating,
    "sun_hot": sun_hot,
    "rain": rain,
    "cold": cold,
    "doctor": doctor,
    "teacher": teacher,
    "student": student,
    "mom_reading": mom_reading,
    "cinema": cinema,
    "handshake": handshake,
    "phone_call": phone_call,
    "shop_scene": shop_scene,
    "doctor_scene": doctor_scene,
    "restaurant_scene": restaurant_scene,
    "school_scene": school_scene,
    "home_tv": home_tv,
    "hospital": hospital,
    "shop": shop,
    "restaurant": restaurant,
    "home": home,
}


def render(scene: str, variant: int = 0) -> str:
    """Return one complete SVG document for ``scene``."""
    if scene not in SCENES:
        raise KeyError(f"unknown scene {scene!r}; known: {', '.join(sorted(SCENES))}")
    return SCENES[scene](variant % len(PALETTES))
