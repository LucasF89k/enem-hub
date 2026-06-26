import { type PrismaClient, SimuladoType } from "@prisma/client"

export async function seedSimulados(prisma: PrismaClient) {
  console.log("  Seeding simulados...")

  // Busca questões por área para montar os simulados
  const cnQuestions = await prisma.question.findMany({
    where: { areaSlug: "ciencias-natureza", source: "Custom" },
    select: { id: true },
    take: 20,
  })
  const chQuestions = await prisma.question.findMany({
    where: { areaSlug: "ciencias-humanas", source: "Custom" },
    select: { id: true },
    take: 20,
  })
  const lctQuestions = await prisma.question.findMany({
    where: { areaSlug: "linguagens", source: "Custom" },
    select: { id: true },
    take: 13,
  })
  const mtQuestions = await prisma.question.findMany({
    where: { areaSlug: "matematica", source: "Custom" },
    select: { id: true },
    take: 13,
  })

  // Limpa simulados existentes de seed
  await prisma.simuladoQuestion.deleteMany({})
  await prisma.simulado.deleteMany({
    where: { title: { in: ["Simulado Completo ENEM", "Simulado CN", "Simulado CH"] } },
  })

  // 1. Simulado Completo — FULL (45 questões, 90 min)
  const fullQuestions = [
    ...cnQuestions.slice(0, 12),
    ...chQuestions.slice(0, 11),
    ...lctQuestions.slice(0, 11),
    ...mtQuestions.slice(0, 11),
  ]

  const simuladoFull = await prisma.simulado.create({
    data: {
      title: "Simulado Completo ENEM",
      description: "Simulado com questões das 4 áreas do ENEM — ideal para treino geral",
      type: SimuladoType.FULL,
      duration: 90,
      isPublic: true,
    },
  })

  for (let i = 0; i < fullQuestions.length; i++) {
    await prisma.simuladoQuestion.create({
      data: {
        simuladoId: simuladoFull.id,
        questionId: fullQuestions[i].id,
        order: i + 1,
      },
    })
  }

  // 2. Simulado CN — AREA (20 questões, 40 min)
  const simuladoCN = await prisma.simulado.create({
    data: {
      title: "Simulado CN",
      description: "Simulado focado em Ciências da Natureza: Biologia, Química e Física",
      type: SimuladoType.AREA,
      duration: 40,
      isPublic: true,
    },
  })

  for (let i = 0; i < Math.min(cnQuestions.length, 20); i++) {
    await prisma.simuladoQuestion.create({
      data: {
        simuladoId: simuladoCN.id,
        questionId: cnQuestions[i].id,
        order: i + 1,
      },
    })
  }

  // 3. Simulado CH — AREA (20 questões, 40 min)
  const simuladoCH = await prisma.simulado.create({
    data: {
      title: "Simulado CH",
      description: "Simulado focado em Ciências Humanas: História, Geografia, Filosofia e Sociologia",
      type: SimuladoType.AREA,
      duration: 40,
      isPublic: true,
    },
  })

  for (let i = 0; i < Math.min(chQuestions.length, 20); i++) {
    await prisma.simuladoQuestion.create({
      data: {
        simuladoId: simuladoCH.id,
        questionId: chQuestions[i].id,
        order: i + 1,
      },
    })
  }

  console.log("  ✓ 3 simulados criados (Full 45q, CN 20q, CH 20q)")
}
