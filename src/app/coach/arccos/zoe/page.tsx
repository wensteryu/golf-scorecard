'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/card';

// --- Helpers ---

function sgColor(value: number): string {
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-golf-red';
  return 'text-golf-gray-500';
}

function formatSG(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return '0.0';
}

// --- Data ---

const SG = { total: 3.9, driving: 4.5, approach: -0.5, short: 0.2, putting: -0.2 };
const SG_TREND = { total: 7.9, driving: 3.7, approach: 1.5, short: 3.3, putting: -0.4 };
const SG_PRIOR = { driving: 0.8, approach: -2.0, short: -3.1, putting: 0.2 };

const SCORING_BY_PAR = [
  { type: 'Par 3s', avg: 3.1, sg: 0.1 },
  { type: 'Par 4s', avg: 4.3, sg: 0.1 },
  { type: 'Par 5s', avg: 4.4, sg: 0.5 },
];

const SCORING_BREAKDOWN = [
  { label: 'Birdies', player: 3.3, hcp: 2.2 },
  { label: 'Pars', player: 8.9, hcp: 10.5 },
  { label: 'Bogeys', player: 5.0, hcp: 4.6 },
  { label: 'Double+', player: 0.8, hcp: 0.7 },
];

const TOP_AREAS = [
  { rank: 1, category: 'Approach Game', sg: -1.9, desc: 'Shots from the fairway' },
  { rank: 2, category: 'Approach Game', sg: -1.7, desc: '100-150 yard approach shots' },
  { rank: 3, category: 'Putting Game', sg: -0.9, desc: '0-10 ft putts' },
];

const DRIVING_DVA = [
  { label: 'Distance', sg: 1.1 },
  { label: 'Accuracy', sg: 3.5 },
  { label: 'Penalties', sg: -0.1 },
];

const DRIVING_ACCURACY = [
  { dir: 'Missed Left', pct: '19%', sg: -0.1, shots: 2.6 },
  { dir: 'Hit Fairway', pct: '71%', sg: 4.6, shots: 9.9 },
  { dir: 'Missed Right', pct: '10%', sg: -0.1, shots: 1.4 },
];

const DRIVING_BY_LENGTH = [
  { range: '0-350 yds', sg: 1.7, shots: 6.2 },
  { range: '350-400 yds', sg: 1.3, shots: 3.3 },
  { range: '400-450 yds', sg: 1.2, shots: 2.3 },
  { range: '450+ yds', sg: 0.3, shots: 2.2 },
];

const DRIVING_BY_SHAPE = [
  { shape: 'Dogleg Left', sg: 0.6, shots: 1.9 },
  { shape: 'Straight', sg: 2.4, shots: 9.5 },
  { shape: 'Dogleg Right', sg: 1.4, shots: 2.5 },
];

const APPROACH_BY_DISTANCE = [
  { range: '50-100 yds', sg: 0.4, shots: 5.2 },
  { range: '100-150 yds', sg: -1.7, shots: 7.8 },
  { range: '150-200 yds', sg: 0.6, shots: 2.7 },
  { range: '200+ yds', sg: 0.1, shots: 3.5 },
];

const APPROACH_BY_TERRAIN = [
  { terrain: 'Tee (Par 3s)', sg: 0.4, shots: 4 },
  { terrain: 'Fairway', sg: -1.9, shots: 10.7 },
  { terrain: 'Rough', sg: 1.1, shots: 4.2 },
  { terrain: 'Sand', sg: -0.1, shots: 0.2 },
];

const GIR_MISSES = [
  { dir: 'Short', count: 2.7, pct: '14%' },
  { dir: 'Long', count: 1.7, pct: '10%' },
  { dir: 'Right', count: 1.4, pct: '8%' },
  { dir: 'Left', count: 0.5, pct: '3%' },
];

