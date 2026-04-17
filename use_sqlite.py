with open('agency-v1/prisma/schema.prisma', 'r') as f:
    schema = f.read()
import re
schema = re.sub(r'provider\s*=\s*"postgresql"', 'provider = "sqlite"', schema)
schema = re.sub(r'url\s*=\s*env\("POSTGRES_EXTERNAL_URL"\)', 'url      = "file:./dev.db"', schema)
with open('agency-v1/prisma/schema.prisma', 'w') as f:
    f.write(schema)
