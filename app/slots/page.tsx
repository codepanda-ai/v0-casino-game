"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Symbols ──────────────────────────────────────────────────────────────────
type Symbol = "Cherry" | "Lemon" | "Orange" | "Plum" | "Bell" | "Bar" | "Seven"

const SYMBOLS: Symbol[] = ["Cherry", "Lemon", "Orange", "Plum", "Bell", "Bar", "Seven"]

const SYMBOL_DISPLAY: Record<Symbol, { emoji: string; label: string; color: string }> = {
  Cherry: { emoji: "🍒", label: "Cherry", color: "text-red-400" },
  Lemon:  { emoji: "🍋", label: "Lemon",  color: "text-yellow-300" },
  Orange: { emoji: "🍊", label: "Orange", color: "text-orange-400" },
  Plum:   { emoji: "🍇", label: "Plum",   color: "text-purple-400" },
  Bell:   { emoji: "🔔", label: "Bell",   color: "text-yellow-400" },
  Bar:    { emoji: "🎰", label: "Bar",    color: "text-blue-400" },
  Seven:  { emoji: "7",  label: "Seven",  color: "text-primary font-black" },
}

// ─── Payout logic ─────────────────────────────────────────────────────────────
function getMultiplier(reels: [Symbol, Symbol, Symbol]): number {
  const [a, b, c] = reels
  if (a === b && b === c) {
    if (a === "Seven")  return 50
    if (a === "Bar")    return 20
    if (a === "Bell")   return 15
    return 10 // three of any other fruit
  }
  if (a === b || b === c || a === c) return 2
  return 0
}

function getResultLabel(reels: [Symbol, Symbol, Symbol], bet: number): { label: string; win: boolean; amount: number } {
  const mult = getMultiplier(reels)
  if (mult === 0) return { label: "No match — better luck next time!", win: false, amount: 0 }
  const winnings = bet * mult
  const [a] = reels
  if (mult === 50) return { label: `JACKPOT! Three Sevens! +$${winnings}`, win: true, amount: winnings }
  if (mult >= 10)  return { label: `Three ${a}s! ${mult}x — +$${winnings}`, win: true, amount: winnings }
  return { label: `Two matching — 2x — +$${winnings}`, win: true, amount: winnings }
}

// ─── Reel strip (each reel shows 3 symbols; middle is the result) ──────────────
const STRIP_SIZE = 24 // number of symbols in the animated strip
const VISIBLE   = 3  // visible rows per reel

function buildStrip(finalSymbol: Symbol): Symbol[] {
  // Fill a long strip ending with the final symbol in the middle visible slot
  const strip: Symbol[] = []
  for (let i = 0; i < STRIP_SIZE; i++) {
    strip.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  }
  // Ensure final symbol lands on the center visible row (index STRIP_SIZE - 2)
  strip[STRIP_SIZE - 2] = finalSymbol
  return strip
}

// ─── Single Reel component ────────────────────────────────────────────────────
interface ReelProps {
  spinning: boolean
  finalSymbol: Symbol
  stopDelay: number // ms until this reel stops
  onStop?: () => void
  hasWon: boolean
}

