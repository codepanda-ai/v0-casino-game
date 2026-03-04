"use client"

import Link from "next/link"
import { Dice1, Target, Spade, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

const games = [
  {
    name: "Slots",
    tagline: "Spin to win big jackpots",
    icon: Dice1,
    href: "/slots",
    accentClass: "group-hover:shadow-[0_0_40px_rgba(200,170,60,0.3)]",
    borderHover: "group-hover:border-primary/60",
    iconColor: "text-primary",
    btnClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    name: "Roulette",
    tagline: "Place your bets, feel the rush",
    icon: Target,
    href: "/roulette",
    accentClass: "group-hover:shadow-[0_0_40px_rgba(220,60,60,0.3)]",
    borderHover: "group-hover:border-chart-2/60",
    iconColor: "text-chart-2",
    btnClass: "bg-chart-2 text-foreground hover:bg-chart-2/90",
  },
  {
    name: "Blackjack",
    tagline: "Beat the dealer, hit 21",
    icon: Spade,
    href: null,
    accentClass: "group-hover:shadow-[0_0_40px_rgba(60,180,100,0.3)]",
    borderHover: "group-hover:border-chart-3/60",
    iconColor: "text-chart-3",
    btnClass: "bg-chart-3 text-primary-foreground hover:bg-chart-3/90",
  },
]

export function GameSelection() {
  return (
    <section id="games" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      {/* Responsible gambling banner */}
      <div className="mb-10 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">18+ only.</span> You must be at least 18 years of age and reside in a country where online gambling is legally permitted to play. Gamble responsibly &mdash; know your limits.{" "}
          <a
            href="https://www.begambleaware.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            BeGambleAware.org
          </a>
        </p>
      </div>

      <div className="mb-10 text-center">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Choose Your Game
        </h2>
        <p className="mt-2 text-muted-foreground">
          Three legendary games. Endless possibilities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {games.map((game) => {
          const Icon = game.icon
          return (
            <div
              key={game.name}
              className={`group relative flex cursor-pointer flex-col items-center rounded-xl border border-border/60 bg-card p-8 text-center transition-all duration-300 hover:scale-[1.02] ${game.accentClass} ${game.borderHover}`}
            >
              <div className={`mb-5 flex size-16 items-center justify-center rounded-2xl bg-secondary ${game.iconColor}`}>
                <Icon className="size-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {game.name}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {game.tagline}
              </p>
              {game.href ? (
                <Button asChild className={`mt-6 w-full font-semibold ${game.btnClass}`}>
                  <Link href={game.href}>Play Now</Link>
                </Button>
              ) : (
                <Button disabled className={`mt-6 w-full font-semibold opacity-50 ${game.btnClass}`}>
                  Coming Soon
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
