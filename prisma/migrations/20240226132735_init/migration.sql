-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "url" TEXT,
    "youtubeId" TEXT,
    "usersId" TEXT NOT NULL,
    "postsId" TEXT,
    CONSTRAINT "Video_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Video_postsId_fkey" FOREIGN KEY ("postsId") REFERENCES "Posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("createdAt", "id", "updatedAt", "url", "usersId", "youtubeId") SELECT "createdAt", "id", "updatedAt", "url", "usersId", "youtubeId" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_youtubeId_key" ON "Video"("youtubeId");
CREATE INDEX "Video_usersId_idx" ON "Video"("usersId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
