"""Original flat-vector drawing kit for the TOPIK picture items (TOPIK Ⅰ 15–16, TOPIK Ⅱ 1–2).

Every picture is 480x360 with no words, numbers or clock faces, so nothing in the art gives the answer away. The
primitives and colour palettes come from the HSK scene library (MockExmps/HSK/_source/scenes.py); this module adds
people with free arm poses, seated and bending figures, and the rooms and props the TOPIK forms ask for. A person is
drawn in local coordinates: feet at y=0, hips at -50, shoulders at (±16, -103), head centre at -143. The person's
right arm is the +x arm; ``flip`` mirrors the whole figure (and its props) so it faces the other way.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location('hsk_scenes', Path(__file__).resolve().parents[2] / 'HSK' / '_source' / 'scenes.py')
hsk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hsk)

W, H, INK, SKIN, HAIR, WHITE, LINE = hsk.W, hsk.H, hsk.INK, hsk.SKIN, hsk.HAIR, hsk.WHITE, hsk.LINE
rect, circle, ellipse, line, path, poly = hsk._rounded, hsk._circle, hsk._ellipse, hsk._line, hsk._path, hsk._poly
palette, shadow = hsk._p, hsk.shadow
COAT = '#F7F4EC'
WOOD = '#B98A57'
CARD = '#C98B4B'

# Arm shapes: (shoulder x, shoulder y, control x, control y, hand x, hand y) for the right (+x) arm; mirrored for left.
DOWN = (16, -103, 26, -74, 23, -52)
FORWARD = (16, -103, 34, -100, 50, -94)        # holding something out to someone in front
REACH = (16, -103, 32, -102, 46, -98)           # reaching out to take something
POINT = (16, -103, 36, -112, 56, -124)
UP_TO_EAR = (16, -103, 29, -88, 20, -136)
ON_HIP_FRONT = (16, -103, 27, -86, 10, -80)     # hand in front of the chest (holding a clipboard, a box)
DOOR = (16, -103, 36, -96, 54, -90)
LOW = (16, -103, 30, -70, 40, -36)              # reaching down (with ``bend``)


def mirror(arm):
    return tuple(-v if i % 2 == 0 else v for i, v in enumerate(arm))


def person(x, ground, *, woman=False, shirt='#4F7CAC', pants='#3D4A57', hair_style=None, scale=1.0, flip=False,
           right=DOWN, left=None, right_hand='skin', left_hand='skin', seated=False, bend=0, coat=False, apron=None,
           bag=None, props='', front='', sleeve_rolled=(), hair=None):
    """A flat person. ``right``/``left`` are arm shapes (left defaults to a hanging arm). ``props`` are drawn behind
    the arms, ``front`` in front of everything (both in local coordinates). ``seated`` sits the figure on a seat at
    y=-42; ``bend`` tilts the upper body forward by that many degrees. ``sleeve_rolled`` names arms ('right', 'left')
    whose forearm is bare. ``hair`` is the hair colour (grey for an older person)."""
    hair_style = hair_style or ('long' if woman else 'short')
    hair = hair or HAIR
    left = left or mirror(DOWN)
    torso_fill = COAT if coat else shirt
    sx = -scale if flip else scale
    out = [f'<g transform="translate({x} {ground}) scale({sx} {scale})">']
    if seated:
        out.append(rect(-20, -50, 40, 14, 6, pants, INK, 2))  # lap
        out.append(line(-10, -38, -12, -6, pants, 12))
        out.append(line(10, -38, 12, -6, pants, 12))
        hip_shift = 8
    else:
        out.append(line(-8, -50, -10, -6, pants, 13))
        out.append(line(8, -50, 10, -6, pants, 13))
        hip_shift = 0
    out.append(ellipse(-13, -3, 11, 5, INK))
    out.append(ellipse(13, -3, 11, 5, INK))
    upper = [f'<g transform="translate(0 {hip_shift}) rotate({bend} 0 -50)">']
    upper.append(path('M -17 -112 Q -20 -80 -16 -48 L 16 -48 Q 20 -80 17 -112 Z', torso_fill, INK, 3))
    if coat:
        upper.append(path('M -16 -112 L 0 -84 L 16 -112 L 9 -114 L 0 -98 L -9 -114 Z', '#DCE3E8', INK, 2))
        upper.append(line(0, -84, 0, -50, '#C9D1D8', 2))
    if apron:
        upper.append(path('M -13 -100 L 13 -100 L 15 -46 L -15 -46 Z', apron, INK, 2))
        upper.append(line(-13, -100, -9, -112, INK, 2))
        upper.append(line(13, -100, 9, -112, INK, 2))
    if bag:
        upper.append(path('M -14 -110 L 22 -64', 'none', '#6B4F3A', 3))
        upper.append(rect(14, -70, 22, 18, 4, bag, INK, 2))
    upper.append(rect(-5, -126, 10, 15, 4, SKIN))
    upper.append(circle(0, -143, 18, SKIN, INK, 3))
    upper.append(circle(-18, -142, 4, SKIN, INK, 2))
    upper.append(circle(18, -142, 4, SKIN, INK, 2))
    upper.append(circle(-6, -146, 2.0, INK))
    upper.append(circle(6, -146, 2.0, INK))
    upper.append(path('M -5 -137 Q 0 -132 5 -137', 'none', INK, 2))
    if hair_style == 'long':
        upper.append(path('M -18 -146 Q -22 -170 0 -169 Q 22 -170 18 -146 L 20 -120 L 12 -122 L 13 -145 Q 0 -158 -13 -145 L -12 -122 L -20 -120 Z', hair, INK, 2))
    elif hair_style == 'bun':
        upper.append(circle(0, -166, 9, hair, INK, 2))
        upper.append(path('M -18 -146 Q -18 -166 0 -166 Q 18 -166 18 -146 Q 8 -154 0 -153 Q -8 -154 -18 -146 Z', hair, INK, 2))
    else:
        upper.append(path('M -18 -146 Q -18 -167 0 -167 Q 18 -167 18 -146 Q 10 -155 0 -154 Q -10 -155 -18 -146 Z', hair, INK, 2))
    upper.append(props)
    for name, arm, hand in (('right', right, right_hand), ('left', left, left_hand)):
        if arm is None:
            continue
        x1, y1, mx, my, ex, ey = arm
        upper.append(path(f'M {x1} {y1} Q {mx} {my} {ex} {ey}', 'none', INK, 14))
        upper.append(path(f'M {x1} {y1} Q {mx} {my} {ex} {ey}', 'none', torso_fill, 10))
        if name in sleeve_rolled:
            # bare forearm: the second half of the curve in skin colour
            hx, hy = (x1 + 2 * mx + ex) / 4, (y1 + 2 * my + ey) / 4
            upper.append(path(f'M {hx} {hy} Q {(mx + ex) / 2} {(my + ey) / 2} {ex} {ey}', 'none', SKIN, 9))
        if hand == 'skin':
            upper.append(circle(ex, ey, 5.5, SKIN, INK, 2))
        elif hand:
            upper.append(circle(ex, ey, 5, torso_fill, INK, 2))
    upper.append(front)
    upper.append('</g>')
    out += upper
    out.append('</g>')
    return '\n'.join(out)


# --- props, in a person's local coordinates (hand positions match the arm shapes above) -------------------------------

def held_umbrella(hx, hy, colour='#2E3440'):
    """A closed umbrella held by its handle at (hx, hy), hanging down."""
    return (path(f'M {hx} {hy - 2} q 9 0 9 -9', 'none', INK, 4)
            + path(f'M {hx - 1} {hy + 4} L {hx + 9} {hy + 12} L {hx + 4} {hy + 66} L {hx - 7} {hy + 14} Z', colour, INK, 2)
            + line(hx + 4, hy + 66, hx + 5, hy + 76, INK, 3))


def lying_umbrella(x, y, length=72, colour='#2E3440'):
    """A closed umbrella lying on the floor, handle at (x, y)."""
    return (path(f'M {x} {y} q -10 0 -10 -9', 'none', INK, 4)
            + path(f'M {x + 4} {y - 1} L {x + 14} {y - 9} L {x + length} {y - 3} L {x + 14} {y + 5} Z', colour, INK, 2)
            + line(x + length, y - 3, x + length + 9, y - 3, INK, 3))


def held_bag(hx, hy, colour='#C9655C'):
    return path(f'M {hx - 8} {hy + 2} Q {hx} {hy - 10} {hx + 8} {hy + 2}', 'none', INK, 2.5) + rect(hx - 14, hy + 2, 28, 24, 4, colour, INK, 2)


def held_book(hx, hy, colour='#4F7CAC', thick=14):
    return rect(hx - 4, hy - 16, 26, 32, 3, colour, INK, 2) + rect(hx - 4, hy - 16, 6, 32, 2, '#2E4A6B', INK, 1.5) + rect(hx + 20, hy - 15, thick / 3, 30, 1, WHITE, INK, 1)


def big_box(cx, cy, w=62, h=48):
    return (rect(cx - w / 2, cy - h / 2, w, h, 3, CARD, INK, 2.5)
            + line(cx - w / 2, cy - h / 2 + 10, cx + w / 2, cy - h / 2 + 10, '#A8733C', 2)
            + rect(cx - 5, cy - h / 2, 10, h, 0, '#D9A86A', None, 0, 0.8))


def clipboard(cx, cy):
    return (rect(cx - 15, cy - 20, 30, 40, 4, '#E8D6B8', INK, 2) + rect(cx - 7, cy - 23, 14, 6, 2, '#8A98A4', INK, 1.5)
            + ''.join(line(cx - 9, cy - 8 + i * 8, cx + 9, cy - 8 + i * 8, '#8A98A4', 2) for i in range(3)))


def pen(hx, hy):
    return line(hx - 2, hy + 2, hx - 12, hy + 12, INK, 2.5)


def phone(hx, hy):
    return rect(hx - 6, hy - 14, 11, 22, 3, '#3A4652', INK, 2) + rect(hx - 4, hy - 11, 7, 12, 1.5, '#A9D3DF')


def medicine_bag(hx, hy):
    return (rect(hx - 2, hy - 8, 22, 26, 2, '#F3EAD8', INK, 2) + path(f'M {hx - 2} {hy - 8} l 4 -4 l 14 0 l 4 4', 'none', INK, 1.5)
            + rect(hx + 7, hy + 0, 4, 12, 1, '#D9695F') + rect(hx + 3, hy + 4, 12, 4, 1, '#D9695F'))


# --- furniture and rooms (scene coordinates) ---------------------------------------------------------------------------

def start(v, room=True):
    return hsk.svg_start(v, room=room)


def end():
    return hsk.svg_end()


def chair(x, y, colour=WOOD, flip=False):
    return hsk.chair(x, y, colour, flip)


def desk(x, y, w=160, h=14, colour=WOOD, legs=True):
    out = rect(x - w / 2, y - h, w, h, 5, colour, INK, 3)
    if legs:
        out += line(x - w / 2 + 14, y, x - w / 2 + 14, y + 40, colour, 9) + line(x + w / 2 - 14, y, x + w / 2 - 14, y + 40, colour, 9)
    return out


def school_desk(x, y, colour='#C9A46C', scale=0.6):
    return (f'<g transform="translate({x} {y}) scale({scale})">' + rect(-60, -70, 120, 12, 4, colour, INK, 3)
            + line(-48, -58, -48, 0, '#8A98A4', 7) + line(48, -58, 48, 0, '#8A98A4', 7)
            + hsk.chair(0, 0, '#8A98A4') + '</g>')


def blackboard(x, y, w=230, h=86):
    return rect(x, y, w, h, 6, '#3F6B57', INK, 3) + rect(x + 6, y + 6, w - 12, h - 12, 3, '#47785F') + rect(x + w * 0.55, y + h + 2, 40, 6, 2, '#D8CDBA', INK, 1.5)


def window(x, y, w=110, h=90, sky='#CFE3EE'):
    return (rect(x, y, w, h, 4, sky, INK, 3) + line(x + w / 2, y, x + w / 2, y + h, INK, 3) + line(x, y + h / 2, x + w, y + h / 2, INK, 3)
            + hsk._cloud(x + w * 0.3, y + h * 0.28, 0.35))


def door(x, y_floor, w=78, h=170, colour='#9C7A55', open_=False, glass=True, hinge='right'):
    """A door with its frame; ``open_`` shows a dark doorway and the leaf swung towards the viewer on the hinge side."""
    top = y_floor - h
    frame = rect(x - 6, top - 6, w + 12, h + 6, 3, '#E9E2D3', INK, 2)
    if not open_:
        out = frame + rect(x, top, w, h, 3, colour, INK, 3)
        if glass:
            out += rect(x + w / 2 - 12, top + 22, 24, 44, 3, '#CFE3EE', INK, 2)
        hx = x + 12 if hinge == 'right' else x + w - 12
        return out + circle(hx, top + h * 0.55, 4.5, '#E3B23C', INK, 2)
    out = frame + rect(x, top, w, h, 3, '#4A4F57', INK, 3)
    d = 1 if hinge == 'right' else -1
    e = x + w if hinge == 'right' else x
    out += poly([(e, top), (e + d * w * 0.45, top + 14), (e + d * w * 0.45, y_floor + 10), (e, y_floor)], colour, INK, 3)
    if glass:
        out += poly([(e + d * w * 0.12, top + 26), (e + d * w * 0.32, top + 30), (e + d * w * 0.32, top + 74), (e + d * w * 0.12, top + 70)], '#CFE3EE', INK, 2)
    return out


def bookshelf(x, y_floor, w=96, h=196, shelves=5, seed=0):
    colours = ['#C9655C', '#4F7CAC', '#E3B23C', '#3E8E7E', '#8B6BB1', '#D98B4F', '#6A9A5B', '#5D8FA8']
    top = y_floor - h
    out = [rect(x, top, w, h, 4, '#9C7A55', INK, 3)]
    row = (h - 10) / shelves
    for r in range(shelves):
        y0 = top + 6 + r * row
        out.append(rect(x + 6, y0, w - 12, row - 6, 2, '#6E5440'))
        bx, k = x + 8, seed + r * 3
        while bx < x + w - 14:
            bw = 6 + (k * 7) % 6
            bh = row - 12 - (k * 5) % 9
            out.append(rect(bx, y0 + row - 6 - bh, bw, bh, 1.5, colours[k % len(colours)], INK, 1))
            bx += bw + 1
            k += 1
    return '\n'.join(out)


def counter(x, y_floor, w=150, h=84, colour='#B98A57'):
    top = y_floor - h
    return rect(x, top, w, h, 4, colour, INK, 3) + rect(x - 6, top - 10, w + 12, 12, 4, '#9C7A55', INK, 3)


def cross_sign(x, y, colour='#D9695F'):
    return rect(x - 34, y - 26, 68, 52, 8, '#F7F2E7', INK, 2) + rect(x - 8, y - 20, 16, 40, 3, colour) + rect(x - 20, y - 8, 40, 16, 3, colour)


def scale_platform(x, y_floor):
    return rect(x - 34, y_floor - 12, 68, 14, 5, '#DCE3E8', INK, 2.5) + circle(x, y_floor - 5, 4, '#8A98A4')


def bp_monitor(x, y):
    return rect(x - 22, y - 28, 44, 28, 5, '#E8ECEF', INK, 2) + rect(x - 15, y - 23, 30, 13, 2, '#A9D3DF') + circle(x - 8, y - 5, 3, '#4F7CAC') + circle(x + 8, y - 5, 3, '#D9695F')


def plant(x, y_floor):
    return (path(f'M {x - 16} {y_floor - 36} L {x + 16} {y_floor - 36} L {x + 12} {y_floor} L {x - 12} {y_floor} Z', '#C98B4B', INK, 2)
            + ''.join(path(f'M {x} {y_floor - 36} Q {x + dx * 0.5} {y_floor - 60} {x + dx} {y_floor - 84 + abs(dx)}', 'none', '#5E8B5A', 6) for dx in (-22, -8, 8, 22)))


def svg(*parts, v=0, room=True):
    return '\n'.join([start(v, room), *parts, end()])
