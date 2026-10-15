# Konversi thumbnail game PNG (~1MB/file) menjadi WebP kecil untuk web.
# Aman dijalankan berulang: file *_thumbnail.webp yang ada akan ditimpa.
# Jalankan dari root repo: .venv-tools/Scripts/python.exe tools/convert-thumbnails.py
import sys
from pathlib import Path
from PIL import Image

THUMB_DIR = Path(__file__).resolve().parent.parent / "public" / "thumbnails"
MAX_WIDTH = 640
QUALITY = 82

def main() -> int:
    if not THUMB_DIR.is_dir():
        print(f"Folder tidak ditemukan: {THUMB_DIR}")
        return 1

    converted = []
    for png in sorted(THUMB_DIR.glob("*_thumbnail.png")):
        webp = png.with_suffix(".webp")
        with Image.open(png) as im:
            im = im.convert("RGB")
            if im.width > MAX_WIDTH:
                height = round(im.height * MAX_WIDTH / im.width)
                im = im.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)
            im.save(webp, "WEBP", quality=QUALITY, method=6)
        old_kb = png.stat().st_size / 1024
        new_kb = webp.stat().st_size / 1024
        converted.append((webp.name, old_kb, new_kb))
        print(f"  {webp.name}: {old_kb:,.0f} KB -> {new_kb:,.0f} KB")

    total_old = sum(c[1] for c in converted)
    total_new = sum(c[2] for c in converted)
    print(f"\nTotal: {total_old:,.0f} KB -> {total_new:,.0f} KB ({len(converted)} file)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
