"""The four-picture options of each TOPIK form, drawn from the forms' English scene briefs with scenes.py.

  python -X utf8 MockExmps/TOPIK/_source/pictures.py [--only=topik1-mock-01] [--png]

Writes MockExmps/TOPIK/<topik-i|topik-ii>/mock-0N/l<NN>-<1..4>.svg (scripts/build-topik-mocks.mjs copies them to
public/exam-assets/topik/<slug>/). --png also renders artifacts/topik-pictures/<slug>-l<NN>.png contact sheets with
artifacts/resvg/resvg.exe so the four options can be checked side by side against the brief.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scenes import (DOOR, FORWARD, LOW, POINT, REACH, UP_TO_EAR, big_box, blackboard, bookshelf, bp_monitor,  # noqa: E402
                    chair, clipboard, counter, cross_sign, desk, door, held_bag, held_book, held_umbrella, INK, lying_umbrella,
                    medicine_bag, path, pen, person, phone, plant, rect, scale_platform, school_desk, svg, window,
                    circle, ellipse, hsk, line, poly, WHITE, SKIN)

ROOT = Path(__file__).resolve().parents[3]
TOPIK = ROOT / 'MockExmps' / 'TOPIK'
FLOOR = 318
# Shirt colours: a woman is drawn with long hair (or a bun), a man with short hair.
RED, BLUE, GREEN, PURPLE, ORANGE, TEAL = '#C9655C', '#4F7CAC', '#3E8E7E', '#8B6BB1', '#D98B4F', '#4C8B7A'


def woman(x, **kw):
    kw.setdefault('shirt', RED)
    return person(x, kw.pop('ground', FLOOR), woman=True, **kw)


def man(x, **kw):
    kw.setdefault('shirt', BLUE)
    return person(x, kw.pop('ground', FLOOR), **kw)


# --- TOPIK Ⅰ mock 01 ---------------------------------------------------------------------------------------------

def classroom():
    return [blackboard(40, 44), window(330, 46, 110, 86), school_desk(48, 272, scale=0.5), school_desk(432, 272, scale=0.5)]


def i01_l15():
    room = classroom()
    hand = FORWARD[4:]
    return [
        svg(*room, woman(190, right=FORWARD, front=held_umbrella(*hand)), man(300, flip=True)),
        svg(*room, woman(190), man(300, flip=True, right=FORWARD, front=held_bag(*hand))),
        svg(*room, chair(392, FLOOR), lying_umbrella(334, FLOOR - 12, 78),
            man(300, bend=28, right=LOW, left=(-16, -103, 4, -70, 20, -40)), woman(170)),
        svg(*room, woman(190, right=REACH), man(300, flip=True, right=FORWARD, front=held_umbrella(*hand))),
    ]


def bookstore():
    return [window(18, 56, 100, 92), bookshelf(124, 300, 80, 210, seed=1), bookshelf(300, 300, 80, 210, seed=5),
            door(394, 300, 72, 196, hinge='left')]


def i01_l16():
    apron = GREEN
    return [
        svg(*bookstore(), man(230, flip=True, right=POINT, apron=apron), woman(292, flip=True, bag=ORANGE, shirt=PURPLE)),
        svg(*bookstore(), woman(208, bag=ORANGE, shirt=PURPLE), man(270, right=POINT, apron=apron)),
        svg(*bookstore(), woman(230, flip=True, right=POINT, apron=apron), man(292, flip=True, bag=ORANGE, shirt=TEAL)),
        svg(*bookstore(), man(212, ground=FLOOR - 16, right=FORWARD, apron=apron, front=held_book(*FORWARD[4:], thick=24)),
            counter(150, FLOOR, 150, 70),
            woman(318, flip=True, right=REACH, left=(-16, -103, 10, -98, 26, -94), bag=ORANGE, shirt=PURPLE)),
    ]


# --- TOPIK Ⅱ mock 01 ---------------------------------------------------------------------------------------------

def corridor(open_):
    return [rect(0, 230, 480, 6, 0, '#D8CDBA'), door(250, 300, 78, 186, open_=open_, hinge='right'), plant(40, 300),
            rect(120, 70, 86, 60, 4, '#E8E2D4', INK, 2), rect(128, 78, 70, 44, 2, '#BFD3C6')]


CARRY = dict(right=(16, -103, 32, -96, 26, -84), left=(-16, -103, -32, -96, -26, -84), front=big_box(0, -86, 66, 52))


def ii01_l01():
    holder = dict(flip=True, right=DOOR)
    return [
        svg(*corridor(True), man(170, **CARRY), woman(400, **holder)),
        svg(*corridor(False), man(110, right=(16, -103, 30, -92, 40, -80), left=(-16, -103, 6, -88, 30, -78)),
            woman(240, flip=True, right=(16, -103, 30, -92, 40, -80), left=(-16, -103, 6, -88, 30, -78)),
            big_box(175, FLOOR - 82, 92, 50)),
        svg(*corridor(True), woman(170, **CARRY), man(400, **holder)),
        svg(*corridor(False), woman(170, **CARRY), chair(430, FLOOR, flip=True),
            man(425, seated=True, flip=True, right=UP_TO_EAR, front=phone(*UP_TO_EAR[4:])), desk(425, FLOOR - 40, 104)),
    ]


def clinic():
    return [cross_sign(84, 82), window(300, 50, 120, 86)]


def bp_scene(patient_woman):
    """Patient seated at the desk with the right sleeve rolled up and the arm on the desk; the other person, in a white
    coat, wraps the cuff round the patient's upper arm."""
    arm = (16, -103, 30, -78, 54, -62)
    cuff = rect(14, -98, 16, 18, 4, '#4A5560', INK, 2)
    patient = (woman if patient_woman else man)(170, seated=True, right=arm, sleeve_rolled=('right',), front=cuff,
                                                 shirt=PURPLE if patient_woman else TEAL)
    nurse = (man if patient_woman else woman)(250, flip=True, coat=True, hair_style=None if patient_woman else 'bun',
                                              right=(16, -103, 34, -100, 50, -96), left=(-16, -103, 14, -92, 46, -88))
    tube = path('M 192 238 Q 250 280 300 250', 'none', '#3E4750', 2.5)
    return svg(*clinic(), nurse, desk(300, FLOOR - 50, 190), bp_monitor(320, FLOOR - 64), chair(170, FLOOR), patient, tube)


