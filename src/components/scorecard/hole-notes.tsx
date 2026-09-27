import { HoleScore } from '@/lib/types';

const hasText = (s: string | null | undefined) => (s ?? '').trim().length > 0;

/** Per-hole coach and student notes, in hole order. Renders nothing when there are none. */
export function HoleNotes({ holes, className = 'mx-4 mb-2' }: { holes: HoleScore[]; className?: string }) {
  const withNotes = holes.filter((h) => hasText(h.coach_note) || hasText(h.student_note));
  if (withNotes.length === 0) return null;

  return (
    <>
      {withNotes.map((h) => (
        <div key={`notes-${h.hole_number}`} className={`${className} flex flex-col gap-2`}>
          {hasText(h.student_note) && (
            <div className="px-3 py-2 rounded-lg bg-golf-green/10 border border-golf-green/20">
              <p className="text-xs font-bold text-golf-green">Hole {h.hole_number} - My Note</p>
              <p className="text-sm text-golf-gray-500 mt-0.5 whitespace-pre-line">{h.student_note}</p>
            </div>
          )}
          {hasText(h.coach_note) && (
            <div className="px-3 py-2 rounded-lg bg-golf-blue/10 border border-golf-blue/20">
              <p className="text-xs font-bold text-golf-blue">Hole {h.hole_number} - Coach Note</p>
              <p className="text-sm text-golf-gray-500 mt-0.5">{h.coach_note}</p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
