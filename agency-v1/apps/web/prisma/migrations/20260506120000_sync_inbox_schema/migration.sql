-- Sync DB with schema.prisma for inbox/messages.
-- The Message.inReplyToId field exists in schema but the column was never
-- migrated, so prisma.message.create() fails when the RETURNING clause
-- requests it. Same goes for a few Conversation columns the original
-- migration (20260212164826_add_meta_inbox_constraints) didn't include.
--
-- All ADDs are idempotent (IF NOT EXISTS) so this is safe to re-run.

-- messages.in_reply_to_id (the column that triggered the user-visible error)
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "in_reply_to_id" TEXT;
CREATE INDEX IF NOT EXISTS "messages_in_reply_to_id_idx" ON "messages"("in_reply_to_id");

-- conversations.sentiment / topic (used by analyzeIncomingMessage)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "sentiment" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "topic" TEXT;