def ii01_l02():
    return [
        bp_scene(True),
        bp_scene(False),
        svg(*clinic(), desk(330, FLOOR - 50, 150), scale_platform(170, FLOOR), woman(170, ground=FLOOR - 12, shirt=PURPLE),
            man(290, flip=True, coat=True, left=(-16, -103, -27, -86, -10, -84), right=(16, -103, 30, -92, 6, -86),
                props=clipboard(-6, -88), front=pen(6, -86))),
        svg(*clinic(), desk(300, FLOOR - 50, 190), chair(170, FLOOR),
            woman(170, seated=True, shirt=PURPLE, right=(16, -103, 30, -78, 54, -62), sleeve_rolled=('right',)),
            man(250, flip=True, coat=True, right=(16, -103, 32, -96, 44, -90), front=medicine_bag(44, -90))),
    ]


# --- TOPIK Ⅰ mock 02 ---------------------------------------------------------------------------------------------

def tree(x, y_floor, s=1.0):
    return (rect(x - 7 * s, y_floor - 90 * s, 14 * s, 90 * s, 4, '#8B6A4A', INK, 2)
            + circle(x, y_floor - 118 * s, 44 * s, '#6E9E62', INK, 2.5) + circle(x - 28 * s, y_floor - 96 * s, 26 * s, '#7FAE6E', INK, 2)
            + circle(x + 30 * s, y_floor - 100 * s, 28 * s, '#7FAE6E', INK, 2))


def park():
    return [hsk._cloud(110, 60, 0.8), hsk._cloud(380, 48, 0.6), tree(60, 290, 0.9), tree(430, 288, 1.0),
            path('M 0 330 Q 240 300 480 326 L 480 360 L 0 360 Z', '#E9DEC5', None, 0)]


def dog(x, y, facing=-1, colour='#C98B4B', sleeping=False):
    """A small dog standing (or lying asleep) on the ground at y; ``facing`` -1 looks left, 1 right."""
    f = facing
    if sleeping:
        return (ellipse(x, y - 11, 28, 11, colour, INK, 2.5) + circle(x + f * 26, y - 12, 11, colour, INK, 2.5)
                + ellipse(x + f * 22, y - 20, 5, 8, '#8B5A2B', INK, 1.5) + path(f'M {x + f * 24} {y - 13} q {f * 4} 3 {f * 8} 0', 'none', INK, 2)
                + path(f'M {x - f * 26} {y - 8} q {-f * 12} 2 {-f * 6} 10', 'none', colour, 6))
    out = ''.join(line(x + dx, y - 20, x + dx, y - 2, colour, 6) for dx in (-16, -8, 10, 17))
    out += ellipse(x, y - 26, 24, 12, colour, INK, 2.5)
    out += path(f'M {x - f * 22} {y - 30} q {-f * 12} -8 {-f * 10} -20', 'none', colour, 5)
    out += circle(x + f * 26, y - 40, 12, colour, INK, 2.5) + ellipse(x + f * 20, y - 46, 5, 9, '#8B5A2B', INK, 1.5)
    out += circle(x + f * 30, y - 42, 2, INK) + circle(x + f * 37, y - 38, 2.5, INK)
    out += rect(x + f * 16 - 4, y - 36, 8, 6, 2, '#D9695F', INK, 1.5)
    return out


def leash(x1, y1, x2, y2):
    return path(f'M {x1} {y1} Q {(x1 + x2) / 2} {max(y1, y2) + 18} {x2} {y2}', 'none', '#D9695F', 2.5)


def held_cat(cx, cy):
    c = '#8A8F98'
    return (ellipse(cx, cy + 6, 22, 15, c, INK, 2) + circle(cx + 14, cy - 10, 11, c, INK, 2)
            + poly([(cx + 6, cy - 17), (cx + 9, cy - 28), (cx + 14, cy - 20)], c, INK, 1.5) + poly([(cx + 15, cy - 20), (cx + 21, cy - 28), (cx + 22, cy - 16)], c, INK, 1.5)
            + circle(cx + 11, cy - 11, 1.8, INK) + circle(cx + 18, cy - 11, 1.8, INK) + path(f'M {cx - 20} {cy + 8} q -14 -4 -10 -18', 'none', c, 5))


