import re

with open("apps/coffee-web/prisma/schema.prisma", "r", encoding="utf-8") as f:
    content = f.read()

models = re.findall(r"^model\s+(\w+)\s+\{", content, re.MULTILINE)
print("Total models:", len(models))
print(", ".join(sorted(models)))
