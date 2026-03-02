-- DropForeignKey
ALTER TABLE "Members" DROP CONSTRAINT "Members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Members" DROP CONSTRAINT "Members_userId_fkey";

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