def bench(x, y_floor, w=190):
    return (rect(x - w / 2, y_floor - 52, w, 12, 4, '#B98A57', INK, 2.5) + rect(x - w / 2, y_floor - 92, w, 10, 4, '#B98A57', INK, 2.5)
            + rect(x - w / 2, y_floor - 74, w, 10, 4, '#B98A57', INK, 2.5)
            + line(x - w / 2 + 14, y_floor - 40, x - w / 2 + 14, y_floor, '#6E5440', 7) + line(x + w / 2 - 14, y_floor - 40, x + w / 2 - 14, y_floor, '#6E5440', 7))


PET = (16, -103, 30, -70, 42, -38)


def i02_l15():
    return [
        svg(*park(), dog(255, FLOOR, facing=-1), woman(175, bend=30, right=PET), man(330, flip=True, right=(16, -103, 26, -76, 26, -56)),
            leash(304, 264, 239, 284), v=0, room=False),
        svg(*park(), woman(200, right=(16, -103, 28, -88, 14, -84), left=(-16, -103, -26, -88, -8, -82), front=held_cat(4, -84)),
            man(300, flip=True, right=(16, -103, 34, -104, 64, -100)), v=0, room=False),
        svg(*park(), dog(255, FLOOR, facing=-1), man(175, bend=30, right=PET), woman(330, flip=True, right=(16, -103, 26, -76, 26, -56)),
            leash(304, 264, 239, 284), v=0, room=False),
        svg(*park(), bench(240, FLOOR - 10), man(195, seated=True, ground=FLOOR - 14), woman(285, seated=True, ground=FLOOR - 14, flip=True),
            dog(240, FLOOR + 22, facing=1, sleeping=True), v=0, room=False),
    ]


def kitchen():
    counter_top = FLOOR - 104
    return [window(170, 40, 100, 76), rect(18, 30, 120, 70, 6, '#E6DCC8', INK, 2), line(78, 30, 78, 100, INK, 2),
            rect(14, counter_top, 236, FLOOR - counter_top, 4, '#D8CDBA', INK, 3), rect(8, counter_top - 8, 248, 10, 3, '#9C7A55', INK, 2.5),
            ellipse(56, counter_top - 6, 26, 5, '#4A5560'),                                     # burner
            rect(34, counter_top - 40, 44, 32, 6, '#8A98A4', INK, 2.5), line(28, counter_top - 36, 84, counter_top - 36, INK, 3),  # pot
            rect(146, counter_top - 6, 92, 10, 3, '#B9C7D2', INK, 2), path(f'M 228 {counter_top - 6} v -34 h -18', 'none', '#8A98A4', 5)]  # sink, tap


def dining_table(with_food=False):
    top = FLOOR - 64
    out = [rect(318, top, 150, 14, 5, '#B98A57', INK, 3), line(332, top + 14, 332, FLOOR + 8, '#B98A57', 9), line(454, top + 14, 454, FLOOR + 8, '#B98A57', 9)]
    if with_food:
        out += [path(f'M {x - 16} {top - 2} q 16 18 32 0 Z', WHITE, INK, 2) for x in (360, 426)]
    else:
        out += [path(f'M {x - 14} {top - 1} q 14 14 28 0 Z', WHITE, INK, 2) for x in (380, 436)]
    return out


def spoon_chopsticks(hx, hy):
    return line(hx - 2, hy, hx + 12, hy + 14, '#8A98A4', 3) + circle(hx + 13, hy + 16, 4, '#8A98A4') + line(hx + 4, hy - 2, hx + 18, hy + 12, '#6E5440', 2) + line(hx + 7, hy - 3, hx + 21, hy + 10, '#6E5440', 2)


STIR = (16, -103, 34, -112, 50, -118)
SET = (16, -103, 30, -78, 42, -64)


def stirring(person_fn, x, **kw):
    return person_fn(x, flip=True, right=STIR, front=line(50, -118, 44, -96, '#6E5440', 3) + ellipse(44, -96, 5, 3, '#6E5440'), **kw)


def setting_table(person_fn, x, **kw):
    """Standing at the left end of the dining table, putting a spoon and chopsticks on it."""
    return person_fn(x, ground=FLOOR, right=(16, -103, 30, -84, 46, -70), front=spoon_chopsticks(44, -74), **kw)


def i02_l16():
    table_items = [line(352, FLOOR - 66, 368, FLOOR - 66, '#8A98A4', 3), line(352, FLOOR - 70, 370, FLOOR - 70, '#6E5440', 2)]
    return [
        svg(*kitchen(), *dining_table(), *table_items, setting_table(woman, 290), stirring(man, 112)),
        svg(*kitchen(), *dining_table(), *table_items, setting_table(man, 290), stirring(woman, 112)),
        svg(*kitchen(), man(362, seated=True, right=(16, -103, 30, -118, 8, -128), front=line(8, -128, 18, -112, '#8A98A4', 3)),
            woman(428, seated=True, flip=True, right=(16, -103, 30, -118, 8, -128), front=line(8, -128, 22, -116, '#6E5440', 2.5)),
            *dining_table(with_food=True)),
        svg(*kitchen(), *dining_table(), stirring(man, 112), woman(184, right=(16, -103, 26, -96, 8, -98), left=(-16, -103, -26, -96, -8, -98),
            front=ellipse(0, -100, 18, 6, WHITE, INK, 2)), line(210, FLOOR - 140, 210, FLOOR - 112, '#7FB7D6', 4),
            circle(198, FLOOR - 112, 4, WHITE, '#7FB7D6', 1.5), circle(206, FLOOR - 106, 3, WHITE, '#7FB7D6', 1.5)),
    ]


