"use client"

import { useState, useTransition } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  BookOpen,
  Stethoscope,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ptBR as rdpPtBR } from "react-day-picker/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  CURSOS_ORDENADOS,
  findCurso,
  estimateCutoff,
  AREA_LABEL,
} from "@/constants/cursos"
import { universidadesDoCurso, findUniversidade, TIPO_LABEL } from "@/constants/universidades"
import { completeOnboarding } from "@/app/actions/onboarding.actions"
import { OnboardingIntro } from "./OnboardingIntro"

interface OnboardingStepsProps {
  defaultName: string
}

interface OnboardingForm {
  name: string
  targetScore: number
  targetCourse: string // slug do curso
  targetInstitution: string // id da universidade
  examDate: Date | undefined
  dailyStudyHours: number
  weekdays: number[]
}

const TOTAL_STEPS = 4

const WEEKDAYS = [
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
  { label: "Dom", value: 0 },
]

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
}

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 900) return { text: "Nota de Medicina 🏥", color: "text-accent" }
  if (score >= 800) return { text: "Muito boa pontuação ⭐", color: "text-yellow-400" }
  return { text: "Boa pontuação 📈", color: "text-blue-400" }
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h/dia` : `${h}h ${m}min/dia`
}

export function OnboardingSteps({ defaultName }: OnboardingStepsProps) {
  const [showIntro, setShowIntro] = useState(true)
  const [[step, direction], setStep] = useState<[number, number]>([0, 0])
  const [form, setForm] = useState<OnboardingForm>({
    name: defaultName,
    targetScore: 850,
    targetCourse: "medicina",
    targetInstitution: "",
    examDate: undefined,
    dailyStudyHours: 3,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [courseOpen, setCourseOpen] = useState(false)
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const curso = findCurso(form.targetCourse) ?? findCurso("medicina")!
  const uniOptions = universidadesDoCurso(curso.slug, curso.area)
    .map((u) => ({ u, corte: estimateCutoff(curso, u) }))
    .sort((a, b) => b.corte - a.corte)
  const selectedUni = findUniversidade(form.targetInstitution)

  // Ao escolher a faculdade, sugere a nota de corte como nota alvo
  function selectUniversity(uniId: string) {
    const u = findUniversidade(uniId)
    setForm((f) => ({
      ...f,
      targetInstitution: uniId,
      targetScore: u ? estimateCutoff(curso, u) : f.targetScore,
    }))
    setSchoolOpen(false)
  }

  function selectCourse(slug: string) {
    const c = findCurso(slug)
    // limpa universidade se ela não oferecer o novo curso
    const keepUni =
      c && form.targetInstitution
        ? universidadesDoCurso(c.slug, c.area).some((u) => u.id === form.targetInstitution)
        : false
    setForm((f) => ({ ...f, targetCourse: slug, targetInstitution: keepUni ? f.targetInstitution : "" }))
    setCourseOpen(false)
  }

  const navigate = (to: number) => setStep([to, to > step ? 1 : -1])
  const goNext = () => navigate(step + 1)
  const goPrev = () => navigate(step - 1)

  const canGoNext = () => {
    if (step === 0) return form.name.trim().length >= 2
    if (step === 2) return !!form.examDate
    return true
  }

  const handleSubmit = () => {
    startTransition(async () => {
      await completeOnboarding({
        name: form.name,
        targetScore: form.targetScore,
        targetCourse: form.targetCourse || "medicina",
        targetInstitution: form.targetInstitution || null,
        examDate: form.examDate ?? null,
        dailyStudyGoal: Math.round(form.dailyStudyHours * 60),
      })
    })
  }

  const toggleWeekday = (value: number) => {
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(value)
        ? f.weekdays.filter((d) => d !== value)
        : [...f.weekdays, value],
    }))
  }

  const scoreLabel = getScoreLabel(form.targetScore)

  // --- Step Content ---

  const Step0 = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center">
          <Stethoscope className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo(a)!</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed max-w-xs">
            Você está a um passo de organizar seus estudos para a Medicina. Vamos configurar tudo em 2 minutos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-name" className="text-sm font-medium">
          Como você quer ser chamado(a)?
        </Label>
        <Input
          id="onboarding-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Seu primeiro nome"
          className="h-12 text-base"
          autoFocus
          maxLength={80}
        />
      </div>

      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
        <p className="text-sm text-primary font-medium">
          "A medicina é uma ciência da incerteza e uma arte da probabilidade."
        </p>
        <p className="text-xs text-muted-foreground mt-1">— William Osler</p>
      </div>
    </div>
  )

  const Step1 = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Sua meta</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Olá, {form.name.split(" ")[0]}! Qual nota você precisa?
        </p>
      </div>

      {/* Curso combobox */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Curso desejado</Label>
        <Popover open={courseOpen} onOpenChange={setCourseOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-12 w-full justify-between text-left font-normal"
            >
              <span className="truncate">{curso.nome}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar curso..." />
              <CommandList>
                <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                <CommandGroup>
                  {CURSOS_ORDENADOS.map((c) => (
                    <CommandItem
                      key={c.slug}
                      value={`${c.nome} ${AREA_LABEL[c.area]}`}
                      onSelect={() => selectCourse(c.slug)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          form.targetCourse === c.slug ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm">{c.nome}</span>
                        <span className="text-xs text-muted-foreground">{AREA_LABEL[c.area]}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Universidade combobox (sugere a nota de corte ao escolher) */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Universidade-alvo{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-12 w-full justify-between text-left font-normal"
            >
              <span className={cn("truncate", !selectedUni && "text-muted-foreground")}>
                {selectedUni
                  ? `${selectedUni.sigla} · ${selectedUni.cidade}/${selectedUni.uf}`
                  : "Selecionar universidade..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar universidade..." />
              <CommandList>
                <CommandEmpty>Nenhuma universidade encontrada.</CommandEmpty>
                <CommandGroup>
                  {uniOptions.map(({ u, corte }) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.sigla} ${u.nome} ${u.cidade} ${u.uf}`}
                      onSelect={() => selectUniversity(u.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          form.targetInstitution === u.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm">{u.sigla}</span>
                        <span className="text-xs text-muted-foreground">
                          {TIPO_LABEL[u.tipo]} · {u.cidade}/{u.uf}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {corte}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedUni && (
          <p className="text-xs text-muted-foreground">
            Nota de corte estimada para {curso.nome}:{" "}
            <b className="text-primary">{estimateCutoff(curso, selectedUni)}</b> — usamos como sua
            nota alvo.
          </p>
        )}
      </div>

      {/* Score slider */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Nota alvo
            </span>
            <p className="text-4xl font-black tabular-nums text-foreground">{form.targetScore}</p>
          </div>
          <span className={cn("pb-1 text-sm font-semibold", scoreLabel.color)}>
            {scoreLabel.text}
          </span>
        </div>
        <Slider
          min={400}
          max={1000}
          step={10}
          value={[form.targetScore]}
          onValueChange={([v]) => setForm((f) => ({ ...f, targetScore: v }))}
          className="w-full"
          aria-label="Nota alvo"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>400</span>
          <span>700</span>
          <span>1000</span>
        </div>
      </div>
    </div>
  )

  const Step2 = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Sua disponibilidade</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Vamos montar um plano de estudos realista para você.
        </p>
      </div>

      {/* Exam date */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Data do seu ENEM{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 w-full justify-start text-left font-normal gap-2",
                !form.examDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0" />
              {form.examDate
                ? format(form.examDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.examDate}
              onSelect={(date) => {
                setForm((f) => ({ ...f, examDate: date }))
                setCalendarOpen(false)
              }}
              locale={rdpPtBR}
              captionLayout="dropdown"
              startMonth={new Date(2025, 0)}
              endMonth={new Date(2030, 11)}
              disabled={(date) => date < new Date()}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Daily hours slider */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <Label className="text-sm font-medium">Horas de estudo por dia</Label>
          <span className="text-base font-bold text-primary">
            {formatHours(form.dailyStudyHours)}
          </span>
        </div>
        <Slider
          min={1}
          max={12}
          step={0.5}
          value={[form.dailyStudyHours]}
          onValueChange={([v]) => setForm((f) => ({ ...f, dailyStudyHours: v }))}
          aria-label="Horas por dia"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1h</span>
          <span>6h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Weekday checkboxes */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-medium">Dias disponíveis</Label>
        <div className="flex gap-2 flex-wrap">
          {WEEKDAYS.map(({ label, value }) => {
            const checked = form.weekdays.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleWeekday(value)}
                className={cn(
                  "flex-1 min-w-[40px] h-10 rounded-lg text-sm font-medium border transition-colors",
                  checked
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const Step3 = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tudo pronto!</h2>
        <p className="text-sm text-muted-foreground text-center">
          Seu plano personalizado está configurado. Vamos estudar!
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <SummaryRow
          icon={<span className="text-lg">👤</span>}
          label="Nome"
          value={form.name}
        />
        <SummaryRow
          icon={<Target className="w-4 h-4 text-primary" />}
          label="Nota alvo"
          value={
            <span>
              <span className="font-bold text-foreground">{form.targetScore}</span>
              <span className={cn("ml-2 text-xs", scoreLabel.color)}>
                {scoreLabel.text}
              </span>
            </span>
          }
        />
        <SummaryRow
          icon={<BookOpen className="w-4 h-4 text-primary" />}
          label="Curso"
          value={curso.nome}
        />
        {selectedUni && (
          <SummaryRow
            icon={<Stethoscope className="w-4 h-4 text-primary" />}
            label="Universidade"
            value={`${selectedUni.sigla} — ${selectedUni.cidade}/${selectedUni.uf}`}
          />
        )}
        <SummaryRow
          icon={<CalendarIcon className="w-4 h-4 text-primary" />}
          label="Data do ENEM"
          value={
            form.examDate
              ? format(form.examDate, "dd/MM/yyyy")
              : "—"
          }
        />
        <SummaryRow
          icon={<Clock className="w-4 h-4 text-primary" />}
          label="Estudo diário"
          value={formatHours(form.dailyStudyHours)}
        />
        <SummaryRow
          icon={<BookOpen className="w-4 h-4 text-primary" />}
          label="Dias/semana"
          value={`${form.weekdays.length} dia${form.weekdays.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* CTA button */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-full"
        >
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold gap-2 rounded-2xl shadow-lg shadow-primary/30"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Começar a estudar
              </>
            )}
          </Button>
        </motion.div>
        <p className="text-xs text-muted-foreground">
          Você pode alterar essas configurações no seu perfil a qualquer momento.
        </p>
      </div>
    </div>
  )

  const STEPS = [Step0, Step1, Step2, Step3]

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <OnboardingIntro key="intro" onContinue={() => setShowIntro(false)} />
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen flex flex-col bg-background"
        >
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === step
                  ? "w-5 h-2 bg-primary"
                  : i < step
                  ? "w-2 h-2 bg-primary/60"
                  : "w-2 h-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {step + 1} de {TOTAL_STEPS}
        </span>
      </div>

      {/* Animated step content */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className="px-4 py-4 max-w-lg mx-auto pb-32">
              {STEPS[step]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="shrink-0 px-4 pb-8 pt-2 flex items-center gap-3 bg-background/80 backdrop-blur-sm border-t border-border">
        {step > 0 ? (
          <Button
            variant="outline"
            size="lg"
            className="h-12 gap-1.5 px-4"
            onClick={goPrev}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        ) : (
          <div className="h-12 flex-shrink-0 w-24" />
        )}

        {step < TOTAL_STEPS - 1 && (
          <Button
            size="lg"
            className="flex-1 h-12 gap-1.5"
            onClick={goNext}
            disabled={!canGoNext()}
          >
            Avançar
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}
