with open("src/features/scene/LaraVariants.ts", "r") as f:
    lines = f.readlines()
for i in range(68, 80):
    print(f"Line {i+1}: {repr(lines[i])}")