const CHIPPING = {
  short: { sg: -0.1, missedGreens: '5%', missedGreensHcp: '4%', distToPin: '4 yds', distToPinHcp: '4 yds', upDown: '33%', upDownHcp: '57%' },
  long: { sg: 0.2, missedGreens: '17%', missedGreensHcp: '11%', distToPin: '7 yds', distToPinHcp: '7 yds', upDown: '24%', upDownHcp: '35%' },
};

const SAND = {
  short: { sg: 0.2, missedGreens: '0%', missedGreensHcp: '11%', distToPin: '4 yds', distToPinHcp: '6 yds', upDown: '0%', upDownHcp: '39%' },
  long: { sg: -0.2, missedGreens: '100%', missedGreensHcp: '17%', distToPin: '15 yds', distToPinHcp: '8 yds', upDown: '0%', upDownHcp: '27%' },
};

const PUTTING_BY_LENGTH = [
  { range: '0-10 ft', sg: -0.9, putts: 17.4 },
  { range: '10-25 ft', sg: 0.0, putts: 7.4 },
  { range: '25-50 ft', sg: 0.5, putts: 6.4 },
];

const PUTTS_PER_ROUND = [
  { label: '1-Putts', player: 2.5, hcp: 5.2 },
  { label: '2-Putts', player: 14.6, hcp: 11.5 },
  { label: '3-Putts+', player: 0.9, hcp: 1.3 },
];

const STRENGTHS = [
  { title: 'Driving accuracy', desc: '71% fairway hit rate, +3.5 SG accuracy' },
  { title: 'Distance off the tee', desc: '231 yards avg, 18 yards longer than scratch' },
  { title: 'GIR', desc: '65% vs 56% for scratch — hitting more greens than a 0 HCP' },
  { title: 'Par 5 scoring', desc: '+0.5 SG per hole, best scoring category' },
  { title: 'Birdies', desc: '3.3 per round, well above scratch (2.2)' },
  { title: 'Long putts', desc: '+0.5 SG on 25-50 ft putts (great lag putting)' },
];

const IMPROVEMENTS = [
  { title: '100-150 yard approaches', desc: '-1.7 SG — biggest single weakness' },
  { title: 'Fairway approach shots', desc: '-1.9 SG — losing strokes from the best lie' },
  { title: '0-10 ft putts', desc: '-0.9 SG — missing makeable putts' },
  { title: '1-Putts', desc: 'Only 2.5 per round vs 5.2 for scratch' },
  { title: 'Up & Down %', desc: '33% (0-25 yds) vs 57% for scratch — scrambling needs work' },
  { title: 'All approaches proximity', desc: '57ft vs 44ft — approach dispersion is wide' },
];

// --- Reusable sub-components ---

function StatTile({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <Card>
      <CardBody className={`text-center py-3 ${className ?? ''}`}>
        <p className="text-2xl font-extrabold text-golf-gray-500">{value}</p>
        <p className="text-xs font-bold text-golf-gray-300 uppercase">{label}</p>
      </CardBody>
    </Card>
  );
}

function SGTile({ value, label }: { value: number; label: string }) {
  return (
    <Card>
      <CardBody className="text-center py-3">
        <p className={`text-2xl font-extrabold ${sgColor(value)}`}>{formatSG(value)}</p>
        <p className="text-xs font-bold text-golf-gray-300 uppercase">{label}</p>
      </CardBody>
    </Card>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-golf-gray-400 uppercase tracking-wide mb-3">
      {children}
    </h2>
  );
}

