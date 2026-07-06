with open("paragraphs_ta.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("=== Search results for 'ERD' or 'Entity' or 'Relationship' or 'Diagram Hubungan' ===")
for i, line in enumerate(lines):
    if any(k in line.lower() for k in ["erd", "entity", "relationship"]):
        # Skip lines that look like Table of Contents
        if "daftar" in line.lower() or "gambar" in line.lower() or "halaman" in line.lower():
            continue
        print(f"L{i}: {line.strip()}")

print("\n=== Search results for 'database' ===")
for i, line in enumerate(lines):
    if "database" in line.lower():
        if "daftar" in line.lower() or "gambar" in line.lower() or "halaman" in line.lower():
            continue
        print(f"L{i}: {line.strip()[:180]}")