# --- TOPIK Ⅰ mock 03 ---------------------------------------------------------------------------------------------

def shopfront(x, w, wall, awning):
    """A shop with a striped awning, a window of goods and a door (no sign, no lettering)."""
    n = 6
    sw = (w + 12) / n
    out = rect(x, 64, w, 226, 4, wall, INK, 2.5) + rect(x - 6, 112, w + 12, 26, 4, awning, INK, 2.5)
    out += ''.join(rect(x - 6 + i * sw, 113, sw, 24, 0, WHITE) for i in range(1, n, 2)) + rect(x - 6, 112, w + 12, 26, 4, 'none', INK, 2.5)
    win = w * 0.5
    out += rect(x + 14, 156, win, 92, 3, '#CFE3EE', INK, 2.5) + line(x + 14, 222, x + 14 + win, 222, INK, 2)
    out += ''.join(circle(x + 30 + i * 22, 210, 8, c, INK, 1.5) for i, c in enumerate(['#D9695F', '#E3B23C', '#6A9A5B', '#D98B4F']) if 30 + i * 22 < win)
    out += rect(x + 22 + win, 166, 46, 124, 3, '#9C7A55', INK, 2.5) + rect(x + 32 + win, 180, 26, 40, 2, '#CFE3EE', INK, 1.5) + circle(x + 30 + win, 232, 3.5, '#E3B23C', INK, 1.5)
    return out


def street():
    return [shopfront(16, 206, '#E6D3B8', '#C9655C'), shopfront(258, 206, '#D3DCE4', '#4F7CAC'), rect(0, 286, 480, 74, 0, '#D9D6CF'),
            line(0, 300, 480, 300, '#C3BFB6', 2)]


def backpack(x, ground=FLOOR, colour='#3E8E7E'):
    """A big backpack worn by the person at x (scene coordinates; draw it before the person, straps go in ``props``)."""
    return rect(x - 28, ground - 130, 56, 74, 12, colour, INK, 2.5) + rect(x - 22, ground - 76, 44, 16, 5, '#2F6F62', INK, 2)


STRAPS = line(-11, -110, -12, -66, '#2F6F62', 5) + line(11, -110, 12, -66, '#2F6F62', 5)


def paper_map(x, y, w=56, h=38):
    """An open paper map with its top-left corner at (x, y), local coordinates."""
    return (rect(x, y, w, h, 2, '#F4ECD6', INK, 2) + rect(x + w * 0.58, y + 4, w * 0.3, h * 0.35, 2, '#A8C98E')
            + path(f'M {x + 3} {y + h * 0.75} Q {x + w * 0.4} {y + h * 0.55} {x + w - 3} {y + h * 0.85}', 'none', '#7FB3D5', 3)
            + line(x + 4, y + h * 0.4, x + w - 4, y + h * 0.4, '#E3B23C', 2.5) + line(x + w * 0.35, y + 3, x + w * 0.35, y + h - 3, '#E3B23C', 2.5)
            + line(x + w / 3, y, x + w / 3, y + h, '#D8CDB0', 1) + line(x + 2 * w / 3, y, x + 2 * w / 3, y + h, '#D8CDB0', 1))


# Showing a map to the person in front (the +x side): one hand holds its far edge, the other points at a spot on it.
SHOW_HOLD, SHOW_POINT = (16, -103, 44, -100, 76, -92), (-16, -103, 10, -98, 44, -92)
SHOW_MAP = paper_map(22, -110, 56, 38)
# Holding a map open in front of oneself with both hands.
OWN_MAP = paper_map(-30, -104, 60, 38)
OWN_R, OWN_L = (16, -103, 32, -96, 30, -86), (-16, -103, -32, -96, -30, -86)


def i03_l15():
    showing = dict(right=SHOW_HOLD, left=SHOW_POINT)
    return [
        svg(*street(), woman(175), backpack(305), man(305, flip=True, props=STRAPS + SHOW_MAP, **showing), v=0, room=False),
        svg(*street(), woman(175, props=SHOW_MAP, **showing), backpack(305), man(305, flip=True, props=STRAPS), v=0, room=False),
        svg(*street(), woman(165, flip=True, right=UP_TO_EAR, front=phone(*UP_TO_EAR[4:])), backpack(310),
            man(310, flip=True, right=OWN_R, left=OWN_L, props=STRAPS + OWN_MAP), v=0, room=False),
        svg(*street(), woman(175, left=(-16, -103, -42, -108, -68, -112)), backpack(305), man(305, flip=True, props=STRAPS), v=0, room=False),
    ]


