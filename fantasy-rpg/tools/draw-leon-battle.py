"""Build Leon's left-facing battle atlas from hand-placed pixel shapes and key poses."""
import json
import math
from collections import namedtuple
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parents[1] / "assets"
SIZE = (80, 72)
ANCHOR = (42, 64)
PAL = {
    "ink": "#251c22", "brown": "#48302b", "hide": "#755139", "hide_hi": "#a46e48",
    "hair_ink": "#422722", "hair_deep": "#653d2c", "hair": "#945837", "hair_hi": "#bd7d4a",
    "hair_glint": "#dc9f64", "skin_dark": "#aa673e", "skin": "#da9d66", "skin_hi": "#f2c48c",
    "light": "#f7dfad", "eye": "#345362", "navy_dark": "#252b40", "navy": "#303f5e",
    "blue": "#425d80", "blue_hi": "#607d9a", "steel_dark": "#3f495d", "steel": "#748591",
    "steel_hi": "#aebfc0", "silver": "#d9e3d9", "trim_dark": "#93633e", "gold": "#c39351",
    "gold_hi": "#e2ba77", "rust_dark": "#6a382d", "rust": "#97563d", "rust_hi": "#be7d53",
    "trouser": "#50434a", "trouser_hi": "#75605b",
}
Pose = namedtuple("Pose", "head shoulder hip front_knee front_foot back_knee back_foot elbow hand tip offhand cape")
READY = Pose((38,29), (41,39), (43,49), (32,52), (30,63), (51,53), (55,63),
             (42,44), (34,43), (13,33), (38,46), (0,0))


def poly(draw, points, fill, outline=None):
    draw.polygon(points, fill=PAL[fill], outline=PAL[outline] if outline else None)


def line(draw, points, fill, width=1):
    draw.line(points, fill=PAL[fill], width=width)


def offsets(origin, points):
    return [(origin[0] + x, origin[1] + y) for x, y in points]


def boot(draw, foot, near):
    def points(coords):
        return offsets(foot, coords if near else [(-x,y) for x,y in coords])

    poly(draw, points([(-3,-8),(4,-8),(4,-5),(5,-2),(4,0),(-7,0),(-8,-2),(-6,-4),(-4,-4)]),
         "hide" if near else "brown", "ink")
    poly(draw, points([(-5,-3),(-2,-4),(1,-3),(3,-2),(-6,-2)]), "hide_hi" if near else "hide")
    line(draw, points([(-3,-5),(2,-6)]), "gold" if near else "trim_dark")
    line(draw, points([(-7,-1),(-1,-1)]), "brown")
    line(draw, points([(2,-7),(3,-6)]), "gold_hi" if near else "hide")


def leg(draw, hip, knee, foot, near):
    hx, hy = hip
    kx, ky = knee
    fx, fy = foot
    poly(draw, [(hx-5,hy-4),(hx+4,hy-3),(kx+5,ky-3),(kx+4,ky+1),(fx+4,fy-7),
                (fx+3,fy-5),(fx-4,fy-5),(kx-5,ky+2),(kx-5,ky-2),(hx-5,hy+3)],
         "trouser" if near else "brown", "ink")
    poly(draw, [(hx-4,hy-2),(kx-4,ky-2),(kx-4,ky),(kx+2,ky+2),(kx+3,ky-1),(hx-1,hy-3)],
         "trouser_hi" if near else "trouser")
    poly(draw, [(kx-4,ky-1),(kx-1,ky-3),(kx+3,ky-2),(kx+2,ky+2),(kx-2,ky+3)],
         "steel" if near else "steel_dark", "ink")
    line(draw, [(kx-3,ky),(kx-1,ky-2),(kx+1,ky-2)], "steel_hi" if near else "steel")
    boot(draw, foot, near)


