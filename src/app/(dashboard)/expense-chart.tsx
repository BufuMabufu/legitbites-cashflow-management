"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ExpenseChartProps {
  data: { date: string; expense: number }[];
  rangeLabel: string;
}

function formatRupiahShort(amount: number) {
  if (amount >= 1e9) return `Rp ${(amount / 1e9).toFixed(1)}M`;
  if (amount >= 1e6) return `Rp ${(amount / 1e6).toFixed(1)}Jt`;
  if (amount >= 1e3) return `Rp ${(amount / 1e3).toFixed(1)}Rb`;
  return `Rp ${amount}`;
}

export function ExpenseChart({ data, rangeLabel }: ExpenseChartProps) {
  return (
    <Card className="col-span-1 border-red-200 dark:border-red-900/50">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
          📉 Pengeluaran — {rangeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={formatRupiahShort} 
                tick={{ fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <Tooltip 
                formatter={(value: unknown) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value)), "Pengeluaran"]}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                contentStyle={{ borderRadius: '12px', borderColor: '#d1d5db', padding: '12px', fontSize: '16px' }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