def flower_bed(x0, x1, ground=FLOOR):
    out = ellipse((x0 + x1) / 2, ground - 6, (x1 - x0) / 2, 14, '#8B6A4A', INK, 2)
    colours = ['#D9695F', '#E3B23C', '#E58FB0', '#8B6BB1', '#F2F2F2']
    for i in range(int((x1 - x0) / 14)):
        fx, fy = x0 + 10 + i * 14, ground - 30 - (i * 7) % 16
        out += line(fx, ground - 8, fx, fy, '#5E8B5A', 3) + circle(fx, fy, 6.5, colours[i % len(colours)], INK, 1.5) + circle(fx, fy, 2, '#E3B23C')
    return out


def phone_back(hx, hy):
    """A phone seen from behind (its camera side), held at (hx, hy)."""
    return rect(hx - 7, hy - 12, 14, 22, 3, '#3A4652', INK, 2) + circle(hx - 2, hy - 7, 2.2, '#8A98A4')


# Taking a photo of someone on the +x side: the phone held sideways in both hands, out in front at eye level.
SHOOT_R, SHOOT_L = (16, -103, 38, -112, 50, -126), (-16, -103, 16, -116, 40, -128)
SHOOT = rect(32, -136, 26, 16, 3, '#3A4652', INK, 2) + circle(38, -131, 2.2, '#8A98A4')
# A selfie: the -x arm stretched up and out.
SELFIE_L = (-16, -103, -38, -126, -52, -152)


def i03_l16():
    bed = flower_bed(300, 470)
    return [
        svg(*park(), bed, woman(165, right=SHOOT_R, left=SHOOT_L, front=SHOOT), man(385, flip=True), v=0, room=False),
        svg(*park(), bed, man(345, left=SELFIE_L, front=phone_back(-52, -152)), woman(415, flip=True), v=0, room=False),
        svg(*park(), bed, woman(130, flip=True, scale=0.82, ground=FLOOR - 26),
            man(255, bend=30, right=(16, -103, 34, -96, 50, -86), left=(-16, -103, 14, -94, 44, -88), front=phone_back(50, -88)), v=0, room=False),
        svg(*park(), bed, man(165, right=SHOOT_R, left=SHOOT_L, front=SHOOT), woman(385, flip=True), v=0, room=False),
    ]


# --- TOPIK Ⅱ mock 02 ---------------------------------------------------------------------------------------------

def sofa(x0, w, colour='#8B6BB1', seat='#A48BC4'):
    return (rect(x0, FLOOR - 104, w, 62, 14, colour, INK, 3) + rect(x0 - 4, FLOOR - 56, w + 8, 32, 10, seat, INK, 3)
            + rect(x0 - 16, FLOOR - 80, 24, 58, 10, colour, INK, 3) + rect(x0 + w - 8, FLOOR - 80, 24, 58, 10, colour, INK, 3)
            + line(x0 + 4, FLOOR - 22, x0 + 4, FLOOR, '#6E5440', 6) + line(x0 + w - 4, FLOOR - 22, x0 + w - 4, FLOOR, '#6E5440', 6))


def tv_cabinet(x0, on):
    """A low cabinet with a TV on it, at x0..x0+140; the screen is dark when off and shows a landscape when on."""
    top = FLOOR - 58
    out = rect(x0, top, 140, 58, 4, '#B98A57', INK, 3) + line(x0 + 70, top + 8, x0 + 70, FLOOR - 6, INK, 2) + circle(x0 + 60, top + 30, 3, INK) + circle(x0 + 80, top + 30, 3, INK)
    out += rect(x0 + 56, top - 14, 28, 14, 3, '#3A4652', INK, 2) + rect(x0 + 16, top - 92, 108, 78, 6, '#2E3440', INK, 3)
    sx, sy, sw, sh = x0 + 22, top - 86, 96, 66
    if on:
        out += (rect(sx, sy, sw, sh, 3, '#9FC9E0') + circle(sx + 72, sy + 18, 9, '#F6D36B')
                + poly([(sx, sy + sh), (sx + 34, sy + 28), (sx + 58, sy + 50), (sx + 74, sy + 38), (sx + sw, sy + sh)], '#6E9E62'))
    else:
        out += rect(sx, sy, sw, sh, 3, '#1F242B') + path(f'M {sx + 12} {sy + 10} l 18 0', 'none', '#3A4350', 3)
    return out


def socket(cx, cy):
    return rect(cx - 9, cy - 12, 18, 24, 3, WHITE, INK, 2) + circle(cx - 3, cy, 1.8, INK) + circle(cx + 3, cy, 1.8, INK)


def plug_cable(hx, hy, tx, ty):
    """A plug in a hand at (hx, hy) (scene coordinates), its cable running to (tx, ty)."""
    return path(f'M {hx} {hy} Q {(hx + tx) / 2} {max(hy, ty) + 30} {tx} {ty}', 'none', '#3A4652', 3) + rect(hx - 6, hy - 6, 12, 12, 2, WHITE, INK, 2)


# Bending forward and reaching to a wall socket just above the floor, about 44 px in front of the feet.
UNPLUG = (16, -103, 30, -92, 34, -79)
BESIDE_SOFA = 178


def living_room(on=False):
    return [window(36, 40, 110, 80), sofa(28, 106), tv_cabinet(222, on), socket(384, 258)]


def unplugging(person_fn, **kw):
    """At x=430 facing left, pulling the TV's plug out of the socket at (380, 258)."""
    return [plug_cable(394, 258, 360, 262), person_fn(434, flip=True, bend=30, right=UNPLUG, **kw)]


