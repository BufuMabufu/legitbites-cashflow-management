"use client";

import * as React from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface IncomeDonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  totalIncome: number;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function IncomeDonutChart({ data, totalIncome }: IncomeDonutChartProps) {
  const [activeName, setActiveName] = React.useState<string | null>(null);

  const onPieEnter = (entry: any) => {
    setActiveName(entry.name);
  };

  const onPieLeave = () => {
    setActiveName(null);
  };

  const activeData = activeName ? data.find(d => d.name === activeName) : null;

  return (
    <Card className="flex flex-col border-emerald-100 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">Top Kategori Pemasukan</CardTitle>
        <CardDescription className="text-base mt-1">
          Sumber pendapatan terbesar
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Belum ada pemasukan di rentang waktu ini.
          </div>
        ) : (
          <div className="h-[280px] w-full mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  style={{ cursor: "pointer", outline: "none" }}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{
                        filter: activeName === entry.name ? "brightness(1.1)" : "none",
                        transition: "filter 0.2s ease"
                      }}
                    />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm mt-4">
                        {payload?.map((entry: any, index: number) => (
                          <li 
                            key={`item-${index}`} 
                            className={`flex items-center font-medium transition-colors ${
                              activeName === entry.value || activeName === null ? "text-muted-foreground" : "text-muted-foreground/30"
                            }`}
                          >
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
            {/* Dynamic Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase opacity-80 truncate max-w-[120px]">
                {activeData ? activeData.name : "Total"}
              </span>
              <span className="text-base md:text-lg font-bold text-emerald-600 px-2 w-full text-center truncate">
                {formatRupiah(activeData ? activeData.value : totalIncome)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
