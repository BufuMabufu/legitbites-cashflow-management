"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface SalesChartProps {
  data: { date: string; income: number }[];
}

function formatRupiahShort(amount: number) {
  if (amount >= 1e9) return `Rp ${(amount / 1e9).toFixed(1)}M`;
  if (amount >= 1e6) return `Rp ${(amount / 1e6).toFixed(1)}Jt`;
  if (amount >= 1e3) return `Rp ${(amount / 1e3).toFixed(1)}Rb`;
  return `Rp ${amount}`;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="col-span-1 border-emerald-200 dark:border-emerald-900/50">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold">Grafik Pemasukan (7 Hari Terakhir)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 14 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
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
                formatter={(value: unknown) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value)), "Pemasukan"]}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                contentStyle={{ borderRadius: '12px', borderColor: '#d1d5db', padding: '12px', fontSize: '16px' }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
