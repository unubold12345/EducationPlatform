CREATE TABLE "ContentDraft" (
 "key" TEXT NOT NULL PRIMARY KEY,"body" JSONB NOT NULL,"provenance" TEXT NOT NULL,
 "revision" INTEGER NOT NULL DEFAULT 1,"status" TEXT NOT NULL DEFAULT 'DRAFT',
 "editorId" TEXT NOT NULL,"reviewerId" TEXT,"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "PublishedContent" (
 "id" TEXT NOT NULL PRIMARY KEY,"key" TEXT NOT NULL,"version" INTEGER NOT NULL,
 "body" JSONB NOT NULL,"provenance" TEXT NOT NULL,"publishedBy" TEXT NOT NULL,
 "reviewedBy" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PublishedContent_key_version_key" ON "PublishedContent"("key","version");
