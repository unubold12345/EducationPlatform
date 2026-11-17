"""Original SVG scenes added for the HSK 2 mock pack.

They use the primitives and palettes of the HSK 1 scene library (MockExmps/HSK/_source/scenes.py), which is
imported unchanged, so both levels share one drawing style.  No drawing contains a word or a numeral.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "HSK" / "_source"))
import scenes as base  # noqa: E402
from scenes import (  # noqa: E402
    HAIR, INK, MUTED, SKIN, WHITE, _circle, _cloud, _ellipse, _line, _p, _path, _poly, _rounded, chair, person,
    shadow, svg_end, svg_start, table,
)

WOOD = "#B98A57"
GLASS = "#CFE6EA"


def fig(x, ground, s=1.0, p=None, shirt=None, pants=None, hair_style="short", arms=None, legs=None, rot=0,
        flip=False, skirt=None, skin=SKIN, mouth="smile"):
    """A person in the HSK 1 style with free limbs: each arm is (elbow x, y, hand x, y), each leg (knee x, y, foot x, y)."""
    p = p or _p(0)
    shirt = shirt or p["shirt"]
    pants = pants or p["pants"]
    arms = arms or ((-26, -74, -23, -52), (26, -74, 23, -52))
    legs = legs or ((-9, -28, -10, -6), (9, -28, 10, -6))
    out = [f'<g transform="translate({x} {ground}) rotate({rot}) scale({-s if flip else s} {s})">']
    for hip, (kx, ky, fx, fy) in zip((-8, 8), legs):
        out.append(_path(f"M {hip} -50 Q {kx} {ky} {fx} {fy}", "none", pants, 13))
        out.append(_ellipse(fx + 3, fy + 3, 11, 5, INK))
    if skirt:
        out.append(_path("M -17 -62 L 17 -62 L 27 -30 L -27 -30 Z", skirt, INK, 3))
    out.append(_path("M -17 -112 Q -20 -80 -16 -48 L 16 -48 Q 20 -80 17 -112 Z", shirt, INK, 3))
    out.append(_rounded(-5, -126, 10, 15, 4, skin))
    out.append(_circle(0, -143, 18, skin, INK, 3))
    out.append(_circle(-6, -146, 2.0, INK))
    out.append(_circle(6, -146, 2.0, INK))
    if mouth == "open":
        out.append(_ellipse(0, -135, 4, 5, "#8A3B3B", INK, 1.5))
    else:
        out.append(_path("M -5 -137 Q 0 -132 5 -137", "none", INK, 2))
    if hair_style == "long":
        out.append(_path("M -18 -146 Q -22 -170 0 -169 Q 22 -170 18 -146 L 20 -120 L 12 -122 L 13 -145 Q 0 -158 -13 -145 L -12 -122 L -20 -120 Z", HAIR, INK, 2))
    elif hair_style == "bun":
        out.append(_circle(0, -166, 9, HAIR, INK, 2))
        out.append(_path("M -18 -146 Q -18 -166 0 -166 Q 18 -166 18 -146 Q 8 -154 0 -153 Q -8 -154 -18 -146 Z", HAIR, INK, 2))
    else:
        out.append(_path("M -18 -146 Q -18 -167 0 -167 Q 18 -167 18 -146 Q 10 -155 0 -154 Q -10 -155 -18 -146 Z", HAIR, INK, 2))
    for shoulder, (mx, my, ex, ey) in zip((-16, 16), arms):
        out.append(_path(f"M {shoulder} -103 Q {mx} {my} {ex} {ey}", "none", shirt, 10))
        out.append(_circle(ex, ey, 5.5, skin, INK, 2))
    out.append("</g>")
    return "\n".join(out)


def ball(x, y, r, kind="foot"):
    if kind == "basket":
        return (_circle(x, y, r, "#D9793F", INK, 3) + _line(x - r, y, x + r, y, INK, 2)
                + _path(f"M {x} {y - r} Q {x + r * .6} {y} {x} {y + r}", "none", INK, 2)
                + _path(f"M {x} {y - r} Q {x - r * .6} {y} {x} {y + r}", "none", INK, 2))
    out = _circle(x, y, r, WHITE, INK, 3)
    out += _poly([(x, y - r * .45), (x + r * .43, y - r * .14), (x + r * .27, y + r * .37), (x - r * .27, y + r * .37), (x - r * .43, y - r * .14)], INK)
    for a in (-90, -18, 54, 126, 198):
        out += _line(x + r * .5 * math.cos(math.radians(a)), y + r * .5 * math.sin(math.radians(a)), x + r * .95 * math.cos(math.radians(a)), y + r * .95 * math.sin(math.radians(a)), INK, 2)
    return out


def note(x, y, s=1.0):
    return (f'<g transform="translate({x} {y}) scale({s})">' + _ellipse(0, 0, 8, 6, INK) + _line(7, 0, 7, -30, INK, 3)
            + _path("M 7 -30 Q 20 -28 22 -16", "none", INK, 3) + "</g>")


def steam(x, y):
    return "".join(_path(f"M {x + d} {y} q -8 -12 0 -24 q 8 -12 0 -24", "none", MUTED, 3, opacity=.6) for d in (-16, 0, 16))


def tree(x, y, s=1.0):
    return (f'<g transform="translate({x} {y}) scale({s})">' + _rounded(-7, -60, 14, 62, 4, "#8A5A3A", INK, 3)
            + _circle(0, -86, 38, "#7FA868", INK, 3) + _circle(-24, -66, 22, "#7FA868", INK, 3) + _circle(24, -66, 22, "#7FA868", INK, 3)
            + _circle(0, -78, 30, "#7FA868") + "</g>")


def bed(v, y=238):
    return (_rounded(66, y, 348, 66, 12, "#E8D6B8", INK, 4) + _rounded(58, y - 8, 22, 86, 8, WOOD, INK, 3)
            + _rounded(400, y + 10, 22, 68, 8, WOOD, INK, 3) + _rounded(78, y + 8, 324, 30, 10, "#FFFDF7", INK, 2))


def window(x, y, w=110, h=90, night=False):
    out = _rounded(x, y, w, h, 6, "#27364A" if night else "#DCEEF3", INK, 4)
    out += _line(x + w / 2, y, x + w / 2, y + h, INK, 3) + _line(x, y + h / 2, x + w, y + h / 2, INK, 3)
    if night:
        out += _circle(x + w * .72, y + h * .28, 11, "#F6E7A8") + _circle(x + w * .78, y + h * .24, 10, "#27364A")
        out += "".join(_circle(x + dx, y + dy, 1.8, WHITE) for dx, dy in ((18, 20), (36, 62), (86, 70), (24, 74)))
    else:
        out += _circle(x + w * .3, y + h * .34, 13, "#F6C85F", INK, 2)
    return out


# ---------------------------------------------------------------------------
# Objects
# ---------------------------------------------------------------------------

def watch(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 312, 70, 8)]
    out.append(_rounded(208, 44, 64, 272, 22, p["shirt3"], INK, 4))
    for y in (70, 92, 268, 290):
        out.append(_circle(240, y, 4, WHITE, INK, 2))
    out.append(_circle(240, 180, 76, "#D9DEE3", INK, 5))
    out.append(_circle(240, 180, 62, WHITE, INK, 3))
    for i in range(12):
        a = math.radians(i * 30)
        out.append(_line(240 + 50 * math.sin(a), 180 - 50 * math.cos(a), 240 + 57 * math.sin(a), 180 - 57 * math.cos(a), INK, 3))
    out.append(_line(240, 180, 240, 136, INK, 5))
    out.append(_line(240, 180, 270, 196, INK, 4))
    out.append(_circle(240, 180, 5, p["accent"], INK, 2))
    out.append(_rounded(316, 170, 14, 20, 4, "#B9C1C8", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def mobile(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 268, 330, 18), shadow(240, 254, 100, 8)]
    out.append(f'<g transform="rotate(-14 240 170)">')
    out.append(_rounded(176, 46, 128, 214, 20, "#2F3A46", INK, 4))
    out.append(_rounded(186, 62, 108, 176, 8, "#A9D3DF", INK, 2))
    colours = [p["shirt"], p["shirt2"], p["shirt3"], p["accent"]]
    for row in range(3):
        for col in range(3):
            out.append(_rounded(198 + col * 32, 78 + row * 36, 22, 22, 6, colours[(row + col) % 4], INK, 1.5))
    out.append(_rounded(214, 214, 52, 14, 7, WHITE, INK, 1.5))
    out.append(_circle(240, 54, 3, MUTED))
    out.append(_rounded(222, 246, 36, 5, 2.5, MUTED))
    out.append("</g>")
    out.append(svg_end())
    return "\n".join(out)


def newspaper(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 120, 9)]
    out.append(_rounded(120, 200, 240, 108, 26, p["shirt2"], INK, 4))
    out.append(_rounded(112, 240, 34, 78, 14, p["shirt2"], INK, 4))
    out.append(_rounded(334, 240, 34, 78, 14, p["shirt2"], INK, 4))
    out.append(person(240, 304, 0.95, p, shirt=p["shirt3"], pose="hands", hair_style="short"))
    out.append(_poly([(140, 176), (238, 164), (238, 282), (140, 294)], "#FBFAF4", INK, 3))
    out.append(_poly([(242, 164), (340, 176), (340, 294), (242, 282)], "#FBFAF4", INK, 3))
    out.append(_rounded(152, 184, 74, 12, 2, INK))
    out.append(_rounded(254, 174, 34, 40, 2, "#B9C1C8", INK, 1.5))
    for i in range(7):
        out.append(_line(152, 208 + i * 11, 226, 204 + i * 11, "#9AA5AF", 2.4))
    for i in range(5):
        out.append(_line(296, 180 + i * 9, 330, 184 + i * 9, "#9AA5AF", 2.4))
    for i in range(5):
        out.append(_line(254, 226 + i * 11, 330, 232 + i * 11, "#9AA5AF", 2.4))
    out.append(_circle(138, 236, 8, SKIN, INK, 2))
    out.append(_circle(342, 236, 8, SKIN, INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def milk(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 274, 330, 18), shadow(240, 260, 120, 8)]
    out.append(_path("M 150 120 L 222 120 L 216 256 L 156 256 Z", "#EAF3F5", INK, 4))
    out.append(_path("M 154 150 L 218 150 L 214 252 L 158 252 Z", WHITE))
    out.append(_path("M 154 150 Q 186 142 218 150", "none", "#C9D5DA", 3))
    out.append(_path("M 268 110 L 300 76 L 332 110 L 332 256 L 268 256 Z", WHITE, INK, 4))
    out.append(_path("M 268 110 L 332 110", "none", INK, 3))
    out.append(_rounded(288, 62, 24, 16, 4, p["shirt3"], INK, 3))
    out.append(_rounded(268, 150, 64, 60, 0, p["shirt3"], INK, 2, opacity=.9))
    out.append(_path("M 284 190 Q 280 166 300 164 Q 320 166 316 190 Z", WHITE, INK, 2))
    out.append(_circle(292, 176, 4, INK) + _circle(309, 181, 3, INK))
    out.append(svg_end())
    return "\n".join(out)


def coffee(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 280, 330, 18), shadow(240, 266, 120, 8)]
    out.append(_ellipse(232, 254, 118, 16, WHITE, INK, 4))
    out.append(_path("M 156 160 L 308 160 Q 304 250 264 252 L 200 252 Q 160 250 156 160 Z", WHITE, INK, 4))
    out.append(_ellipse(232, 160, 76, 16, "#5A3A26", INK, 4))
    out.append(_path("M 196 158 Q 232 150 268 158", "none", "#8A6142", 4))
    out.append(_path("M 306 178 Q 352 178 348 208 Q 344 234 296 230", "none", INK, 12))
    out.append(_path("M 306 178 Q 352 178 348 208 Q 344 234 296 230", "none", WHITE, 5))
    out.append(steam(232, 136))
    for x, y, r in ((368, 262, -20), (392, 250, 30), (104, 262, 15)):
        out.append(f'<g transform="rotate({r} {x} {y})">' + _ellipse(x, y, 13, 9, "#6B432B", INK, 2.5) + _path(f"M {x - 10} {y} Q {x} {y - 5} {x + 10} {y}", "none", "#2E1D12", 2) + "</g>")
    out.append(svg_end())
    return "\n".join(out)


def eggs(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 280, 330, 18), shadow(240, 262, 130, 8)]
    out.append(_ellipse(240, 232, 140, 34, WHITE, INK, 4))
    out.append(_ellipse(240, 228, 104, 22, p["soft"], INK, 2))
    for x in (198, 284):
        out.append(_path(f"M {x} 156 Q {x + 40} 160 {x + 40} 204 Q {x + 38} 236 {x} 236 Q {x - 38} 236 {x - 40} 204 Q {x - 40} 160 {x} 156 Z", "#F4E3C5", INK, 4))
        out.append(_path(f"M {x - 20} 184 Q {x - 16} 170 {x - 4} 166", "none", WHITE, 5, opacity=.8))
    out.append(svg_end())
    return "\n".join(out)


def watermelon(v):
    out = [svg_start(v, room=True), table(240, 280, 360, 18), shadow(240, 264, 150, 8)]
    out.append(_ellipse(176, 198, 104, 70, "#4F8F4A", INK, 4))
    for dx in (-70, -36, 0, 36, 70):
        out.append(_path(f"M {176 + dx * .9} 132 Q {176 + dx * 1.25} 198 {176 + dx * .9} 264", "none", "#2F6A34", 6, opacity=.85))
    out.append(_path("M 290 262 L 432 262 Q 426 176 361 172 Q 296 176 290 262 Z", "#4F8F4A", INK, 4))
    out.append(_path("M 300 256 L 422 256 Q 416 186 361 183 Q 306 186 300 256 Z", "#F3F0DC"))
    out.append(_path("M 308 256 L 414 256 Q 408 194 361 192 Q 314 194 308 256 Z", "#E0564E"))
    for x, y in ((336, 236), (361, 216), (386, 238), (350, 246), (374, 246), (361, 236)):
        out.append(_ellipse(x, y, 3, 5, INK))
    out.append(svg_end())
    return "\n".join(out)


def fish(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 284, 360, 18), shadow(240, 268, 150, 8)]
    out.append(_ellipse(240, 220, 176, 54, WHITE, INK, 4))
    out.append(_ellipse(240, 216, 140, 36, p["soft"], INK, 2))
    out.append(_path("M 120 214 Q 190 160 290 196 L 350 168 L 340 214 L 352 258 L 290 232 Q 190 264 120 214 Z", "#E7A552", INK, 4))
    out.append(_path("M 176 190 Q 190 214 176 240", "none", INK, 3))
    out.append(_circle(152, 208, 5, INK))
    for x in (212, 240, 268):
        out.append(_path(f"M {x} 196 Q {x + 12} 214 {x} 234", "none", "#B8752F", 3))
    out.append(_path("M 220 184 Q 240 164 262 186", "#E7A552", INK, 3))
    for x, y in ((112, 250), (132, 258), (372, 238)):
        out.append(_ellipse(x, y, 14, 7, "#7FA868", INK, 2))
    out.append(svg_end())
    return "\n".join(out)


def noodles(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 284, 330, 18), shadow(240, 268, 130, 8)]
    out.append(steam(240, 124))
    out.append(_ellipse(240, 170, 124, 26, "#F2D58F", INK, 4))
    for i in range(6):
        y = 156 + i * 5
        out.append(_path(f"M {136 + i * 6} {y} q 18 -12 36 0 t 36 0 t 36 0 t 36 0 t 36 0", "none", "#D9A441", 4))
    out.append(_ellipse(206, 166, 14, 8, "#7FA868", INK, 2))
    out.append(_ellipse(282, 172, 16, 9, "#E0564E", INK, 2))
    out.append(_path("M 116 170 Q 124 262 200 264 L 280 264 Q 356 262 364 170 Q 300 204 240 204 Q 180 204 116 170 Z", p["shirt2"], INK, 4))
    out.append(_rounded(206, 262, 68, 10, 4, p["shirt2"], INK, 3))
    out.append(_line(300, 86, 256, 172, "#8A5A3A", 6))
    out.append(_line(324, 92, 270, 174, "#8A5A3A", 6))
    out.append(svg_end())
    return "\n".join(out)


def bus(v):
    p = _p(v)
    out = [svg_start(v), shadow(240, 306, 190, 12)]
    out.append(_rounded(20, 292, 440, 8, 4, "#C9C0AF"))
    out.append(_rounded(40, 110, 400, 176, 22, p["car2"], INK, 4))
    out.append(_rounded(40, 110, 400, 34, 16, "#F4F6F8", INK, 4))
    for i in range(5):
        out.append(_rounded(58 + i * 66, 156, 54, 50, 6, GLASS, INK, 3))
    out.append(_rounded(388, 156, 40, 60, 6, GLASS, INK, 3))
    out.append(_rounded(124, 214, 40, 70, 4, "#E6EEF0", INK, 3) + _line(144, 214, 144, 284, INK, 2))
    out.append(_rounded(322, 214, 40, 70, 4, "#E6EEF0", INK, 3) + _line(342, 214, 342, 284, INK, 2))
    out.append(_rounded(46, 232, 396, 10, 0, WHITE, opacity=.55))
    out.append(_rounded(424, 244, 16, 16, 4, "#F7E6A6", INK, 2))
    for cx in (96, 250, 396):
        if cx == 250:
            continue
        out.append(_circle(cx, 286, 28, "#3D4650", INK, 4) + _circle(cx, 286, 12, "#B9C1C8", INK, 2))
    out.append(_circle(246, 286, 28, "#3D4650", INK, 4) + _circle(246, 286, 12, "#B9C1C8", INK, 2))
    out.append(_cloud(96, 60, .7))
    out.append(svg_end())
    return "\n".join(out)


def pencil(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 286, 380, 18)]
    out.append(f'<g transform="rotate(-8 240 200)">' + _rounded(120, 120, 240, 150, 6, "#FFFDF7", INK, 3)
               + "".join(_line(140, 150 + i * 22, 340, 150 + i * 22, "#C9D5DA", 2) for i in range(5)) + "</g>")
    for colour, rot, y in ((p["accent"], -24, 176), (p["shirt2"], 12, 226)):
        out.append(f'<g transform="rotate({rot} 240 {y})">' + _rounded(96, y - 11, 236, 22, 3, colour, INK, 3)
                   + _line(96, y, 332, y, INK, 1.5) + _rounded(76, y - 11, 22, 22, 5, "#E79C9C", INK, 3) + _rounded(94, y - 11, 10, 22, 0, "#B9C1C8", INK, 2)
                   + _poly([(332, y - 11), (378, y), (332, y + 11)], "#F2D9B3", INK, 3) + _poly([(364, y - 4), (378, y), (364, y + 4)], INK) + "</g>")
    out.append(svg_end())
    return "\n".join(out)


def door(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(150, 50, 170, 232, 4, "#DCEEF3", INK, 5))
    out.append(_rounded(150, 228, 170, 54, 0, "#CFE0C4"))
    out.append(_circle(206, 108, 20, "#F6C85F", INK, 2) + _cloud(268, 150, .5))
    out.append(_path("M 150 282 L 150 50 L 320 50 L 320 282", "none", INK, 5))
    out.append(_poly([(320, 50), (424, 22), (424, 318), (320, 282)], p["shirt3"], INK, 4))
    out.append(_poly([(336, 66), (408, 46), (408, 150), (336, 156)], "none", INK, 2.5))
    out.append(_poly([(336, 176), (408, 172), (408, 292), (336, 266)], "none", INK, 2.5))
    out.append(_circle(338, 170, 7, p["accent"], INK, 2.5))
    out.append(_rounded(56, 252, 70, 26, 6, p["shirt2"], INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def medicine(v):
    p = _p(v)
    out = [svg_start(v, room=True), table(240, 284, 360, 18), shadow(240, 268, 150, 8)]
    out.append(_rounded(130, 110, 100, 156, 14, "#C98B4B", INK, 4))
    out.append(_rounded(122, 84, 116, 34, 8, WHITE, INK, 4))
    out.append(_rounded(142, 150, 76, 86, 6, WHITE, INK, 3))
    out.append(_rounded(172, 170, 16, 46, 3, "#D9695F") + _rounded(157, 185, 46, 16, 3, "#D9695F"))
    out.append(_rounded(262, 206, 132, 60, 8, "#DCE3E8", INK, 3))
    for i in range(4):
        for j in range(2):
            out.append(_circle(284 + i * 30, 222 + j * 28, 9, WHITE, INK, 2.5))
    for x, y, r in ((286, 174, -25), (348, 160, 20)):
        out.append(f'<g transform="rotate({r} {x} {y})">' + _rounded(x - 22, y - 9, 44, 18, 9, p["shirt2"], INK, 3) + _rounded(x - 22, y - 9, 22, 18, 9, WHITE, INK, 3) + "</g>")
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Weather
# ---------------------------------------------------------------------------

def snow(v):
    p = _p(v)
    out = [svg_start(v)]
    out.append(_rounded(2, 2, 476, 356, 16, "#CBD9E4", opacity=.75))
    out.append(_path("M 2 270 Q 120 246 240 268 T 478 262 L 478 342 Q 478 358 462 358 L 18 358 Q 2 358 2 342 Z", WHITE, INK, 3))
    out.append(tree(96, 262, .8).replace("#7FA868", "#EDF3F6"))
    out.append(_circle(300, 244, 50, WHITE, INK, 4) + _circle(300, 168, 36, WHITE, INK, 4))
    out.append(_circle(288, 160, 4, INK) + _circle(312, 160, 4, INK) + _poly([(300, 168), (326, 174), (300, 180)], "#E08A3C", INK, 2))
    out.append(_path("M 282 186 Q 300 196 318 186", "none", INK, 2.5))
    out.append(_rounded(270, 194, 60, 13, 6, p["shirt2"], INK, 3) + _rounded(316, 198, 13, 40, 5, p["shirt2"], INK, 3))
    for y in (228, 250, 270):
        out.append(_circle(300, y, 4.5, INK))
    out.append(_line(254, 226, 214, 196, "#8A5A3A", 5) + _line(346, 226, 388, 198, "#8A5A3A", 5))
    out.append(_rounded(276, 118, 48, 22, 4, INK) + _rounded(262, 136, 76, 9, 4, INK))
    for i, (x, y) in enumerate(((40, 40), (120, 84), (200, 36), (64, 150), (168, 138), (230, 96), (380, 60), (430, 130), (400, 240), (30, 230), (150, 210), (440, 34), (340, 30), (210, 220))):
        out.append(_circle(x, y, 5 if i % 3 else 7, WHITE, "#9FB4C4", 1.5))
    out.append(svg_end())
    return "\n".join(out)


def cloudy(v):
    p = _p(v)
    out = [svg_start(v)]
    out.append(_rounded(2, 2, 476, 284, 16, "#B8C2CC", opacity=.8))
    for x, y, s, c in ((110, 92, 1.5, "#8D99A6"), (300, 76, 1.8, "#7C8894"), (410, 128, 1.2, "#98A3AE"), (210, 140, 1.3, "#A5AFB9")):
        out.append(_cloud(x, y, s, c, 1.0))
    out.append(_rounded(60, 206, 110, 82, 4, "#D9D2C4", INK, 3) + _poly([(48, 208), (115, 160), (182, 208)], p["shirt2"], INK, 3))
    out.append(_rounded(100, 244, 28, 44, 2, "#8A5A3A", INK, 3) + _rounded(72, 222, 22, 20, 2, "#6F7C89", INK, 2))
    out.append(_rounded(300, 186, 120, 102, 4, "#CFC8BA", INK, 3) + _poly([(288, 188), (360, 136), (432, 188)], p["shirt3"], INK, 3))
    out.append(_rounded(346, 236, 30, 52, 2, "#8A5A3A", INK, 3) + _rounded(312, 204, 24, 22, 2, "#6F7C89", INK, 2) + _rounded(386, 204, 24, 22, 2, "#6F7C89", INK, 2))
    out.append(tree(232, 288, .9).replace("#7FA868", "#6E8F62"))
    out.append(svg_end())
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Actions
# ---------------------------------------------------------------------------

def running(v):
    p = _p(v)
    out = [svg_start(v), _circle(404, 70, 26, "#F6C85F", INK, 3), tree(74, 290, .9), tree(420, 288, .6)]
    out.append(_path("M 0 318 Q 240 296 480 318 L 480 340 Q 240 318 0 340 Z", "#D9CDB4", opacity=.9))
    out.append(shadow(244, 322, 70, 8))
    out.append(fig(240, 316, 1.0, p, shirt=p["shirt2"], pants="#3D4A57", rot=8,
                   arms=((-40, -96, -30, -70), (34, -84, 40, -112)), legs=((-36, -44, -58, -22), (34, -40, 26, -4))))
    for y in (190, 214, 238):
        out.append(_line(120, y, 164, y, MUTED, 3))
    out.append(svg_end())
    return "\n".join(out)


def swimming(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(20, 96, 440, 244, 10, "#8FC7DA", INK, 4))
    for y in (156, 216, 276):
        for i in range(11):
            out.append(_rounded(28 + i * 40, y - 4, 24, 8, 4, WHITE if i % 2 else "#D9695F"))
    out.append(_circle(250, 208, 22, SKIN, INK, 3))
    out.append(_path("M 230 202 Q 232 182 252 184 Q 272 186 272 204 Q 250 192 230 202 Z", p["shirt2"], INK, 2.5))
    out.append(_rounded(252, 202, 22, 10, 5, "#3A4652", INK, 2))
    out.append(_path("M 226 222 Q 180 196 150 160 Q 140 148 130 156", "none", SKIN, 13) + _path("M 226 222 Q 180 196 150 160 Q 140 148 130 156", "none", INK, 2, opacity=.0))
    out.append(_path("M 212 232 Q 170 236 124 246", "none", p["shirt2"], 22))
    out.append(_path("M 96 250 q 16 -14 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0 t 32 0", "none", WHITE, 5))
    out.append(_path("M 110 268 q 14 -10 28 0 t 28 0 t 28 0", "none", WHITE, 4))
    for x, y in ((118, 140), (104, 164), (140, 136)):
        out.append(_circle(x, y, 5, WHITE, "#5E97A8", 1.5))
    out.append(_rounded(20, 70, 440, 28, 6, "#E5DCCB", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def football(v):
    p = _p(v)
    out = [svg_start(v)]
    out.append(_path("M 300 286 L 300 150 L 452 150 L 452 286", "none", WHITE, 8) + _path("M 300 286 L 300 150 L 452 150 L 452 286", "none", INK, 2))
    for i in range(1, 6):
        out.append(_line(300 + i * 25, 152, 300 + i * 25, 286, "#9AA5AF", 1.5))
    for i in range(1, 6):
        out.append(_line(300, 150 + i * 23, 452, 150 + i * 23, "#9AA5AF", 1.5))
    out.append(shadow(160, 322, 70, 8))
    out.append(fig(156, 316, 1.0, p, shirt=p["shirt"], pants="#3D4A57", rot=-6,
                   arms=((-44, -100, -52, -76), (40, -96, 48, -70)), legs=((-14, -28, -18, -4), (40, -46, 62, -34))))
    out.append(ball(262, 270, 20))
    out.append(_line(230, 250, 244, 258, MUTED, 3) + _line(228, 268, 240, 270, MUTED, 3))
    out.append(svg_end())
    return "\n".join(out)


def basketball(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(360, 60, 14, 220, 4, "#6F7C89", INK, 3))
    out.append(_rounded(296, 52, 92, 70, 4, WHITE, INK, 4) + _rounded(322, 82, 40, 30, 2, "none", "#D9695F", 3))
    out.append(_ellipse(322, 126, 30, 7, "none", "#D9695F", 5))
    for i in range(5):
        out.append(_line(296 + i * 13, 130, 304 + i * 9, 166, "#9AA5AF", 2))
    out.append(shadow(180, 322, 70, 8, .1))
    out.append(fig(176, 296, 1.0, p, shirt=p["shirt2"], pants="#3D4A57",
                   arms=((30, -130, 44, -168), (-36, -90, -30, -66)), legs=((-14, -30, -18, -4), (14, -30, 14, -4))))
    out.append(ball(238, 110, 21, "basket"))
    out.append(svg_end())
    return "\n".join(out)


def singing(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 320, 70, 8)]
    out.append(_poly([(120, 40), (360, 40), (300, 20), (180, 20)], p["accent"], opacity=.35))
    out.append(fig(240, 316, 1.05, p, shirt=p["shirt2"], hair_style="long", mouth="open", skirt=p["shirt2"],
                   arms=((-30, -80, -24, -56), (30, -100, 14, -124))))
    out.append(_line(258, 188, 252, 204, INK, 5) + _circle(260, 180, 9, "#6F7C89", INK, 3))
    out.append(note(338, 130, 1.1) + note(380, 190, .8) + note(118, 150, .9) + note(92, 220, .7))
    out.append(svg_end())
    return "\n".join(out)


def dancing(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 320, 130, 9)]
    out.append(fig(186, 316, 1.0, p, shirt=p["shirt3"], rot=-5,
                   arms=((-40, -120, -34, -156), (36, -100, 52, -92)), legs=((-20, -30, -26, -4), (22, -30, 30, -6))))
    out.append(fig(296, 316, 1.0, p, shirt=p["shirt2"], hair_style="long", skirt=p["shirt2"], rot=6, flip=True,
                   arms=((-40, -120, -34, -156), (36, -100, 54, -92)), legs=((-16, -30, -20, -4), (24, -34, 36, -14))))
    out.append(note(86, 110, 1.0) + note(396, 96, 1.0) + note(410, 200, .7))
    out.append(svg_end())
    return "\n".join(out)


def getting_up(v):
    p = _p(v)
    out = [svg_start(v, room=True), window(318, 54), shadow(240, 318, 150, 9), bed(v)]
    out.append(_rounded(96, 196, 70, 62, 14, "#F7F2E7", INK, 3))
    out.append(_path("M 200 250 Q 280 236 400 250 L 400 286 Q 280 296 200 286 Z", p["shirt3"], INK, 3))
    out.append(fig(190, 300, 1.0, p, shirt=p["soft"], pants=p["shirt3"],
                   arms=((-44, -130, -40, -168), (44, -130, 40, -168)), legs=((10, -50, 40, -50), (10, -44, 40, -44)), mouth="open"))
    out.append(_rounded(200, 250, 200, 40, 8, p["shirt3"], INK, 3))
    out.append(_circle(56, 250, 20, "#D9695F", INK, 3) + _circle(56, 250, 14, WHITE, INK, 2) + _line(56, 250, 56, 240, INK, 2.5) + _line(56, 250, 64, 252, INK, 2.5))
    out.append(_circle(42, 230, 6, "#D9695F", INK, 2) + _circle(70, 230, 6, "#D9695F", INK, 2))
    out.append(_rounded(30, 270, 52, 12, 4, WOOD, INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def washing(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_line(20, 70, 460, 56, INK, 3))
    out.append(_path("M 300 62 L 330 62 L 350 80 L 338 92 L 330 86 L 330 132 L 300 132 L 300 86 L 292 92 L 280 80 Z", p["shirt"], INK, 3))
    out.append(_path("M 384 60 L 430 58 L 432 124 L 412 124 L 408 86 L 404 124 L 384 124 Z", p["shirt3"], INK, 3))
    out.append(shadow(210, 322, 120, 9))
    out.append(person(150, 318, 1.0, p, shirt=p["shirt2"], pose="hands", hair_style="bun"))
    out.append(_rounded(196, 300, 8, 20, 2, WOOD, INK, 2) + _rounded(300, 300, 8, 20, 2, WOOD, INK, 2))
    out.append(_path("M 176 236 L 332 236 L 318 302 L 190 302 Z", "#B9C1C8", INK, 4))
    out.append(_ellipse(254, 236, 78, 12, "#DCEEF3", INK, 3))
    for x, y, r in ((216, 228, 13), (240, 220, 16), (270, 226, 14), (296, 230, 10), (228, 212, 8), (262, 208, 9)):
        out.append(_circle(x, y, r, WHITE, "#9FB4C4", 2))
    out.append(_path("M 196 232 Q 214 206 236 228 L 226 240 Z", p["accent"], INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def sick(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 318, 150, 9), bed(v)]
    out.append(_rounded(96, 224, 86, 34, 14, "#F7F2E7", INK, 3))
    out.append(_path("M 180 250 Q 250 232 400 250 L 400 286 Q 250 298 180 286 Z", p["shirt3"], INK, 3))
    out.append(_circle(140, 222, 25, "#F4CDB4", INK, 3))
    out.append(_path("M 118 216 Q 118 198 140 198 Q 162 198 162 216 Q 150 208 140 208 Q 130 208 118 216 Z", HAIR, INK, 2))
    out.append(_rounded(122, 200, 36, 14, 5, WHITE, INK, 2.5))
    out.append(_path("M 130 224 l 6 -3 M 146 221 l 6 3", "none", INK, 2) + _path("M 134 236 Q 140 232 146 236", "none", INK, 2))
    out.append(_circle(126, 230, 5, "#E79C9C", opacity=.7) + _circle(154, 230, 5, "#E79C9C", opacity=.7))
    out.append(_line(146, 236, 176, 226, WHITE, 5) + _line(146, 236, 176, 226, INK, 1.5) + _circle(178, 225, 4, "#D9695F", INK, 1.5))
    out.append(_rounded(414, 214, 52, 100, 6, WOOD, INK, 3))
    out.append(_rounded(424, 180, 16, 34, 4, "#C98B4B", INK, 2.5) + _rounded(422, 174, 20, 9, 3, WHITE, INK, 2))
    out.append(_path("M 444 190 L 460 190 L 458 214 L 446 214 Z", "#DCEEF3", INK, 2.5))
    out.append(svg_end())
    return "\n".join(out)


def birthday(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    for x, y, c in ((70, 96, p["shirt2"]), (112, 64, p["accent"]), (404, 78, p["shirt3"])):
        out.append(_path(f"M {x} {y + 30} q -8 40 4 90", "none", MUTED, 2) + _ellipse(x, y, 24, 30, c, INK, 3) + _poly([(x - 5, y + 30), (x + 5, y + 30), (x, y + 38)], c, INK, 2))
    out.append(person(132, 300, 1.2, p, shirt=p["shirt2"], pose="wave", hair_style="long", child=True))
    out.append(_poly([(116, 150), (148, 150), (132, 108)], p["accent"], INK, 3) + _circle(132, 106, 6, "#D9695F", INK, 2))
    out.append(table(240, 286, 340, 18))
    out.append(_rounded(220, 208, 140, 60, 8, "#F7E3D0", INK, 4))
    out.append(_path("M 220 226 q 12 16 23 0 t 23 0 t 24 0 t 23 0 t 24 0 t 23 0", "none", "#E79C9C", 6))
    for i in range(5):
        x = 240 + i * 25
        out.append(_rounded(x - 3, 180, 6, 28, 2, (p["shirt3"], p["shirt2"])[i % 2], INK, 2) + _path(f"M {x} 166 q 7 8 0 14 q -7 -6 0 -14 Z", "#F6C85F", INK, 1.5))
    out.append(_ellipse(290, 268, 96, 8, WHITE, INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def gift(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 322, 140, 9)]
    out.append(fig(150, 318, 1.0, p, shirt=p["shirt2"], hair_style="long", skirt=p["shirt2"],
                   arms=((-26, -74, -23, -52), (40, -92, 62, -88))))
    out.append(fig(336, 318, 1.0, p, shirt=p["shirt3"], flip=True, mouth="open",
                   arms=((-26, -74, -23, -52), (36, -86, 50, -72))))
    out.append(_rounded(214, 206, 62, 50, 4, p["accent"], INK, 4))
    out.append(_rounded(240, 206, 10, 50, 0, "#D9695F") + _rounded(214, 226, 62, 10, 0, "#D9695F"))
    out.append(_path("M 245 206 Q 222 178 228 200 Z", "#D9695F", INK, 3) + _path("M 245 206 Q 268 178 262 200 Z", "#D9695F", INK, 3))
    out.append(svg_end())
    return "\n".join(out)


def waiter(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(190, 322, 70, 8)]
    out.append(table(378, 268, 150, 14) + chair(440, 310, WOOD, flip=True))
    out.append(_ellipse(378, 250, 30, 6, WHITE, INK, 2.5) + _path("M 346 222 L 352 250 L 362 250 L 356 222 Z", GLASS, INK, 2))
    out.append(fig(186, 318, 1.05, p, shirt=WHITE, pants="#2F3A46",
                   arms=((-28, -76, -24, -54), (44, -110, 58, -150))))
    out.append(_path("M 170 206 L 182 206 L 186 262 L 170 266 Z", "#2F3A46", INK, 2) + _path("M 202 206 L 190 206 L 186 262 L 202 266 Z", "#2F3A46", INK, 2))
    out.append(_poly([(178, 192), (186, 198), (178, 204)], INK) + _poly([(194, 192), (186, 198), (194, 204)], INK))
    out.append(_ellipse(250, 156, 62, 9, "#B9C1C8", INK, 3))
    out.append(_path("M 212 150 Q 214 124 240 124 Q 266 124 268 150 Z", "#DCE3E8", INK, 3) + _circle(240, 120, 5, "#6F7C89", INK, 2))
    out.append(_path("M 276 130 L 300 130 L 296 150 L 280 150 Z", GLASS, INK, 2.5))
    out.append(svg_end())
    return "\n".join(out)


def travel(v):
    p = _p(v)
    out = [svg_start(v), _cloud(100, 70, .8), _cloud(380, 96, .6), shadow(240, 318, 140, 9)]
    out.append(person(170, 314, 1.02, p, shirt=p["shirt2"], pose="wave", hair_style="long"))
    out.append(_path("M 150 146 L 190 146 L 196 136 L 144 136 Z", p["accent"], INK, 3) + _ellipse(170, 148, 36, 6, p["accent"], INK, 3))
    out.append(_line(296, 150, 296, 206, INK, 5) + _line(346, 150, 346, 206, INK, 5) + _line(294, 150, 348, 150, INK, 6))
    out.append(_rounded(268, 200, 106, 104, 12, p["shirt3"], INK, 4))
    out.append(_line(268, 236, 374, 236, INK, 3) + _line(268, 270, 374, 270, INK, 3))
    out.append(_rounded(308, 218, 26, 10, 4, WHITE, INK, 2))
    out.append(_circle(288, 310, 9, "#3D4650", INK, 3) + _circle(354, 310, 9, "#3D4650", INK, 3))
    out.append(_rounded(206, 268, 46, 40, 8, p["shirt"], INK, 3) + _path("M 216 268 Q 229 246 242 268", "none", INK, 4))
    out.append(svg_end())
    return "\n".join(out)


def office(v):
    p = _p(v)
    out = [svg_start(v, room=True), window(44, 44, 100, 84, night=True), shadow(250, 322, 150, 9)]
    out.append(chair(176, 318, "#6F7C89"))
    out.append(person(196, 318, 0.96, p, shirt=p["shirt3"], pose="write", hair_style="short"))
    out.append(_rounded(120, 240, 320, 16, 6, WOOD, INK, 3) + _line(144, 256, 144, 314, WOOD, 10) + _line(416, 256, 416, 314, WOOD, 10))
    out.append(_rounded(268, 148, 124, 80, 8, "#2F3A46", INK, 4) + _rounded(278, 158, 104, 60, 3, "#A9D3DF"))
    for i in range(4):
        out.append(_line(288, 170 + i * 12, 288 + (70, 50, 80, 40)[i], 170 + i * 12, WHITE, 3))
    out.append(_rounded(322, 228, 16, 12, 0, "#6F7C89", INK, 2) + _rounded(300, 236, 60, 6, 3, "#6F7C89", INK, 2))
    for i in range(4):
        out.append(_rounded(398 - i * 2, 228 - i * 7, 44, 8, 2, "#FFFDF7", INK, 2))
    out.append(_rounded(232, 222, 30, 18, 4, WHITE, INK, 2.5) + _path("M 262 226 q 10 4 0 10", "none", INK, 2.5))
    out.append(svg_end())
    return "\n".join(out)


def hotel(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(250, 50, 170, 96, 6, "#F7F2E7", INK, 3))
    for i in range(4):
        for j in range(2):
            x, y = 272 + i * 38, 70 + j * 38
            out.append(_circle(x, y, 4, INK) + _circle(x, y + 12, 7, "none", p["accent"], 3) + _line(x, y + 19, x, y + 28, p["accent"], 3))
    out.append(person(336, 300, 1.0, p, shirt=p["shirt3"], pose="hands", hair_style="bun"))
    out.append(_rounded(220, 210, 240, 108, 6, WOOD, INK, 4) + _rounded(212, 198, 256, 18, 5, "#8A5A3A", INK, 3))
    out.append(_path("M 392 198 Q 392 180 410 180 Q 428 180 428 198 Z", p["accent"], INK, 3) + _circle(410, 177, 4, INK))
    out.append(shadow(120, 322, 80, 8))
    out.append(person(104, 318, 1.0, p, shirt=p["shirt2"], pose="point", hair_style="short"))
    out.append(_rounded(150, 258, 50, 56, 8, p["shirt"], INK, 3) + _path("M 162 258 Q 175 236 188 258", "none", INK, 4))
    out.append(svg_end())
    return "\n".join(out)


def bus_stop(v):
    p = _p(v)
    out = [svg_start(v), _cloud(110, 66, .7)]
    out.append(_rounded(-30, 190, 130, 96, 14, p["car2"], INK, 4) + _rounded(30, 204, 54, 36, 5, GLASS, INK, 3) + _circle(60, 286, 18, "#3D4650", INK, 4))
    out.append(_line(160, 286, 160, 96, "#6F7C89", 8) + _circle(160, 86, 30, p["shirt3"], INK, 4))
    out.append(_rounded(142, 76, 36, 18, 5, WHITE, INK, 2.5) + _circle(150, 96, 4, WHITE) + _circle(170, 96, 4, WHITE))
    out.append(_line(216, 286, 216, 150, "#6F7C89", 6) + _line(440, 286, 440, 150, "#6F7C89", 6) + _rounded(204, 138, 248, 16, 6, "#8FB8CE", INK, 3))
    out.append(shadow(330, 322, 130, 9))
    out.append(person(262, 316, 0.95, p, shirt=p["shirt2"], pose="stand", hair_style="long"))
    out.append(person(330, 316, 1.0, p, shirt=p["shirt"], pose="phone", hair_style="short"))
    out.append(person(398, 316, 0.95, p, shirt=p["shirt3"], pose="carry", hair_style="bun"))
    out.append(svg_end())
    return "\n".join(out)


def siblings(v):
    p = _p(v)
    out = [svg_start(v, room=True), shadow(240, 322, 120, 9)]
    out.append(person(190, 318, 1.12, p, shirt=p["shirt3"], pose="stand", hair_style="short"))
    out.append(person(300, 318, 0.98, p, shirt=p["shirt2"], pose="wave", hair_style="long", child=True))
    out.append(_line(246, 118, 246, 316, MUTED, 2) + "".join(_line(240, y, 252, y, MUTED, 2) for y in range(130, 316, 24)))
    out.append(svg_end())
    return "\n".join(out)


def cooking(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(250, 214, 200, 104, 6, "#DCE3E8", INK, 4) + _rounded(250, 206, 200, 14, 4, "#6F7C89", INK, 3))
    out.append(_circle(290, 250, 8, INK) + _circle(320, 250, 8, INK) + _rounded(360, 244, 70, 56, 4, "#B9C1C8", INK, 3))
    out.append(_path("M 286 176 L 386 176 Q 384 206 356 206 L 316 206 Q 288 206 286 176 Z", "#3D4650", INK, 4) + _line(386, 182, 434, 172, "#3D4650", 8))
    out.append(steam(336, 160))
    out.append(_rounded(300, 60, 130, 40, 6, "#B9C1C8", INK, 3) + _poly([(320, 100), (410, 100), (392, 124), (338, 124)], "#9AA5AF", INK, 3))
    out.append(shadow(170, 322, 70, 8))
    out.append(fig(170, 318, 1.02, p, shirt=p["shirt2"], hair_style="bun",
                   arms=((-26, -74, -23, -52), (44, -110, 78, -120))))
    out.append(_path("M 154 232 L 186 232 L 190 286 L 150 286 Z", WHITE, INK, 3) + _line(158, 232, 164, 210, WHITE, 4) + _line(182, 232, 176, 210, WHITE, 4))
    out.append(_line(250, 196, 300, 180, "#8A5A3A", 5))
    out.append(svg_end())
    return "\n".join(out)


def tickets(v):
    p = _p(v)
    out = [svg_start(v, room=True)]
    out.append(_rounded(210, 40, 240, 280, 8, "#E8E1D1", INK, 4))
    out.append(_rounded(240, 80, 180, 130, 8, GLASS, INK, 4))
    out.append(person(330, 262, 0.9, p, shirt=p["shirt3"], pose="hands", hair_style="bun"))
    out.append(_rounded(210, 206, 240, 114, 0, "#E8E1D1") + _line(210, 206, 450, 206, INK, 4) + _rounded(228, 198, 204, 16, 5, WOOD, INK, 3))
    out.append(_path("M 296 206 Q 330 182 364 206", "#2F3A46", INK, 3))
    out.append(shadow(130, 322, 70, 8))
    out.append(fig(126, 318, 1.0, p, shirt=p["shirt2"], arms=((-26, -74, -23, -52), (44, -104, 78, -112))))
    for dx, dy, c in ((0, 0, "#FFFDF7"), (10, -12, p["accent"])):
        out.append(f'<g transform="rotate(-12 {236 + dx} {188 + dy})">' + _rounded(206 + dx, 176 + dy, 60, 26, 4, c, INK, 2.5)
                   + _line(250 + dx, 178 + dy, 250 + dx, 200 + dy, INK, 1.5) + _line(214 + dx, 186 + dy, 240 + dx, 186 + dy, MUTED, 2.5) + "</g>")
    out.append(svg_end())
    return "\n".join(out)


def kids_playing(v):
    p = _p(v)
    out = [svg_start(v), _circle(410, 70, 26, "#F6C85F", INK, 3), tree(70, 290, .9), _cloud(220, 70, .7), shadow(240, 322, 150, 9)]
    out.append(fig(150, 318, .8, p, shirt=p["shirt2"], hair_style="long", skirt=p["shirt2"],
                   arms=((-36, -120, -30, -150), (36, -120, 34, -152)), legs=((-14, -30, -18, -4), (14, -30, 14, -4)), mouth="open"))
    out.append(fig(338, 318, .8, p, shirt=p["shirt3"], flip=True, mouth="open",
                   arms=((-40, -110, -50, -134), (40, -110, 52, -136)), legs=((-20, -30, -28, -4), (20, -30, 26, -6))))
    out.append(ball(244, 150, 20) + _path("M 190 190 Q 244 110 300 190", "none", MUTED, 2, opacity=.6))
    out.append(svg_end())
    return "\n".join(out)


SCENES = dict(base.SCENES)
SCENES.update({
    "watch": watch, "mobile": mobile, "newspaper": newspaper, "milk": milk, "coffee": coffee, "eggs": eggs,
    "watermelon": watermelon, "fish": fish, "noodles": noodles, "bus": bus, "pencil": pencil, "door": door,
    "medicine": medicine, "snow": snow, "cloudy": cloudy, "running": running, "swimming": swimming,
    "football": football, "basketball": basketball, "singing": singing, "dancing": dancing, "getting_up": getting_up,
    "washing": washing, "sick": sick, "birthday": birthday, "gift": gift, "waiter": waiter, "travel": travel,
    "office": office, "hotel": hotel, "bus_stop": bus_stop, "siblings": siblings, "cooking": cooking,
    "tickets": tickets, "kids_playing": kids_playing,
})


def render(scene: str, variant: int = 0) -> str:
    """Return one complete 480x360 SVG document for ``scene``."""
    if scene not in SCENES:
        raise KeyError(f"unknown scene {scene!r}")
    return SCENES[scene](variant % len(base.PALETTES))