function ListRow({ label, value, valueColor, sub }: { label: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-golf-gray-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${valueColor ?? 'text-golf-gray-500'}`}>{value}</span>
        {sub && <span className="text-xs text-golf-gray-300 ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

function HeadlineStat({ sg, label, trend, prior }: { sg: number; label: string; trend: number; prior: number }) {
  const improving = trend > 0;
  return (
    <Card>
      <CardBody className="py-4">
        <div className="flex items-baseline gap-3">
          <p className={`text-3xl font-extrabold ${sgColor(sg)}`}>{formatSG(sg)}</p>
          <p className="text-sm font-bold text-golf-gray-400">SG {label}</p>
        </div>
        <p className={`text-xs mt-1 ${improving ? 'text-emerald-600' : 'text-golf-red'}`}>
          {improving ? `Improved by ${trend.toFixed(1)}` : `Declined by ${Math.abs(trend).toFixed(1)}`}
          <span className="text-golf-gray-300"> (prior avg: {formatSG(prior)})</span>
        </p>
      </CardBody>
    </Card>
  );
}

function ShortGameCard({ title, short, long }: { title: string; short: typeof CHIPPING.short; long: typeof CHIPPING.long }) {
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          {[{ data: short, label: '0-25 Yards' }, { data: long, label: '25-50 Yards' }].map((col) => (
            <div key={col.label}>
              <p className="text-xs font-bold text-golf-gray-400 uppercase mb-2">{col.label}</p>
              <p className={`text-lg font-extrabold mb-2 ${sgColor(col.data.sg)}`}>{formatSG(col.data.sg)} SG</p>
              <div className="space-y-1.5 text-xs text-golf-gray-400">
                <div className="flex justify-between">
                  <span>Missed Greens</span>
                  <span className="font-bold text-golf-gray-500">{col.data.missedGreens} <span className="font-normal text-golf-gray-300">({col.data.missedGreensHcp})</span></span>
                </div>
                <div className="flex justify-between">
                  <span>Dist. to Pin</span>
                  <span className="font-bold text-golf-gray-500">{col.data.distToPin} <span className="font-normal text-golf-gray-300">({col.data.distToPinHcp})</span></span>
                </div>
                <div className="flex justify-between">
                  <span>Up &amp; Down</span>
                  <span className="font-bold text-golf-gray-500">{col.data.upDown} <span className="font-normal text-golf-gray-300">({col.data.upDownHcp})</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// --- Page ---

export default function ZoeArccosStatsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-golf-gray-50">
      {/* Header */}
      <div className="bg-surface border-b border-golf-gray-100 px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.push('/coach')}
            className="text-sm font-bold text-golf-gray-400 hover:text-golf-gray-500 min-h-[44px] flex items-center cursor-pointer mb-2"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-extrabold text-golf-gray-500">
            Zoe Yu — Arccos Stats
          </h1>
          <p className="text-sm text-golf-gray-400">
            Benchmark: 0 HCP / 10 Round Avg &middot; April 3, 2026
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        {/* 1. Overall Strokes Gained */}
        <section>
          <SectionHeader>Overall Strokes Gained</SectionHeader>
          <Card className="mb-3">
            <CardBody className="py-4">
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-extrabold text-emerald-600">+3.9</p>
                <p className="text-sm font-bold text-golf-gray-400">SG / Round</p>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Improved by 7.9 strokes over last 10 rounds
              </p>
            </CardBody>
          </Card>
          <div className="grid grid-cols-4 gap-3">
            <SGTile value={SG.driving} label="Driving" />
            <SGTile value={SG.approach} label="Approach" />
            <SGTile value={SG.short} label="Short" />
            <SGTile value={SG.putting} label="Putting" />
          </div>
        </section>

        {/* 2. Scoring */}
        <section>
          <SectionHeader>Scoring</SectionHeader>
          <Card className="mb-3">
            <CardHeader>Scoring by Par</CardHeader>
            <CardBody>
              {SCORING_BY_PAR.map((row) => (
                <ListRow
                  key={row.type}
                  label={row.type}
                  value={`${row.avg} avg`}
                  sub={`(${formatSG(row.sg)} SG/hole)`}
                  valueColor={sgColor(row.sg)}
                />
              ))}
            </CardBody>
          </Card>
          <div className="grid grid-cols-4 gap-3">
            {SCORING_BREAKDOWN.map((s) => (
              <Card key={s.label}>
                <CardBody className="text-center py-3">
                  <p className="text-lg font-extrabold text-golf-gray-500">{s.player}</p>
                  <p className="text-xs font-bold text-golf-gray-300 uppercase">{s.label}</p>
                  <p className="text-[10px] text-golf-gray-300 mt-0.5">vs {s.hcp}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* 3. Top Areas to Work On */}
        <section>
          <SectionHeader>Areas to Work On</SectionHeader>
          <div className="flex flex-col gap-3">
            {TOP_AREAS.map((a) => (
              <Card key={a.rank}>
                <CardBody className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-golf-red/15 text-golf-red text-sm font-extrabold flex items-center justify-center">
                      {a.rank}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-golf-gray-500">
                        {a.category} <span className="text-golf-red font-extrabold">{formatSG(a.sg)} SG</span>
                      </p>
                      <p className="text-xs text-golf-gray-400 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* 4. Driving Game */}
        <section>
          <SectionHeader>Driving Game</SectionHeader>
          <HeadlineStat sg={SG.driving} label="Driving" trend={SG_TREND.driving} prior={SG_PRIOR.driving} />

          <div className="grid grid-cols-3 gap-3 mt-3">
            {DRIVING_DVA.map((d) => (
              <SGTile key={d.label} value={d.sg} label={d.label} />
            ))}
          </div>

          <Card className="mt-3">
            <CardHeader>Driving Accuracy — 71% Fairways</CardHeader>
            <CardBody>
              {DRIVING_ACCURACY.map((row) => (
                <div
                  key={row.dir}
                  className={`flex items-center justify-between py-2 ${row.dir === 'Hit Fairway' ? 'bg-emerald-50 rounded-lg px-2 -mx-2' : ''}`}
                >
                  <span className="text-sm text-golf-gray-400">{row.dir}</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${sgColor(row.sg)}`}>{row.pct}</span>
                    <span className="text-xs text-golf-gray-300 ml-1.5">({formatSG(row.sg)} SG, {row.shots} shots)</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="mt-3">
            <StatTile value="231 yds" label="Avg Distance (0 HCP: 213)" />
          </div>

          <Card className="mt-3">
            <CardHeader>By Hole Length</CardHeader>
            <CardBody>
              {DRIVING_BY_LENGTH.map((row) => (
                <ListRow key={row.range} label={row.range} value={formatSG(row.sg)} valueColor={sgColor(row.sg)} sub={`(${row.shots} shots)`} />
              ))}
            </CardBody>
          </Card>

          <Card className="mt-3">
            <CardHeader>By Hole Shape</CardHeader>
            <CardBody>
              {DRIVING_BY_SHAPE.map((row) => (
                <ListRow key={row.shape} label={row.shape} value={formatSG(row.sg)} valueColor={sgColor(row.sg)} sub={`(${row.shots} shots)`} />
              ))}
            </CardBody>
          </Card>
        </section>

        {/* 5. Approach Game */}
        <section>
          <SectionHeader>Approach Game</SectionHeader>
          <HeadlineStat sg={SG.approach} label="Approach" trend={SG_TREND.approach} prior={SG_PRIOR.approach} />

          <Card className="mt-3">
            <CardHeader>By Pin Distance</CardHeader>
            <CardBody>
              {APPROACH_BY_DISTANCE.map((row) => (
                <ListRow key={row.range} label={row.range} value={formatSG(row.sg)} valueColor={sgColor(row.sg)} sub={`(${row.shots} shots)`} />
              ))}
            </CardBody>
          </Card>

          <Card className="mt-3">
            <CardHeader>By Terrain</CardHeader>
            <CardBody>
              {APPROACH_BY_TERRAIN.map((row) => (
                <ListRow key={row.terrain} label={row.terrain} value={formatSG(row.sg)} valueColor={sgColor(row.sg)} sub={`(${row.shots} shots)`} />
              ))}
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-2xl font-extrabold text-emerald-600">65%</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">GIR</p>
                <p className="text-[10px] text-golf-gray-300 mt-0.5">0 HCP: 56%</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-3">
                <p className="text-2xl font-extrabold text-golf-red">57ft</p>
                <p className="text-xs font-bold text-golf-gray-300 uppercase">All Approaches</p>
                <p className="text-[10px] text-golf-gray-300 mt-0.5">0 HCP: 44ft</p>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-3">
            <CardHeader>GIR Miss Breakdown</CardHeader>
            <CardBody>
              {GIR_MISSES.map((row) => (
                <ListRow key={row.dir} label={row.dir} value={`${row.count}`} sub={`(${row.pct})`} />
              ))}
            </CardBody>
          </Card>

          <Card className="mt-3">
            <CardHeader>Proximity to Pin</CardHeader>
            <CardBody>
              <ListRow label="GIR Approaches" value="22ft" sub="(0 HCP: 26ft)" valueColor="text-emerald-600" />
              <ListRow label="All Approaches" value="57ft" sub="(0 HCP: 44ft)" valueColor="text-golf-red" />
            </CardBody>
          </Card>
        </section>

        {/* 6. Short Game */}
        <section>
          <SectionHeader>Short Game</SectionHeader>
          <HeadlineStat sg={SG.short} label="Short Game" trend={SG_TREND.short} prior={SG_PRIOR.short} />
          <div className="mt-3">
            <ShortGameCard title="Chipping" short={CHIPPING.short} long={CHIPPING.long} />
          </div>
          <div className="mt-3">
            <ShortGameCard title="Sand Shots" short={SAND.short} long={SAND.long} />
          </div>
        </section>

        {/* 7. Putting Game */}
        <section>
          <SectionHeader>Putting Game</SectionHeader>
          <HeadlineStat sg={SG.putting} label="Putting" trend={SG_TREND.putting} prior={SG_PRIOR.putting} />

          <Card className="mt-3">
            <CardHeader>By 1st Putt Length</CardHeader>
            <CardBody>
              {PUTTING_BY_LENGTH.map((row) => (
                <ListRow key={row.range} label={row.range} value={formatSG(row.sg)} valueColor={sgColor(row.sg)} sub={`(${row.putts} putts)`} />
              ))}
            </CardBody>
          </Card>

          <div className="grid grid-cols-3 gap-3 mt-3">
            {PUTTS_PER_ROUND.map((s) => (
              <Card key={s.label}>
                <CardBody className="text-center py-3">
                  <p className="text-lg font-extrabold text-golf-gray-500">{s.player}</p>
                  <p className="text-xs font-bold text-golf-gray-300 uppercase">{s.label}</p>
                  <p className="text-[10px] text-golf-gray-300 mt-0.5">vs {s.hcp}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card className="mt-3">
            <CardHeader>Putting Averages</CardHeader>
            <CardBody>
              <ListRow label="Putts / Hole" value="1.7" sub="(0 HCP: 1.7)" />
              <ListRow label="Putts / GIR" value="1.8" sub="(0 HCP: 1.9)" valueColor="text-emerald-600" />
            </CardBody>
          </Card>
        </section>

        {/* 8. Key Strengths */}
        <section>
          <SectionHeader>Key Strengths</SectionHeader>
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3">
                {STRENGTHS.map((s) => (
                  <div key={s.title}>
                    <p className="text-sm font-bold text-emerald-600">{s.title}</p>
                    <p className="text-xs text-golf-gray-400">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>

        {/* 9. Areas for Improvement */}
        <section>
          <SectionHeader>Areas for Improvement</SectionHeader>
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3">
                {IMPROVEMENTS.map((s) => (
                  <div key={s.title}>
                    <p className="text-sm font-bold text-golf-red">{s.title}</p>
                    <p className="text-xs text-golf-gray-400">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>

      </div>
    </div>
  );
}