def ii02_l01():
    return [
        svg(*living_room(), *unplugging(man), woman(BESIDE_SOFA)),
        svg(*living_room(on=True), woman(82, seated=True, ground=FLOOR - 14, right=FORWARD, front=rect(44, -100, 14, 7, 2, '#2E3440', INK, 1.5)),
            man(BESIDE_SOFA)),
        svg(*living_room(), *unplugging(woman), man(BESIDE_SOFA)),
        svg(door(40, FLOOR, open_=True, hinge='left'), window(330, 40, 110, 80), socket(246, 258),
            desk(330, FLOOR - 70, 190, legs=True), rect(404, FLOOR - 64, 34, 64, 4, '#4A5560', INK, 2.5),
            rect(290, FLOOR - 148, 84, 58, 5, '#2E3440', INK, 3) + rect(296, FLOOR - 142, 72, 46, 3, '#1F242B') + rect(322, FLOOR - 90, 20, 20, 2, '#3A4652', INK, 2),
            plug_cable(258, 258, 404, FLOOR - 40), woman(214, bend=30, right=UNPLUG), man(79)),
    ]


def rope_post(x):
    return rect(x - 4, FLOOR - 58, 8, 58, 3, '#C9A13C', INK, 2) + circle(x, FLOOR - 60, 6, '#C9A13C', INK, 2) + ellipse(x, FLOOR, 14, 4, '#8E7330', INK, 1.5)


def rope_barrier(x0, x1):
    return rope_post(x0) + rope_post(x1) + path(f'M {x0} {FLOOR - 54} Q {(x0 + x1) / 2} {FLOOR - 30} {x1} {FLOOR - 54}', 'none', '#B8323A', 5)


SUIT, SUIT_LEGS = '#EEF1F4', '#E3E8EC'


def clear_helmet():
    """The visor of a round space helmet: drawn in front, see-through so the face shows; ``helmet_shell`` goes behind."""
    return (f'<circle cx="0" cy="-143" r="25" fill="#CFE3EE" fill-opacity=".28" stroke="{INK}" stroke-width="2.5"/>'
            + path('M -12 -160 Q -4 -165 6 -163', 'none', WHITE, 3) + rect(-17, -122, 34, 9, 4, '#C9D1D8', INK, 2))


def helmet_shell(x, ground=FLOOR):
    return circle(x, ground - 143, 30, '#E8EDF1', INK, 3)


def spacesuit_display(x):
    """An empty spacesuit on a pedestal: opaque gold visor, life-support pack behind."""
    g = FLOOR - 36
    visor = (circle(0, -143, 28, SUIT, INK, 3) + ellipse(0, -141, 19, 15, '#D9A84E', INK, 2) + path('M -10 -150 Q -2 -155 6 -152', 'none', '#F3D98B', 3)
             + rect(-17, -120, 34, 9, 4, '#C9D1D8', INK, 2))
    return (rect(x - 44, g, 88, 36, 4, '#C9D1D8', INK, 3) + rect(x - 28, g - 128, 56, 64, 8, '#DCE1E6', INK, 2.5)
            + person(x, g, shirt=SUIT, pants=SUIT_LEGS, right=(16, -103, 28, -80, 26, -58), right_hand='glove', left_hand='glove', front=visor))


def museum():
    frames = ''.join(rect(x, 56, 74, 60, 4, '#2E3440', INK, 3) + circle(x + 37, 86, r, c, INK, 2) for x, r, c in ((276, 18, '#D98B4F'), (372, 14, '#7FB3D5')))
    return [frames + ellipse(313, 86, 28, 7, 'none', '#E3B23C', 2.5)]


VEST = '#3E8E7E'


def ii02_l02():
    display = [spacesuit_display(130), rope_barrier(70, 190)]
    return [
        svg(*museum(), *display, helmet_shell(250), man(250, front=clear_helmet()),
            woman(400, flip=True, apron=VEST, right=SHOOT_R, left=SHOOT_L, front=SHOOT)),
        svg(*museum(), *display, helmet_shell(250), woman(250, shirt=PURPLE, front=clear_helmet()),
            man(400, flip=True, right=SHOOT_R, left=SHOOT_L, front=SHOOT)),
        svg(*museum(), *display, woman(405, flip=True, apron=VEST, ground=FLOOR - 6), counter(335, FLOOR, w=130, h=72),
            helmet_shell(245), man(245, right=(16, -103, 38, -126, 54, -152), front=clear_helmet() + phone_back(54, -152))),
        svg(*museum(), helmet_shell(220), man(220, shirt=SUIT, pants=SUIT_LEGS, right_hand='glove', left_hand='glove', front=clear_helmet()),
            woman(390, flip=True, apron=VEST, right=SHOOT_R, left=SHOOT_L, front=SHOOT)),
    ]


# --- TOPIK Ⅱ mock 03 ---------------------------------------------------------------------------------------------

GREY_HAIR = '#C8C3BB'
SEAT_TOP = FLOOR - 40          # a chair's seat (hsk chair)
TABLE_Y = FLOOR - 50           # a table's top edge


