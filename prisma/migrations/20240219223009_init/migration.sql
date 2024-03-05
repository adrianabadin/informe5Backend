-- CreateTable
CREATE TABLE "UserRoles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "timeStart" INTEGER NOT NULL,
    "timeEnd" INTEGER NOT NULL,
    "visitCounter" INTEGER NOT NULL,
    "adsId" TEXT,
    "postsId" TEXT,
    "videoId" TEXT,
    "radioPostId" TEXT,
    "audioId" TEXT,
    CONSTRAINT "Metric_adsId_fkey" FOREIGN KEY ("adsId") REFERENCES "Ads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Metric_postsId_fkey" FOREIGN KEY ("postsId") REFERENCES "Posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Metric_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Metric_radioPostId_fkey" FOREIGN KEY ("radioPostId") REFERENCES "RadioPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Metric_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "street" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Gender" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "gender" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hash" TEXT,
    "birthDate" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "innerRefreshToken" TEXT,
    "avatar" TEXT,
    "fbid" TEXT,
    "addressesId" TEXT,
    "genderId" TEXT,
    "userRolesId" TEXT NOT NULL,
    CONSTRAINT "Users_userRolesId_fkey" FOREIGN KEY ("userRolesId") REFERENCES "UserRoles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Users_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Users_addressesId_fkey" FOREIGN KEY ("addressesId") REFERENCES "Addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "refreshToken" TEXT,
    "facebookToken" TEXT
);

-- CreateTable
CREATE TABLE "Photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "url" TEXT NOT NULL,
    "fbid" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Ads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "importance" TEXT NOT NULL,
    "usersId" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Ads_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "heading" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "usersId" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "fbid" TEXT,
    "isVisible" BOOLEAN NOT NULL,
    CONSTRAINT "Posts_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "url" TEXT,
    "youtubeId" TEXT,
    "usersId" TEXT NOT NULL,
    CONSTRAINT "Video_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RadioPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "importance" INTEGER NOT NULL,
    "visitCount" INTEGER NOT NULL,
    "minTimeExposure" INTEGER NOT NULL,
    "usersId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,
    CONSTRAINT "RadioPost_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "driveId" TEXT NOT NULL,
    "postsId" TEXT,
    CONSTRAINT "Audio_postsId_fkey" FOREIGN KEY ("postsId") REFERENCES "Posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PhotosToPosts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PhotosToPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "Photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PhotosToPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "Posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRoles_role_key" ON "UserRoles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE INDEX "Metric_adsId_idx" ON "Metric"("adsId");

-- CreateIndex
CREATE INDEX "Metric_postsId_idx" ON "Metric"("postsId");

-- CreateIndex
CREATE INDEX "Metric_videoId_idx" ON "Metric"("videoId");

-- CreateIndex
CREATE INDEX "Metric_radioPostId_idx" ON "Metric"("radioPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Gender_gender_key" ON "Gender"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE INDEX "Users_username_idx" ON "Users"("username");

-- CreateIndex
CREATE INDEX "Users_addressesId_idx" ON "Users"("addressesId");

-- CreateIndex
CREATE UNIQUE INDEX "DataConfig_id_key" ON "DataConfig"("id");

-- CreateIndex
CREATE INDEX "Ads_usersId_idx" ON "Ads"("usersId");

-- CreateIndex
CREATE INDEX "Posts_usersId_idx" ON "Posts"("usersId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_youtubeId_key" ON "Video"("youtubeId");

-- CreateIndex
CREATE INDEX "Video_usersId_idx" ON "Video"("usersId");

-- CreateIndex
CREATE INDEX "RadioPost_usersId_idx" ON "RadioPost"("usersId");

-- CreateIndex
CREATE INDEX "Audio_postsId_idx" ON "Audio"("postsId");

-- CreateIndex
CREATE UNIQUE INDEX "_PhotosToPosts_AB_unique" ON "_PhotosToPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_PhotosToPosts_B_index" ON "_PhotosToPosts"("B");
