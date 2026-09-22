-- CreateIndex
-- As telas de estudo perguntam "quais topicos esse aluno ja estudou?".
-- Sem este indice o Postgres usava o indice de userId e filtrava topicId
-- linha a linha, varrendo todas as sessoes do aluno.
CREATE INDEX "StudySession_userId_topicId_idx" ON "StudySession"("userId", "topicId");
