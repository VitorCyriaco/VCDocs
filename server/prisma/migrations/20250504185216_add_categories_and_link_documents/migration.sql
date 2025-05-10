/*
  Warnings:

  - You are about to drop the `_DocumentDepartments` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Department` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Department` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `isRestricted` on the `Document` table. All the data in the column will be lost.
  - You are about to alter the column `A` on the `_UserDepartments` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- DropIndex
DROP INDEX "_DocumentDepartments_B_index";

-- DropIndex
DROP INDEX "_DocumentDepartments_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_DocumentDepartments";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" INTEGER NOT NULL,
    CONSTRAINT "Category_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DocumentRestrictions" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DocumentRestrictions_A_fkey" FOREIGN KEY ("A") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DocumentRestrictions_B_fkey" FOREIGN KEY ("B") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DocumentCategories" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DocumentCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DocumentCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Department" ("companyId", "description", "id", "name") SELECT "companyId", "description", "id", "name" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("approvedById", "companyId", "createdAt", "filePath", "id", "status", "title", "uploadedById") SELECT "approvedById", "companyId", "createdAt", "filePath", "id", "status", "title", "uploadedById" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new__UserDepartments" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__UserDepartments" ("A", "B") SELECT "A", "B" FROM "_UserDepartments";
DROP TABLE "_UserDepartments";
ALTER TABLE "new__UserDepartments" RENAME TO "_UserDepartments";
CREATE UNIQUE INDEX "_UserDepartments_AB_unique" ON "_UserDepartments"("A", "B");
CREATE INDEX "_UserDepartments_B_index" ON "_UserDepartments"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_DocumentRestrictions_AB_unique" ON "_DocumentRestrictions"("A", "B");

-- CreateIndex
CREATE INDEX "_DocumentRestrictions_B_index" ON "_DocumentRestrictions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DocumentCategories_AB_unique" ON "_DocumentCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_DocumentCategories_B_index" ON "_DocumentCategories"("B");