def cloak(draw, shoulder, hip, drift):
    sx, sy = shoulder
    hx, hy = hip
    dx, dy = drift
    edge = [(sx+5,sy-2),(sx+11,sy+3),(hx+16+dx,hy+1+dy),
            (hx+20+dx,hy+9+dy),(hx+15+dx,hy+7+dy),(hx+11+dx,hy+10+dy),(hx+4,hy+6)]
    poly(draw, edge, "navy_dark", "ink")
    poly(draw, [(sx+7,sy+2),(hx+14+dx,hy+1+dy),(hx+18+dx,hy+7+dy),(hx+13+dx,hy+5+dy),
                (hx+10+dx,hy+8+dy),(hx+7,hy+5)], "navy")
    line(draw, [(sx+8,sy+4),(hx+13+dx,hy+2+dy),(hx+15+dx,hy+5+dy)], "blue")
    line(draw, [(hx+10+dx,hy+8+dy),(hx+14+dx,hy+6+dy),(hx+18+dx,hy+8+dy)], "trim_dark")
    line(draw, [(hx+10+dx,hy+6+dy),(hx+13+dx,hy+5+dy),(hx+14+dx,hy+5+dy)], "blue_hi")


def torso(draw, shoulder, hip):
    sx, sy = shoulder
    hx, hy = hip
    poly(draw, [(sx-7,sy-5),(sx+3,sy-5),(sx+8,sy),(sx+6,sy+5),(hx+7,hy+1),
                (hx+3,hy+3),(hx-8,hy+2),(hx-11,hy-1),(sx-8,sy+3),(sx-10,sy)],
         "navy", "ink")
    poly(draw, [(sx-8,sy-1),(sx-6,sy-4),(sx-2,sy-4),(sx+2,sy-1),
                (sx+2,sy+3),(hx-3,hy-2),(hx-8,hy-2),(sx-7,sy+3)],
         "steel_dark")
    poly(draw, [(sx-8,sy+1),(sx-6,sy-2),(sx-3,sy-2),(sx-1,sy),(sx-3,sy+2),(sx-5,sy+4)],
         "steel")
    line(draw, [(sx-7,sy),(sx-5,sy-1),(sx-3,sy-1)], "steel_hi")
    line(draw, [(sx-5,sy+3),(sx-2,sy+2)], "blue_hi")
    poly(draw, [(sx-6,sy-5),(sx-3,sy-3),(sx+4,sy-4),(sx+5,sy-1),(sx-2,sy+1),(sx-8,sy-2)], "rust_dark")
    line(draw, [(sx-7,sy-3),(sx-2,sy),(sx+1,sy-1)], "rust_hi")
    poly(draw, [(hx-10,hy-2),(hx+7,hy-2),(hx+7,hy+1),(hx+2,hy+3),(hx-9,hy+2)], "hide", "ink")
    line(draw, [(hx-8,hy-1),(hx+5,hy-1)], "hide_hi")
    draw.rectangle((hx-5,hy-1,hx-2,hy+1), fill=PAL["gold"])
    draw.point((hx-4,hy), fill=PAL["brown"])


def head(draw, origin, blink):
    def shape(points, fill, outline=None):
        poly(draw, offsets(origin, points), fill, outline)

    def streak(points, fill):
        line(draw, offsets(origin, points), fill)

    shape([(-10,-4),(-8,-8),(0,-9),(8,-6),(10,0),(7,5),(4,8),
           (-4,8),(-6,6),(-9,5),(-9,3),(-11,2),(-10,0)], "skin", "hair_ink")
    shape([(-9,-3),(-3,-3),(1,0),(0,5),(-3,6),(-7,5),(-7,3),(-9,2)], "skin_hi")
    streak([(-9,1),(-7,2),(-8,3)], "light")
    streak([(-7,4),(-6,4)], "skin_dark")
    streak([(-6,6),(-3,6),(-2,5)], "skin")
    streak([(-8,-1),(-6,-2),(-4,-1)], "hair_deep")
    streak([(-7,0),(-5,0)], "hair_ink" if blink else "eye")
    if not blink:
        streak([(-7,1),(-6,1)], "eye")
        streak([(-5,1),(-4,1)], "light")
    shape([(-11,-2),(-12,-6),(-10,-10),(-6,-11),(-7,-13),(-2,-12),
           (3,-14),(4,-11),(10,-12),(9,-9),(14,-8),(11,-6),(15,-4),
           (11,-3),(13,0),(9,0),(10,3),(6,2),(5,6),(2,4),(2,0),(0,-2),
           (-2,1),(-3,-3),(-6,-5),(-7,-2),(-8,-5)], "hair_deep", "hair_ink")
    shape([(-11,-6),(-8,-9),(-5,-9),(-4,-11),(3,-11),(1,-9),(9,-10),(8,-8),
           (11,-7),(7,-6),(11,-5),(8,-4),(5,-6),(2,-7),(4,-4),(2,-2),
           (-1,-5),(-4,-6),(-7,-7),(-9,-4)], "hair")
    shape([(-8,-8),(-5,-9),(-1,-10),(-3,-8),(1,-8),(5,-9),(6,-8),
           (3,-7),(-1,-7),(0,-5),(-2,-5),(-5,-7),(-7,-6)], "hair_hi")
    streak([(-7,-8),(-5,-9),(-3,-9)], "hair_glint")
    streak([(2,-7),(5,-8),(8,-8)], "hair_hi")
    streak([(4,-5),(6,-4),(8,-4),(9,-3)], "hair")
    streak([(1,-10),(2,-11),(3,-11)], "hair_glint")
    streak([(6,-2),(7,-2),(8,-1)], "hair")
    streak([(3,0),(4,-1),(5,0),(4,2),(3,2)], "skin")
    streak([(4,0),(4,1)], "skin_hi")


