-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "avatar" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "hasVideo" BOOLEAN NOT NULL,
    "likes" INTEGER NOT NULL,
    "retweets" INTEGER NOT NULL,
    "replies" INTEGER NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_handle_key" ON "Account"("handle");

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
