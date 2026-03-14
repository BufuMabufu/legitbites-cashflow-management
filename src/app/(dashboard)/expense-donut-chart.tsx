"use client";

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ExpenseDonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  totalExpense: number;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Custom tooltip for Pie Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border shadow-lg">
        <p className="font-bold text-sm mb-1">{data.name}</p>
        <p className="font-semibold text-rose-600">
          {formatRupiah(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function ExpenseDonutChart({ data, totalExpense }: ExpenseDonutChartProps) {
  return (
    <Card className="flex flex-col border-rose-100 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/10">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">Top Kategori Pengeluaran</CardTitle>
        <CardDescription className="text-base mt-1">
          Distribusi biaya terbesar
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Belum ada pengeluaran di rentang waktu ini.
          </div>
        ) : (
          <div className="h-[280px] w-full mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomTooltip />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm mt-4">
                        {payload?.map((entry, index) => (
                          <li key={`item-${index}`} className="flex items-center text-muted-foreground font-medium">
                            <span 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.value}
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase opacity-80">Total</span>
              <span className="text-base md:text-lg font-bold text-rose-600 px-2 w-full text-center truncate">
                {formatRupiah(totalExpense)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
