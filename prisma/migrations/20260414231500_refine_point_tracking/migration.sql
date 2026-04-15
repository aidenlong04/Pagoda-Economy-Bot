-- AlterTable: Add reactionCount and lastDailyAt to users
ALTER TABLE "users" ADD COLUMN "reaction_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "last_daily_at" TIMESTAMP(3);
