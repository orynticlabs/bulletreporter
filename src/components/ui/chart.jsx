// Converted version of your Recharts utility components to pure JSX (no TypeScript)
import React, { createContext, useContext } from "react"
import {
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts"
import { cn } from "../../lib/utils"

// Context to pass chart config
const ChartContext = createContext({})

export function useChart() {
  return useContext(ChartContext)
}

export function ChartContainer({ config, className, children, ...props }) {
  return (
    <ChartContext.Provider value={config}>
      <div
        role="figure"
        className={cn("relative h-full w-full overflow-auto", className)}
        {...props}
      >
        <ChartStyle config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ config }) {
  return (
    <style>
      {`
        :root {
          ${Object.entries(config)
            .map(([key, value]) => {
              const light = value.theme?.light || value.color
              const dark = value.theme?.dark || light
              return `--color-${key}: ${light}; @media (prefers-color-scheme: dark) { --color-${key}: ${dark}; }`
            })
            .join("\n")}
        }
      `}
    </style>
  )
}

export const ChartTooltip = RechartsTooltip

export function ChartTooltipContent({ label, payload, labelFormatter, valueFormatter }) {
  if (!payload?.length) return null

  return (
    <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-sm">
      <div className="text-[0.6rem] font-medium text-muted-foreground">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="grid gap-1">
        {payload.map((entry, index) => {
          const config = getPayloadConfigFromPayload(entry)
          const value = valueFormatter ? valueFormatter(entry.value, entry.name) : entry.value
          return (
            <div key={index} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="truncate text-xs font-medium text-muted-foreground">
                {config?.label ?? entry.name}
              </span>
              <span className="ml-auto text-xs font-medium">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ChartLegend = RechartsLegend

export function ChartLegendContent({ payload, className }) {
  if (!payload?.length) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-4 text-sm", className)}>
      {payload.map((entry, index) => {
        const config = getPayloadConfigFromPayload(entry)
        return (
          <div key={index} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                entry.type === "line" && "rounded-none",
                entry.type === "cross" && "rounded-sm",
                entry.type === "diamond" && "rotate-45",
                entry.type === "square" && "rounded-sm",
                entry.type === "star" && "rotate-45",
                entry.type === "triangle" && "rotate-45"
              )}
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {config?.label ?? entry.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function getPayloadConfigFromPayload(entry) {
  const config = useChart()
  if (!entry?.dataKey || !config) return null
  return config[entry.dataKey] || null
}