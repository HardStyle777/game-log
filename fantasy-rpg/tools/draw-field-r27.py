"""Render the map artwork at three pixels per field unit using the field model."""
import json
import random
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

GAME = Path(__file__).resolve().parents[1]
OUT = GAME / "assets" / "r27"
SCALE = 3


class Art:
    def __init__(self, w, h, fill=None, mode="RGBA"):
        self.w, self.h = w, h
        self.image = Image.new(mode, (w*SCALE,h*SCALE), fill)
        self.pen = ImageDraw.Draw(self.image)

    def pixel(self, x, y):
        return round(x*SCALE),round(y*SCALE)

    def rect(self, x, y, w, h, color):
        x0,y0 = self.pixel(x,y)
        x1,y1 = self.pixel(x+w,y+h)
        if x1>x0 and y1>y0:
            self.pen.rectangle((x0,y0,x1-1,y1-1), fill=color)

    def oval(self, x, y, w, h, color):
        self.pen.ellipse((*self.pixel(x,y),*self.pixel(x+w,y+h)),fill=color)

    def poly(self, pts, color):
        self.pen.polygon([self.pixel(x,y) for x,y in pts],fill=color)

    def line(self, pts, color, width=1):
        self.pen.line([self.pixel(x,y) for x,y in pts],fill=color,width=max(1,round(width*SCALE)))


def grass(w,h,meadow):
    g = Art(w,h,"#6c9854" if meadow else "#739752","RGB")
    rng = random.Random(980 if meadow else 483)
    tones = ("#668e4d","#719b54","#789e56","#6a9350","#80a25b") if meadow else (
        "#6b904e","#789953","#7d9d54","#739553","#81a059")
    for y in range(-24,h,38):
        for x in range(-21,w,51):
            a,b = x+rng.randrange(-14,17),y+rng.randrange(-10,15)
            color = rng.choice(tones)
            g.poly([(a,b+6),(a+9,b),(a+34,b-3),(a+47,b+2),(a+63,b+13),
                    (a+56,b+27),(a+36,b+29),(a+10,b+24),(a-5,b+16)],color)
    for y in range(5,h,10):
        for x in range(3,w,11):
            a,b = x+rng.randrange(-3,5),y+rng.randrange(-3,5)
            if rng.random()<.62:
                g.rect(a,b,4.4,.7,"#5e8548" if meadow else "#648848")
                g.poly([(a+.4,b),(a-.9,b-1.6),(a+.1,b-1.3),(a+1.4,b),
                        (a+2,b-2.3),(a+2.7,b-2),(a+2.6,b)],"#93aa60")
            if rng.random()<.075:
                g.rect(a+4,b+4,3.5,.6,"#527c47")
                g.line([(a+5,b+4),(a+5.5,b+1)],"#51834a",.55)
                g.rect(a+5,b+1,1.3,1.1,rng.choice(("#ebde9a","#f2ece0","#d0a48a","#9d9abd")))
    return g