def school_bag(cx, top, colour='#C9655C'):
    """A small backpack standing upright: body, front pocket and the carrying loop on top (scene coordinates)."""
    return (path(f'M {cx - 9} {top + 2} Q {cx} {top - 12} {cx + 9} {top + 2}', 'none', INK, 3)
            + rect(cx - 22, top, 44, 56, 11, colour, INK, 2.5) + rect(cx - 15, top + 28, 30, 20, 5, '#A9504A', INK, 2))


def book_stack(cx, cy):
    """Three books held flat in front of the chest (local coordinates, centred on cx, cy)."""
    return (rect(cx - 22, cy - 6, 44, 10, 2, '#4F7CAC', INK, 2) + rect(cx - 20, cy - 16, 40, 10, 2, '#E3B23C', INK, 2)
            + rect(cx - 23, cy - 26, 46, 10, 2, '#3E8E7E', INK, 2))


HOLD_STACK = dict(right=(16, -103, 26, -84, 18, -78), left=(-16, -103, -26, -84, -18, -78), front=book_stack(0, -78))
# Seated at a table: forearms resting on the table top.
ON_TABLE_R, ON_TABLE_L = (16, -103, 26, -82, 20, -62), (-16, -103, -26, -82, -20, -62)
# Seated, the +x arm lifting a bag off the chair to that side by its loop.
LIFT_BAG = (16, -103, 46, -124, 76, -122)
LIBRARY_TABLE = desk(170, TABLE_Y, 240)    # x 50–290
NEXT_CHAIR = 330                             # the chair beside the seated reader, past the table's end


def reading_room():
    return [bookshelf(8, FLOOR - 18, 88, 236, shelves=6, seed=3), window(160, 44, 120, 82), bookshelf(376, FLOOR - 18, 96, 236, shelves=6, seed=7)]


def table_book(x):
    """A book lying open on the library table."""
    return path(f'M {x - 26} {TABLE_Y - 14} L {x} {TABLE_Y - 18} L {x + 26} {TABLE_Y - 14} L {x + 26} {TABLE_Y - 12} L {x - 26} {TABLE_Y - 12} Z',
                '#F4F1E8', INK, 2) + line(x, TABLE_Y - 18, x, TABLE_Y - 12, INK, 1.5)


def lifting_scene(lifter, carrier):
    """``lifter`` sits at the table's end and lifts their bag off the next chair; ``carrier`` stands beside that chair
    holding a stack of books."""
    seated_x = 250
    # LIFT_BAG's hand is at local (76, -122): scene (seated_x + 76, FLOOR - 122 + 8); the loop's top sits in it.
    raised = school_bag(seated_x + 76, FLOOR - 122 + 8 + 4)
    return svg(*reading_room(), chair(seated_x, FLOOR), chair(NEXT_CHAIR, FLOOR),
               lifter(seated_x, seated=True, right=LIFT_BAG, left=ON_TABLE_L, shirt=TEAL if lifter is man else RED),
               raised, LIBRARY_TABLE, table_book(205),
               carrier(410, flip=True, shirt=ORANGE if carrier is man else PURPLE, **HOLD_STACK))


def ii03_l01():
    return [
        lifting_scene(woman, man),
        svg(*reading_room(), chair(NEXT_CHAIR, FLOOR), chair(250, FLOOR),
            woman(250, seated=True, shirt=PURPLE, right=ON_TABLE_R, left=ON_TABLE_L),
            LIBRARY_TABLE, rect(222, TABLE_Y - 44, 46, 10, 2, '#3E8E7E', INK, 2) + rect(224, TABLE_Y - 34, 42, 10, 2, '#E3B23C', INK, 2)
            + rect(220, TABLE_Y - 24, 48, 10, 2, '#4F7CAC', INK, 2),
            man(414, shirt=TEAL, right=(16, -103, 30, -84, 30, -70), front=school_bag(30, -66))),
        lifting_scene(man, woman),
        svg(*reading_room(), chair(250, FLOOR), chair(NEXT_CHAIR, FLOOR), school_bag(NEXT_CHAIR - 6, SEAT_TOP - 56),
            man(250, seated=True, shirt=TEAL, right=FORWARD, left=(-16, -103, 4, -98, 24, -94), front=held_book(30, -100)),
            LIBRARY_TABLE,
            woman(422, flip=True, shirt=PURPLE, right=(16, -103, 26, -130, 22, -158))),
    ]


def community_room():
    board = rect(118, 40, 230, 96, 5, '#F6F7F4', INK, 3) + rect(128, 136, 210, 6, 2, '#B9B4AC', INK, 2)
    return [board, window(368, 52, 96, 84), plant(40, FLOOR)]


ROOM_TABLE = desk(240, TABLE_Y, 300)          # x 90–390
ELDER = dict(hair=GREY_HAIR, shirt='#7A8C6E', front=circle(-7, -145, 6, 'none', INK, 2) + circle(7, -145, 6, 'none', INK, 2)
             + line(-1, -145, 1, -145, INK, 2))
# Holding a phone in both hands in front of the chest, a thumb on the screen.
PHONE_R, PHONE_L = (16, -103, 30, -84, 9, -88), (-16, -103, -30, -84, -9, -88)


def held_phone(extra=''):
    return extra + rect(-10, -116, 20, 32, 3, '#3A4652', INK, 2) + rect(-7, -113, 14, 24, 1.5, '#A9D3DF') + circle(5, -98, 4, SKIN, INK, 1.5)


