"""Original SVG scenes added for the HSK 3.0 forms 04-06 (HSK 1 and HSK 2), 2026-11-19.

They use the primitives and palettes of the HSK 1 scene library (MockExmps/HSK/_source/scenes.py) and the HSK 2
additions (MockExmps/HSK2/_source/scenes2.py), both imported unchanged, so every level shares one drawing style.
Three extra palettes (variants 4-6) give forms 04-06 their own colours. No drawing contains a word or a numeral.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "HSK" / "_source"))
sys.path.insert(0, str(ROOT / "HSK2" / "_source"))
import scenes as base  # noqa: E402
import scenes2  # noqa: E402
from scenes import (  # noqa: E402
    HAIR, INK, MUTED, SKIN, WHITE, _circle, _cloud, _ellipse, _line, _p, _path, _poly, _rounded, chair, person, shadow,
    svg_end, svg_start, table,
)
from scenes2 import GLASS, WOOD, fig, note, steam, tree, window  # noqa: E402

# Forms 04-06 draw with variants 4-6. Appending keeps variants 0-3 (forms 01-03 and the examples) unchanged.
if len(base.PALETTES) == 4:
    base.PALETTES.extend([
        {"shirt": "#2F8F9D", "shirt2": "#E07A5F", "shirt3": "#5B7DB1", "pants": "#3A4450", "accent": "#E9B949",
         "soft": "#DCEEF0", "wall": "#F3EFE7", "floor": "#E6DDCC", "sky": "#E6F0F4", "ground": "#D8E6D0",
         "taxi": "#E9B949", "car2": "#5B7DB1"},
        {"shirt": "#B5656B", "shirt2": "#3F8F6B", "shirt3": "#C98A3D", "pants": "#3E4753", "accent": "#DDA94B",
         "soft": "#F2E3E2", "wall": "#F6F0E6", "floor": "#E8DECB", "sky": "#EBF1F3", "ground": "#DCE6CF",
         "taxi": "#DDA94B", "car2": "#B5656B"},
        {"shirt": "#5C8A4F", "shirt2": "#7A6BB0", "shirt3": "#D0704F", "pants": "#3B4552", "accent": "#E2AE3C",
         "soft": "#E3EDDD", "wall": "#F2EEE5", "floor": "#E4DBC9", "sky": "#E9F1F2", "ground": "#D7E4CE",
         "taxi": "#E2AE3C", "car2": "#7A6BB0"},
    ])

DOUGH = "#F6EEDC"
OLD_HAIR = "#C9CDD2"


def plate(cx, cy, rx=150, ry=30):
    return _ellipse(cx, cy, rx, ry, "#F7F2E7", INK, 4) + _ellipse(cx, cy - 4, rx * .78, ry * .62, "#ECE4D3")


def chopsticks(x, y):
    return _line(x, y, x - 70, y + 52, "#A9703D", 5) + _line(x + 14, y + 6, x - 56, y + 58, "#A9703D", 5)


# ---------------------------------------------------------------------------
# Food
# ---------------------------------------------------------------------------

def dumplings(v):
    out = [svg_start(v, room=True), shadow(240, 300, 150, 12), plate(240, 270)]
    for cx, cy in ((168, 252), (230, 244), (292, 252), (198, 276), (262, 278)):
        out.append(_path(f"M {cx - 34} {cy + 8} Q {cx - 30} {cy - 30} {cx} {cy - 32} Q {cx + 30} {cy - 30} {cx + 34} {cy + 8} Q {cx} {cy + 16} {cx - 34} {cy + 8} Z", DOUGH, INK, 3))
        for dx in (-16, -6, 4, 14):
            out.append(_path(f"M {cx + dx} {cy - 30} q 3 6 0 12", "none", INK, 1.6, opacity=.55))
    out.append(chopsticks(412, 168))
    out.append(steam(232, 186))
    out.append(svg_end())
    return "\n".join(out)


def buns(v):
    out = [svg_start(v, room=True), shadow(240, 304, 140, 12)]
    out.append(_rounded(110, 236, 260, 66, 16, "#D9B98A", INK, 4))
    for x in range(132, 360, 26):
        out.append(_line(x, 240, x, 298, "#B9935E", 2))
    out.append(_ellipse(240, 238, 132, 20, "#E8D3A8", INK, 3))
    for cx, cy in ((178, 218), (240, 212), (302, 218)):
        out.append(_path(f"M {cx - 40} {cy + 18} Q {cx - 40} {cy - 34} {cx} {cy - 36} Q {cx + 40} {cy - 34} {cx + 40} {cy + 18} Z", WHITE, INK, 3))
        out.append(_path(f"M {cx - 10} {cy - 30} Q {cx} {cy - 22} {cx + 10} {cy - 30} M {cx} {cy - 36} L {cx} {cy - 24}", "none", INK, 2))
    out.append(steam(240, 150))
    out.append(svg_end())
    return "\n".join(out)


def bread(v):
    out = [svg_start(v, room=True), shadow(240, 300, 160, 12)]
    out.append(_rounded(70, 268, 340, 30, 10, WOOD, INK, 4))
    out.append(_path("M 96 268 Q 92 186 150 176 L 286 176 Q 340 186 336 268 Z", "#D59A5A", INK, 4))
    for x in (156, 206, 256):
        out.append(_path(f"M {x} 196 Q {x + 18} 206 {x + 30} 196", "none", "#F2D3A2", 5))
    for i, x in enumerate((352, 380)):
        out.append(_rounded(x, 196 + i * 6, 26, 72 - i * 6, 10, "#F7E3BF", INK, 3))
        out.append(_rounded(x + 4, 200 + i * 6, 18, 62 - i * 6, 8, "#FBF0DA"))
    out.append(svg_end())
    return "\n".join(out)


def vegetables(v):
    out = [svg_start(v, room=True), shadow(240, 306, 150, 12)]
    # leaves and carrots behind the basket rim
    for x, rot in ((170, -18), (206, -6), (300, 14)):
        out.append(f'<g transform="rotate({rot} {x} 220)">' + _path(f"M {x} 220 L {x - 14} 140 Q {x} 126 {x + 14} 140 Z", "#E0843E", INK, 3)
                   + _path(f"M {x - 6} 138 Q {x - 16} 110 {x - 4} 104 M {x + 4} 136 Q {x + 10} 108 {x + 20} 104", "none", "#6A9A5B", 5) + "</g>")
    out.append(_circle(254, 196, 40, "#7FB069", INK, 3) + _path("M 230 186 Q 254 170 278 186 M 236 206 Q 254 194 272 206", "none", "#5E8F4E", 3))
    out.append(_circle(342, 214, 26, "#D9534F", INK, 3) + _path("M 334 190 L 342 182 L 350 190", "none", "#6A9A5B", 4))
    # basket
    out.append(_path("M 110 222 L 370 222 L 346 300 Q 342 308 330 308 L 150 308 Q 138 308 134 300 Z", "#C98B4B", INK, 4))
    for y in (246, 270, 292):
        out.append(_line(122 + (y - 222) * .3, y, 358 - (y - 222) * .3, y, "#9C6A36", 3))
    out.append(_rounded(102, 212, 276, 16, 7, "#B57A3E", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Things
# ---------------------------------------------------------------------------

def shirt(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_line(60, 60, 420, 60, "#8A6A4A", 6))
    out.append(_path("M 240 60 L 240 76 Q 222 78 222 92", "none", INK, 4))
    out.append(_path("M 158 112 L 222 92 L 258 92 L 322 112 L 334 176 L 302 184 L 300 300 L 180 300 L 178 184 L 146 176 Z", p["shirt2"], INK, 4))
    out.append(_path("M 222 92 L 240 124 L 258 92", "none", INK, 3))
    out.append(_path("M 222 92 L 230 112 L 240 124 L 250 112 L 258 92", WHITE, INK, 2.5))
    for y in (150, 190, 230, 270):
        out.append(_circle(240, y, 4, WHITE, INK, 1.5))
    out.append(_rounded(262, 150, 28, 22, 3, "none", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def trousers(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_line(60, 56, 420, 56, "#8A6A4A", 6))
    out.append(_path("M 240 56 L 240 72", "none", INK, 4) + _line(176, 84, 304, 84, INK, 4))
    out.append(_path("M 180 88 L 300 88 L 318 308 L 260 308 L 240 150 L 220 308 L 162 308 Z", p["shirt3"], INK, 4))
    out.append(_rounded(180, 88, 120, 18, 3, p["shirt3"], INK, 3))
    for x in (198, 240, 282):
        out.append(_rounded(x - 4, 86, 8, 22, 2, "none", INK, 2))
    out.append(_path("M 196 124 Q 210 132 214 112 M 284 124 Q 270 132 266 112", "none", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def schoolbag(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 304, 110, 10)]
    out.append(_path("M 196 100 Q 196 64 240 64 Q 284 64 284 100", "none", INK, 8) + _path("M 196 100 Q 196 64 240 64 Q 284 64 284 100", "none", p["shirt"], 4))
    out.append(_rounded(150, 96, 180, 206, 34, p["shirt"], INK, 4))
    out.append(_path("M 150 160 Q 240 134 330 160", "none", INK, 3))
    out.append(_rounded(180, 196, 120, 84, 18, p["accent"], INK, 3))
    out.append(_line(190, 216, 290, 216, INK, 2.5) + _rounded(232, 208, 16, 16, 4, WHITE, INK, 2))
    out.append(_rounded(136, 186, 18, 70, 8, p["shirt"], INK, 3) + _rounded(326, 186, 18, 70, 8, p["shirt"], INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def flowers(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 300, 300, 18), shadow(240, 282, 70, 6)]
    stems = ((240, 120), (194, 140), (286, 140), (216, 100), (266, 100))
    colours = ("#D9534F", p["accent"], "#E58FB0", "#D9534F", p["shirt2"])
    for (x, y), colour in zip(stems, colours):
        out.append(_path(f"M 240 230 Q {(x + 240) / 2} {(y + 230) / 2 + 10} {x} {y}", "none", "#5E8F4E", 5))
    out.append(_path("M 226 196 Q 196 186 200 168 Q 222 176 230 196 Z", "#7FB069", INK, 2))
    for (x, y), colour in zip(stems, colours):
        for i in range(6):
            dx, dy = ((14, 0), (7, 12), (-7, 12), (-14, 0), (-7, -12), (7, -12))[i]
            out.append(_circle(x + dx, y + dy, 10, colour, INK, 2))
        out.append(_circle(x, y, 8, "#F6D36B", INK, 2))
    out.append(_path("M 206 206 L 274 206 L 264 282 L 216 282 Z", GLASS, INK, 4))
    out.append(svg_end())
    return "\n".join(out)


def bird(v):
    p = _p(v)
    out = [svg_start(v), _cloud(110, 80, .8), _cloud(380, 70, .6)]
    out.append(_path("M 30 236 Q 200 210 460 226", "none", "#8A5A3A", 12))
    out.append(_path("M 360 222 Q 392 190 430 196 Q 402 206 380 224", "#7FB069", INK, 2.5))
    out.append(_path("M 120 230 Q 100 204 76 206 Q 92 222 112 232", "#7FB069", INK, 2.5))
    out.append(_ellipse(240, 182, 50, 38, p["shirt3"], INK, 4))
    out.append(_path("M 196 176 Q 160 160 150 196 Q 176 190 200 198 Z", p["shirt3"], INK, 3))
    out.append(_ellipse(252, 192, 26, 20, "#F3E3C3", INK, 2))
    out.append(_circle(276, 144, 26, p["shirt3"], INK, 4))
    out.append(_circle(284, 138, 5, WHITE, INK, 1.5) + _circle(285, 138, 2.5, INK))
    out.append(_poly([(298, 144), (322, 150), (298, 156)], p["accent"], INK, 2.5))
    out.append(_path("M 216 210 Q 228 236 222 224 M 236 214 Q 246 236 240 224", "none", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def money(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 296, 150, 12)]
    for i, (x, y, rot) in enumerate(((150, 170, -10), (172, 182, -2), (196, 194, 6))):
        out.append(f'<g transform="rotate({rot} {x + 90} {y + 45})">' + _rounded(x, y, 180, 90, 8, ("#9CC5A1", "#E7A88F", "#9DB8D9")[i], INK, 3)
                   + _rounded(x + 10, y + 10, 160, 70, 5, "none", INK, 1.5) + _circle(x + 90, y + 45, 22, "none", INK, 2)
                   + _circle(x + 30, y + 45, 6, "none", INK, 1.5) + _circle(x + 150, y + 45, 6, "none", INK, 1.5) + "</g>")
    for x, y in ((356, 268), (390, 276), (374, 248)):
        out.append(_ellipse(x, y, 26, 10, "#C9A443", INK, 3) + _ellipse(x, y - 4, 26, 10, "#E8C766", INK, 3) + _ellipse(x, y - 4, 14, 5, "none", "#B08A2E", 2))
    out.append(svg_end())
    return "\n".join(out)


def chair_only(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 310, 90, 9)]
    out.append(f'<g transform="translate(240 306) scale(1.9)">' + _rounded(-40, -100, 14, 100, 5, p["shirt3"], INK, 2)
               + _rounded(-40, -44, 76, 12, 4, p["shirt3"], INK, 2) + _line(-34, -32, -34, 0, p["shirt3"], 7)
               + _line(30, -32, 30, 0, p["shirt3"], 7) + _rounded(-40, -100, 14, 30, 5, "#FFFFFF", INK, 1.5, opacity=.25) + "</g>")
    out.append(svg_end())
    return "\n".join(out)


def table_only(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 312, 170, 10)]
    out.append(_rounded(80, 170, 320, 24, 8, WOOD, INK, 4))
    out.append(_rounded(92, 194, 296, 18, 4, "#A27646", INK, 3))
    for x in (110, 370):
        out.append(_line(x, 212, x, 306, WOOD, 16) + _line(x - 8, 212, x - 8, 306, INK, 2.5, "butt") + _line(x + 8, 212, x + 8, 306, INK, 2.5, "butt"))
    out.append(svg_end())
    return "\n".join(out)


def table_chairs(v):
    p = _p(v)
    out = [svg_start(v, room=True), window(300, 50), shadow(240, 318, 190, 10)]
    out.append(chair(96, 314, p["shirt3"]) + chair(384, 314, p["shirt3"], flip=True))
    out.append(table(240, 250, 250, 18) + _line(140, 250, 140, 314, WOOD, 10) + _line(340, 250, 340, 314, WOOD, 10))
    out.append(_ellipse(200, 228, 30, 8, WHITE, INK, 2) + _rounded(260, 210, 28, 22, 6, p["soft"], INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def building(v):
    p = _p(v)
    out = [svg_start(v), _cloud(90, 70, .7), _cloud(400, 110, .55), tree(70, 292, .7), tree(420, 292, .8)]
    out.append(_rounded(170, 40, 140, 252, 6, "#D9DEE3", INK, 4))
    out.append(_rounded(170, 40, 140, 18, 6, "#B9C1C8", INK, 3))
    for row in range(8):
        for col in range(3):
            out.append(_rounded(186 + col * 40, 70 + row * 26, 28, 16, 3, GLASS if (row + col) % 3 else "#F6E7A8", INK, 1.5))
    out.append(_rounded(222, 252, 36, 40, 4, p["shirt3"], INK, 3) + _line(240, 254, 240, 292, INK, 2))
    out.append(_rounded(100, 180, 64, 112, 4, "#E8DFCC", INK, 3) + _rounded(316, 150, 70, 142, 4, "#E8DFCC", INK, 3))
    for x, y in ((112, 196), (136, 196), (112, 232), (136, 232), (328, 168), (356, 168), (328, 204), (356, 204), (328, 240), (356, 240)):
        out.append(_rounded(x, y, 16, 20, 2, GLASS, INK, 1.5))
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Getting around
# ---------------------------------------------------------------------------

def driving(v):
    p = _p(v)
    body = p["car2"]
    out = [svg_start(v), tree(60, 290, .7), shadow(250, 306, 150, 12)]
    out.append(_rounded(20, 292, 440, 10, 4, "#C9C0AF"))
    out.append(_path("M 80 270 Q 84 228 124 220 L 170 216 L 206 172 Q 216 160 234 160 L 318 160 Q 336 160 348 174 L 378 216 L 412 222 Q 432 226 432 252 L 432 274 Q 432 286 420 286 L 92 286 Q 80 286 80 274 Z", body, INK, 4))
    out.append(_path("M 196 212 L 222 178 Q 228 170 238 170 L 268 170 L 268 212 Z", GLASS, INK, 3))
    out.append(_path("M 280 170 L 314 170 Q 324 170 330 178 L 356 212 L 280 212 Z", GLASS, INK, 3))
    # driver behind the front window, hands on the wheel
    out.append(_circle(306, 186, 15, SKIN, INK, 2.5) + _path("M 291 182 Q 292 166 306 166 Q 320 166 321 182 Q 312 174 306 174 Q 298 174 291 182 Z", HAIR, INK, 2))
    out.append(_path("M 294 212 Q 296 200 306 200 Q 318 200 320 212 Z", p["shirt2"], INK, 2))
    out.append(_ellipse(338, 198, 6, 14, "none", INK, 3) + _line(318, 204, 334, 200, SKIN, 5))
    out.append(_line(274, 216, 274, 282, INK, 3))
    out.append(_rounded(82, 248, 12, 14, 4, "#F7E6A6", INK, 2) + _rounded(418, 248, 12, 14, 4, "#F7E6A6", INK, 2))
    for cx in (150, 360):
        out.append(_circle(cx, 286, 26, "#3D4650", INK, 4) + _circle(cx, 286, 11, "#B9C1C8", INK, 2))
    out.append(_line(30, 250, 60, 250, MUTED, 3) + _line(24, 266, 58, 266, MUTED, 3))
    out.append(svg_end())
    return "\n".join(out)


def walking(v):
    p = _p(v)
    out = [svg_start(v), _circle(404, 70, 24, "#F6C85F", INK, 3), tree(80, 290, .8), tree(410, 290, .6), _cloud(220, 70, .6)]
    out.append(_path("M 0 322 Q 240 304 480 322 L 480 340 Q 240 322 0 340 Z", "#D9CDB4", opacity=.9))
    out.append(shadow(244, 322, 60, 7))
    out.append(fig(240, 318, 1.0, p, shirt=p["shirt"], pants="#3D4A57",
                   arms=((-30, -82, -36, -60), (28, -80, 34, -58)), legs=((-16, -30, -26, -6), (14, -28, 22, -4))))
    out.append(_rounded(262, 250, 26, 30, 5, "#C98B4B", INK, 2.5) + _line(270, 252, 274, 260, INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def subway(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(0, 0, 480, 360, 18, "#E3E0DA"))
    out.append(_rounded(20, 40, 440, 18, 4, "#B9C1C8", INK, 3))
    for x in (100, 240, 380):
        out.append(_rounded(x - 30, 58, 60, 10, 3, "#F7F2C9", INK, 2))
    # train front in the tunnel
    out.append(_rounded(60, 86, 360, 196, 34, "#D9DEE3", INK, 4))
    out.append(_rounded(60, 214, 360, 22, 0, p["shirt3"]))
    out.append(_rounded(96, 108, 288, 86, 16, "#33414F", INK, 3))
    out.append(_rounded(108, 118, 120, 64, 10, GLASS, INK, 2) + _rounded(252, 118, 120, 64, 10, GLASS, INK, 2))
    out.append(_circle(110, 254, 12, "#F7E6A6", INK, 2) + _circle(370, 254, 12, "#F7E6A6", INK, 2))
    # platform and edge line
    out.append(_rounded(0, 282, 480, 78, 0, "#CFC6B4") + _line(0, 282, 480, 282, INK, 3))
    out.append(_rounded(0, 290, 480, 10, 0, p["accent"]))
    out.append(person(420, 352, .72, p, shirt=p["shirt2"], pose="stand", hair_style="long"))
    out.append(person(60, 352, .76, p, shirt=p["shirt"], pose="phone"))
    out.append(svg_end())
    return "\n".join(out)


def shopping_bags(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 322, 110, 9)]
    out.append(_rounded(48, 80, 130, 200, 6, "#E8E1D1", INK, 3) + _rounded(62, 96, 102, 70, 4, GLASS, INK, 2))
    out.append(fig(240, 318, 1.05, p, shirt=p["shirt2"], hair_style="long", skirt=p["shirt2"],
                   arms=((-34, -80, -46, -64), (34, -80, 46, -64))))
    for x, colour, w, h in ((186, p["accent"], 48, 60), (290, p["shirt3"], 54, 66), (140, p["soft"], 44, 52)):
        out.append(_rounded(x - w / 2, 252 - h / 2 + 22, w, h, 5, colour, INK, 3))
        out.append(_path(f"M {x - 12} {252 - h / 2 + 22} Q {x} {252 - h / 2 - 2} {x + 12} {252 - h / 2 + 22}", "none", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# People and actions
# ---------------------------------------------------------------------------

def painting(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 320, 150, 9)]
    # easel and canvas
    out.append(_line(292, 120, 262, 316, WOOD, 8) + _line(372, 120, 402, 316, WOOD, 8) + _line(332, 120, 332, 312, WOOD, 6))
    out.append(_rounded(262, 90, 140, 120, 4, WHITE, INK, 4))
    out.append(_path("M 272 196 L 306 150 L 330 176 L 352 140 L 392 196 Z", "#7FB069", INK, 2))
    out.append(_circle(366, 116, 12, "#F6C85F", INK, 2))
    out.append(_rounded(256, 206, 152, 10, 3, WOOD, INK, 2))
    # painter with a brush
    out.append(fig(180, 318, 1.02, p, shirt=p["shirt3"], hair_style="bun",
                   arms=((-26, -74, -23, -52), (40, -112, 74, -142))))
    out.append(_line(252, 178, 276, 156, "#8A5A3A", 4) + _circle(278, 154, 4, "#D9534F"))
    out.append(_ellipse(126, 210, 26, 16, "#E8D6B8", INK, 2) + _circle(118, 206, 4, "#D9534F") + _circle(130, 204, 4, "#5B7DB1") + _circle(134, 214, 4, "#E9B949"))
    out.append(svg_end())
    return "\n".join(out)


def laughing(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 322, 140, 9)]
    out.append(fig(176, 318, 1.0, p, shirt=p["shirt"], mouth="open", rot=-6,
                   arms=((-30, -80, -14, -70), (30, -82, 16, -72))))
    out.append(fig(304, 318, 1.0, p, shirt=p["shirt2"], hair_style="long", skirt=p["shirt2"], mouth="open", rot=6, flip=True,
                   arms=((-32, -110, -24, -140), (30, -84, 18, -72))))
    for x, y in ((120, 120), (134, 100), (360, 104), (376, 124)):
        out.append(_path(f"M {x} {y} l 10 -6 M {x} {y} l 12 2", "none", MUTED, 3))
    out.append(svg_end())
    return "\n".join(out)


def grandparents(v):
    p = _p(v)
    out = [svg_start(v), tree(70, 290, .9), _cloud(330, 70, .6), shadow(240, 322, 160, 9)]
    out.append(_rounded(110, 250, 260, 16, 6, WOOD, INK, 3) + _rounded(110, 214, 260, 14, 6, WOOD, INK, 3))
    out.append(_line(130, 266, 130, 318, WOOD, 9) + _line(350, 266, 350, 318, WOOD, 9))
    # grandfather with a walking stick
    out.append(fig(190, 318, 1.0, p, shirt=p["shirt3"], legs=((-6, -64, -6, -6), (10, -64, 12, -6)),
                   arms=((-26, -80, -20, -60), (26, -78, 34, -66))).replace(HAIR, OLD_HAIR))
    out.append(_line(232, 258, 244, 318, "#8A5A3A", 5))
    # grandmother
    out.append(fig(290, 318, 1.0, p, shirt=p["shirt2"], hair_style="bun", skirt=p["shirt2"], flip=True,
                   legs=((-6, -64, -6, -6), (10, -64, 12, -6)), arms=((-26, -80, -20, -60), (26, -80, 20, -60))).replace(HAIR, OLD_HAIR))
    out.append(_circle(184, 176, 7, "none", INK, 2) + _circle(198, 176, 7, "none", INK, 2) + _line(191, 176, 191, 176, INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def classroom(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(150, 40, 300, 130, 6, "#3E5C4F", INK, 4) + _rounded(150, 170, 300, 8, 2, WOOD, INK, 2))
    for y, w in ((78, 150), (104, 200), (130, 120)):
        out.append(_line(176, y, 176 + w, y, "#F2F2E8", 5))
    out.append(_circle(400, 104, 20, "none", "#F2F2E8", 4))
    out.append(fig(380, 318, 1.0, p, shirt=p["shirt3"], arms=((32, -112, 46, -150), (-26, -74, -23, -52))))
    # two students from behind at their desks
    for x, colour, hair in ((110, p["shirt"], "short"), (230, p["shirt2"], "long")):
        out.append(_circle(x, 238, 22, HAIR, INK, 3))
        if hair == "long":
            out.append(_rounded(x - 22, 238, 44, 30, 10, HAIR, INK, 2))
        out.append(_path(f"M {x - 30} 300 Q {x - 30} 262 {x} 260 Q {x + 30} 262 {x + 30} 300 Z", colour, INK, 3))
        out.append(_rounded(x - 52, 296, 104, 14, 4, WOOD, INK, 3) + _line(x - 40, 310, x - 40, 340, WOOD, 8) + _line(x + 40, 310, x + 40, 340, WOOD, 8))
    out.append(svg_end())
    return "\n".join(out)


def headphones(v):
    p = _p(v)
    out = [svg_start(v, room=True), window(330, 60), shadow(220, 322, 90, 8)]
    out.append(fig(220, 318, 1.08, p, shirt=p["shirt"], mouth="smile",
                   arms=((-28, -84, -10, -76), (28, -84, 10, -76))))
    out.append(_path("M 196 166 Q 196 136 220 134 Q 244 136 244 166", "none", INK, 6))
    out.append(_rounded(184, 156, 16, 26, 6, p["shirt2"], INK, 2.5) + _rounded(240, 156, 16, 26, 6, p["shirt2"], INK, 2.5))
    out.append(_rounded(208, 230, 24, 38, 5, "#3A4652", INK, 2) + _path("M 220 230 Q 214 210 192 182", "none", INK, 2))
    out.append(note(300, 160, 1.0) + note(140, 140, .8) + note(330, 230, .7))
    out.append(svg_end())
    return "\n".join(out)


def exam(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 322, 150, 9)]
    out.append(_rounded(40, 50, 120, 120, 60, WHITE, INK, 4) + _line(100, 110, 100, 72, INK, 4) + _line(100, 110, 126, 122, INK, 4))
    out.append(chair(306, 318, "#8A6A4A", flip=True))
    out.append(fig(270, 300, 1.0, p, shirt=p["shirt2"],
                   arms=((-34, -90, -40, -70), (-4, -84, -36, -62)), legs=((-24, -44, -40, -40), (-20, -40, -36, -34))))
    out.append(table(190, 262, 240, 16) + _line(90, 262, 90, 318, WOOD, 10) + _line(290, 262, 290, 318, WOOD, 10))
    out.append(f'<g transform="rotate(-6 180 236)">' + _rounded(140, 222, 90, 26, 3, WHITE, INK, 2)
               + "".join(_line(150, 230 + i * 7, 190 + (i % 2) * 20, 230 + i * 7, MUTED, 2) for i in range(3)) + "</g>")
    out.append(_line(236, 236, 214, 250, INK, 3))
    out.append(svg_end())
    return "\n".join(out)


NEW = {
    "dumplings": dumplings, "buns": buns, "bread": bread, "vegetables": vegetables, "shirt": shirt, "trousers": trousers,
    "schoolbag": schoolbag, "flowers": flowers, "bird": bird, "money": money, "chair": chair_only, "table": table_only,
    "table_chairs": table_chairs, "building": building, "driving": driving, "walking": walking, "subway": subway,
    "shopping_bags": shopping_bags, "painting": painting, "laughing": laughing, "grandparents": grandparents,
    "classroom": classroom, "headphones": headphones, "exam": exam,
}
SCENES = dict(scenes2.SCENES)
SCENES.update(NEW)


def render(scene: str, variant: int = 0) -> str:
    """Return one complete 480x360 SVG document for ``scene``."""
    if scene not in SCENES:
        raise KeyError(f"unknown scene {scene!r}")
    return SCENES[scene](variant % len(base.PALETTES))
