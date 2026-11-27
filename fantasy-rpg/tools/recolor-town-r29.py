"""Recolor the R27 village art at native resolution, preserving sprite geometry."""
import json
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "assets"
SOURCE = ASSETS / "r27"
OUTPUT = ASSETS / "r29"


def palette(text):
    words = text.split()
    return {bytes.fromhex(a): bytes.fromhex(b) for a, b in zip(words[::2], words[1::2])}


SWATCHES = {
    "ground": palette("""
        739752 74b88a 739553 6db487 7d9d54 83c091 6b904e 65a981 789953 78b98a 81a059 8ac89a
        818374 9aaac0 afab97 c4d1dd b2aea0 cbd7e1 a3a697 b5c6d6 b8b29e cfdbe3 aaa794 bfccda
        bcb7a7 d5dfe8 c0b8a3 d9e4ed 90927f a9b9ca 969b80 a9b9cd 93aa60 9bd69c 567c44 529970
        5a7746 569c7e cdc3a9 e6eef5 59664e 6c8396 afb4a0 cbd9dd a7a189 b5c5d7 648848 579c75
        415d3a 376f64 717b64 8296ab 7d8475 92a4b9 d6c9a6 e1edf0 a2a18c b8cad8 899386 9fb7c7
        86a456 86c692 d0c7ac dfebf4 c3bd9e d8e4eb 8f967a 9fc5a9 d0c4a8 e0eaf2 527c47 549c7b
        929685 a7bbcd 6b804c 65a883 51834a 57ac7c 4b5b46 587788 969a88 ade1d7 ebde9a f7d6ae
        9cac62 87c798 9d9abd b7a4e2 d0a48a eaa6c2 f2ece0 f2fbff dcb6a5 f398b1 e4cd8f ffe4a1
    """),
    "house": palette("""
        d6bd8c eee8ed 263c32 344d65 848274 929db2 ac8f64 c8bfd1 956940 a57765 5d4436 69556b
        6e523a 766275 315665 31698c 765337 806479 674431 77596a 9b9784 a7b1c4 a9a795 bbc8d8
        648c96 65abc5 bb9469 c7adb8 aca294 b6bacb b38755 c28f7d 74675d 828ca5 a27348 b28585
        c2a783 d4c6d5 c7ad76 dec9be 8d6949 a07a88 9b7650 aa8490 bb9462 cbb3af 775036 895d7a
        c4a47a decbd0 554c46 586783 775531 895d6c c5b698 ced8e6 81766a 8c9cb4 a4babb b3e3ea
        725137 79526f 694734 825f77 dec081 fbe2b7
    """),
    "inn": palette("""
        527aa0 418bd4 263e53 284776 385976 3165a7 6c92ad 64b1e4 a1ac9a d6eff6 5d7f9a 69acd5
        9cc0c5 9ee2fa
    """),
    "shop": palette("""
        9d5b4e d67582 592f37 83435f c0785c ed8992 78433d ac566e e5ca98 f7deed 9c5847 df6796
        d99c72 f9afb0 775137 96536f
    """),
    "hall": palette("""
        283f47 316173 4f7980 529faf 3d5d67 3e849b 73999a 73c0c5 a8bfab b8efdf c5b47c e4d2ed
        547a7d 437b9c
    """),
    "home": palette("""
        a76a52 df8690 5c393a 884b68 825044 bb6579 c38363 ef9ca1 dfaa78 f9bdb4
    """),
    "tree": palette("""
        51904d 5bac78 6eaa59 7fc893 3d7444 458d6e 29472b 345c61 244e37 2e6d58 2f6140 387e64
        594734 6e5860 8bb665 9ad8a1 95784e a38478 a1c16d b7e5aa 705537 8a6770
    """),
    "fountain": palette("""
        cfc7ad e0edf6 478e9c 48b6cb 6b796e 849db5 233e35 345169 93a59a a3bfd3 316f81 378eae
        a4b0a2 b9cfe0 8a9b8f 99b6d1 d4ceaf e0edf3 729fa0 7cc3d6 97a59a abc6d6 cbd2c0 d5e8f2
        748f89 82a8bf d0cebb dce9f1 82bfc2 9be4e7 e1d9bf ebf7fc
    """),
    "gate": palette("""
        687267 778ea6 717863 879cb2 aaa88e b7c7d7 294233 355b70 878c76 9dafc2 bab495 c8d9e7
        a6a892 b6c6d8 bcbba2 cedfec d1cbb0 dfebf5 827e67 8598b0
    """),
    "npc": palette("""
        694834 725871 3f6d58 397d76 638e71 63a995 c69969 d8a791 e6bf8b f0cdb2 3b4138 425265
        263732 304a61 b68b59 c4967d 966747 a7787c b6a779 cdc4a8 594033 6b5263
    """),
    "sign": palette("""
        b08d5c bc957e 563e2f 715867 314736 3c586b 775335 8a6777 d0b37e d6b9a0 b08351 bd9284
        795b3f 846676 886747 987582 5a4536 725868
    """),
    "chest": palette("""
        ab7546 b98073 895b39 9d6b6a 4e382b 654a62 342e26 3a3b5a bf9858 c89d86 c2a26b d2b19e
        e5c687 ebd6b9 b67f48 c39080 dfc080 e9cbb0 5e4931 765b6e
    """),
}


def recolor(image, mapping):
    def pixel(rgba):
        rgb, alpha = bytes(rgba[:3]), rgba[3]
        return (*mapping.get(rgb, rgb), alpha) if alpha else (0, 0, 0, 0)

    result = Image.new("RGBA", image.size)
    result.putdata([pixel(rgba) for rgba in image.getdata()])
    return result


def save_indexed(image, path):
    pixels = image.getdata()
    colors = list(dict.fromkeys(pixels))
    if len(colors) > 256:
        raise ValueError(f"{path.name} exceeds the indexed palette limit")
    index = {color: i for i, color in enumerate(colors)}
    indexed = Image.new("P", image.size)
    indexed.putdata([index[color] for color in pixels])
    indexed.putpalette([channel for color in colors for channel in color[:3]])
    alpha = bytes(color[3] for color in colors)
    options = {"transparency": alpha} if any(a != 255 for a in alpha) else {}
    indexed.save(path, optimize=True, **options)


def main():
    OUTPUT.mkdir(exist_ok=True)
    ground = Image.open(SOURCE / "town-ground.png").convert("RGBA")
    save_indexed(recolor(ground, SWATCHES["ground"]), OUTPUT / "town-ground.png")

    manifest = json.loads((SOURCE / "field-art.json").read_text())
    atlas = Image.open(SOURCE / "field-props.png").convert("RGBA")
    town = Image.new("RGBA", atlas.size)
    scale = manifest["scale"]
    houses = ("inn", "shop", "hall", "home")
    items = (*houses, "tree0", "tree1", "tree2", "fountain", "sign", "chest", "npc", "gate")
    for name in items:
        rect = manifest["props"][name]
        x, y, w, h = (rect[k] * scale for k in ("x", "y", "w", "h"))
        mapping = SWATCHES.get(name, SWATCHES["tree"])
        if name in houses:
            mapping = {**SWATCHES["house"], **mapping}
        town.paste(recolor(atlas.crop((x, y, x + w, y + h)), mapping), (x, y))
    save_indexed(town, OUTPUT / "town-props.png")


if __name__ == "__main__":
    main()