def sword(draw, grip, tip):
    gx, gy = grip
    tx, ty = tip
    dx, dy = tx-gx, ty-gy
    length = math.hypot(dx, dy)
    ux, uy = dx/length, dy/length

    def at(distance, across=0):
        return (round(gx+ux*distance-uy*across), round(gy+uy*distance+ux*across))

    poly(draw, [at(-5,-1),at(4,-1),at(4,1),at(-5,1)], "brown", "ink")
    poly(draw, [at(4,-2),at(length-4,-2),at(length),at(length-4,2),at(4,2)], "steel", "ink")
    line(draw, [at(5,0),at(length-3,0),at(length-1)], "silver")
    line(draw, [at(6,1),at(length-5,1)], "steel_hi")
    poly(draw, [at(3,-4),at(4,-4),at(5,3),at(3,4)], "gold", "ink")
    line(draw, [at(4,-3),at(4,2)], "gold_hi")
    line(draw, [at(-4,-1),at(-4,1)], "gold")


def forearm(draw, shoulder, elbow, hand):
    sx, sy = shoulder
    ex, ey = elbow
    gx, gy = hand
    poly(draw, [(sx-3,sy-2),(sx+3,sy-2),(ex+3,ey-1),(ex+1,ey+4),(gx-1,gy+3),
                (gx-4,gy+1),(gx-3,gy-2),(ex-2,ey-3)], "navy", "ink")
    line(draw, [(ex-1,ey),(gx+2,gy-1)], "blue_hi")
    line(draw, [(gx+3,gy),(gx+4,gy+1),(gx+4,gy+2)], "steel")
    line(draw, [(ex,ey+2),(ex+1,ey+2)], "trim_dark")
    draw.rectangle((gx-3,gy-2,gx+1,gy+2), fill=PAL["brown"])
    line(draw, [(gx-2,gy-1),(gx+1,gy-1),(gx+1,gy)], "hide_hi")
    draw.point((gx-1,gy), fill=PAL["gold"])
    poly(draw, [(sx-4,sy-2),(sx-2,sy-5),(sx+2,sy-5),(sx+5,sy-3),
                (sx+6,sy),(sx+2,sy+2),(sx-3,sy+1)], "steel", "ink")
    line(draw, [(sx-3,sy-2),(sx-1,sy-4),(sx+2,sy-4),(sx+4,sy-3)], "steel_hi")
    line(draw, [(sx-1,sy-3),(sx+2,sy-3)], "silver")
    line(draw, [(sx+1,sy-2),(sx+4,sy-1)], "steel_dark")
    line(draw, [(sx-2,sy),(sx+2,sy+1),(sx+4,sy)], "gold")


