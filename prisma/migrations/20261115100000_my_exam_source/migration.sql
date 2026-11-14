-- An exam from a file keeps the text read from the document, so the same account can pay a lower
-- price for new questions from the same material (a retry).
-- Additive: four nullable columns; no existing row changes. Exams made before this have no kept text.
ALTER TABLE "MyExam"
    ADD COLUMN "sourceText" TEXT,
    ADD COLUMN "sourceChars" INTEGER,
    ADD COLUMN "sourceCount" INTEGER,
    ADD COLUMN "sourceStructure" TEXT;
