/*
  Warnings:

  - You are about to drop the `Default` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Default";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "story_id" INTEGER NOT NULL,
    CONSTRAINT "Snippet_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Option" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "snippet_id" INTEGER NOT NULL,
    CONSTRAINT "Option_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "Snippet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
