"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, Gift, Zap, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"

const promotions = [
  {
    id: 1,
    title: "Double XP Weekend",
    description: "Earn 2x experience points on all games this weekend. Level up faster and unlock exclusive rewards.",
    icon: Zap,
    accent: "text-primary",
  },
  {
    id: 2,
    title: "Free Spins Friday",
    description: "Get 50 free spins on our featured slot machines every Friday. No deposit required.",
    icon: Gift,
    accent: "text-chart-3",
  },
  {
    id: 3,
    title: "Deposit Match Bonus",
    description: "We will match your deposit up to $500. Double your bankroll and double your fun.",
    icon: Percent,
    accent: "text-chart-2",
  },
]

export function PromoBanner() {
  const [current, setCurrent] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % promotions.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + promotions.length) % promotions.length)
  }, [])

  useEffect(() => {
    if (dismissed) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [dismissed, next])

  if (dismissed) return null

  const promo = promotions[current]
  const Icon = promo.icon

  return (
    <section id="promotions" className="relative overflow-hidden border-b border-border/50 bg-secondary/50">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:flex"
          onClick={prev}
          aria-label="Previous promotion"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className={`hidden shrink-0 items-center justify-center rounded-lg bg-secondary p-2.5 sm:flex ${promo.accent}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {promo.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {promo.description}
            </p>
          </div>
          <Button size="sm" className="shrink-0 text-xs font-semibold">
            Claim Now
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:flex"
          onClick={next}
          aria-label="Next promotion"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {promotions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`size-1.5 rounded-full transition-all ${
                i === current
                  ? "bg-primary w-4 rounded-full"
                  : "bg-muted-foreground/40"
              }`}
              aria-label={`Go to promotion ${i + 1}`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss promotions"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </section>
  )
}
