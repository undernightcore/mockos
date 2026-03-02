/*
  Warnings:

  - Added the required column `role` to the `Members` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN');

-- AlterTable
ALTER TABLE "Members" ADD COLUMN     "role" "MemberRole" NOT NULL;
