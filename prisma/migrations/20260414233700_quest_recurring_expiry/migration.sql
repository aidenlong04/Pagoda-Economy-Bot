-- CreateEnum: RecurringSchedule
CREATE TYPE "RecurringSchedule" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum: QuestType — add MONTHLY
ALTER TYPE "QuestType" ADD VALUE 'MONTHLY';

-- AlterEnum: TransactionSource — add MESSAGE, VOICE
ALTER TYPE "TransactionSource" ADD VALUE 'MESSAGE';
ALTER TYPE "TransactionSource" ADD VALUE 'VOICE';

-- AlterTable: Quest — add expiration, recurring, admin tracking fields
ALTER TABLE "quests" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "quests" ADD COLUMN "recurring" "RecurringSchedule" NOT NULL DEFAULT 'NONE';
ALTER TABLE "quests" ADD COLUMN "last_reset_at" TIMESTAMP(3);
ALTER TABLE "quests" ADD COLUMN "created_by" TEXT;

-- AlterTable: Achievement — add admin tracking
ALTER TABLE "achievements" ADD COLUMN "created_by" TEXT;
