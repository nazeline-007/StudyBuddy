-- AlterTable
ALTER TABLE "LearningPath" ADD COLUMN     "subjectId" TEXT;

-- CreateIndex
CREATE INDEX "LearningPath_studentId_subjectId_isCurrent_idx" ON "LearningPath"("studentId", "subjectId", "isCurrent");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
