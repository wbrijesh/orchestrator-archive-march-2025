"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
const chartData = [
  { product: "Orchestrator", accuracy: 89 },
  { product: "Runner H 0.1", accuracy: 50 },
  { product: "Computer Use", accuracy: 52 },
  { product: "Web Voyager", accuracy: 57 },
  { product: "Browser Use", accuracy: 61 },
  { product: "Operator", accuracy: 63 },
];

const chartConfig = {};

// Define custom colors for each bar
const barColors = [
  "#fa5f11",
  "#555555",
  "#555555",
  "#555555",
  "#555555",
  "#555555",
];
export default function Benchmark() {
  return (
    <div className="mx-auto max-w-4xl w-full">
      <Card className="mx-5">
        <CardHeader>
          <CardTitle className="text-2xl">Web Agent Accuracy</CardTitle>
          <CardDescription>
            Data presented in this chart is based on the latest available
            information as of March 2023.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                left: 20,
                right: 20,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="#999999"
                strokeDasharray="6 6"
              />
              <XAxis
                dataKey="product"
                tickLine={false}
                tickMargin={10}
                axisLine={{ stroke: "#cccccc" }}
                tick={{ fill: "#777777" }}
              />
              <YAxis
                domain={[30, 100]}
                ticks={[30, 40, 50, 60, 70, 80, 90, 100]}
                tickFormatter={(value) => `${value}%`}
                axisLine={{ stroke: "#cccccc" }}
                tick={{ fill: "#777777" }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="accuracy" radius={5} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[index % barColors.length]}
                  />
                ))}
                <LabelList
                  position="insideTop"
                  offset={8}
                  className="fill-white text-[16px]"
                  fontSize={12}
                  formatter={(value) => `${value}%`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
