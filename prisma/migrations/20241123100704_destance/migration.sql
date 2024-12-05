/*
  Warnings:

  - You are about to drop the column `distance` on the `Counter` table. All the data in the column will be lost.
  - Added the required column `needDistance` to the `Counter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextDistance` to the `Counter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Counter" DROP COLUMN "distance",
ADD COLUMN     "needDistance" INTEGER NOT NULL,
ADD COLUMN     "nextDistance" INTEGER NOT NULL;