def roads(config, kind, ground):
    w,h = ground.w,ground.h
    paved = kind=="town"
    clip = Art(w,h,0,"L")
    for x,y,a,b in config["paths"]:
        if paved:
            clip.rect(x,y,a,b,255)
        else:
            rng = random.Random(x*23+y)
            if a<b:
                left=[(x+rng.randint(-4,4),t) for t in range(y,y+b,12)]
                right=[(x+a+rng.randint(-4,4),t) for t in range(y,y+b,12)]
                clip.poly(left+[(x,y+b),(x+a,y+b)]+right[::-1],255)
            else:
                top=[(t,y+rng.randint(-3,4)) for t in range(x,x+a,12)]
                bottom=[(t,y+b+rng.randint(-4,3)) for t in range(x,x+a,12)]
                clip.poly(top+[(x+a,y),(x+a,y+b)]+bottom[::-1],255)
    rim = clip.image.filter(ImageFilter.MaxFilter(2*SCALE*2+1))
    ground.image.paste("#5a7746" if paved else "#849360",(0,0,w*SCALE,h*SCALE),rim)
    road = Art(w,h,"#818374" if paved else "#b19a70","RGB")
    rng = random.Random(14 if paved else 630)
    if paved:
        shades=("#afab97","#b8b29e","#aaa794","#c0b8a3","#a3a697","#b2aea0","#bcb7a7")
        for row,y in enumerate(range(-2,h,8)):
            for x in range(-15+row%2*8,w,16):
                col=rng.choice(shades)
                road.poly([(x,y+1.3),(x+1.4,y),(x+13.9,y),(x+15.3,y+1),
                           (x+15.3,y+6),(x+14.7,y+7),(x+.5,y+7),(x,y+6)],col)
                road.line([(x+1.3,y+1),(x+13.3,y+1)],"#cdc3a9",.45)
                road.line([(x+1.8,y+6.6),(x+14,y+6.6)],"#90927f",.5)
                if rng.random()<.31:
                    road.rect(x+2+rng.randrange(7),y+2.5,3,.42,"#929685")
                if rng.random()<.07:
                    road.line([(x+2,y+5),(x+4,y+3),(x+7,y+3.5),(x+9,y+2)],"#969a88",.45)
    else:
        for y in range(-12,h,8):
            for x in range(-11,w,11):
                a,b=x+rng.randrange(8),y+rng.randrange(7)
                col=rng.choice(("#a48d64","#c5ad80","#bea477","#ab9267","#d0b684"))
                road.poly([(a,b),(a+2,b-.7),(a+5,b-.3),(a+5.6,b+.6),(a+2.2,b+1.1)],col)
                if rng.random()<.17:
                    road.poly([(a,b+1),(a+3.5,b+.5),(a+4.5,b+2),(a+2.5,b+3),(a,b+3)],"#958566")
                    road.rect(a+.6,b+1,2.6,.6,"#c9b58f")
    ground.image.paste(road.image,(0,0),clip.image)


def town(config):
    g = grass(config["w"],config["h"],False)
    roads(config,"town",g)
    for x in range(0,576,12):
        if x<246 or x>=332:
            g.rect(x,480,12,16,"#59664e")
            g.poly([(x,478),(x+2,475),(x+10,475),(x+12,479),(x+12,485),
                    (x+9,487),(x,486)],"#969b80")
            g.rect(x+2,476,7,1.3,"#c3bd9e")
            g.rect(x+1,487,10,3.5,"#717b64")
            g.rect(x+7,490,.65,4.8,"#4b5b46")
    for end in (248,576):
        start=0 if end==248 else 328
        g.rect(start,0,end-start,13,"#415d3a")
        for x in range(start,end,8):
            g.poly([(x,1),(x+4,0),(x+8,1),(x+8,9),(x+4,11),(x,9)],"#567c44")
            g.rect(x+1,1,4.5,2,"#86a456")
    # The plaza paving, drainage and entrance stones are drawn from the same palette.
    for y in (187,289):
        g.line([(10,y),(242,y)],"#7d8475",1)
        g.line([(335,y),(565,y)],"#7d8475",1)
    g.oval(248,216,80,64,"#899386")
    g.oval(251,217,74,59,"#d6c9a6")
    g.oval(255,221,66,50,"#afb4a0")
    for x in (251,324):
        for y in list(range(16,182,7))+list(range(300,472,7)):
            g.rect(x,y,2,5.6,"#a2a18c")
            g.rect(x+.35,y+.4,.55,4.4,"#d0c4a8")
    for x in (231,345):
        for y in (204,277):
            g.poly([(x-10,y),(x-8,y-4),(x+8,y-4),(x+10,y),
                    (x+8,y+4),(x-8,y+4)],"#8f967a")
            g.rect(x-8,y-2,16,4,"#6b804c")
            for i in range(7):
                u=x-6+i*2
                g.line([(u,y+1.4),(u-.3,y-1.4)],"#9cac62",.5)
                g.rect(u-.4,y-1.6+(i%2)*.7,.9,.9,("#dcb6a5","#e4cd8f")[i%2])
    for b in config["buildings"]:
        x,y=b["door"]
        g.poly([(x-15,y-1),(x+15,y-1),(x+17,y+16),(x-17,y+16)],"#a7a189")
        for z in range(4):
            g.rect(x-12-z*.6,y+z*4.1,24+z*1.2,1.05,"#d0c7ac")
    return g


