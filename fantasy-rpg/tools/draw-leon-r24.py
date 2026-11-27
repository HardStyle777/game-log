"""Build Leon's battle frames with the party's native raster and shading."""
import json
from math import cos, hypot, radians, sin
from pathlib import Path
from typing import NamedTuple

from PIL import Image, ImageDraw, ImageColor

ASSETS = Path(__file__).resolve().parents[1] / "assets"
SOURCE = ASSETS / "r22"
LAYOUT = ASSETS / "r23" / "leon-clips.json"
THRESHOLDS = (21, 38, 61, 86, 113, 145, 180, 217)

HAIR = ("201717", "32211d", "4b3027", "644031", "865537", "a36b48", "c08659", "d6a16e", "ecbf87")
CLOTH = ("161a24", "212534", "2a354b", "344965", "415a77", "536e86", "698499", "889eaa", "abbcb9")
METAL = ("1b1b24", "292c36", "3f4351", "545967", "666e7c", "848d99", "aab3b9", "cad2cb", "f5f2da")
GOLD = ("241a1a", "3a2a21", "533921", "795337", "97714a", "b48b5c", "cea76e", "e4c48d", "f5e2b6")
LEATHER = ("1b1518", "282024", "41302c", "5b4339", "775440", "986e50", "b88759", "cda072", "e3b786")
CAPE = ("161822", "202437", "2b3852", "314564", "405b7d", "4a6489", "5c7d9b", "819ead", "a2bac3")
SHOULDER = (30, 39)
GRIP = (25, 47)
FLOOR = 64

# Screen coordinates in Glen's idle image. Cutting on existing armor seams keeps the native edge clusters.
HEAD_MASK = [(22,15),(49,15),(49,32),(44,34),(42,35),(40,37),(32,37),(29,34),(22,32)]
ARM_MASK = [(27,38),(31,38),(32,40),(30,42),(31,45),(29,48),(27,49),(23,49),(20,48),(23,44),(25,42)]
MANTLE_MASK = [(51,40),(56,42),(69,44),(69,57),(58,58),(55,52),(53,51)]
LEFT_LEG_MASK = [(30,49),(38,48),(41,54),(39,59),(38,65),(25,65),(25,54)]
RIGHT_LEG_MASK = [(40,48),(53,48),(57,54),(57,59),(60,65),(46,65),(45,58),(42,55)]


def color(code):
    return ImageColor.getcolor("#" + code, "RGBA")


def shade(rgb, ramp, bias=0):
    r, g, b = rgb[:3]
    luminance = (r*3 + g*6 + b)/10 + bias
    return color(ramp[sum(luminance >= t for t in THRESHOLDS)])


def layer(sprite, points):
    mask = Image.new("1", sprite.size)
    ImageDraw.Draw(mask).polygon(points, fill=1)
    cut = Image.new("RGBA", sprite.size)
    cut.paste(sprite, (0, 0), mask)
    return cut


def remove(base, *layers):
    for part in layers:
        base.paste((0, 0, 0, 0), (0, 0, *base.size), part.getchannel("A"))


