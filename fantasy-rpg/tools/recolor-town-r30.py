"""Apply the R30 village palette to R29's indexed town artwork."""
import json
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "assets"
SOURCE = ASSETS / "r29"
OUTPUT = ASSETS / "r30"


def swatches(text):
    words = text.split()
    return {bytes.fromhex(a): bytes.fromhex(b) for a, b in zip(words[::2], words[1::2])}


PALETTES = {
    "ground": swatches("""
        74b88a 53aa77 6db487 4ca572 83c091 62b17e 65a981 449b6b 78b98a 58ac76 8ac89a 71bc85
        9aaac0 829bb8 c4d1dd aec4da cbd7e1 b8cfe0 b5c6d6 a0b9d3 cfdbe3 bed3e2 bfccda a6bdd5
        d5dfe8 c7dbe9 d9e4ed d1e3f0 a9b9ca 91acc7 a9b9cd 91a9c3 9bd69c 8bcf8e 529970 358964
        569c7e 41896d e6eef5 e6eef5 6c8396 5b748b cbd9dd b8d4df b5c5d7 9eb8d1 579c75 438c67
        376f64 2a6c5a 8296ab 6c88a3 92a4b9 809db8 e1edf0 d4eaf0 b8cad8 a5bfd5 9fb7c7 8cb2c8
        86c692 74bd81 dfebf4 d6e9f4 d8e4eb c7dceb 9fc5a9 7bb998 e0eaf2 d1e5f2 549c7b 388e6c
        a7bbcd 92afc5 65a883 489870 57ac7c 3e9d71 587788 486780 ade1d7 95d8d2 f7d6ae f5ca8f
        87c798 6fba82 b7a4e2 b897df eaa6c2 eb8cb3 f2fbff f2fbff f398b1 ef7b9e ffe4a1 ffe4a1
    """),
    "props": swatches("""
        5bac78 3f9f6c 7fc893 66bd80 458d6e 2f825e 345c61 2c4f5d 2e6d58 215e50 387e64 277257
        6e5860 605165 9ad8a1 88d194 a38478 9a7b73 b7e5aa a9e399 8a6770 7e626e e0edf6 d7ebf6
        48b6cb 29acc5 849db5 708fac 345169 2c4566 a3bfd3 8fb4d1 378eae 237da6 b9cfe0 a7c8e1
        99b6d1 84aac9 e0edf3 dbedf5 7cc3d6 62bdd3 abc6d6 9dc1d9 d5e8f2 cde6f3 82a8bf 719ab7
        dce9f1 d9eaf1 9be4e7 85e9eb ebf7fc e8faff
    """),
}


def save(filename, colors, omit=()):
    image = Image.open(SOURCE / filename).convert("RGBA")
    for rect in omit:
        x, y, w, h = rect
        image.paste((0, 0, 0, 0), (x, y, x + w, y + h))

    def shade(pixel):
        rgb, alpha = bytes(pixel[:3]), pixel[3]
        return (*colors.get(rgb, rgb), alpha) if alpha else (0, 0, 0, 0)

    pixels = [shade(pixel) for pixel in image.getdata()]
    palette = list(dict.fromkeys(pixels))
    if len(palette) > 256:
        raise ValueError(f"{filename} exceeds the indexed palette limit")
    index = {color: i for i, color in enumerate(palette)}
    indexed = Image.new("P", image.size)
    indexed.putdata([index[color] for color in pixels])
    indexed.putpalette([channel for color in palette for channel in color[:3]])
    alpha = bytes(color[3] for color in palette)
    options = {"transparency": alpha} if any(a != 255 for a in alpha) else {}
    indexed.save(OUTPUT / filename, optimize=True, **options)


def main():
    OUTPUT.mkdir(exist_ok=True)
    manifest = json.loads((ASSETS / "r27" / "field-art.json").read_text())
    houses = [manifest["props"][name] for name in ("inn", "shop", "hall", "home")]
    omit = [tuple(rect[k] * manifest["scale"] for k in ("x", "y", "w", "h")) for rect in houses]
    save("town-ground.png", PALETTES["ground"])
    save("town-props.png", PALETTES["props"], omit=omit)


if __name__ == "__main__":
    main()
