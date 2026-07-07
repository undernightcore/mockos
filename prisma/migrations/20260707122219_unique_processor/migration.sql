/*
  Warnings:

  - A unique constraint covering the columns `[responseId]` on the table `Processor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Processor_responseId_key" ON "Processor"("responseId");