def head_color(head):
    out = head.copy()
    for y in range(18, 37):
        for x in range(23, 49):
            p = head.getpixel((x,y))
            if not p[3]:
                continue
            r, g, b = p[:3]
            bright_fringe = y < 26 and x < 35
            if y < 28 or r > 1.85*g or (x >= 37 and r > 1.45*g and g < 115):
                out.putpixel((x,y), shade(p, HAIR, -3 if not bright_fringe else 8))
            elif p == color("f7e3b6"):
                out.putpixel((x,y), color("f3dcb4"))

    # Brown side-swept fringe, shortened back, visible far eye and blue near eye.
    for x,y,source in [
        (30,18,None),(31,18,None),(31,17,(34,21)),(32,18,(35,20)),
        (37,18,(38,21)),(38,18,(39,20)),(38,17,(40,21)),(39,18,(39,20)),
        (42,19,(42,20)),(43,20,(43,21)),(45,23,(44,23)),(46,23,(43,25)),
        (46,24,(45,24)),(47,25,(44,26)),(46,27,(44,27)),
        (45,31,None),(46,31,None),(46,32,None),(47,32,None),
        (46,33,None),(47,33,None),(45,34,None),(44,34,None),
        (29,31,(30,31)),(30,30,(30,29)),(34,28,(38,27)),(36,28,(37,26)),
    ]:
        out.putpixel((x,y), out.getpixel(source) if source else (0,0,0,0))
    for x,y,c in [
        (31,31,"618498"),(31,32,"344962"),(32,31,"d8c6aa"),
        (34,29,"4f3025"),(35,30,"241f2a"),(34,30,"36506b"),(34,31,"527593"),
        (35,31,"2d425c"),(36,31,"ead7b2"),(33,32,"f4e3c1"),
        (33,34,"d3a077"),(34,34,"dfb78c"),(41,32,"c69368"),(42,31,"c48c62"),
    ]:
        out.putpixel((x,y), color(c))
    return out