def elder_kw(**kw):
    out = dict(ELDER)
    front = kw.pop('front', '')
    out['front'] = out['front'] + front
    out.update(kw)
    return out


def laptop(x):
    return (rect(x - 34, TABLE_Y - 52, 68, 44, 4, '#3A4652', INK, 2.5) + rect(x - 29, TABLE_Y - 47, 58, 34, 2, '#A9D3DF')
            + path(f'M {x - 40} {TABLE_Y - 4} L {x - 34} {TABLE_Y - 10} L {x + 34} {TABLE_Y - 10} L {x + 40} {TABLE_Y - 4} Z', '#7D8A96', INK, 2))


def held_notebook():
    """A notebook held up in the left hand and written in with a pen in the right (local coordinates)."""
    page = rect(-26, -116, 36, 28, 2, '#F4F1E8', INK, 2)
    rules = ''.join(line(-21, y, 5, y, '#9AA5B1', 1.5) for y in (-108, -101, -94))
    return page + rules + pen(8, -98)


NOTE_R, NOTE_L = (16, -103, 30, -86, 8, -98), (-16, -103, -30, -88, -24, -96)


def ii03_l02():
    old_x, young_x = 190, 290
    return [
        svg(*community_room(), chair(old_x, FLOOR), chair(young_x, FLOOR),
            man(old_x, seated=True, **elder_kw(right=ON_TABLE_R, left=ON_TABLE_L)),
            woman(young_x, seated=True, shirt=RED, right=PHONE_R, left=PHONE_L, front=held_phone()), ROOM_TABLE),
        svg(*community_room(), chair(old_x, FLOOR), chair(young_x, FLOOR),
            man(old_x, seated=True, **elder_kw(right=PHONE_R, left=PHONE_L, front=held_phone())),
            woman(young_x, seated=True, shirt=RED, right=ON_TABLE_R, left=ON_TABLE_L), ROOM_TABLE),
        svg(*community_room(), chair(old_x, FLOOR), chair(young_x, FLOOR),
            man(old_x, seated=True, **elder_kw(right=UP_TO_EAR, left=ON_TABLE_L, front=phone(*UP_TO_EAR[4:]))),
            woman(young_x, seated=True, shirt=RED, right=NOTE_R, left=NOTE_L, front=held_notebook()),
            ROOM_TABLE),
        svg(*community_room(), woman(268, flip=True, shirt=RED, right=(16, -103, 40, -104, 62, -96)),
            chair(old_x, FLOOR), man(old_x, seated=True, **elder_kw(right=(16, -103, 24, -78, 14, -60), left=(-16, -103, -24, -78, -14, -60))),
            ROOM_TABLE, laptop(old_x)),
    ]


FORMS = {
    'topik1-mock-01': ('topik-i', 1, {15: i01_l15, 16: i01_l16}),
    'topik1-mock-02': ('topik-i', 2, {15: i02_l15, 16: i02_l16}),
    'topik1-mock-03': ('topik-i', 3, {15: i03_l15, 16: i03_l16}),
    'topik2-mock-01': ('topik-ii', 1, {1: ii01_l01, 2: ii01_l02}),
    'topik2-mock-02': ('topik-ii', 2, {1: ii02_l01, 2: ii02_l02}),
    'topik2-mock-03': ('topik-ii', 3, {1: ii03_l01, 2: ii03_l02}),
}


def main():
    only = next((a[7:].split(',') for a in sys.argv if a.startswith('--only=')), None)
    png = '--png' in sys.argv
    for slug, (folder, number, items) in FORMS.items():
        if only and slug not in only:
            continue
        form = json.loads((TOPIK / folder / f'mock-0{number}.json').read_text(encoding='utf-8'))
        out = TOPIK / folder / f'mock-0{number}'
        out.mkdir(exist_ok=True)
        for n, draw in items.items():
            pictures = draw()
            item = next(q for s in form['listening'] for q in s['questions'] if q['number'] == n)
            assert len(pictures) == len(item['pictures']) == 4, (slug, n)
            files = []
            for i, body in enumerate(pictures, 1):
                assert '<text' not in body
                f = out / f'l{n:02}-{i}.svg'
                f.write_text(body, encoding='utf-8')
                files.append(f)
            if png:
                sheet = ROOT / 'artifacts' / 'topik-pictures'
                sheet.mkdir(parents=True, exist_ok=True)
                grid = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 980 740" width="980" height="740">'
                        '<rect width="980" height="740" fill="#fff"/>'
                        + ''.join(f'<image x="{10 + (i % 2) * 490}" y="{10 + (i // 2) * 370}" width="480" height="360" xlink:href="{os.path.relpath(f, sheet).replace(os.sep, '/')}"/>' for i, f in enumerate(files))
                        + '</svg>')
                tmp = sheet / f'{slug}-l{n:02}.svg'
                tmp.write_text(grid, encoding='utf-8')
                subprocess.run([str(ROOT / 'artifacts' / 'resvg' / 'resvg.exe'), str(tmp), str(sheet / f'{slug}-l{n:02}.png')], check=True)
                tmp.unlink()
            print(f'{slug} l{n:02}: answer {item["answer"]}')


if __name__ == '__main__':
    main()
