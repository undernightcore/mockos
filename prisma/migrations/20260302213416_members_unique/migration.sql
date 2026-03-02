/*
  Warnings:

  - A unique constraint covering the columns `[projectId,userId]` on the table `Members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Members_projectId_userId_key" ON "Members"("projectId", "userId");