def armor_color(sprite):
    out = sprite.copy()
    for y in range(33,FLOOR):
        for x in range(17,67):
            p = sprite.getpixel((x,y))
            if not p[3]:
                continue
            r,g,b = p[:3]
            cape = (x >= 52 and y >= x//3+24 and x > (55 if y > 50 else y+6))
            shoulder = (x >= 42 and x <= 52 and y < 42) or (x < 32 and y < 39)
            arm = x < 31 or (x >= 48 and 40 <= y < 50)
            chest = 31 <= x <= 43 and 38 <= y <= 43
            knee = (30 <= x < 40 and 49 <= y < 54) or (43 <= x < 51 and 50 <= y < 55)
            if cape:
                ramp = CAPE
            elif (shoulder or arm or chest or knee) and g > 85:
                ramp = METAL if (g > r*.78 or r-g < 48) else GOLD
            elif y >= 55:
                ramp = LEATHER
            elif (37 <= x <= 46 and 47 <= y <= 50) or (g > 75 and r > g*1.34):
                ramp = GOLD
            else:
                ramp = CLOTH
            out.putpixel((x,y), shade(p,ramp))
    return out


def add_at(base, part, shift=(0,0)):
    base.alpha_composite(part, shift)


def stroke(draw, xy, code, width=1):
    draw.line(xy, fill=color(code), width=width)


def place_sword(draw, grip, tip):
    gx, gy = grip
    dx, dy = tip[0]-gx, tip[1]-gy
    length = hypot(dx,dy)
    ux,uy = dx/length,dy/length

    def at(dist, across=0):
        return round(gx+dist*ux-across*uy), round(gy+dist*uy+across*ux)

    draw.polygon([at(2,-1.4),at(length-4,-1.4),at(length,0),at(length-5,1.7),at(2,1.7)],
                 fill=color("8295a3"), outline=color("353b4c"))
    stroke(draw,[at(3,-.25),at(length-2,-.25)],"e3ebdd")
    stroke(draw,[at(4,1.2),at(length-5,1)],"adbcc1")
    stroke(draw,[at(3,-2.6),at(2,2.6)],"886847",2)
    stroke(draw,[at(3,-2.6),at(2,-.1)],"dcb480")
    stroke(draw,[at(-3,0),at(0,0)],"684a38",2)
    draw.point(at(-3), fill=color("b79365"))


class Key(NamedTuple):
    shift: tuple[int,int] = (0,0)
    blade: tuple[int,int] = (-18,-6)
    arm_angle: int = 0
    step: int = 0
    head_shift: tuple[int,int] = (0,0)
    mantle_shift: tuple[int,int] = (0,0)
    fall: int = 0
    blink: bool = False


READY = Key()
HIGH = Key(blade=(-17,-8), arm_angle=-5, head_shift=(0,-1))
BREATH = Key(shift=(0,1), blade=(-18,-5), head_shift=(0,0), mantle_shift=(1,0), blink=True)
COIL = Key(shift=(1,0), blade=(6,-22), arm_angle=-92, mantle_shift=(1,-1))
LIFT = Key(shift=(1,-1), blade=(-1,-21), arm_angle=-80, mantle_shift=(2,-2))
CUT = Key(shift=(-1,0), blade=(-14,-14), arm_angle=-38, step=-1, mantle_shift=(2,-1))
STRIKE = Key(shift=(-3,1), blade=(-15,0), arm_angle=-32, step=-3, head_shift=(-1,0), mantle_shift=(3,-1))
FOLLOW = Key(shift=(-2,2), blade=(-19,5), arm_angle=-11, step=-3, mantle_shift=(3,0))
RECOVER = Key(shift=(-1,1), blade=(-18,4), arm_angle=4, step=-1, mantle_shift=(1,1))
BRACE = Key(shift=(0,1), blade=(-5,-19), arm_angle=-23, mantle_shift=(1,0))
OFFER = Key(shift=(0,1), blade=(-12,10), arm_angle=7, mantle_shift=(1,0))
RELEASE = Key(blade=(-18,-9), arm_angle=-19, head_shift=(-1,0), mantle_shift=(2,-1))
RECOIL = Key(shift=(2,0), blade=(-14,8), arm_angle=7, head_shift=(1,-1), mantle_shift=(2,0))
STAGGER = Key(shift=(1,2), blade=(-18,3), arm_angle=4, head_shift=(1,1), mantle_shift=(2,1))
RAISE = Key(blade=(1,-21), arm_angle=-80, mantle_shift=(1,-1))
TIP = STAGGER._replace(fall=26)
KNEEL = STAGGER._replace(fall=49)
FALL = STAGGER._replace(fall=66)
DOWN = STAGGER._replace(fall=84)
KEYS = {
    "idle": [READY,HIGH,READY,BREATH],
    "attack": [BREATH,COIL,LIFT,CUT,STRIKE,FOLLOW,FOLLOW,RECOVER,BREATH,READY],
    "guard": [READY,BRACE,BRACE,BREATH],
    "cast": [READY,OFFER,OFFER,BRACE,RELEASE,RELEASE,RECOVER,READY],
    "hit": [RECOIL,STAGGER,RECOIL,READY],
    "knockout": [RECOIL,STAGGER,TIP,KNEEL,FALL,DOWN],
    "victory": [READY,HIGH,RAISE,RAISE,HIGH,READY],
    "resolve": [BRACE,BREATH,COIL,READY],
    "awaken": [BREATH,BRACE,RAISE,RAISE,HIGH,READY],
    "down": [DOWN],
    "revive": [DOWN,FALL,KNEEL,TIP,BREATH,READY],
}


def rotate_point(point, pivot, angle):
    a = radians(angle)
    x,y = point[0]-pivot[0], point[1]-pivot[1]
    return round(pivot[0]+cos(a)*x+sin(a)*y), round(pivot[1]-sin(a)*x+cos(a)*y)


def settle_fall(sprite, compression):
    # The forward shoulder stays on the ground as the far boot and cape settle.
    settled = Image.new("RGBA", sprite.size)
    for x in range(sprite.width):
        weight = min(1, max(0, (x-14)/19))
        height = round(sprite.height*(1-compression*weight))
        column = sprite.crop((x,0,x+1,sprite.height))
        column = column.resize((1,height),Image.Resampling.NEAREST)
        add_at(settled,column,(x,sprite.height-height))
    return settled.crop(settled.getbbox())


def render(parts, key):
    body, head, arm, mantle, front_leg, back_leg = parts
    dx,dy = key.shift
    mx,my = key.mantle_shift
    hx,hy = key.head_shift
    im = Image.new("RGBA", body.size)
    add_at(im, mantle, (dx+mx,dy+my))
    add_at(im, back_leg)
    add_at(im, front_leg, (key.step,0))

    hand = rotate_point(GRIP, SHOULDER, key.arm_angle)
    grip = (hand[0]+dx,hand[1]+dy)
    tip = (grip[0]+key.blade[0],grip[1]+key.blade[1])
    if not key.fall:
        place_sword(ImageDraw.Draw(im), grip, tip)
    swung_arm = arm.rotate(key.arm_angle, center=SHOULDER, resample=Image.Resampling.NEAREST)
    add_at(im, swung_arm, (dx,dy))
    add_at(im, body, key.shift)
    add_at(im, head, (dx+hx,dy+hy))
    if key.blink:
        stroke(ImageDraw.Draw(im), [(34+dx+hx,31+dy+hy),(35+dx+hx,31+dy+hy)],"573c34")

    if key.fall:
        im = im.rotate(key.fall, expand=True, resample=Image.Resampling.NEAREST)
        im = im.crop(im.getbbox())
        if key.fall >= 66:
            im = settle_fall(im,.38 if key.fall == 84 else .22)
        fallen = Image.new("RGBA",body.size)
        add_at(fallen, im, (42-im.width//2,FLOOR-im.height))
        place_sword(ImageDraw.Draw(fallen), (22,61), (6,60))
        return fallen
    return im


def main():
    metadata = json.loads((SOURCE / "motion.json").read_text())
    actor = metadata["actors"]["glen"]
    ready = actor["clips"]["idle"][0]
    x,y,w,h = (ready[k] for k in ("x","y","w","h"))
    sprite = Image.open(SOURCE / (actor["file"]+".png")).convert("RGBA").crop((x,y,x+w,y+h))

    # The original sword is replaced by Leon's own blade and arm motion.
    ImageDraw.Draw(sprite).polygon([(0,41),(19,41),(23,45),(24,48),(21,52),(0,53)],fill=(0,0,0,0))
    head = layer(sprite, HEAD_MASK)
    armor = armor_color(sprite)
    remove(armor, head)
    mantle = layer(armor, MANTLE_MASK)
    for x,y in ((61,53),(62,54),(63,54)):
        if mantle.getpixel((x,y))[3]:
            mantle.putpixel((x,y),color("a08255"))
    arm = layer(armor, ARM_MASK)
    front_leg = layer(armor, LEFT_LEG_MASK)
    back_leg = layer(armor, RIGHT_LEG_MASK)
    keep_hip = layer(armor,[(30,47),(50,47),(52,50),(47,51),(35,51),(30,50)])
    remove(armor, mantle, arm, front_leg, back_leg)
    add_at(armor, keep_hip)
    draw = ImageDraw.Draw(armor)
    stroke(draw, [(39,35),(40,36),(42,36),(43,35)], "86513e")
    stroke(draw, [(39,36),(40,37),(42,37)], "be7b51")
    stroke(draw, [(32,44),(34,45),(36,45)], "617b8e")
    parts = armor, head_color(head), arm, mantle, front_leg, back_leg

    clips = json.loads(LAYOUT.read_text())["clips"]
    atlas = Image.new("RGBA",(max(map(len, clips.values()))*w,len(clips)*h))
    for name,seq in KEYS.items():
        assert len(seq) == len(clips[name]), name
        for key, slot in zip(seq,clips[name]):
            im = render(parts,key)
            x0,y0,x1,y1 = im.getbbox()
            assert 0 < x0 < x1 < w and 0 < y0 < y1 <= FLOOR, (name,im.getbbox())
            atlas.alpha_composite(im,(slot["x"],slot["y"]))

    out = ASSETS / "r24"
    out.mkdir(exist_ok=True)
    atlas.save(out / "leon-battle.png", optimize=True)


if __name__ == "__main__":
    main()
