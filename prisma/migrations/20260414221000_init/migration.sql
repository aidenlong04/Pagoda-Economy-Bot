-- Create enums
CREATE TYPE "TransactionType" AS ENUM ('EARN', 'SPEND', 'TRANSFER');
CREATE TYPE "TransactionSource" AS ENUM ('QUEST', 'SHOP', 'EVENT', 'ADMIN_GRANT', 'TRANSFER', 'DAILY', 'ACHIEVEMENT');
CREATE TYPE "ShopActionType" AS ENUM ('ROLE_GRANT', 'CUSTOM_RESPONSE', 'INVENTORY_ITEM');
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM');
CREATE TYPE "RequirementType" AS ENUM ('MESSAGE_COUNT', 'REACTION_COUNT', 'VOICE_MINUTES', 'URL_CLICKS', 'CUSTOM');
CREATE TYPE "AchievementCategory" AS ENUM ('EARNING', 'SPENDING', 'ACTIVITY', 'QUEST');
CREATE TYPE "EventConditionType" AS ENUM ('MIN_UNIQUE_PARTICIPANTS', 'INDIVIDUAL_INTERACTION_THRESHOLD');
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED');
CREATE TYPE "EventInteractionType" AS ENUM ('MESSAGE', 'REACT', 'URL_CLICK');

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "discord_id" TEXT NOT NULL UNIQUE,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "total_earned" INTEGER NOT NULL DEFAULT 0,
  "total_spent" INTEGER NOT NULL DEFAULT 0,
  "message_count" INTEGER NOT NULL DEFAULT 0,
  "voice_minutes" INTEGER NOT NULL DEFAULT 0,
  "days_active_streak" INTEGER NOT NULL DEFAULT 0,
  "quests_completed" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "transactions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL,
  "type" "TransactionType" NOT NULL,
  "source" "TransactionSource" NOT NULL,
  "actor_id" TEXT,
  "metadata" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "transactions_user_id_timestamp_idx" ON "transactions"("user_id", "timestamp");

CREATE TABLE "shop_items" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "stock" INTEGER,
  "action_type" "ShopActionType" NOT NULL,
  "action_data" JSONB NOT NULL,
  "repeatable" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "purchases" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "item_id" TEXT NOT NULL REFERENCES "shop_items"("id") ON DELETE CASCADE,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "purchases_user_id_item_id_idx" ON "purchases"("user_id", "item_id");

CREATE TABLE "quests" (
  "id" TEXT PRIMARY KEY,
  "type" "QuestType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requirement_type" "RequirementType" NOT NULL,
  "requirement_value" INTEGER NOT NULL,
  "reward_ap" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "assigned_to" TEXT
);

CREATE TABLE "quest_progress" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "quest_id" TEXT NOT NULL REFERENCES "quests"("id") ON DELETE CASCADE,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  UNIQUE("user_id", "quest_id")
);

CREATE TABLE "achievements" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "category" "AchievementCategory" NOT NULL,
  "threshold" INTEGER NOT NULL,
  "reward_ap" INTEGER NOT NULL,
  "reward_role_id" TEXT
);

CREATE TABLE "user_achievements" (
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "achievement_id" TEXT NOT NULL REFERENCES "achievements"("id") ON DELETE CASCADE,
  "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "achievement_id")
);

CREATE TABLE "events" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "start_time" TIMESTAMP(3) NOT NULL,
  "end_time" TIMESTAMP(3) NOT NULL,
  "reward_ap" INTEGER NOT NULL,
  "channel_ids" JSONB NOT NULL,
  "condition_type" "EventConditionType" NOT NULL,
  "condition_value" INTEGER NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE "event_interactions" (
  "id" TEXT PRIMARY KEY,
  "event_id" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "interaction_type" "EventInteractionType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "event_interactions_event_id_user_id_timestamp_idx" ON "event_interactions"("event_id", "user_id", "timestamp");

CREATE TABLE "config" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "user_inventory_items" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "item_name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "metadata" JSONB,
  UNIQUE("user_id", "item_name")
);
