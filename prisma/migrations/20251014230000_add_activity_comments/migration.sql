-- CreateTable: Activity comments for status updates and history
CREATE TABLE "ActivityComment" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityComment_activityId_createdAt_idx" ON "ActivityComment"("activityId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityComment_userId_idx" ON "ActivityComment"("userId");

-- AddForeignKey
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
