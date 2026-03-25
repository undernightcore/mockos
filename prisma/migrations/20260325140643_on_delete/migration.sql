-- DropForeignKey
ALTER TABLE "Header" DROP CONSTRAINT "Header_responseId_fkey";

-- DropForeignKey
ALTER TABLE "Processor" DROP CONSTRAINT "Processor_responseId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_routeId_fkey";

-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Header" ADD CONSTRAINT "Header_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processor" ADD CONSTRAINT "Processor_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;
