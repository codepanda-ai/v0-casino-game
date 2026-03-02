"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy } from "lucide-react"

type Player = {
  rank: number
  name: string
  initials: string
  totalWinnings: string
  gamesPlayed: number
}

const slotsLeaderboard: Player[] = [
  { rank: 1, name: "GoldenAce", initials: "GA", totalWinnings: "$12,450", gamesPlayed: 234 },
  { rank: 2, name: "SpinMaster", initials: "SM", totalWinnings: "$9,820", gamesPlayed: 198 },
  { rank: 3, name: "LuckyDraw", initials: "LD", totalWinnings: "$8,310", gamesPlayed: 176 },
  { rank: 4, name: "JackpotJoe", initials: "JJ", totalWinnings: "$6,750", gamesPlayed: 152 },
  { rank: 5, name: "Dan", initials: "DA", totalWinnings: "$5,480", gamesPlayed: 134 },
  { rank: 6, name: "ReelQueen", initials: "RQ", totalWinnings: "$4,920", gamesPlayed: 128 },
  { rank: 7, name: "SlotShark", initials: "SS", totalWinnings: "$3,650", gamesPlayed: 112 },
  { rank: 8, name: "WildCard", initials: "WC", totalWinnings: "$2,890", gamesPlayed: 98 },
  { rank: 9, name: "BonusHunt", initials: "BH", totalWinnings: "$2,130", gamesPlayed: 87 },
  { rank: 10, name: "MegaSpin", initials: "MS", totalWinnings: "$1,560", gamesPlayed: 72 },
]

const rouletteLeaderboard: Player[] = [
  { rank: 1, name: "RedOrBlack", initials: "RB", totalWinnings: "$15,200", gamesPlayed: 89 },
  { rank: 2, name: "WheelKing", initials: "WK", totalWinnings: "$11,340", gamesPlayed: 76 },
  { rank: 3, name: "Dan", initials: "DA", totalWinnings: "$9,100", gamesPlayed: 68 },
  { rank: 4, name: "HighRoller", initials: "HR", totalWinnings: "$7,650", gamesPlayed: 55 },
  { rank: 5, name: "BetBoss", initials: "BB", totalWinnings: "$6,200", gamesPlayed: 48 },
  { rank: 6, name: "LuckyNum", initials: "LN", totalWinnings: "$5,400", gamesPlayed: 42 },
  { rank: 7, name: "SpinPro", initials: "SP", totalWinnings: "$4,100", gamesPlayed: 38 },
  { rank: 8, name: "ChipStack", initials: "CS", totalWinnings: "$3,250", gamesPlayed: 34 },
  { rank: 9, name: "TableTitan", initials: "TT", totalWinnings: "$2,680", gamesPlayed: 29 },
  { rank: 10, name: "RouletteRx", initials: "RR", totalWinnings: "$1,990", gamesPlayed: 24 },
]

const blackjackLeaderboard: Player[] = [
  { rank: 1, name: "CardCount", initials: "CC", totalWinnings: "$18,900", gamesPlayed: 156 },
  { rank: 2, name: "AceHigh", initials: "AH", totalWinnings: "$14,200", gamesPlayed: 134 },
  { rank: 3, name: "BlackjackPro", initials: "BP", totalWinnings: "$11,500", gamesPlayed: 121 },
  { rank: 4, name: "Dan", initials: "DA", totalWinnings: "$9,350", gamesPlayed: 108 },
  { rank: 5, name: "DealersBane", initials: "DB", totalWinnings: "$7,800", gamesPlayed: 95 },
  { rank: 6, name: "HitOrStand", initials: "HS", totalWinnings: "$6,100", gamesPlayed: 82 },
  { rank: 7, name: "SplitKing", initials: "SK", totalWinnings: "$4,750", gamesPlayed: 74 },
  { rank: 8, name: "TwentyOne", initials: "TO", totalWinnings: "$3,600", gamesPlayed: 65 },
  { rank: 9, name: "DoubleDown", initials: "DD", totalWinnings: "$2,400", gamesPlayed: 52 },
  { rank: 10, name: "ShufflePro", initials: "SH", totalWinnings: "$1,800", gamesPlayed: 41 },
]

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return "bg-primary/15 text-primary font-bold"
    case 2:
      return "bg-muted-foreground/10 text-muted-foreground font-bold"
    case 3:
      return "bg-chart-5/15 text-chart-5 font-bold"
    default:
      return "text-muted-foreground"
  }
}

function getRankIcon(rank: number) {
  if (rank > 3) return null
  const colors = ["text-primary", "text-muted-foreground", "text-chart-5"]
  return <Trophy className={`size-3.5 ${colors[rank - 1]}`} />
}

function LeaderboardTable({ players }: { players: Player[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Player
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Winnings
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">
              Games Played
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.rank}
              className={`border-b border-border/30 transition-colors hover:bg-secondary/50 ${
                player.name === "Dan" ? "bg-primary/5" : ""
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-7 items-center justify-center rounded-md text-xs ${getRankStyle(
                      player.rank
                    )}`}
                  >
                    {player.rank}
                  </span>
                  {getRankIcon(player.rank)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-7">
                    <AvatarFallback
                      className={`text-[10px] font-bold ${
                        player.name === "Dan"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {player.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`text-sm font-medium ${
                    player.name === "Dan" ? "text-primary" : "text-foreground"
                  }`}>
                    {player.name}
                    {player.name === "Dan" && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
                    )}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                {player.totalWinnings}
              </td>
              <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground sm:table-cell">
                {player.gamesPlayed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Leaderboard() {
  return (
    <section id="leaderboard" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Leaderboard
        </h2>
        <p className="mt-2 text-muted-foreground">
          Top players from the past 7 days
        </p>
      </div>

      <Tabs defaultValue="slots" className="w-full">
        <div className="flex justify-center">
          <TabsList className="mb-6 bg-secondary">
            <TabsTrigger value="slots" className="px-6 data-[state=active]:text-primary">
              Slots
            </TabsTrigger>
            <TabsTrigger value="roulette" className="px-6 data-[state=active]:text-chart-2">
              Roulette
            </TabsTrigger>
            <TabsTrigger value="blackjack" className="px-6 data-[state=active]:text-chart-3">
              Blackjack
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-xl border border-border/50 bg-card">
          <TabsContent value="slots">
            <LeaderboardTable players={slotsLeaderboard} />
          </TabsContent>
          <TabsContent value="roulette">
            <LeaderboardTable players={rouletteLeaderboard} />
          </TabsContent>
          <TabsContent value="blackjack">
            <LeaderboardTable players={blackjackLeaderboard} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