def meadow(config):
    g=grass(config["w"],config["h"],True)
    roads(config,"meadow",g)
    rng=random.Random(1113)
    for cx,cy in [(110,173),(420,145),(95,302),(433,380),(200,475),(510,253),(150,418)]:
        for k in range(27):
            x,y=cx+rng.randrange(-31,32),cy+rng.randrange(-22,22)
            color=rng.choice(("#4c8249","#567e47","#679a52","#a1b66d"))
            g.poly([(x-1,y),(x-2,y-3),(x-.5,y-2),(x+.5,y),(x+1.1,y-4),
                    (x+2,y-2),(x+2.4,y)],color)
    for cx,cy in [(219,92),(381,118),(201,302),(384,471),(110,198),(476,173),(94,413)]:
        for i in range(9):
            x,y=cx+rng.randrange(-16,17),cy+rng.randrange(-13,14)
            g.line([(x,y+2),(x+.5,y)],"#508a4a",.55)
            g.rect(x-.8,y-.6,2,1.3,rng.choice(("#e3c56e","#dfd3ad","#b3a4c7","#e1ad95")))
            g.rect(x+.15,y-.15,.65,.55,"#eee5ad")
    return g


def room(config):
    w,h=config["w"],config["h"]
    g=Art(w,h,"#a87952","RGB")
    rng=random.Random(714)
    for j,y in enumerate(range(0,h,9)):
        for x in range(-24+(j%4)*12,w,48):
            g.rect(x,y,47.75,8.5,rng.choice(("#b58b5e","#ad8357","#bc9160","#b28658","#b78a5e")))
            g.rect(x+.7,y+.45,45.5,.65,"#cea469")
            g.rect(x+.5,y+8,46,.55,"#896248")
            g.rect(x+1.4,y+1.8,.55,5.8,"#957154")
            for k in range(3):
                a,b=x+rng.randrange(3,23),y+rng.randrange(3,8)
                g.line([(a,b),(a+5,b-.4),(a+13,b-.35)],rng.choice(("#aa7b52","#9d704b","#c39465")),.37)
    g.rect(0,0,w,25,"#af956f")
    g.rect(0,0,w,4,"#5b432e")
    for x in range(8,w,32):
        g.rect(x,5,29,15,"#d8bb89")
        g.rect(x,19,29,2,"#ba976d")
        g.rect(x,4,2,20,"#7b5538")
    for y,col in [(21,"#533727"),(22,"#885d3d"),(25,"#63462e"),(26,"#d0a76b"),(28,"#926743")]:
        g.rect(0,y,w,1.8,col)
    for x in (0,w-7):
        g.rect(x,0,7,h,"#573e2d")
        g.rect(x+1.1,2,1.1,h-2,"#94714d")
    g.rect(7,304,93,16,"#664530")
    g.rect(156,304,93,16,"#664530")
    g.rect(101,304,54,16,"#71513a")
    g.rect(103,307,50,5,"#cca471")
    g.rect(105,308,46,1,"#e1bf83")
    # Woven carpet, stitched border and repeating diamonds.
    g.rect(81,168,96,66,"#684732")
    g.rect(83,169,92,63,"#b78651")
    g.rect(86,172,86,57,"#82454a")
    g.rect(90,176,78,49,"#c08b61")
    g.rect(92,178,74,45,"#9a5751")
    for x in range(95,166,9):
        for y in (180,221):
            g.poly([(x,y-1.8),(x+2,y),(x,y+1.8),(x-2,y)],"#e0b77e")
    for x in (109,129,149):
        g.poly([(x,186),(x+14,201),(x,216),(x-14,201)],"#c38b66")
        g.poly([(x,189),(x+10,201),(x,213),(x-10,201)],"#72464a")
        g.poly([(x,196),(x+5,201),(x,206),(x-5,201)],"#e2b47d")
    for x in range(85,174,2):
        g.rect(x,167,.6,3,"#c6a071")
        g.rect(x,231,.6,3,"#c6a071")
    for x in (74,182):
        g.rect(x-13,3,26,17,"#533e2d")
        g.rect(x-10,5,20,12,"#8aafa6")
        g.line([(x-8,14),(x-3,6),(x,6),(x+6,11)],"#c5d0a5",.75)
        g.rect(x-.7,5,1.4,12,"#825c3c")
        g.rect(x-11,11,22,1.3,"#825c3c")
        g.rect(x-15,18,30,2,"#bb9365")
    for x in (48,208):
        for y in range(72,110,3):
            for side in (-1,1):
                g.rect(x+side*17,y,.75,2.3,"#b79968")
    return g


ROOFS={
    "inn":("#263e53","#385976","#527aa0","#6c92ad","#9cc0c5"),
    "shop":("#592f37","#78433d","#9d5b4e","#c0785c","#d99c72"),
    "hall":("#283f47","#3d5d67","#4f7980","#73999a","#a8bfab"),
    "home":("#5c393a","#825044","#a76a52","#c38363","#dfaa78"),
}