function Reel({ spinning, finalSymbol, stopDelay, onStop, hasWon }: ReelProps) {
  const strip = useRef<Symbol[]>(buildStrip(finalSymbol))

  // Rebuild strip when a new final symbol is passed while not spinning
  if (!spinning) {
    // Keep current strip; the final slot is already set
  }

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 bg-secondary transition-all duration-300",
        spinning ? "border-primary/40" : hasWon ? "border-primary animate-win-pulse" : "border-border/60",
      )}
      style={{ width: "clamp(80px, 28vw, 130px)", height: "clamp(240px, 44vw, 390px)" }}
      aria-label={`Reel showing ${finalSymbol}`}
    >
      {/* Gradient overlays top/bottom to fade edges */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3 bg-gradient-to-b from-secondary to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-secondary to-transparent" />

      {/* Center highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 h-1/3 rounded-md border border-primary/20 bg-primary/5" />

      <ReelStrip spinning={spinning} finalSymbol={finalSymbol} stopDelay={stopDelay} onStop={onStop} />
    </div>
  )
}

interface ReelStripProps {
  spinning: boolean
  finalSymbol: Symbol
  stopDelay: number
  onStop?: () => void
}

function ReelStrip({ spinning, finalSymbol, stopDelay, onStop }: ReelStripProps) {
  const [displaySymbols, setDisplaySymbols] = useState<Symbol[]>([finalSymbol, finalSymbol, finalSymbol])
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSpinning = useRef(false)

  // Start/stop animation based on `spinning` prop
  if (spinning && !prevSpinning.current) {
    prevSpinning.current = true
    setIsAnimating(true)
    intervalRef.current = setInterval(() => {
      setDisplaySymbols([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ])
    }, 80)

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDisplaySymbols([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        finalSymbol,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ])
      setIsAnimating(false)
      onStop?.()
    }, stopDelay)
  }

  if (!spinning && prevSpinning.current) {
    prevSpinning.current = false
    setDisplaySymbols([
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      finalSymbol,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ])
  }

  const SYMBOL_H = `calc((clamp(240px, 44vw, 390px)) / ${VISIBLE})`

  return (
    <div className={cn("flex h-full flex-col", isAnimating && "spinning-reel")}>
      {displaySymbols.map((sym, i) => {
        const { emoji, color } = SYMBOL_DISPLAY[sym]
        const isCenter = i === 1
        return (
          <div
            key={i}
            className={cn(
              "flex items-center justify-center transition-all",
              isCenter ? "scale-110" : "scale-90 opacity-50",
            )}
            style={{ height: SYMBOL_H, flex: "0 0 auto" }}
          >
            <span
              className={cn(
                "select-none leading-none",
                sym === "Seven" ? `${color} font-black` : color,
                !isAnimating && isCenter && "animate-symbol-blur-in",
              )}
              style={{
                fontSize: "clamp(28px, 8vw, 52px)",
                display: "block",
              }}
            >
              {emoji}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Bet preset buttons ────────────────────────────────────────────────────────
const BET_PRESETS = [5, 10, 25, 50, 100]

// ─── Main Slots Page ──────────────────────────────────────────────────────────
export default function SlotsPage() {
  const INITIAL_BALANCE = 1000
  const [balance, setBalance]             = useState(INITIAL_BALANCE)
  const [betInput, setBetInput]           = useState("10")
  const [spinning, setSpinning]           = useState(false)
  const [reelResults, setReelResults]     = useState<[Symbol, Symbol, Symbol]>(["Cherry", "Bell", "Seven"])
  const [stoppedCount, setStoppedCount]   = useState(0)
  const [result, setResult]               = useState<{ label: string; win: boolean; amount: number } | null>(null)
  const [warning, setWarning]             = useState<string | null>(null)
  const [history, setHistory]             = useState<{ label: string; win: boolean }[]>([])
  const pendingResults                    = useRef<[Symbol, Symbol, Symbol]>(["Cherry", "Bell", "Seven"])

  const bet = Math.max(1, parseInt(betInput) || 0)
  const isValidBet = bet > 0 && bet <= balance

  const handleReelStop = useCallback((idx: number) => {
    setStoppedCount(prev => {
      const next = prev + 1
      if (next === 3) {
        // All reels stopped — apply result
        const finalReels = pendingResults.current
        const res = getResultLabel(finalReels, bet)
        setBalance(b => b + res.amount)
        setResult(res)
        setHistory(h => [{ label: res.label, win: res.win }, ...h.slice(0, 9)])
        setSpinning(false)
      }
      return next
    })
  }, [bet])

  function handleSpin() {
    setWarning(null)
    if (bet < 1) {
      setWarning("Please enter a valid bet amount.")
      return
    }
    if (bet > balance) {
      setWarning("Insufficient balance for this bet.")
      return
    }

    // Pick outcomes before spinning
    const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    pendingResults.current = [r1, r2, r3]

    setBalance(b => b - bet)
    setReelResults([r1, r2, r3])
    setResult(null)
    setStoppedCount(0)
    setSpinning(true)
  }

  const isWin = result?.win ?? false

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md lg:px-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Lobby</span>
          </Link>
        </Button>

        <h1 className="font-serif text-xl font-bold text-primary lg:text-2xl">
          Slot Machine
        </h1>

        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className={cn("text-lg font-bold tabular-nums", balance === 0 ? "text-destructive" : "text-primary")}>
            ${balance.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Main game area */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 lg:py-12">

        {/* Reels container */}
        <div
          className={cn(
            "flex items-center justify-center gap-3 rounded-2xl border-2 p-5 transition-all duration-500 lg:gap-5 lg:p-8",
            isWin && !spinning ? "border-primary/60 bg-card shadow-[0_0_60px_rgba(200,170,60,0.15)]" : "border-border/40 bg-card",
          )}
        >
          {(["reel1", "reel2", "reel3"] as const).map((_, idx) => (
            <Reel
              key={idx}
              spinning={spinning}
              finalSymbol={reelResults[idx]}
              stopDelay={1200 + idx * 600}
              onStop={() => handleReelStop(idx)}
              hasWon={isWin && !spinning}
            />
          ))}
        </div>

        {/* Result display */}
        <div className="h-10 text-center">
          {result && !spinning && (
            <p
              className={cn(
                "text-base font-semibold lg:text-lg",
                result.win ? "text-primary animate-win-glow-text" : "text-muted-foreground",
              )}
            >
              {result.label}
            </p>
          )}
          {spinning && (
            <p className="animate-pulse text-sm text-muted-foreground">Spinning&hellip;</p>
          )}
        </div>

        {/* Bet selector */}
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-medium text-muted-foreground">Bet:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
              <input
                type="number"
                min={1}
                max={balance}
                value={betInput}
                onChange={e => { setBetInput(e.target.value); setWarning(null) }}
                disabled={spinning}
                className="w-full rounded-lg border border-border bg-input py-2 pl-7 pr-3 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                aria-label="Bet amount"
              />
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2">
            {BET_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => { setBetInput(String(preset)); setWarning(null) }}
                disabled={spinning || preset > balance}
                className={cn(
                  "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all duration-150",
                  Number(betInput) === preset
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Warning */}
          {warning && (
            <p className="text-center text-xs font-medium text-destructive" role="alert">
              {warning}
            </p>
          )}
        </div>

        {/* Spin button */}
        <Button
          onClick={handleSpin}
          disabled={spinning || !isValidBet}
          size="lg"
          className={cn(
            "h-14 w-full max-w-md rounded-xl text-xl font-black tracking-widest transition-all duration-200",
            spinning
              ? "animate-pulse bg-primary/60 text-primary-foreground/60"
              : "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(200,170,60,0.3)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(200,170,60,0.5)]",
          )}
          aria-label={spinning ? "Spinning…" : "Spin the reels"}
        >
          {spinning ? "SPINNING…" : "SPIN"}
        </Button>

        {/* Balance depleted */}
        {balance === 0 && !spinning && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-8 py-5 text-center">
            <p className="font-serif text-lg font-bold text-foreground">Out of balance!</p>
            <p className="text-sm text-muted-foreground">Your balance has hit zero.</p>
            <Button
              size="sm"
              onClick={() => { setBalance(INITIAL_BALANCE); setResult(null); setHistory([]) }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add $1,000
            </Button>
          </div>
        )}

        {/* Payout table */}
        <details className="w-full max-w-md">
          <summary className="cursor-pointer select-none text-center text-xs text-muted-foreground hover:text-foreground">
            View payout table
          </summary>
          <div className="mt-3 overflow-hidden rounded-xl border border-border/50 bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Combination</th>
                  <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Payout</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["7 7 7", "50x bet"],
                  ["BAR BAR BAR", "20x bet"],
                  ["🔔 🔔 🔔", "15x bet"],
                  ["Any 3 matching fruits", "10x bet"],
                  ["Any 2 matching", "2x bet"],
                  ["No match", "Lose bet"],
                ].map(([combo, pay]) => (
                  <tr key={combo} className="border-b border-border/20 last:border-0">
                    <td className="px-4 py-2 text-foreground">{combo}</td>
                    <td className="px-4 py-2 text-right font-semibold text-primary">{pay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Recent results */}
        {history.length > 0 && (
          <div className="w-full max-w-md">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Trophy className="size-3" />
              Recent Results
            </h2>
            <ul className="flex flex-col gap-1">
              {history.map((h, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    h.win ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {h.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
