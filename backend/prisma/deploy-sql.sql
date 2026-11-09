-- ============================================
-- 班级共创 - Supabase 建表 SQL
-- 用法：在 Supabase Dashboard → SQL Editor 中粘贴执行
-- ============================================

-- Users table
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Topics table
CREATE TABLE "Topic" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "coverImage" TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "inviteCode" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdBy" TEXT NOT NULL REFERENCES "User"(id)
);

-- Members table
CREATE TABLE "Member" (
  id TEXT PRIMARY KEY,
  "topicId" TEXT NOT NULL REFERENCES "Topic"(id),
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("topicId", "userId")
);

-- Materials table
CREATE TABLE "Material" (
  id TEXT PRIMARY KEY,
  "topicId" TEXT NOT NULL REFERENCES "Topic"(id),
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  content TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Articles table
CREATE TABLE "Article" (
  id TEXT PRIMARY KEY,
  "topicId" TEXT NOT NULL UNIQUE REFERENCES "Topic"(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  html TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX "Topic_inviteCode_idx" ON "Topic"("inviteCode");
CREATE INDEX "Material_topicId_idx" ON "Material"("topicId");
CREATE INDEX "Member_topicId_idx" ON "Member"("topicId");
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- ============================================
-- 建表完成后，还需要创建 Storage bucket
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('materials', 'materials', true);
