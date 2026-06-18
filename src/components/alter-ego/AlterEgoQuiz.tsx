import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useClaude } from '../../hooks/useClaude'
import { useTMDB } from '../../hooks/useTMDB'
import { useTaste } from '../../hooks/useTaste'
import { tasteToPromptBlock } from '../../lib/taste'
import { CAST_QUESTIONS } from '../../lib/castQuestions'
import type { CastSelection } from '../../lib/casting'
import QuestionCard from './QuestionCard'
import LoadingReveal from './LoadingReveal'
import EgoReveal from './EgoReveal'
import ErrorState from '../shared/ErrorState'

type Stage = 'quiz' | 'loading' | 'reveal' | 'error'

export default function AlterEgoQuiz() {
  const [stage, setStage] = useState<Stage>('quiz')
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<CastSelection[]>([])
  const { character, generateAlterEgo, error: claudeError, reset: resetClaude } = useClaude()
  const { movies, fetchMoviesByQueries, loading: moviesLoading, error: tmdbError } = useTMDB()
  const taste = useTaste()

  const total = CAST_QUESTIONS.length
  const current = CAST_QUESTIONS[step]

  const handleAnswer = async (index: number) => {
    const selection: CastSelection = { question: current.prompt, option: current.options[index] }
    const next = [...selections, selection]
    setSelections(next)

    if (step < total - 1) {
      setStep((s) => s + 1)
      return
    }

    setStage('loading')
    try {
      const ego = await generateAlterEgo(next, tasteToPromptBlock(taste))
      try {
        await fetchMoviesByQueries(ego.tmdb_search_queries)
      } catch (tmdbErr) {
        console.error('[CASTED] TMDB reel fetch failed (continuing):', tmdbErr)
      }
    } catch (err) {
      console.error('[CASTED] casting failed:', err)
      setStage('error')
    }
  }

  const handleBack = () => {
    if (step === 0) return
    setSelections((prev) => prev.slice(0, -1))
    setStep((s) => s - 1)
  }

  const handleRestart = () => {
    setSelections([])
    setStep(0)
    resetClaude()
    setStage('quiz')
  }

  const handleLoadingComplete = () => {
    if (character) setStage('reveal')
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-casted-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/[0.03] blur-[150px]" />
      </div>

      <AnimatePresence mode="wait">
        <QuestionCard
          key={current.id}
          id={current.id}
          prompt={current.prompt}
          options={current.options.map((o) => o.label)}
          step={step + 1}
          total={total}
          onAnswer={handleAnswer}
          onBack={handleBack}
        />
      </AnimatePresence>
    </div>
  )
}
