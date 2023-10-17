CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "script" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Template_sequence_key" ON "Template"("sequence");