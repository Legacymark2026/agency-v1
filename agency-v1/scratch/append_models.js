const fs = require('fs');
const filePath = 'apps/coffee-web/prisma/schema.prisma';
let content = fs.readFileSync(filePath, 'utf8');

const modelsToAdd = `

model GoldneezReward {
  id          String   @id @default(uuid())
  title       String
  cost        Int
  description String
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("tbl_goldneez_rewards")
}

model GoldneezEvent {
  id          String   @id @default(uuid())
  title       String
  description String
  date        String
  time        String
  capacity    Int      @default(10)
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("tbl_goldneez_events")
}

model GoldneezShippingStep {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  stepIndex Int      @map("step_index")
  label     String
  status    String   // completed, current, upcoming
  desc      String
  date      String
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([orderId, stepIndex])
  @@map("tbl_goldneez_shipping_steps")
}
`;

content = content.trim() + '\n' + modelsToAdd;
fs.writeFileSync(filePath, content, 'utf8');
console.log("Models appended successfully!");
