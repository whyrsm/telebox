-- AlterTable
ALTER TABLE "files" ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "files_user_id_idx" ON "files"("user_id");

-- CreateIndex
CREATE INDEX "files_folder_id_idx" ON "files"("folder_id");

-- CreateIndex
CREATE INDEX "files_created_at_idx" ON "files"("created_at");

-- CreateIndex
CREATE INDEX "files_name_idx" ON "files"("name");

-- CreateIndex
CREATE INDEX "files_user_id_is_favorite_idx" ON "files"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "folders_user_id_idx" ON "folders"("user_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- CreateIndex
CREATE INDEX "folders_created_at_idx" ON "folders"("created_at");

-- CreateIndex
CREATE INDEX "folders_user_id_is_favorite_idx" ON "folders"("user_id", "is_favorite");
