import { Navbar } from "@/components/navbar"
import { PromoBanner } from "@/components/promo-banner"
import { GameSelection } from "@/components/game-selection"
import { PlayerStats } from "@/components/player-stats"
import { Leaderboard } from "@/components/leaderboard"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PromoBanner />
      <main>
        <GameSelection />
        <PlayerStats />
        <Leaderboard />
      </main>
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        <p>Luxe Casino. Play responsibly. 18+ only.</p>
      </footer>
    </div>
  )
}
