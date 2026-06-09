with open(r"c:\Users\XE\Desktop\kpi\extracted_src\src\App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for i in range(3560, 3620):
    print(f"{i+1}: {lines[i]}")
