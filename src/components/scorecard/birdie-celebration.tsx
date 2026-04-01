'use client';

type CelebrationType = 'birdie' | 'eagle' | 'hole-in-one';

interface BirdieCelebrationProps {
  type: CelebrationType | null;
}

const CELEBRATION_CONFIG: Record<
  CelebrationType,
  {
    label: string;
    labelColor: string;
    dragonCount: number;
    dragonSize: string;
    particleEmojis: string[];
  }
> = {
  birdie: {
    label: 'Birdie!',
    labelColor: 'text-emerald-600',
    dragonCount: 1,
    dragonSize: 'h-20 w-20',
    particleEmojis: ['⭐', '✨', '⭐', '✨'],
  },
  eagle: {
    label: 'Eagle!',
    labelColor: 'text-amber-600',
    dragonCount: 2,
    dragonSize: 'h-24 w-24',
    particleEmojis: ['⭐', '🔥', '✨', '⭐', '🔥', '✨'],
  },
  'hole-in-one': {
    label: 'HOLE IN ONE!',
    labelColor: 'text-red-600',
    dragonCount: 3,
    dragonSize: 'h-28 w-28',
    particleEmojis: ['🏆', '🔥', '✨', '🌟', '🎉', '🔥', '✨', '🏆'],
  },
};

// Burst directions for particles — distributed radially
function getBurstPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const distance = 80 + Math.random() * 40;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    'bg-golf-green',
    'bg-golf-blue',
    'bg-golf-orange',
    'bg-golf-red',
    'bg-golf-purple',
    'bg-yellow-400',
  ];
  const color = colors[index % colors.length];
  const left = `${(index * 13 + 5) % 100}%`;
  const delay = `${(index * 0.25) % 2}s`;
  const size = index % 2 === 0 ? 'w-2 h-2' : 'w-3 h-1.5';

  return (
    <div
      className={`absolute top-0 rounded-sm animate-confetti ${color} ${size}`}
      style={{ left, animationDelay: delay }}
    />
  );
}

export function BirdieCelebration({ type }: BirdieCelebrationProps) {
  if (!type) return null;

  const config = CELEBRATION_CONFIG[type];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Screen flash for hole-in-one */}
      {type === 'hole-in-one' && (
        <div className="absolute inset-0 bg-yellow-300 animate-screen-flash" />
      )}

      {/* Confetti for hole-in-one */}
      {type === 'hole-in-one' && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 16 }, (_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      {/* Central dragon(s) */}
      <div className="relative flex flex-col items-center">
        <div className="flex items-center gap-2 animate-emoji-pop">
          {Array.from({ length: config.dragonCount }, (_, i) => (
            <img
              key={i}
              src="/logo.png"
              alt="Dragon"
              className={`${config.dragonSize} object-contain ${i % 2 === 1 ? '-scale-x-100' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Label */}
        <div
          className={`mt-3 text-2xl font-extrabold animate-label-slide-up ${config.labelColor}`}
          style={{ textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}
        >
          {config.label}
        </div>

        {/* Particle burst */}
        {config.particleEmojis.map((particle, i) => {
          const pos = getBurstPosition(i, config.particleEmojis.length);
          return (
            <div
              key={i}
              className="absolute text-2xl animate-emoji-burst"
              style={{
                '--burst-x': `${pos.x}px`,
                '--burst-y': `${pos.y}px`,
                animationDelay: `${0.1 + i * 0.05}s`,
              } as React.CSSProperties}
            >
              {particle}
            </div>
          );
        })}
      </div>
    </div>
  );
}
