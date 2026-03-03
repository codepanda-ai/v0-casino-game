"use client"

import { Gamepad2, TrendingUp, Trophy, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

const weeklyData = [
  { day: "Mon", value: 120 },
  { day: "Tue", value: -50 },
  { day: "Wed", value: 200 },
  { day: "Thu", value: 80 },
  { day: "Fri", value: -30 },
  { day: "Sat", value: 350 },
  { day: "Sun", value: 150 },
]

const stats = [
  {
    label: "Total Games Played",
    value: "47",
    icon: Gamepad2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Win Rate",
    value: "62%",
    icon: TrendingUp,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    label: "Biggest Win",
    value: "$2,450",
    icon: Trophy,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Net Profit/Loss",
    value: "+$1,280",
    isPositive: true,
    icon: DollarSign,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
]

export function PlayerStats() {
  return (
    <section className="border-y border-border/50 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-10">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Your Week in Review
          </h2>
          <p className="mt-2 text-muted-foreground">
            {"Here's how you performed this week, Dan."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-border/50 bg-card">
                <CardContent className="flex items-center gap-4 pt-0">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${
                      stat.isPositive !== undefined
                        ? stat.isPositive ? "text-chart-3" : "text-chart-2"
                        : "text-foreground"
                    }`}>
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Daily performance chart */}
        <Card className="mt-6 border-border/50 bg-card">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Daily Performance</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barCategoryGap="20%">
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    fill="currentColor"
                    className="text-primary"
                    shape={(props: Record<string, unknown>) => {
                      const { x, y, width, height, value } = props as {
                        x: number
                        y: number
                        width: number
                        height: number
                        value: number
                      }
                      const isNegative = (value as number) < 0
                      return (
                        <rect
                          x={x}
                          y={isNegative ? y : y}
                          width={width}
                          height={Math.abs(height as number)}
                          rx={4}
                          fill={isNegative ? "oklch(0.6 0.2 25)" : "oklch(0.8 0.15 85)"}
                          opacity={0.85}
                        />
                      )
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {weeklyData.map((d) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
