"""Build battle atlases from the party's detailed source art at twice the original grid."""
import json
from pathlib import Path
from typing import NamedTuple

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parents[1] / "assets"
OUT = ASSETS / "r25"
CELL = (160, 144)
ANCHOR = (84, 128)
FOOT = ANCHOR[1]
NEAREST = Image.Resampling.NEAREST


class Source(NamedTuple):
    art: str
    box: tuple[int, int, int, int]
    waist: int
    pivot: tuple[int, int]
    weapon: tuple[tuple[int, int], ...]


SOURCES = {
    "fia": Source("fia", (20,36,118,128), 96, (59,85),
                  ((18,34),(35,33),(51,44),(53,56),(49,59),(51,66),(43,72),(46,79),(58,81),
                   (61,88),(53,94),(46,93),(56,127),(46,127),(35,87),(33,76),(27,67),(18,66))),
    "glen": Source("glen", (22,36,130,128), 101, (55,81),
                   ((20,108),(41,90),(46,87),(51,81),(53,76),(58,77),(59,84),(55,90),
                    (52,96),(47,99),(23,115),(20,115))),
    "eris": Source("eris", (20,30,110,128), 100, (57,91),
                   ((17,53),(32,53),(36,56),(43,60),(46,64),(49,71),(49,79),(48,85),(54,88),(61,90),
                    (62,98),(54,105),(57,117),(48,118),(40,103),(35,95),(33,85),(24,83),(17,75))),
}

# Every pose uses the same head and armor. The movement comes from the upper body,
# planted legs and pivots at the weapon hand/shoulder, with no resampled silhouettes between ticks.
class Pose(NamedTuple):
    x: int = 0
    y: int = 0
    angle: int = 0
    step: int = 0
    fall: int = 0


READY = Pose()
RISE = Pose(0,-1,-2)
LOW = Pose(0,1,2)
DRAW = Pose(1,0,10)
WINDUP = Pose(2,-1,23)
LIFT = Pose(1,-2,45)
SWING = Pose(-2,0,-17,1)
CONTACT = Pose(-5,2,-31,3)
RESTORE = Pose(-1,1,-3,1)
GUARD = Pose(1,2,-18)
FLINCH = Pose(4,1,12)
STAGGER = Pose(3,3,16)
TIP = Pose(3,3,18,0,23)
KNEEL = Pose(2,2,14,0,47)
FALL = Pose(1,2,12,0,68)
DOWN = Pose(0,1,7,0,83)
VICTORY = Pose(0,-2,-35)

LEON_DRAW = Pose(1,0,-29)
LEON_LIFT = Pose(2,-1,-62)
LEON_CUT = Pose(-2,0,-37,1)
LEON_CONTACT = Pose(-5,2,10,3)
LEON_FOLLOW = Pose(-3,3,29,3)
LEON_GUARD = Pose(1,2,-39)
LEON_KEYS = {
    "idle": (READY,RISE,READY,LOW),
    "attack": (LOW,LEON_DRAW,LEON_LIFT,LEON_CUT,LEON_CONTACT,LEON_FOLLOW,LEON_FOLLOW,RESTORE,LOW,READY),
    "guard": (READY,LEON_GUARD,LEON_GUARD,LOW),
    "cast": (READY,DRAW,DRAW,GUARD,SWING,SWING,RESTORE,READY),
    "hit": (FLINCH,STAGGER,FLINCH,READY),
    "knockout": (FLINCH,STAGGER,TIP,KNEEL,FALL,DOWN),
    "victory": (READY,RISE,VICTORY,VICTORY,RISE,READY),
    "resolve": (GUARD,LOW,DRAW,READY),
    "awaken": (LOW,GUARD,VICTORY,VICTORY,RISE,READY),
    "down": (DOWN,),
    "revive": (DOWN,FALL,KNEEL,TIP,LOW,READY),
}


def companion_keys(actor):
    if actor == "glen":
        windup = (READY,DRAW,LIFT)
        attack = (SWING,Pose(-4,1,-21,2),CONTACT,RESTORE)
        cast = (READY,DRAW,SWING,READY)
        guard = (LOW,GUARD,LOW)
    else:
        # Fia thrusts from her shoulder. Lucia draws her staff close before releasing.
        charge = Pose(1,-1,-13 if actor=="fia" else 12)
        hold = Pose(0,-1,-8 if actor=="fia" else 16)
        throw = Pose(-2,1,16 if actor=="fia" else 23)
        windup = (READY,hold,charge)
        attack = (hold,throw,throw,RESTORE)
        cast = (hold,charge,throw,RESTORE)
        guard = (LOW,Pose(1,2,-7 if actor=="fia" else 9),LOW)
    return {
        "idle": (READY,RISE,LOW,READY),
        "windup": windup,
        "attack": attack,
        "cast": cast,
        "guard": guard,
        "hit": (FLINCH,STAGGER,READY),
        "down": (DOWN,),
    }


def mask_layer(source, points):
    mask = Image.new("1", CELL)
    ImageDraw.Draw(mask).polygon(points,fill=1)
    result = Image.new("RGBA", CELL)
    result.paste(source,(0,0),mask)
    return result


