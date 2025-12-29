-- AlterTable
ALTER TABLE "files" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "files_user_id_deleted_at_idx" ON "files"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "folders_user_id_deleted_at_idx" ON "folders"("user_id", "deleted_at");