def fallen(shift):
    im = Image.new("RGBA", SIZE)
    draw = ImageDraw.Draw(im)
    poly(draw, [(35,53),(43,50),(52,51),(65,55),(67,61),(59,62),(53,60),(47,63),(37,61)],
         "navy_dark", "ink")
    poly(draw, [(39,53),(45,51),(53,53),(58,55),(53,58),(46,59),(39,59)],
         "navy", "ink")
    line(draw, [(40,54),(45,53),(50,54)], "blue_hi")
    poly(draw, [(53,54),(57,51),(62,53),(64,56),(69,56),(71,59),(71,62),(64,62),(61,58),
                (57,59),(53,61),(48,59)], "trouser", "ink")
    poly(draw, [(62,56),(67,56),(67,54),(71,54),(71,60),(69,62),(66,61)],
         "hide", "ink")
    line(draw, [(68,55),(70,55),(70,57)], "hide_hi")
    line(draw, [(45,58),(38,59),(32,61)], "ink", 5)
    line(draw, [(42,58),(36,59),(33,60)], "steel", 2)
    draw.point((32,60), fill=PAL["gold"])
    poly(draw, [(43,53),(47,54),(49,57),(45,59),(40,56)], "steel_dark", "ink")
    line(draw, [(42,54),(45,54),(47,56)], "steel_hi")
    face = Image.new("RGBA", (32, 30))
    head(ImageDraw.Draw(face), (14,15), True)
    face = face.rotate(38+shift, resample=Image.Resampling.NEAREST, expand=True)
    face = face.crop(face.getbbox())
    im.alpha_composite(face, (19,63-face.height-shift//4))
    sword(draw, (21,59), (4,58))
    return im


def frame(pose, blink=False, fall=0):
    if fall >= 65:
        return fallen(0 if fall == 83 else 8)

    im = Image.new("RGBA", SIZE)
    draw = ImageDraw.Draw(im)
    cloak(draw, pose.shoulder, pose.hip, pose.cape)
    leg(draw, (pose.hip[0]+2, pose.hip[1]), pose.back_knee, pose.back_foot, False)
    leg(draw, (pose.hip[0]-3, pose.hip[1]), pose.front_knee, pose.front_foot, True)
    torso(draw, pose.shoulder, pose.hip)
    x, y = pose.offhand
    line(draw, [(pose.shoulder[0]-6,pose.shoulder[1]+1),(x+1,y+1),(x,y)], "ink", 6)
    line(draw, [(pose.shoulder[0]-6,pose.shoulder[1]+2),(x+1,y),(x,y)], "blue", 3)
    line(draw, [(x-1,y),(x+1,y)], "hide_hi", 2)
    if not fall:
        sword(draw, pose.hand, pose.tip)
    forearm(draw, pose.shoulder, pose.elbow, pose.hand)
    head(draw, pose.head, blink)
    if fall:
        # Align the lowest visible pixel to the same ground row throughout the fall.
        im = im.rotate(fall, resample=Image.Resampling.NEAREST, expand=True)
        im = im.crop(im.getbbox())
        placed = Image.new("RGBA", SIZE)
        placed.alpha_composite(im, (42-im.width//2,64-im.height))
        draw = ImageDraw.Draw(placed)
        sword(draw, (24,59), (6,58))
        return placed
    return im


LOW = READY._replace(head=(38,30),shoulder=(42,40),hip=(42,50),elbow=(42,45),
                     hand=(33,44),tip=(12,36),offhand=(38,47),cape=(1,0))
LIGHT = READY._replace(shoulder=(43,38),hip=(43,48),elbow=(43,43),hand=(34,42),tip=(14,31),
                       offhand=(39,45),cape=(0,-1))
BRACE = LOW._replace(elbow=(38,43),hand=(29,40),tip=(20,20),offhand=(35,43),cape=(1,0))
COIL = READY._replace(head=(40,29),shoulder=(46,39),hip=(45,49),elbow=(49,41),
                      hand=(51,36),tip=(64,19),offhand=(35,43),cape=(2,-1))
LIFT = COIL._replace(elbow=(49,36),hand=(46,29),tip=(50,6),offhand=(35,39),cape=(1,-2))
CUT = READY._replace(head=(36,29),shoulder=(40,38),hip=(41,48),front_knee=(30,51),
                     front_foot=(27,63),elbow=(34,33),hand=(28,33),tip=(10,20),offhand=(37,44),cape=(3,-2))
STRIKE = CUT._replace(head=(32,31),shoulder=(36,40),hip=(38,49),front_knee=(25,52),
                      front_foot=(23,63),back_knee=(49,52),back_foot=(54,63),elbow=(29,39),
                      hand=(22,42),tip=(3,42),offhand=(36,47),cape=(6,-2))
FOLLOW = STRIKE._replace(head=(34,33),shoulder=(38,42),hip=(40,51),front_knee=(26,53),
                         elbow=(31,46),hand=(25,50),tip=(6,55),offhand=(38,49),cape=(4,0))
RECOVER = LOW._replace(front_knee=(29,53),front_foot=(27,63),hand=(29,47),tip=(8,49))
RECOIL = BRACE._replace(head=(44,27),shoulder=(47,38),hip=(45,50),front_knee=(35,54),elbow=(46,46),
                        hand=(38,49),tip=(21,58),offhand=(46,44),cape=(2,1))
STAGGER = RECOIL._replace(head=(44,33),shoulder=(47,42),elbow=(44,48),hand=(36,52),tip=(16,56))
OFFER = BRACE._replace(elbow=(38,47),hand=(34,49),tip=(17,58),offhand=(28,35))
RELEASE = OFFER._replace(head=(37,30),shoulder=(41,40),offhand=(24,36),cape=(2,-1))
RAISE = LIGHT._replace(elbow=(42,32),hand=(36,28),tip=(31,5),offhand=(34,40))

# Keep the published durations/contact marks. The contact key draws the extended strike.
KEYS = {
    "idle": [READY,LIGHT,READY,LOW],
    "attack": [LOW,COIL,LIFT,CUT,STRIKE,FOLLOW,FOLLOW,RECOVER,LOW,READY],
    "guard": [LOW,BRACE,BRACE,LOW],
    "cast": [LOW,OFFER,OFFER,OFFER,RELEASE,RELEASE,RECOVER,READY],
    "hit": [RECOIL,STAGGER,STAGGER,LOW],
    "knockout": [RECOIL,STAGGER,(STAGGER,18),(STAGGER,39),(LOW,69),(LOW,83)],
    "victory": [READY,LIGHT,RAISE,RAISE,LIGHT,READY],
    "resolve": [BRACE,LOW,COIL,READY],
    "awaken": [LOW,BRACE,RAISE,RAISE,LIGHT,READY],
    "down": [(LOW,83)],
    "revive": [(LOW,83),(LOW,65),(STAGGER,42),(STAGGER,18),LOW,READY],
}


def main():
    timing = json.loads((ASSETS / "leon-clips.json").read_text())["clips"]
    timing["idle"] = [{"ms": ms} for ms in (245,185,235,135)]
    atlas = Image.new("RGBA", (max(map(len,KEYS.values()))*SIZE[0],len(KEYS)*SIZE[1]))
    clips = {}
    for row, (clip, poses) in enumerate(KEYS.items()):
        assert len(poses) == len(timing[clip]), clip
        clips[clip] = []
        for col, (key, old) in enumerate(zip(poses, timing[clip])):
            pose, fall = key if type(key) is tuple else (key, 0)
            im = frame(pose, blink=(clip,col) in {("idle",3),("hit",1)}, fall=fall)
            x, y = col*SIZE[0], row*SIZE[1]
            assert im.getbbox()[3] <= ANCHOR[1], (clip,col,im.getbbox())
            atlas.alpha_composite(im, (x,y))
            props = {k:v for k,v in old.items() if k not in {"x","y","w","h"}}
            clips[clip].append(dict(x=x, y=y, w=SIZE[0], h=SIZE[1], **props))
    out = ASSETS / "r23"
    out.mkdir(exist_ok=True)
    atlas.save(out / "leon-battle.png", optimize=True)
    (out / "leon-clips.json").write_text(json.dumps(
        dict(cell=SIZE,anchor=ANCHOR,clips=clips), separators=(",",":"))+"\n")


if __name__ == "__main__":
    main()
