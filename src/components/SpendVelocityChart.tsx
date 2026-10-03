import React, { useState } from 'react';
import { DailySpendPoint, MonthlyStats } from '../utils/financeCalculations';
import { formatCurrency } from '../utils/formatters';
import { Activity, Info, Zap } from 'lucide-react';

interface SpendVelocityChartProps {
  points: DailySpendPoint[];
  stats: MonthlyStats;
  monthName: string;
}

export const SpendVelocityChart: React.FC<SpendVelocityChartProps> = ({
  points,
  stats,
  monthName,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailySpendPoint | null>(null);

  if (!points || points.length === 0) return null;

  // Zero-data state: do not draw fake burn-down curves for fresh users
  if (stats.totalExpenses === 0 && stats.totalBudgetedExpenses === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-white">Spend Velocity & Burn-Down Curve</h3>
        </div>
        <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 text-center space-y-1">
          <p className="text-xs font-bold text-slate-300">No spending activity recorded yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            As you log expenses for {monthName}, your daily burn rate and trajectory will be visualized here against your budget.
          </p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(
    stats.totalBudgetedExpenses * 1.15,
    stats.projectedEndMonthSpend * 1.15,
    1000
  );

  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (day: number) => {
    return padding.left + ((day - 1) / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxVal) * innerHeight;
  };

  // Generate SVG path for Ideal Budget Line
  const idealPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.idealCumulative)}`)
    .join(' ');

  // Generate SVG path for Actual Cumulative Spend
  const actualPoints = points.filter((p) => p.cumulativeActual !== null);
  const actualPath = actualPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.cumulativeActual!)}`)
    .join(' ');

  // Generate SVG path for Projected Spend (connecting from last actual point to end of month)
  const lastActual = actualPoints[actualPoints.length - 1];
  const projectedPoints = points.filter((p) => p.projectedCumulative !== undefined);
  const projectedPath =
    lastActual && projectedPoints.length > 0
      ? `M ${getX(lastActual.day)} ${getY(lastActual.cumulativeActual!)} ` +
        projectedPoints.map((p) => `L ${getX(p.day)} ${getY(p.projectedCumulative!)}`).join(' ')
      : '';

  // Area under actual line
  const actualArea =
    actualPoints.length > 0
      ? `${actualPath} L ${getX(lastActual.day)} ${getY(0)} L ${getX(1)} ${getY(0)} Z`
      : '';

  const isUnderIdeal = (lastActual?.cumulativeActual || 0) <= (lastActual?.idealCumulative || 0);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Spend Velocity & Burn-Down Curve</span>
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isUnderIdeal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {isUnderIdeal ? 'Burn Pacing Safe' : 'Burn Above Target'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares your daily spending trajectory against ideal linear pacing for {monthName}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 rounded-full" />
            <span className="text-slate-300">Actual Spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-500 stroke-dasharray rounded-full" />
            <span>Ideal Pacing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-400 stroke-dasharray rounded-full" />
            <span>AI Projected</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[600px] select-none"
        >
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="budgetLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const yVal = maxVal * ratio;
            const y = getY(yVal);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? 'none' : '4 4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ₹{Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Budget Limit line */}
          {stats.totalBudgetedExpenses > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(stats.totalBudgetedExpenses)}
                x2={width - padding.right}
                y2={getY(stats.totalBudgetedExpenses)}
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="6 4"
                opacity="0.6"
              />
              <text
                x={width - padding.right}
                y={getY(stats.totalBudgetedExpenses) - 6}
                fill="#f87171"
                fontSize="10"
                textAnchor="end"
                fontWeight="600"
              >
                Monthly Cap {formatCurrency(stats.totalBudgetedExpenses)}
              </text>
            </g>
          )}

          {/* Ideal pacing line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Projected trajectory line */}
          {projectedPath && (
            <path
              d={projectedPath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* Actual spend area fill */}
          {actualArea && <path d={actualArea} fill="url(#actualGradient)" />}

          {/* Actual spend line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Day markers and interaction zones */}
          {points.map((p) => {
            const x = getX(p.day);
            const isHovered = hoveredPoint?.day === p.day;
            const hasActual = p.cumulativeActual !== null;

            return (
              <g
                key={p.day}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Day label on X axis */}
                {(p.day === 1 || p.day === 5 || p.day === 10 || p.day === 15 || p.day === 20 || p.day === 25 || p.day === points.length) && (
                  <text
                    x={x}
                    y={height - padding.bottom + 18}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    Day {p.day}
                  </text>
                )}

                {/* Node circle on actual line */}
                {hasActual && (
                  <circle
                    cx={x}
                    cy={getY(p.cumulativeActual!)}
                    r={isHovered ? 5 : p.actualDaily > 50 ? 3.5 : 2}
                    fill={p.actualDaily > 50 ? '#34d399' : '#10b981'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* Node on projected line */}
                {p.projectedCumulative && isHovered && (
                  <circle
                    cx={x}
                    cy={getY(p.projectedCumulative)}
                    r="4"
                    fill="#c084fc"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* Invisible wide hit target for hover */}
                <rect
                  x={x - (innerWidth / points.length) / 2}
                  y={padding.top}
                  width={innerWidth / points.length}
                  height={innerHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs text-white min-w-[180px]"
            style={{
              left: `${Math.min(
                Math.max(10, ((hoveredPoint.day - 1) / (points.length - 1)) * 100),
                75
              )}%`,
              top: '10px',
            }}
          >
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
              <span>Day {hoveredPoint.day} ({hoveredPoint.dateStr})</span>
            </div>
            {hoveredPoint.cumulativeActual !== null ? (
              <>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Day's Spend:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(hoveredPoint.actualDaily)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(hoveredPoint.cumulativeActual)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Ideal Benchmark:</span>
                  <span className="text-slate-300">
                    {formatCurrency(hoveredPoint.idealCumulative)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Projected Run:</span>
                  <span className="font-semibold text-purple-400">
                    {formatCurrency(hoveredPoint.projectedCumulative || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Ideal Target:</span>
                  <span className="text-slate-300">
                    {formatCurrency(hoveredPoint.idealCumulative)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>
            Daily burn rate: <strong>{formatCurrency(stats.avgDailySpend)}/day</strong>
          </span>
        </div>
        <div>
          Target pace to remain under budget: <strong>{formatCurrency(stats.totalBudgetedExpenses / stats.daysInMonth)}/day</strong>
        </div>
      </div>
    </div>
  );
};
