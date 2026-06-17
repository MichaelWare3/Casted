import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { generateAlterEgoQuestions } from '../../lib/claude'
import { useClaude } from '../../hooks/useClaude'
import { useTMDB } from '../../hooks/useTMDB'
import { useTaste } from '../../hooks/useTaste'
import { tasteToPromptBlock } from '../../lib/taste'
import type { QuizAnswer, QuizQuestion } from '../../types'
import QuestionCard from './QuestionCard'
import LoadingReveal from './LoadingReveal'
import EgoReveal from './EgoReveal'
import ErrorState from '../shared/ErrorState'
import LoadingDots from '../shared/LoadingDots'

type Stage = 'quiz' | 'loading' | 'reveal' | 'error'

export default function AlterEgoQuiz() {
  const [stage, setStage] = useState<Stage>('quiz')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const { character, generateAlterEgo, error: claudeError, reset: resetClaude } = useClaude()
  const { movies, fetchMoviesByQueries, loading: moviesLoading, error: tmdbError } = useTMDB()
  const taste = useTaste()

  useEffect(() => {
    let cancelled = false
    generateAlterEgoQuestions()
      .then((qs) => {
        if (cancelled) return
        setQuestions(qs)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[CASTED] ❌ Question generation failed:', err)
        setQuestionsError(err instanceof Error ? err.message : 'Could not load questions')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const total = questions.length
  const current = questions[step]

  const handleAnswer = async (option: { letter: 'A' | 'B' | 'C'; text: string }) => {
    if (!current) return
    const next: QuizAnswer = { question: current.prompt, answer: option.text }
    const newAnswers = [...answers, next]
    setAnswers(newAnswers)

    if (step < total - 1) {
      setStep((s) => s + 1)
      return
    }

    setStage('loading')
    try {

      const ego = await generateAlterEgo(newAnswers, tasteToPromptBlock(taste))

      if (!ego?.tmdb_search_queries?.length) {
        console.warn('[CASTED] ⚠️ ego has no tmdb_search_queries!', ego)
      }
      try {
        await fetchMoviesByQueries(ego.tmdb_search_queries)
      } catch (tmdbErr) {
        console.error('[CASTED] ❌ TMDB fetch threw (continuing to reveal):', tmdbErr)
      }
    } catch (err) {
      console.error('[CASTED] ❌ AlterEgoQuiz outer catch — going to error stage:', err)
      setStage('error')
    }
  }

  const handleBack = () => {
    if (step === 0) return
    setAnswers((prev) => prev.slice(0, -1))
    setStep((s) => s - 1)
  }

  const handleRestart = () => {
    setAnswers([])
    setStep(0)
    resetClaude()
    setStage('quiz')
  }

  // When loading screen signals done & character is ready, move to reveal
  const handleLoadingComplete = () => {

    if (character) {

      setStage('reveal')
    } else {
      console.warn('[CASTED] ⚠️ handleLoadingComplete called but character is null')
    }
  }

  useEffect(() => {
    if (stage === 'loading' && claudeError) setStage('error')
  }, [stage, claudeError])

  if (stage === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-casted-black px-6">
        <ErrorState
          message={claudeError || tmdbError || 'Something went wrong. Try again.'}
          onRetry={handleRestart}
          retryLabel="Roll Again"
        />
      </div>
    )
  }

  if (questionsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-casted-black px-6">
        <ErrorState
          message={questionsError}
          onRetry={() => window.location.reload()}
          retryLabel="Try Again"
        />
      </div>
    )
  }

  if (stage === 'reveal' && character) {
    return (
      <EgoReveal
        character={character}
        movies={movies}
        moviesLoading={moviesLoading}
        onRestart={handleRestart}
      />
    )
  }

  if (stage === 'loading') {
    return <LoadingReveal ready={!!character} onComplete={handleLoadingComplete} />
  }

  if (questions.length === 0 || !current) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-casted-black px-6 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/[0.03] blur-[150px]" />
        </div>
        <LoadingDots />
        <p className="mt-6 font-body text-xs uppercase tracking-widest text-casted-muted">
          Writing tonight's questions
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-casted-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/[0.03] blur-[150px]" />
      </div>

      <AnimatePresence mode="wait">
        <QuestionCard
          key={current.id}
          question={current}
          step={step + 1}
          total={total}
          onAnswer={handleAnswer}
          onBack={handleBack}
        />
      </AnimatePresence>
    </div>
  )
}
