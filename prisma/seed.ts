import { PrismaClient } from "@prisma/client"
import { seedCN } from "./seed-cn"
import { seedCH } from "./seed-ch"
import { seedLCT } from "./seed-lct"
import { seedMT } from "./seed-mt"
import { seedQuestions } from "./seed-questions"
import { seedFlashcards } from "./seed-flashcards"
import { seedSimulados } from "./seed-simulados"
import { seedAchievements } from "./seed-achievements"
import { seedRedacao } from "./seed-redacao"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed do ENEM Hub...")
  console.log("")

  // Áreas e tópicos (base de tudo)
  await seedCN(prisma)
  await seedCH(prisma)
  await seedLCT(prisma)
  await seedMT(prisma)
  await seedRedacao(prisma)
  console.log("")

  // Conteúdo (depende das áreas)
  await seedQuestions(prisma)
  await seedFlashcards(prisma)
  console.log("")

  // Simulados (depende das questões)
  await seedSimulados(prisma)
  console.log("")

  // Gamificação (independente)
  await seedAchievements(prisma)
  console.log("")

  const counts = await Promise.all([
    prisma.area.count(),
    prisma.discipline.count(),
    prisma.topic.count(),
    prisma.question.count(),
    prisma.flashcard.count(),
    prisma.simulado.count(),
    prisma.achievement.count(),
  ])

  console.log("✅ Seed concluído!")
  console.log(`   • ${counts[0]} áreas`)
  console.log(`   • ${counts[1]} disciplinas`)
  console.log(`   • ${counts[2]} tópicos`)
  console.log(`   • ${counts[3]} questões`)
  console.log(`   • ${counts[4]} flashcards`)
  console.log(`   • ${counts[5]} simulados`)
  console.log(`   • ${counts[6]} achievements`)
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
