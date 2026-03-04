"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

// Standard European roulette wheel order (clockwise from 0)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

const POCKET_COUNT = 37
const DEG_PER_POCKET = 360 / POCKET_COUNT

const BET_PRESETS = [5, 10, 25, 50, 100]
const INITIAL_BALANCE = 1000

// ─── Types ────────────────────────────────────────────────────────────────────

type BetType =
  | { kind: "straight"; value: number }
  | { kind: "red" }
  | { kind: "black" }
  | { kind: "odd" }
  | { kind: "even" }
  | { kind: "low" }    // 1-18
  | { kind: "high" }   // 19-36
  | { kind: "dozen"; value: 1 | 2 | 3 }
  | { kind: "column"; value: 1 | 2 | 3 }

interface PlacedBet {
  id: string
  type: BetType
  amount: number
}

interface SpinResult {
  number: number
  color: "green" | "red" | "black"
}

interface HistoryEntry {
  number: number
  color: "green" | "red" | "black"
  net: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(n: number): "green" | "red" | "black" {
  if (n === 0) return "green"
  return RED_NUMBERS.has(n) ? "red" : "black"
}

function betKey(type: BetType): string {
  if (type.kind === "straight") return `straight-${type.value}`
  if (type.kind === "dozen") return `dozen-${type.value}`
  if (type.kind === "column") return `column-${type.value}`
  return type.kind
}

function checkWin(bet: PlacedBet, result: SpinResult): number {
  const { type, amount } = bet
  const { number, color } = result
  switch (type.kind) {
    case "straight":
      return type.value === number ? amount * 35 : 0
    case "red":
      return color === "red" ? amount : 0
    case "black":
      return color === "black" ? amount : 0
    case "odd":
      return number !== 0 && number % 2 === 1 ? amount : 0
    case "even":
      return number !== 0 && number % 2 === 0 ? amount : 0
    case "low":
      return number >= 1 && number <= 18 ? amount : 0
    case "high":
      return number >= 19 && number <= 36 ? amount : 0
    case "dozen":
      if (type.value === 1 && number >= 1 && number <= 12) return amount * 2
      if (type.value === 2 && number >= 13 && number <= 24) return amount * 2
      if (type.value === 3 && number >= 25 && number <= 36) return amount * 2
      return 0
    case "column":
      if (number === 0) return 0
      return number % 3 === (type.value === 3 ? 0 : type.value) ? amount * 2 : 0
    default:
      return 0
  }
}

function totalBetAmount(bets: PlacedBet[]): number {
  return bets.reduce((s, b) => s + b.amount, 0)
}

// ─── SVG Wheel ────────────────────────────────────────────────────────────────

const CX = 200
const CY = 200
const R_OUTER = 188   // outermost edge (gold border)
const R_POCKET = 178  // colored sectors outer
const R_INNER = 88    // sectors inner / hub outer
const R_HUB = 30      // center hub
const R_BALL_ORBIT = 170 // ball orbit radius (for pointer display)
const R_NUM = 140     // number label radius

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function sectorPath(index: number, rOuter: number, rInner: number): string {
  const startDeg = index * DEG_PER_POCKET
  const endDeg = (index + 1) * DEG_PER_POCKET
  const s = polarToXY(startDeg, rOuter)
  const e = polarToXY(endDeg, rOuter)
  const si = polarToXY(startDeg, rInner)
  const ei = polarToXY(endDeg, rInner)
  const large = DEG_PER_POCKET > 180 ? 1 : 0
  return [
    `M ${si.x} ${si.y}`,
    `L ${s.x} ${s.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${si.x} ${si.y}`,
    "Z",
  ].join(" ")
}

function pocketColor(n: number): string {
  if (n === 0) return "#1a7a3c"
  return RED_NUMBERS.has(n) ? "#c0392b" : "#1a1a2a"
}

interface WheelProps {
  rotation: number       // current wheel rotation in degrees
  ballAngle: number | null // angle of ball on the wheel (null when not showing)
  spinning: boolean
  winningNumber: number | null
}

function RouletteWheel({ rotation, ballAngle, spinning, winningNumber }: WheelProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer / marker at top */}
      <div
        className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1"
        aria-hidden="true"
      >
        <div className="h-5 w-3 rounded-b-full bg-primary shadow-[0_0_8px_2px_oklch(0.8_0.15_85/0.6)]" />
      </div>

      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{ maxWidth: 340 }}
        aria-label="Roulette wheel"
      >
        {/* Outer gold ring */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="oklch(0.8 0.15 85)" />

        {/* Spinning group */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.15, 1.0)"
              : "none",
          }}
        >
          {/* Pocket sectors */}
          {WHEEL_ORDER.map((num, i) => (
            <path
              key={i}
              d={sectorPath(i, R_POCKET, R_INNER)}
              fill={pocketColor(num)}
              stroke="oklch(0.8 0.15 85)"
              strokeWidth="0.8"
            />
          ))}

          {/* Number labels */}
          {WHEEL_ORDER.map((num, i) => {
            const midDeg = i * DEG_PER_POCKET + DEG_PER_POCKET / 2
            const pos = polarToXY(midDeg, R_NUM)
            const rotDeg = midDeg  // rotate text to align with sector
            return (
              <text
                key={`lbl-${i}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="600"
                fill="white"
                style={{ transform: `rotate(${rotDeg}deg)`, transformOrigin: `${pos.x}px ${pos.y}px` }}
              >
                {num}
              </text>
            )
          })}

          {/* Inner separator ring */}
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="oklch(0.8 0.15 85)" strokeWidth="3" />

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={R_HUB + 8} fill="oklch(0.18 0.012 260)" />
          <circle cx={CX} cy={CY} r={R_HUB} fill="oklch(0.8 0.15 85)" />
          <circle cx={CX} cy={CY} r={R_HUB - 8} fill="oklch(0.15 0.01 260)" />
        </g>

        {/* Ball — fixed in DOM, positioned by ballAngle (stays outside wheel rotation) */}
        {ballAngle !== null && (() => {
          // ballAngle is the angle in the non-rotated frame where ball rests
          // During spinning we orbit; after stopping we position at winning pocket
          const bPos = polarToXY(ballAngle, R_BALL_ORBIT)
          return (
            <circle
              cx={bPos.x}
              cy={bPos.y}
              r="7"
              fill="white"
              stroke="oklch(0.65 0.02 260)"
              strokeWidth="1.5"
              style={{
                filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))",
              }}
              aria-label="Ball"
            />
          )
        })()}
      </svg>

      {/* Win flash overlay */}
      {winningNumber !== null && !spinning && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex size-16 items-center justify-center rounded-full text-xl font-black text-primary-foreground shadow-[0_0_40px_8px_oklch(0.8_0.15_85/0.5)]"
            style={{ backgroundColor: pocketColor(winningNumber) }}
          >
            {winningNumber}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Betting Board ────────────────────────────────────────────────────────────

interface BettingBoardProps {
  bets: PlacedBet[]
  onBet: (type: BetType) => void
  disabled: boolean
  lastResult: SpinResult | null
}

function BettingBoard({ bets, onBet, disabled, lastResult }: BettingBoardProps) {
  // Map betKey -> total amount for display
  const betMap = new Map<string, number>()
  for (const b of bets) {
    const k = betKey(b.type)
    betMap.set(k, (betMap.get(k) ?? 0) + b.amount)
  }

  function cellClass(active: boolean, hit: boolean) {
    return cn(
      "relative flex cursor-pointer items-center justify-center rounded border text-xs font-semibold select-none transition-all duration-150",
      "hover:brightness-125 active:scale-95",
      active ? "border-primary ring-1 ring-primary/60 shadow-[0_0_8px_2px_oklch(0.8_0.15_85/0.4)]" : "border-border/40",
      hit ? "brightness-125" : "",
      disabled ? "pointer-events-none opacity-60" : "",
    )
  }

  function NumberCell({ n }: { n: number }) {
    const color = getColor(n)
    const key = betKey({ kind: "straight", value: n })
    const amount = betMap.get(key) ?? 0
    const hit = lastResult?.number === n
    const bgColor =
      color === "green" ? "bg-emerald-800" :
      color === "red"   ? "bg-red-800" :
      "bg-zinc-800"
    return (
      <div
        className={cn(cellClass(amount > 0, hit), bgColor, "h-8 w-full")}
        onClick={() => onBet({ kind: "straight", value: n })}
        role="button"
        aria-label={`Bet on ${n}`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && onBet({ kind: "straight", value: n })}
      >
        <span className="text-white">{n}</span>
        {amount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow">
            {amount >= 1000 ? "1k" : amount}
          </span>
        )}
      </div>
    )
  }

  function OutsideCell({
    label,
    type,
    colorClass = "",
    colspan = 1,
  }: {
    label: string
    type: BetType
    colorClass?: string
    colspan?: number
  }) {
    const key = betKey(type)
    const amount = betMap.get(key) ?? 0
    const hit = lastResult !== null && checkWin({ id: "", type, amount: 1 }, lastResult) > 0
    return (
      <div
        className={cn(
          cellClass(amount > 0, hit),
          "h-8 px-1 text-center",
          colorClass,
          colspan === 2 ? "col-span-2" : colspan === 3 ? "col-span-3" : "",
        )}
        onClick={() => onBet(type)}
        role="button"
        aria-label={`Bet on ${label}`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && onBet(type)}
      >
        <span>{label}</span>
        {amount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow">
            {amount >= 1000 ? "1k" : amount}
          </span>
        )}
      </div>
    )
  }

  // Build the 12-row × 3-column number grid (standard European layout)
  // Numbers go: row 1 = [1,2,3], row 2 = [4,5,6], ... row 12 = [34,35,36]
  // Column bets: col 1 = multiples ending in 1 (1,4,7..34), col 2 = ...2 (2,5,8..35), col 3 = ...3 (3,6,9..36)
  const rows = Array.from({ length: 12 }, (_, r) => [r * 3 + 1, r * 3 + 2, r * 3 + 3])

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/50 bg-card p-3">
      {/* Zero */}
      <div className="grid grid-cols-3 gap-1">
        <div
          className={cn(cellClass(false, lastResult?.number === 0), "col-span-3 h-8 bg-emerald-800 text-white")}
          onClick={() => onBet({ kind: "straight", value: 0 })}
          role="button"
          aria-label="Bet on 0"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && onBet({ kind: "straight", value: 0 })}
        >
          0
          {(betMap.get("straight-0") ?? 0) > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow">
              {betMap.get("straight-0")}
            </span>
          )}
        </div>
      </div>

      {/* Number grid: 12 rows of 3 */}
      <div className="grid grid-cols-3 gap-1">
        {rows.map((row) =>
          row.map((n) => <NumberCell key={n} n={n} />)
        )}
      </div>

      {/* Column bets */}
      <div className="grid grid-cols-3 gap-1">
        {([1, 2, 3] as const).map((col) => (
          <OutsideCell key={col} label={`C${col}`} type={{ kind: "column", value: col }} />
        ))}
      </div>

      {/* Dozen bets */}
      <div className="grid grid-cols-3 gap-1">
        <OutsideCell label="1-12" type={{ kind: "dozen", value: 1 }} />
        <OutsideCell label="13-24" type={{ kind: "dozen", value: 2 }} />
        <OutsideCell label="25-36" type={{ kind: "dozen", value: 3 }} />
      </div>

      {/* Outside bets: Low / Even / Red / Black / Odd / High */}
      <div className="grid grid-cols-6 gap-1">
        <OutsideCell label="1-18" type={{ kind: "low" }} />
        <OutsideCell label="Even" type={{ kind: "even" }} />
        <OutsideCell label="Red" type={{ kind: "red" }} colorClass="bg-red-900 text-red-200" />
        <OutsideCell label="Black" type={{ kind: "black" }} colorClass="bg-zinc-900 text-zinc-200" />
        <OutsideCell label="Odd" type={{ kind: "odd" }} />
        <OutsideCell label="19-36" type={{ kind: "high" }} />
      </div>
    </div>
  )
}

// ─── Results History ──────────────────────────────────────────────────────────

function ResultsHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground">Recent Results</p>
      <div className="flex flex-wrap gap-1.5">
        {history.map((h, i) => (
          <div
            key={i}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow",
              h.color === "green" ? "bg-emerald-700" :
              h.color === "red"   ? "bg-red-700" :
              "bg-zinc-700",
            )}
            title={h.net >= 0 ? `+$${h.net}` : `-$${Math.abs(h.net)}`}
          >
            {h.number}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoulettePage() {
  const [balance, setBalance]             = useState(INITIAL_BALANCE)
  const [betAmount, setBetAmount]         = useState(10)
  const [betInput, setBetInput]           = useState("10")
  const [placedBets, setPlacedBets]       = useState<PlacedBet[]>([])
  const [spinning, setSpinning]           = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [ballAngle, setBallAngle]         = useState<number | null>(null)
  const [result, setResult]               = useState<SpinResult | null>(null)
  const [lastResult, setLastResult]       = useState<SpinResult | null>(null)
  const [resultText, setResultText]       = useState<{ text: string; net: number } | null>(null)
  const [history, setHistory]             = useState<HistoryEntry[]>([])
  const [warning, setWarning]             = useState<string | null>(null)
  const totalRotationRef                  = useRef(0)
  const ballIntervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null)
  const [ballDisplayAngle, setBallDisplayAngle] = useState<number | null>(null)

  // Keep betAmount in sync with betInput
  const parsedBet = Math.max(1, parseInt(betInput) || 0)

  function handleBetInputChange(val: string) {
    setBetInput(val)
    const n = parseInt(val)
    if (!isNaN(n) && n > 0) setBetAmount(n)
    setWarning(null)
  }

  function handlePreset(v: number) {
    setBetAmount(v)
    setBetInput(String(v))
    setWarning(null)
  }

  function handlePlaceBet(type: BetType) {
    if (spinning) return
    const amount = parsedBet
    if (amount < 1) {
      setWarning("Enter a valid bet amount first.")
      return
    }
    if (totalBetAmount(placedBets) + amount > balance) {
      setWarning("Insufficient balance for this bet.")
      return
    }
    setWarning(null)
    const key = betKey(type)
    // Merge into existing bet of same type, or add new
    setPlacedBets(prev => {
      const existing = prev.find(b => betKey(b.type) === key)
      if (existing) {
        return prev.map(b => betKey(b.type) === key ? { ...b, amount: b.amount + amount } : b)
      }
      return [...prev, { id: `${key}-${Date.now()}`, type, amount }]
    })
  }

  function clearBets() {
    setPlacedBets([])
    setWarning(null)
  }

  function handleSpin() {
    setWarning(null)
    if (placedBets.length === 0) {
      setWarning("Place at least one bet before spinning.")
      return
    }
    const total = totalBetAmount(placedBets)
    if (total > balance) {
      setWarning("Insufficient balance for placed bets.")
      return
    }

    // Deduct bets
    setBalance(b => b - total)
    setResult(null)
    setResultText(null)
    setLastResult(null)
    setSpinning(true)

    // Pick winning number
    const winningIndex = Math.floor(Math.random() * POCKET_COUNT)
    const winningNumber = WHEEL_ORDER[winningIndex]
    const winningColor  = getColor(winningNumber)
    const spinResult: SpinResult = { number: winningNumber, color: winningColor }

    // Calculate target wheel rotation:
    // Pocket i center is at angle: i * DEG_PER_POCKET + DEG_PER_POCKET/2 from top (0°)
    // We want that pocket at the top (pointer). Wheel rotates so pocket angle comes to 0.
    // target = currentRotation + spins*360 - offset_of_pocket
    const pocketCenterAngle = winningIndex * DEG_PER_POCKET + DEG_PER_POCKET / 2
    const spins = 7 // full rotations
    const newRotation = totalRotationRef.current + spins * 360 + (360 - pocketCenterAngle % 360)
    totalRotationRef.current = newRotation % 360 // keep remainder for next spin

    // Animate ball orbiting (random starting angle, clockwise fast)
    let ballA = Math.random() * 360
    setBallDisplayAngle(ballA)
    ballIntervalRef.current = setInterval(() => {
      ballA = (ballA + 12) % 360
      setBallDisplayAngle(ballA)
    }, 30)

    setWheelRotation(newRotation)

    // After wheel stops (~4s), place ball on winning pocket
    setTimeout(() => {
      if (ballIntervalRef.current) clearInterval(ballIntervalRef.current)
      // The wheel has rotated newRotation. The winning pocket is now at the top (0°).
      // Ball should appear at the top of the UNROTATED frame (which is where the pointer is).
      // Since the wheel is rotated, ball angle in screen space = 0 (top pointer position).
      // Actually, the ball is drawn outside the rotating group, so angle 0 = top of screen.
      // But we want the ball to look like it's in the pocket at the top.
      // Ball at angle 0 (top of screen) aligns with the pointer, which is where the winning pocket ended up.
      setBallDisplayAngle(0) // top of wheel = where winning pocket is
      setSpinning(false)
      setResult(spinResult)
      setLastResult(spinResult)

      // Calculate winnings
      let totalWin = 0
      for (const bet of placedBets) {
        totalWin += checkWin(bet, spinResult)
      }
      // totalWin = net profit (e.g. 35x for straight means get back 36x total, 35 profit)
      // Actually let's return: original bet + winnings. For a win on red (1:1), you get 2x back.
      // Our checkWin returns NET win (profit only). We also return the original bet on wins.
      // Let me re-evaluate: checkWin for red returns `amount` (profit), then we add back the original bet too.
      let totalReturn = 0
      for (const bet of placedBets) {
        const win = checkWin(bet, spinResult)
        if (win > 0) totalReturn += win + bet.amount // winnings + stake back
      }

      const net = totalReturn - total
      setBalance(b => b + totalReturn)
      setResultText({
        text: totalReturn > 0
          ? `${winningNumber} — ${winningColor.toUpperCase()}! You won $${totalReturn - total}!`
          : `${winningNumber} — ${winningColor.toUpperCase()}. No winning bets.`,
        net,
      })
      setHistory(h => [{ number: winningNumber, color: winningColor, net }, ...h.slice(0, 14)])
      setPlacedBets([])
    }, 4200)
  }

  // Ball display angle drives the ball SVG position
  // During spin: ballDisplayAngle orbits around
  // After stop: ballDisplayAngle = 0 (at the pointer/top)
  // We pass ballDisplayAngle to the wheel component

  const canSpin = !spinning && placedBets.length > 0 && totalBetAmount(placedBets) <= balance

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
          Roulette
        </h1>

        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className={cn("text-lg font-bold tabular-nums", balance === 0 ? "text-destructive" : "text-primary")}>
            ${balance.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 flex-col items-center gap-4 px-3 py-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8 lg:px-8 lg:py-8">

        {/* Left column: Wheel + result + history */}
        <div className="flex w-full flex-col items-center gap-4 lg:max-w-sm lg:sticky lg:top-24">

          {/* Wheel */}
          <div className="w-full max-w-[320px] lg:max-w-full">
            <RouletteWheel
              rotation={wheelRotation}
              ballAngle={ballDisplayAngle}
              spinning={spinning}
              winningNumber={!spinning && result ? result.number : null}
            />
          </div>

          {/* Result text */}
          <div className="min-h-10 text-center">
            {resultText && !spinning && (
              <p
                className={cn(
                  "text-sm font-semibold leading-relaxed",
                  resultText.net > 0 ? "animate-win-glow-text text-primary" : "text-muted-foreground",
                )}
              >
                {resultText.text}
              </p>
            )}
            {spinning && (
              <p className="animate-pulse text-sm text-muted-foreground">Spinning&hellip;</p>
            )}
          </div>

          {/* History */}
          <ResultsHistory history={history} />

          {/* Payout reference */}
          <details className="w-full">
            <summary className="cursor-pointer select-none text-center text-xs text-muted-foreground hover:text-foreground">
              View payout table
            </summary>
            <div className="mt-2 overflow-hidden rounded-xl border border-border/40 bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-3 py-1.5 text-left text-muted-foreground">Bet</th>
                    <th className="px-3 py-1.5 text-right text-muted-foreground">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Straight up", "35:1"],
                    ["Red / Black", "1:1"],
                    ["Odd / Even", "1:1"],
                    ["1-18 / 19-36", "1:1"],
                    ["Dozen", "2:1"],
                    ["Column", "2:1"],
                  ].map(([b, p]) => (
                    <tr key={b} className="border-b border-border/20 last:border-0">
                      <td className="px-3 py-1.5 text-foreground">{b}</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-primary">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        {/* Right column: Bet controls + board */}
        <div className="flex w-full flex-col gap-4 lg:max-w-md">

          {/* Bet amount selector */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Bet Amount</span>
              {placedBets.length > 0 && (
                <button
                  onClick={clearBets}
                  disabled={spinning}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
                  aria-label="Clear all bets"
                >
                  <Trash2 className="size-3" />
                  Clear bets (${totalBetAmount(placedBets)})
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
              <input
                type="number"
                min={1}
                max={balance}
                value={betInput}
                onChange={e => handleBetInputChange(e.target.value)}
                disabled={spinning}
                className="w-full rounded-lg border border-border bg-input py-2 pl-7 pr-3 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                aria-label="Bet amount"
              />
            </div>

            <div className="flex gap-2">
              {BET_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => handlePreset(p)}
                  disabled={spinning || p > balance}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all duration-150",
                    parsedBet === p
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  ${p}
                </button>
              ))}
            </div>

            {warning && (
              <p className="text-center text-xs font-medium text-destructive" role="alert">
                {warning}
              </p>
            )}
          </div>

          {/* Betting board */}
          <div className={cn("transition-opacity", spinning ? "opacity-50 pointer-events-none" : "")}>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
              Click a cell to place your selected bet amount on it
            </p>
            <BettingBoard
              bets={placedBets}
              onBet={handlePlaceBet}
              disabled={spinning}
              lastResult={lastResult}
            />
          </div>

          {/* SPIN button */}
          <Button
            onClick={handleSpin}
            disabled={!canSpin}
            size="lg"
            className={cn(
              "h-14 w-full rounded-xl text-xl font-black tracking-widest transition-all duration-200",
              spinning
                ? "animate-pulse bg-primary/60 text-primary-foreground/60"
                : canSpin
                  ? "bg-primary text-primary-foreground shadow-[0_0_30px_oklch(0.8_0.15_85/0.35)] hover:scale-[1.02] hover:shadow-[0_0_50px_oklch(0.8_0.15_85/0.55)]"
                  : "bg-primary/40 text-primary-foreground/50",
            )}
            aria-label={spinning ? "Spinning…" : "Spin the wheel"}
          >
            {spinning ? "SPINNING…" : "SPIN"}
          </Button>

          {/* Balance empty state */}
          {balance === 0 && !spinning && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-5 text-center">
              <p className="font-serif text-lg font-bold text-foreground">Out of balance!</p>
              <p className="text-sm text-muted-foreground">Your balance has hit zero.</p>
              <Button
                size="sm"
                onClick={() => { setBalance(INITIAL_BALANCE); setResultText(null); setHistory([]) }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add $1,000
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
