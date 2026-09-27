'use client';

import { useMemo, useState } from 'react';
import { RoundType, Scorecard } from '@/lib/types';
import { aggregateStats } from '@/lib/stats';
import { Card, CardBody } from '@/components/ui/card';

const ROUND_TYPES: { value: RoundType; label: string }[] = [
  { value: 'tournament', label: 'Tournament' },
  { value: 'practice', label: 'Practice' },
];

const fmt = (n: number | null, digits = 1) => (n === null ? '–' : n.toFixed(digits));
const fmtPct = (n: number | null) => (n === null ? '–' : `${Math.round(n)}%`);
const fmtToPar = (n: number | null) => {
  if (n === null) return '–';
  const r = Math.round(n * 10) / 10;
  return r === 0 ? 'E' : `${r > 0 ? '+' : ''}${r.toFixed(1)}`;
};

function Tile({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <Card>
      <CardBody className="text-center py-3 px-1">
        <p className="text-2xl font-extrabold text-golf-gray-500">{value}</p>
        <p className="text-[11px] leading-tight font-bold text-golf-gray-300 uppercase">{label}</p>
        {sub && <p className="text-[11px] whitespace-nowrap text-golf-gray-300 mt-0.5">{sub}</p>}
      </CardBody>
    </Card>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-golf-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

export function StatsPanel({ scorecards }: { scorecards: Scorecard[] }) {
  const [type, setType] = useState<RoundType>('tournament');
  const stats = useMemo(() => aggregateStats(scorecards, type), [scorecards, type]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-3" role="radiogroup" aria-label="Round type">
        {ROUND_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={[
              'flex-1 py-3 rounded-xl font-bold text-base transition-all cursor-pointer',
              type === t.value
                ? 'bg-golf-green text-white border-b-3 border-golf-green-dark'
                : 'bg-golf-gray-100 text-golf-gray-400 border-b-3 border-golf-gray-200 hover:bg-golf-gray-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!stats ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-golf-gray-400 font-semibold">No finished {type} rounds yet.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <p className="text-sm font-semibold text-golf-gray-400">
            Based on {stats.rounds} {type} round{stats.rounds !== 1 ? 's' : ''}
            {stats.rounds9 > 0 && stats.rounds18 > 0 && ` (${stats.rounds18} × 18, ${stats.rounds9} × 9)`}
            <span className="block text-xs text-golf-gray-300">Counts are per 18 holes.</span>
          </p>

          <Group title="Scoring">
            <Tile value={fmt(stats.scoringAvg18)} label="18H Avg" />
            <Tile value={fmtToPar(stats.toParAvg18)} label="To Par" />
            <Tile value={stats.best18 === null ? '–' : String(stats.best18)} label="18H Best" />
            <Tile value={fmt(stats.scoringAvg9)} label="9H Avg" />
            <Tile value={fmt(stats.birdiesPer18)} label="Birdies+" />
            <Tile value={fmt(stats.doublesPer18)} label="Doubles+" />
          </Group>

          <Group title="Par Averages">
            <Tile value={fmt(stats.par3Avg, 2)} label="Par 3" />
            <Tile value={fmt(stats.par4Avg, 2)} label="Par 4" />
            <Tile value={fmt(stats.par5Avg, 2)} label="Par 5" />
          </Group>

          <Group title="Tee to Green">
            <Tile
              value={fmtPct(stats.fairwayPct)}
              label="Fairways"
              sub={stats.fairwayPct === null ? undefined : `L ${fmtPct(stats.missLeftPct)} R ${fmtPct(stats.missRightPct)}`}
            />
            <Tile value={fmtPct(stats.girPct)} label="GIR" />
            <Tile value={fmt(stats.penaltiesPer18)} label="Penalties" />
          </Group>

          <Group title="Short Game & Putting">
            <Tile value={fmtPct(stats.upAndDownPct)} label="Up/Down" />
            <Tile value={fmt(stats.hundredYardsInPer18)} label="100 Yds In" />
            <Tile value={fmt(stats.puttsPer18)} label="Putts" />
            <Tile value={fmt(stats.puttsPerGir, 2)} label="Putts/GIR" />
            <Tile value={fmt(stats.onePuttsPer18)} label="1-Putts" />
            <Tile value={fmt(stats.threePuttsPer18)} label="3-Putts" />
          </Group>
        </>
      )}
    </section>
  );
}
