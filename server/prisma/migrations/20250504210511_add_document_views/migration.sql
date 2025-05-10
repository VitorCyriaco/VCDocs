-- CreateTable
CREATE TABLE "DocumentView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentView_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DocumentView_documentId_idx" ON "DocumentView"("documentId");

-- CreateIndex
CREATE INDEX "DocumentView_viewerId_idx" ON "DocumentView"("viewerId");

-- CreateIndex
CREATE INDEX "DocumentView_viewedAt_idx" ON "DocumentView"("viewedAt");
