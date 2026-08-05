from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "wander"
SCENES = ("dawn", "day", "dusk", "night")
BASE_SIZE = (1920, 1080)


def validate():
    failures = []
    checked = 0
    for scene in SCENES:
        path = ASSET_ROOT / f"bedroom-{scene}.webp"
        if not path.exists():
            failures.append(f"missing: {path}")
            continue
        try:
            with Image.open(path) as image:
                checked += 1
                if image.size != BASE_SIZE:
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
    print(f"validated {checked} full-screen scene photos at {BASE_SIZE[0]}x{BASE_SIZE[1]}")


if __name__ == "__main__":
    validate()