def remove(sprite, part):
    sprite.paste((0,0,0,0),(0,0,*CELL),part.getchannel("A"))


def clean_specks(sprite, minimum):
    remaining = {(x,y) for y in range(CELL[1]) for x in range(CELL[0]) if sprite.getpixel((x,y))[3]}
    while remaining:
        pixels=[remaining.pop()]
        for x,y in pixels:
            for dx,dy in ((-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)):
                neighbor=(x+dx,y+dy)
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    pixels.append(neighbor)
        if len(pixels)<minimum:
            for point in pixels:
                sprite.putpixel(point,(0,0,0,0))
    return sprite


def source_sprite(config):
    img = Image.open(ASSETS/(config.art+".png")).convert("RGBA")
    x0,y0,x1,y1 = config.box
    reduced = img.crop(img.getbbox()).resize((x1-x0,y1-y0),Image.Resampling.BOX)
    # Give newly sampled edge pixels a hard alpha and drop the original grass matte.
    out = Image.new("RGBA", CELL)
    for y in range(y1-y0):
        for x in range(x1-x0):
            r,g,b,a = reduced.getpixel((x,y))
            if a<132:
                continue
            px,py = x+x0,y+y0
            grassy = g>r*1.02 and g>b*1.18 and g>27
            in_floor = py>=101
            in_edge = py>=60 and (px<38 or px>=104)
            if grassy and (in_floor or in_edge):
                continue
            if config.art=="glen" and 64<=px<=87 and 110<=py<=119 and g>=r*.87 and g>b*1.28:
                continue
            out.putpixel((px,py),(r,g,b,255))
    return clean_specks(out,4)


def rgb(code):
    return tuple(bytes.fromhex(code))


def ramp(p, colors):
    r,g,b = p
    t = (r*3+g*6+b)/10
    levels = (0,30,55,82,115,150,184,216,248)
    for i in range(len(levels)-1):
        if t<levels[i+1]:
            mix=(t-levels[i])/(levels[i+1]-levels[i])
            a,b=rgb(colors[i]),rgb(colors[i+1])
            return tuple(round(x+(y-x)*mix) for x,y in zip(a,b))
    return rgb(colors[-1])


BROWN = ("131013","231819","38251e","553324","764a31","946244","b47c54","d49b68","efc792")
BLUE = ("11131d","1d2231","29334a","354968","445f82","59778f","7696aa","a5b6bc","d6ded5")
SILVER = ("10141b","20252f","303944","465362","616f7d","7c8c94","a0a9ac","c6ceca","efeee2")
GOLD = ("161415","26201e","403126","624831","875f3c","a88054","c29c68","dec18b","f6dfac")


def leon_coloring(sprite):
    out = sprite.copy()
    for y in range(31,FOOT):
        for x in range(38,131):
            r,g,b,a=sprite.getpixel((x,y))
            if not a:
                continue
            p=(r,g,b)
            head = y<57 or (x<92 and y<65 and x>=49)
            if head and r>g*1.36 and r>b*1.38 and g<164:
                p=ramp(p,BROWN)
            elif head:
                if ((55<=x<=64 and 57<=y<=65) or (68<=x<=75 and 56<=y<=64)) and b>=20 and g<110 and abs(r-g)<48:
                    p=ramp(p,BLUE)
            elif y>=116:
                continue
            elif (x>106 and y>=88) or (x>=83 and 89<=y<=106 and r>g*1.55):
                p=ramp(p,BLUE)
            elif ((80<=x<=112 and 65<=y<=89) or (57<=x<=81 and 74<=y<=85) or
                  (51<=x<=71 and 99<=y<=110)) and r-g<42:
                p=ramp(p,SILVER)
            elif 61<=x<=84 and 87<=y<=99 and r-g>23 and g>90:
                p=ramp(p,GOLD)
            elif 61<=y<=73 and x<89 and r>g*1.55:
                # Rust-red lining recalls the original collar.
                p=(round(r*.80),round(g*.94),round(b*.99))
            elif x>=52 and y<111 and r>g*1.21:
                p=ramp(p,BLUE)
            out.putpixel((x,y),(*p,a))

    # A swept tuft and a tighter rear hairline make Leon's head distinct from Glen's.
    draw = ImageDraw.Draw(out)
    draw.polygon([(86,45),(93,44),(89,48),(92,48),(88,52)],fill=(50,31,25,255))
    draw.line([(86,46),(90,45),(87,48)],fill=(135,83,48,255))
    draw.line([(64,38),(67,35),(72,36),(69,38)],fill=(113,72,42,255),width=2)
    draw.polygon([(84,62),(91,59),(96,61),(91,64),(88,66)],fill=(0,0,0,0))
    # Blue irises remain readable at the normal stage scale.
    draw.line([(70,60),(70,62)],fill=(42,75,103,255),width=2)
    draw.point((71,60),fill=(126,174,192,255))
    return out


