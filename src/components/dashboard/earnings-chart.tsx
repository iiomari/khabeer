"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

const config = {
  earnings: { label: t.dashboard.totalEarnings, color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function EarningsChart({ data }: { data: { month: string; earnings: number }[] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={data} margin={{ right: 8, left: 8, top: 8 }}>
        <defs>
          <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-earnings)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-earnings)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => formatNumber(value)}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${formatNumber(Number(value))} ريال`} />}
        />
        <Area
          dataKey="earnings"
          type="monotone"
          stroke="var(--color-earnings)"
          strokeWidth={2}
          fill="url(#earningsFill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