def building(info):
    w,h=info["w"],info["h"]
    name=info["id"]
    a=Art(w+20,h+19)
    x,y=10,12
    d=x+(info["door"][0]-info["x"])
    dark,s0,s1,s2,hi=ROOFS[name]
    a.oval(x+1,y+h-9,w+16,17,"#263c325d")
    a.rect(x+4,y+31,w-8,h-32,"#5d4436")
    a.rect(x+7,y+35,w-14,h-36,"#d6bd8c")
    a.rect(x+7,y+35,w-14,6,"#ac8f64")
    a.rect(x+7,y+h-11,w-14,10,"#848274")
    for k in range(7,w-9,11):
        a.rect(x+k,y+h-10,9,3,"#a9a795")
        a.rect(x+k+4,y+h-5,8,3,"#9b9784")
    for beam in (8,w//2-2,w-12):
        a.rect(x+beam,y+36,4,h-43,"#765337")
        a.rect(x+beam+.7,y+39,.85,h-46,"#a27348")
    for dx in (13,w-26):
        a.rect(x+dx,y+42,15,21,"#6e523a")
        a.rect(x+dx+1.4,y+44,12,16,"#315665")
        a.rect(x+dx+2.1,y+44.6,10.4,5.4,"#648c96")
        a.line([(x+dx+2.5,y+52),(x+dx+7,y+46)],"#a4babb",.8)
        a.rect(x+dx+6.8,y+44,1.45,16,"#bb9462")
        a.rect(x+dx+2,y+51,11,1.6,"#c4a47a")
        a.rect(x+dx-1,y+62,17,2.2,"#bb9469")
        for k in range(3):
            a.rect(x+dx-4,y+44+k*4,3.1,2.8,"#8d6949")
            a.rect(x+dx+16,y+44+k*4,3.1,2.8,"#9b7650")
    a.poly([(d-11,y+h-1),(d-11,y+h-28),(d-8,y+h-32),(d+8,y+h-32),
            (d+11,y+h-28),(d+11,y+h-1)],"#674431")
    a.poly([(d-8,y+h-2),(d-8,y+h-27),(d-5,y+h-30),(d+5,y+h-30),
            (d+8,y+h-27),(d+8,y+h-2)],"#956940")
    for k in range(-6,8,3):
        a.rect(d+k,y+h-26,.7,24,"#b38755")
    a.rect(d-8,y+h-11,16,1.3,"#775531")
    a.rect(d+3,y+h-14,2.3,2.3,"#dec081")
    a.rect(d-13,y+h-2,26,2,"#c2a783")

    a.poly([(x-5,y+36),(x+12,y+3),(x+w-12,y+3),(x+w+5,y+36)],dark)
    a.poly([(x-2,y+31),(x+15,y+5),(x+w-15,y+5),(x+w+2,y+31)],s0)
    rng=random.Random(w+h+sum(map(ord,name)))
    for row in range(6):
        yy=y+5+row*4.35
        left=x+15-row*2.8
        right=x+w-15+row*2.8
        for xx in range(int(left)+1-row%2*3,int(right)-3,6):
            xx=max(left,xx)
            a.poly([(xx,yy),(xx+5.7,yy),(xx+5.7,yy+2.9),(xx+4.5,yy+4),
                    (xx,yy+3.65)],rng.choice((s0,s1,s1,s2)))
            a.line([(xx+.5,yy+.55),(xx+4.8,yy+.55)],s2,.42)
            a.rect(xx+5.3,yy+.5,.6,3.0,dark)
    a.line([(x-2,y+31),(x+15,y+5),(x+w-15,y+5),(x+w+2,y+31)],s2,1)
    a.rect(x+13,y+1.7,w-26,3.5,dark)
    a.rect(x+15,y+1.4,w-30,1.4,hi)
    a.rect(x-5,y+32,w+10,4,dark)
    a.rect(x-4,y+33,w+8,1.1,s1)

    chimney=x+w-25
    a.rect(chimney,y-6,10.5,17,"#74675d")
    a.rect(chimney+1,y-4,7.5,12,"#aca294")
    for k in range(4):
        a.rect(chimney+1,y-2+k*3,7.7,.45,"#81766a")
    a.rect(chimney-1.3,y-7.5,13.2,3.3,"#554c46")
    a.rect(chimney-1,y-7,12.4,.9,"#c5b698")
    # Signboard and distinct entry canopies mark each building from the road.
    if name in ("inn","shop"):
        cloth=("#5d7f9a","#a1ac9a") if name=="inn" else ("#9c5847","#e5ca98")
        a.poly([(d-15,y+43),(d+15,y+43),(d+19,y+49),(d-19,y+49)],"#694734")
        for k in range(6):
            c=cloth[k%2]
            a.poly([(d-15+k*5,y+43),(d-10+k*5,y+43),(d-13+k*6,y+49),
                    (d-19+k*6,y+49)],c)
            a.rect(d-19+k*6,y+49,5.6,1.7,c)
        a.rect(d-8,y+36,16,6,"#775036")
        a.rect(d-7,y+36.6,14,3.9,"#c7ad76")
        if name=="inn":
            a.line([(d-3,y+39),(d+3,y+39)],"#725137",.75)
            a.rect(d-3,y+37.4,1.2,1.7,"#725137")
        else:
            a.poly([(d,y+37),(d+2,y+39.5),(d-2,y+39.5)],"#775137")
    if name=="hall":
        a.poly([(d-10,y+7),(d,y+1),(d+10,y+7),(d+10,y+21),(d-10,y+21)],dark)
        a.poly([(d-8,y+8),(d,y+2),(d+8,y+8),(d+8,y+18),(d-8,y+18)],s1)
        a.oval(d-4,y+7,8,7,"#c5b47c")
        a.oval(d-2.7,y+8,5.4,5.1,"#547a7d")
    return a,(-x,-y)


LEAF = ("#244e37","#2f6140","#3d7444","#51904d","#6eaa59","#8bb665","#a1c16d")


def tree(variant):
    a=Art(66,82)
    rng=random.Random(404+variant*615)
    a.oval(15,68,49,11,"#29472b68")
    a.poly([(28,72),(29,56),(27,45),(32,42),(37,45),(35,59),(37,72),(41,74),
            (34,76),(25,75)],"#594734")
    a.line([(29,73),(32,64),(33,52)],"#95784e",2.2)
    a.line([(34,69),(35,64),(34,57)],"#705537",1.2)
    clusters=[(21,28,15,15),(43,23,16,17),(35,39,21,22),
              (16,43,13,15),(50,43,14,15),(34,17,19,17),(31,28,17,16),(22,38,14,16)]
    for j,(cx,cy,rx,ry) in enumerate(clusters):
        cx+=rng.randrange(-2,3)
        cy+=rng.randrange(-3,4)
        edge=[(cx-rx,cy-ry*.22),(cx-rx*.67,cy-ry*.64),(cx-rx*.33,cy-ry*.92),
            (cx+rx*.17,cy-ry),(cx+rx*.56,cy-ry*.82),(cx+rx*.84,cy-ry*.48),
            (cx+rx,cy-ry*.03),(cx+rx*.89,cy+ry*.39),(cx+rx*.48,cy+ry*.8),
            (cx-rx*.09,cy+ry),(cx-rx*.61,cy+ry*.79),(cx-rx*.87,cy+ry*.4)]
        a.poly(edge,LEAF[0 if j<5 else 1])
        a.poly([(cx+(x-cx)*.9,cy+(y-cy)*.88-1.3) for x,y in edge],LEAF[2 if j<5 else 3])
        a.poly([(cx+(x-cx)*.69-rx*.11,cy+(y-cy)*.65-ry*.17) for x,y in edge],
               LEAF[3 if j<5 else 4])
        for k in range(13):
            x=cx+rng.randrange(-int(rx*.68),int(rx*.60))
            y=cy+rng.randrange(-int(ry*.68),int(ry*.41))
            size=rng.choice((1.4,2.1,3.2,4.4))
            c=LEAF[rng.choice((2,3,4,4,5) if j<5 else (3,4,5,5,6))]
            a.poly([(x,y),(x+size*.5,y-.65),(x+size,y-.35),(x+size*.87,y+.64),
                    (x+size*.24,y+1.05)],c)
        for k in range(7):
            x=cx+rng.randrange(-int(rx*.65),int(rx*.64))
            y=cy+rng.randrange(-int(ry*.19),int(ry*.51))
            a.rect(x,y,rng.choice((.8,1.4,2.2)),.63,LEAF[1 if j<5 else 2])
    return a,(-33,-74)


def pine(variant):
    a=Art(66,82)
    rng=random.Random(144+variant*21)
    a.oval(17,68,45,10,"#29472b65")
    a.rect(29,52,8,23,"#584531")
    a.rect(30.3,53,2.6,21,"#8a714c")
    for cy,reach in [(47,25),(38,21),(28,17),(18,13),(11,9)]:
        x=32+rng.randrange(-1,2)
        a.poly([(x,max(2,cy-17)),(x-6,cy-4),(x-reach,cy+15),
                (x-reach*.59,cy+13),(x-reach*.40,cy+17),(x,cy+15),
                (x+reach*.38,cy+17),(x+reach*.63,cy+13),
                (x+reach,cy+15),(x+6,cy-4)],"#2c593d")
        a.poly([(x,max(3,cy-16)),(x-5,cy-3),(x-reach+3,cy+12),
                (x-reach*.44,cy+10),(x-3,cy+12),(x+2,cy+4)],"#578e53")
        a.poly([(x,max(4,cy-11)),(x-4,cy-1),(x-reach*.69,cy+7),
                (x-reach*.37,cy+6),(x-1,cy+2)],"#7ba45d")
        for k in range(10):
            yy=cy+rng.randrange(3,11)
            xx=x+rng.randrange(-int(reach*.57),int(reach*.57))
            a.rect(xx,yy,rng.choice((.7,1.6,2.1)),.63,rng.choice(("#46804e","#669055","#8eac62")))
    return a,(-33,-74)


def fountain():
    a=Art(70,68)
    x,y=35,51
    a.oval(3,44,64,20,"#233e3560")
    ring=[(7,48),(11,40),(21,34),(49,34),(59,40),(63,48),(60,56),(48,62),(22,62),(10,56)]
    a.poly(ring,"#6b796e")
    a.poly([(u,v-4) for u,v in ring],"#cfc7ad")
    a.poly([(x+(u-x)*.88,46+(v-48)*.82-3) for u,v in ring],"#93a59a")
    a.poly([(x+(u-x)*.77,44+(v-48)*.69) for u,v in ring],"#316f81")
    a.poly([(x+(u-x)*.66,44+(v-48)*.54) for u,v in ring],"#478e9c")
    for yy,start,length in [(44,14,12),(48,19,18),(46,42,14),(40,38,17),(50,35,13)]:
        a.line([(start,yy),(start+length*.66,yy-.3),(start+length,yy+.2)],"#82bfc2",.62)
    a.poly([(29,47),(29,25),(41,25),(41,47),(36,50),(31,49)],"#a4b0a2")
    a.rect(31,28,2,18,"#cbd2c0")
    a.rect(37,29,2,17,"#748f89")
    a.oval(23,23,24,10,"#8a9b8f")
    a.oval(23,19,24,10,"#d4ceaf")
    a.oval(26,21,18,6,"#729fa0")
    a.oval(31,15,8,10,"#97a59a")
    a.rect(33,12,4,8,"#d0cebb")
    a.oval(32,10,6,4,"#e1d9bf")
    return a,(-35,-52)


def rock():
    a=Art(30,27)
    a.oval(3,17,25,7,"#334e375f")
    a.poly([(3,18),(8,8),(17,3),(23,6),(27,17),(23,21),(10,23)],"#5e6f68")
    a.poly([(7,16),(10,9),(17,5),(22,7),(23,13),(15,14),(12,19)],"#99a092")
    a.poly([(11,9),(17,5),(21,7),(16,11)],"#c5c1a9")
    a.line([(14,15),(17,12),(20,13),(24,11)],"#76877b",.6)
    a.line([(5,18),(8,17),(11,19),(13,18)],"#7f925f",1.3)
    return a,(-15,-20)


def sign():
    a=Art(32,30)
    a.oval(8,24,16,4,"#31473665")
    a.rect(13,8,5,19,"#775335")
    a.rect(14,9,1.35,17,"#b08351")
    a.poly([(2,5),(23,5),(29,11),(23,17),(2,17)],"#563e2f")
    a.poly([(3,6),(23,6),(27,11),(23,15),(3,15)],"#b08d5c")
    a.line([(3,7),(22,7),(25,10)],"#d0b37e",.6)
    a.line([(6,10),(20,10)],"#795b3f",.74)
    a.line([(6,13),(16,13)],"#886747",.6)
    a.rect(5,7.4,1,1,"#5a4536")
    return a,(-16,-26)


def chest():
    a=Art(30,24)
    a.oval(4,16,25,6,"#342e265f")
    a.poly([(2,9),(5,5),(22,5),(27,9),(27,19),(2,19)],"#4e382b")
    a.poly([(3,9),(6,6),(22,6),(26,9),(26,12),(3,12)],"#ab7546")
    a.rect(3,12,23,6,"#895b39")
    a.line([(4,14.5),(23,14.5)],"#b67f48",.6)
    for x in (6,22):
        a.rect(x,7,1.8,11,"#c2a26b")
        a.rect(x+.4,7,.55,11,"#e5c687")
    a.rect(12,10,5,7,"#bf9858")
    a.rect(13,12,2.8,3,"#dfc080")
    a.rect(14,13,.9,2.2,"#5e4931")
    return a,(-15,-19)


def bed():
    a=Art(37,56)
    a.oval(2,43,34,10,"#4b382953")
    a.rect(3,5,31,45,"#69492f")
    a.rect(4,6,29,42,"#9f7348")
    a.rect(6,9,25,12,"#d0b28a")
    a.rect(8,10,21,9,"#ebe1c4")
    a.rect(9,10,18,1.4,"#f8efcf")
    a.rect(6,20,25,26,"#456479")
    a.rect(7,22,23,22,"#5c7f8d")
    a.rect(7,21,23,2.2,"#acbbb0")
    a.rect(8,26,1.4,16,"#729298")
    for y in range(26,46,5):
        a.line([(9,y),(30,y+.7)],"#4d6e81",.4)
    a.rect(3,46,31,3,"#bd9965")
    for x in (4,30):
        a.rect(x,48,3,4,"#62452d")
    return a,(-18,-42)


def table():
    a=Art(56,38)
    a.oval(4,25,49,11,"#4e3e2f60")
    for x in (6,45):
        a.rect(x,19,4,15,"#59432f")
        a.rect(x,20,1.2,12,"#8d6844")
    a.poly([(2,6),(5,3),(50,3),(53,6),(53,24),(49,27),(6,27),(2,23)],"#614331")
    a.poly([(4,6),(7,4),(48,4),(51,7),(51,21),(48,24),(7,24),(4,21)],"#ac8354")
    a.line([(5,8),(9,5),(48,5)],"#c8a16a",.7)
    for y in range(7,23,5):
        a.line([(8,y),(41,y+.15)],"#926d49",.45)
    a.rect(20,8,15,12,"#7a5743")
    a.rect(21,9,13,10,"#d8c4a0")
    a.rect(21.5,10,12,1,"#e9dac0")
    a.line([(27,10),(27,18)],"#aa8e70",.5)
    a.oval(41,9,7,8,"#765a3e")
    a.oval(41.7,9.7,5.3,4,"#b3a47a")
    return a,(-28,-25)


def villager():
    a=Art(30,36)
    a.oval(4,28,22,6,"#2637326a")
    a.poly([(7,31),(9,22),(21,22),(23,31),(19,33),(11,33)],"#3b4138")
    a.poly([(7,19),(10,16),(20,16),(23,19),(24,28),(19,30),(10,30),(5,27)],"#3f6d58")
    a.poly([(8,20),(11,18),(19,18),(21,22),(19,25),(19,29),(10,28)],"#638e71")
    a.line([(11,19),(14,22),(19,19)],"#b6a779",1)
    a.rect(9,25,13,1.4,"#b68b59")
    a.poly([(7,11),(8,5),(13,2),(20,4),(23,10),(22,18),(19,20),(11,20),(8,17)],"#694834")
    a.poly([(9,11),(10,5),(16,4),(21,8),(20,10),(18,11),(19,17),(16,19),
            (11,18),(10,15),(8,14)],"#c69969")
    a.poly([(11,10),(14,8),(18,10),(18,15),(15,17),(11,16)],"#e6bf8b")
    a.rect(11.5,11.8,1.25,1.7,"#594033")
    a.rect(16,11.9,1.15,1.65,"#594033")
    a.line([(9,8),(12,5),(18,5),(21,7)],"#966747",.85)
    return a,(-15,-31)


def gate():
    a=Art(106,43)
    for x in (8,86):
        a.oval(x-3,30,22,10,"#29423357")
        a.poly([(x,12),(x+3,6),(x+14,6),(x+18,11),(x+18,36),(x,36)],"#717863")
        a.rect(x+2,13,11,21,"#aaa88e")
        for y in range(15,36,5):
            a.line([(x+1,y),(x+17,y)],"#878c76",.55)
        a.rect(x-1,9,20,4,"#a6a892")
        a.rect(x+1,8,16,1.6,"#d1cbb0")
    a.poly([(14,10),(21,6),(44,2),(62,2),(84,5),(94,11),(94,17),(82,12),
            (62,8),(44,8),(23,12),(14,18)],"#687267")
    a.line([(17,10),(25,6),(45,3),(62,3),(82,6),(91,10)],"#bcbba2",1.1)
    a.poly([(46,4),(53,1),(60,4),(59,8),(53,12),(47,8)],"#bab495")
    a.rect(52,4,2,4,"#827e67")
    return a,(-53,-32)


def wolf_symbol(giant):
    w,h=(74,46) if giant else (49,31)
    a=Art(w+9,h+9)
    x,y=4,3
    a.oval(x+5,y+h-3,w-5,7,"#263b316a")
    im=Image.open(GAME/"assets"/"wolf.png").convert("RGBA").resize((w*SCALE,h*SCALE),Image.Resampling.BOX)
    for yy in range(im.height):
        for xx in range(im.width):
            r,g,b,alpha=im.getpixel((xx,yy))
            if alpha<=135:
                im.putpixel((xx,yy),(0,0,0,0))
            elif giant and b>=r:
                im.putpixel((xx,yy),(min(255,r+round(b*.12)),round(g*.83),b,255))
            else:
                im.putpixel((xx,yy),(r,g,b,255))
    a.image.alpha_composite(im,a.pixel(x,y))
    if giant:
        # Shoulder guard and crest give the fully visible field icon the boss's heraldry.
        a.poly([(30,12),(38,10),(45,14),(50,21),(44,28),(39,26),(34,29),
                (32,23),(27,19)],"#4b3934")
        a.poly([(30,13),(38,11),(45,16),(48,21),(44,26),(40,23),(35,27),
                (34,22),(29,19)],"#a68051")
        a.poly([(34,15),(38,13),(43,17),(45,21),(43,24),(40,21),(36,24),
                (35,20),(31,19)],"#515581")
        a.line([(31,16),(37,12),(41,14),(46,19)],"#dbc383",1)
        a.poly([(38,16),(42,19),(38,22),(35,19)],"#7caeda")
        a.line([(36,19),(38,17),(40,18)],"#c8e7f9",.68)
    return a,(-(w+9)//2,-(h+y))



def write_props(data):
    sprites={b["id"]:building(b) for b in data["town"]["buildings"]}
    sprites.update({"tree"+str(i):tree(i) for i in range(3)})
    sprites.update({"pine"+str(i):pine(i) for i in range(2)})
    sprites["wolf"]=wolf_symbol(False)
    sprites["boss"]=wolf_symbol(True)
    for name,draw in [("fountain",fountain),("rock",rock),("sign",sign),("chest",chest),
                      ("bed",bed),("table",table),("npc",villager),("gate",gate)]:
        sprites[name]=draw()
    size=320
    x=y=row=0
    entries={}
    for name,(a,offset) in sprites.items():
        if x+a.w>size:
            x=0
            y+=row
            row=0
        entries[name]={"x":x,"y":y,"w":a.w,"h":a.h,"dx":offset[0],"dy":offset[1]}
        x+=a.w+1
        row=max(row,a.h+1)
    atlas=Image.new("RGBA",(size*SCALE,(y+row)*SCALE))
    for name,(a,_) in sprites.items():
        entry=entries[name]
        atlas.alpha_composite(a.image,(entry["x"]*SCALE,entry["y"]*SCALE))
    atlas.save(OUT/"field-props.png",optimize=True)
    (OUT/"field-art.json").write_text(json.dumps({"scale":SCALE,"props":entries},separators=(",",":"))+"\n")


def main():
    model=(GAME/"field-model.js").as_uri()
    data=json.loads(subprocess.check_output(
        ["node","--input-type=module","-e",
         f"import {{MAPS}} from {json.dumps(model)}; console.log(JSON.stringify(MAPS));"],
        text=True))
    OUT.mkdir(exist_ok=True)
    for name,make in (("town",town),("meadow",meadow),("room",room)):
        make(data[name]).image.quantize(colors=96,dither=Image.Dither.NONE).save(
            OUT/(name+"-ground.png"),optimize=True)
    write_props(data)


if __name__=="__main__":
    main()
