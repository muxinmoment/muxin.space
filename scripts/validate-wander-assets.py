from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "wander"
SCENES = ("dawn", "day", "dusk", "night")
LAYERS = ("sky", "outside", "room", "objects", "light", "foreground")
RUNTIME_SIZE = (2048, 1152)


def validate():
    failures = []
    checked = 0
    for scene in SCENES:
        for layer in LAYERS:
            path = ASSET_ROOT / scene / f"{layer}.webp"
            if not path.exists():
                failures.append(f"missing: {path}")
                continue
            try:
                with Image.open(path) as image:
                    checked += 1
                    if image.size != RUNTIME_SIZE:
                        failures.append(f"size {image.size}: {path}")
                    if image.mode not in ("RGBA", "RGB"):
                        failures.append(f"mode {image.mode}: {path}")
            except Exception as error:
                failures.append(f"unreadable {path}: {error}")
    prototype = ASSET_ROOT / "prototype-dusk-1920.webp"
    if prototype.exists():
        with Image.open(prototype) as image:
            if image.size != (1920, 1080):
                failures.append(f"prototype size {image.size}: {prototype}")
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"validated {checked} runtime layers at {RUNTIME_SIZE[0]}x{RUNTIME_SIZE[1]}")


if __name__ == "__main__":
    validate()