def rig(actor):
    config = SOURCES["glen" if actor=="leon" else actor]
    art = source_sprite(config)
    if actor=="leon":
        art=leon_coloring(art)
    weapon=mask_layer(art,config.weapon)
    if actor=="leon":
        blade=mask_layer(weapon,((19,105),(40,89),(45,89),(47,91),(46,95),(41,102),(22,115),(19,115)))
        remove(weapon,blade)
        weapon.alpha_composite(blade.rotate(-49,center=(46,93),resample=NEAREST))
    # Cut from the pre-rotation raster, so the original blade cannot peek through.
    remove(art,mask_layer(art,config.weapon))
    torso = art.copy()
    torso.paste((0,0,0,0),(0,config.waist+2,CELL[0],CELL[1]))
    legs = art.copy()
    legs.paste((0,0,0,0),(0,0,CELL[0],config.waist-1))
    if actor in ("leon","glen"):
        front = mask_layer(legs,((47,100),(66,99),(69,109),(65,124),(62,130),(40,130),(42,110)))
        remove(legs,front)
    else:
        front=Image.new("RGBA",CELL)
    return config,weapon,torso,legs,front


def ground(sprite, fall):
    turned=sprite.rotate(fall,expand=True,resample=NEAREST)
    turned=turned.crop(turned.getbbox())
    if fall>=65:
        # Settle the far cape and boot toward the ground while keeping the facial pixels.
        h,w=turned.height,turned.width
        flat=Image.new("RGBA",turned.size)
        amount=.42 if fall>=80 else .23
        for x in range(w):
            compression=amount*min(1,max(0,(x-w*.25)/(w*.40)))
            height=round(h*(1-compression))
            flat.alpha_composite(turned.crop((x,0,x+1,h)).resize((1,height),NEAREST),(x,h-height))
        turned=flat.crop(flat.getbbox())
    out=Image.new("RGBA",CELL)
    out.alpha_composite(turned,(ANCHOR[0]-turned.width//2,FOOT-turned.height))
    return out


def render(parts, pose):
    config,weapon,torso,legs,front=parts
    im=Image.new("RGBA",CELL)
    im.alpha_composite(legs)
    im.alpha_composite(front,(-pose.step,0))
    arm=weapon.rotate(pose.angle,center=config.pivot,resample=NEAREST)
    im.alpha_composite(arm,(pose.x,pose.y))
    im.alpha_composite(torso,(pose.x,pose.y))
    if pose.fall:
        return clean_specks(ground(im,pose.fall),9)
    # Avoid any weapon crossing the ground during its wind-up or follow-through.
    im.paste((0,0,0,0),(0,FOOT,CELL[0],CELL[1]))
    return clean_specks(im,9)


def write_atlas(actor, baseline, keys):
    parts=rig(actor)
    variants={}
    clips={}
    bounds={}
    for name,samples in keys.items():
        assert len(samples)==len(baseline[name]), (actor,name)
        clips[name]=[]
        bounds[name]=[]
        for pose,previous in zip(samples,baseline[name]):
            if pose not in variants:
                variants[pose]=(len(variants),render(parts,pose))
            index,im=variants[pose]
            box=im.getbbox()
            assert box and 0<box[0]<box[2]<CELL[0] and 0<box[1]<box[3]<=FOOT,(actor,name,box)
            bounds[name].append(box)
            f={**previous,"x":(index%6)*CELL[0],"y":(index//6)*CELL[1],"w":CELL[0],"h":CELL[1]}
            clips[name].append(f)

    atlas=Image.new("RGBA",(6*CELL[0],(1+(len(variants)-1)//6)*CELL[1]))
    for index,im in variants.values():
        atlas.alpha_composite(im,((index%6)*CELL[0],(index//6)*CELL[1]))
    # Store crisp, fully opaque pixels selected from one palette for the entire animation.
    indexed=atlas.quantize(colors=88,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
    assert set(indexed.convert("RGBA").getchannel("A").get_flattened_data())<={0,255},actor
    indexed.save(OUT/(actor+"-battle.png"),optimize=True)
    return clips,bounds


def main():
    OUT.mkdir(exist_ok=True)
    old=json.loads((ASSETS/"r22"/"motion.json").read_text())["actors"]
    leon=json.loads((ASSETS/"r23"/"leon-clips.json").read_text())["clips"]
    metadata={"cell":CELL,"anchor":ANCHOR,"actors":{}}
    for actor,baseline,keys in [("leon",leon,LEON_KEYS)]+[
        (actor,m["clips"],companion_keys(actor)) for actor,m in old.items()
    ]:
        clips,bounds=write_atlas(actor,baseline,keys)
        metadata["actors"][actor]={"file":actor+"-battle","clips":clips}
        for group in (("idle",),tuple(bounds)):
            boxes=[box for k in group for box in bounds[k]]
            print(actor,group[0] if len(group)==1 else "all",(
                  min(b[0] for b in boxes),min(b[1] for b in boxes),
                  max(b[2] for b in boxes),max(b[3] for b in boxes)))
    (OUT/"motion.json").write_text(json.dumps(metadata,separators=(",",":"))+"\n")


if __name__=="__main__":
    main()
