with open("paragraphs_ta.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

target_idx = -1
for idx, line in enumerate(lines):
    if "P#654:" in line:
        target_idx = idx
        break

if target_idx != -1:
    print(f"Target line index: {target_idx}")
    start = max(0, target_idx - 2)
    end = min(len(lines), target_idx + 40)
    for i in range(start, end):
        print(f"L{i}: {lines[i].strip()}")
else:
    print("P#654 not found.")
