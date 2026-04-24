export interface ParentScorecardEmailInput {
  event: 'submit' | 'review';
  parentFirstName: string | null;
  studentName: string;
  courseName: string;
  roundDate: string;
  holeScores: Array<{
    hole_number: number;
    par: number;
    score: number | null;
    coach_note?: string | null;
  }>;
  stats: {
    totalScore: number;
    totalPar: number;
    scoreToPar: number;
    front9Score: number;
    front9Par: number;
    back9Score: number;
    back9Par: number;
    fairwaysHit: number;
    fairwaysTotal: number;
    girHit: number;
    girTotal: number;
    totalPutts: number;
    onePutts: number;
    threePutts: number;
  };
  reflections: {
    mentalityRating: number | null;
    whatTranspired: string | null;
    howToRespond: string | null;
  };
  coachFeedback?: string | null;
}

function formatToPar(diff: number): string {
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function formatDate(dateString: string): string {
  // dateString is YYYY-MM-DD
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function mentalityLabel(rating: number): string {
  switch (rating) {
    case 4: return 'Excellent';
    case 3: return 'Good';
    case 2: return 'Average';
    case 1: return 'Poor';
    default: return '';
  }
}

function scoreCellStyle(score: number | null, par: number): string {
  const base = 'padding:6px 0;text-align:center;font-size:14px;font-weight:700;border-bottom:1px solid #e5e7eb;';
  if (score === null) return base + 'color:#9ca3af;';
  const diff = score - par;
  if (diff <= -2) return base + 'background:#fde68a;color:#78350f;'; // Eagle
  if (diff === -1) return base + 'background:#34d399;color:#064e3b;'; // Birdie
  if (diff === 0) return base + 'color:#111827;'; // Par
  if (diff === 1) return base + 'background:#fed7aa;color:#7c2d12;'; // Bogey
  if (diff === 2) return base + 'background:#fdba74;color:#7c2d12;'; // Double
  return base + 'background:#fca5a5;color:#7f1d1d;'; // Triple+
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderScorecardRow(
  label: string,
  holes: Array<{ hole_number: number; par: number; score: number | null }>,
  getValue: (h: { hole_number: number; par: number; score: number | null }) => string,
  getStyle?: (h: { hole_number: number; par: number; score: number | null }) => string,
  rowStyle?: string
): string {
  const cells = holes
    .map((h) => {
      const style = getStyle
        ? getStyle(h)
        : 'padding:6px 0;text-align:center;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;';
      return `<td style="${style}">${getValue(h)}</td>`;
    })
    .join('');
  return `<tr${rowStyle ? ` style="${rowStyle}"` : ''}><td style="padding:6px 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e5e7eb;text-align:left;white-space:nowrap;">${label}</td>${cells}</tr>`;
}

function renderNineTable(
  title: string,
  holes: Array<{ hole_number: number; par: number; score: number | null }>,
  nineScore: number,
  ninePar: number
): string {
  if (holes.length === 0) return '';
  const diff = nineScore - ninePar;
  const toPar = formatToPar(diff);
  const toParColor = diff < 0 ? '#047857' : diff === 0 ? '#111827' : '#b45309';

  const header = `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:20px 0 8px 0;">
    <span style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">${title}</span>
    <span style="font-size:14px;font-weight:700;color:#111827;">${nineScore} <span style="color:${toParColor};font-weight:700;">(${toPar})</span></span>
  </div>`;

  const holeRow = renderScorecardRow(
    'Hole',
    holes,
    (h) => String(h.hole_number),
    () => 'padding:6px 0;text-align:center;font-size:12px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb;background:#f9fafb;'
  );
  const parRow = renderScorecardRow(
    'Par',
    holes,
    (h) => String(h.par)
  );
  const scoreRow = renderScorecardRow(
    'Score',
    holes,
    (h) => (h.score === null ? '—' : String(h.score)),
    (h) => scoreCellStyle(h.score, h.par)
  );

  return `${header}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <tbody>${holeRow}${parRow}${scoreRow}</tbody>
  </table>`;
}

function renderStatsTable(stats: ParentScorecardEmailInput['stats']): string {
  const rows: Array<[string, string]> = [
    ['Fairways hit', `${stats.fairwaysHit} / ${stats.fairwaysTotal || '—'}`],
    ['Greens in regulation', `${stats.girHit} / ${stats.girTotal || '—'}`],
    ['Total putts', String(stats.totalPutts)],
    ['1-Putts', String(stats.onePutts)],
    ['3-Putts or worse', String(stats.threePutts)],
  ];
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 12px;font-size:14px;color:#4b5563;border-bottom:1px solid #e5e7eb;">${label}</td><td style="padding:10px 12px;font-size:14px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #e5e7eb;">${value}</td></tr>`
    )
    .join('');
}

function renderReflections(reflections: ParentScorecardEmailInput['reflections']): string {
  const hasAny =
    reflections.mentalityRating ||
    (reflections.whatTranspired && reflections.whatTranspired.trim().length > 0) ||
    (reflections.howToRespond && reflections.howToRespond.trim().length > 0);
  if (!hasAny) return '';

  const sections: string[] = [];

  if (reflections.mentalityRating) {
    sections.push(
      `<div style="margin-bottom:12px;"><span style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">Mentality</span><div style="margin-top:4px;font-size:15px;color:#111827;">${mentalityLabel(
        reflections.mentalityRating
      )} <span style="color:#6b7280;">(${reflections.mentalityRating}/4)</span></div></div>`
    );
  }
  if (reflections.whatTranspired && reflections.whatTranspired.trim().length > 0) {
    sections.push(
      `<div style="margin-bottom:12px;"><span style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">What transpired</span><div style="margin-top:4px;font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(
        reflections.whatTranspired.trim()
      )}</div></div>`
    );
  }
  if (reflections.howToRespond && reflections.howToRespond.trim().length > 0) {
    sections.push(
      `<div><span style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">How I'll respond</span><div style="margin-top:4px;font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(
        reflections.howToRespond.trim()
      )}</div></div>`
    );
  }

  return sections.join('');
}

function renderCoachFeedback(
  overall: string | null | undefined,
  holeScores: ParentScorecardEmailInput['holeScores']
): string {
  const overallTrimmed = (overall ?? '').trim();
  const notedHoles = holeScores.filter(
    (h) => (h.coach_note ?? '').trim().length > 0
  );
  if (!overallTrimmed && notedHoles.length === 0) return '';

  let html = '';

  if (overallTrimmed) {
    html += `<div style="margin-bottom:16px;"><span style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">Overall</span><blockquote style="margin:6px 0 0 0;padding:12px 16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(
      overallTrimmed
    )}</blockquote></div>`;
  }

  if (notedHoles.length > 0) {
    html += `<div><span style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">Notes by hole</span><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:8px;border-collapse:collapse;">`;
    html += notedHoles
      .map(
        (h) =>
          `<tr><td style="padding:10px 12px;vertical-align:top;width:64px;font-size:13px;font-weight:700;color:#16a34a;border-bottom:1px solid #e5e7eb;white-space:nowrap;">Hole ${h.hole_number}</td><td style="padding:10px 12px;vertical-align:top;font-size:14px;line-height:1.55;color:#111827;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">${escapeHtml(
            (h.coach_note ?? '').trim()
          )}</td></tr>`
      )
      .join('');
    html += `</table></div>`;
  }

  return html;
}

export function buildParentScorecardEmail(
  input: ParentScorecardEmailInput
): { subject: string; html: string } {
  const {
    event,
    parentFirstName,
    studentName,
    courseName,
    roundDate,
    holeScores,
    stats,
    reflections,
    coachFeedback,
  } = input;

  const sorted = [...holeScores].sort((a, b) => a.hole_number - b.hole_number);
  const front = sorted.filter((h) => h.hole_number <= 9);
  const back = sorted.filter((h) => h.hole_number > 9);

  const scoreToParStr = formatToPar(stats.scoreToPar);
  const greetingName = (parentFirstName ?? '').trim() || 'there';
  const dateLabel = formatDate(roundDate);

  const subject =
    event === 'submit'
      ? `${studentName} submitted a round — ${courseName} (${scoreToParStr})`
      : `Coach reviewed ${studentName}'s round — ${courseName} (${scoreToParStr})`;

  const headline = event === 'submit' ? 'New Round Submitted' : 'Coach Review Complete';
  const lede =
    event === 'submit'
      ? `<strong>${escapeHtml(studentName)}</strong> just submitted a round for coach review.`
      : `Coach has reviewed <strong>${escapeHtml(studentName)}</strong>&rsquo;s round and left feedback below.`;

  const scoreToParColor =
    stats.scoreToPar < 0 ? '#047857' : stats.scoreToPar === 0 ? '#111827' : '#b45309';

  const heroCard = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px 0;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
    <tbody>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#6b7280;font-weight:600;">Course</td>
        <td style="padding:14px 16px;font-size:15px;color:#111827;font-weight:700;text-align:right;">${escapeHtml(courseName)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#6b7280;font-weight:600;border-top:1px solid #e5e7eb;">Date</td>
        <td style="padding:14px 16px;font-size:15px;color:#111827;font-weight:700;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(dateLabel)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#6b7280;font-weight:600;border-top:1px solid #e5e7eb;">Score</td>
        <td style="padding:14px 16px;font-size:20px;color:#111827;font-weight:800;text-align:right;border-top:1px solid #e5e7eb;">${stats.totalScore} <span style="font-size:15px;font-weight:700;color:${scoreToParColor};">(${scoreToParStr})</span></td>
      </tr>
    </tbody>
  </table>`;

  const scorecardSection =
    front.length > 0 || back.length > 0
      ? `<div style="margin-top:24px;">
          <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:#111827;">Scorecard</h3>
          ${renderNineTable('Front 9', front, stats.front9Score, stats.front9Par)}
          ${renderNineTable('Back 9', back, stats.back9Score, stats.back9Par)}
          <div style="margin-top:10px;padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:13px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.04em;">Total</span>
            <span style="font-size:18px;font-weight:800;color:#065f46;">${stats.totalScore} <span style="font-size:14px;font-weight:700;">(${scoreToParStr})</span></span>
          </div>
        </div>`
      : '';

  const statsSection = `<div style="margin-top:24px;">
    <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:800;color:#111827;">Key stats</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <tbody>${renderStatsTable(stats)}</tbody>
    </table>
  </div>`;

  const reflectionsHtml = renderReflections(reflections);
  const reflectionsSection = reflectionsHtml
    ? `<div style="margin-top:24px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:800;color:#111827;">${escapeHtml(studentName)}&rsquo;s reflections</h3>
        <div style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${reflectionsHtml}</div>
      </div>`
    : '';

  const coachHtml =
    event === 'review' ? renderCoachFeedback(coachFeedback, holeScores) : '';
  const coachSection = coachHtml
    ? `<div style="margin-top:24px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:800;color:#111827;">Coach feedback</h3>
        <div>${coachHtml}</div>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#16a34a;padding:20px 24px;">
              <div style="color:#dcfce7;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Elite Golf Realm</div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:4px;">${headline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 10px 0;font-size:16px;line-height:1.5;color:#111827;">Hi ${escapeHtml(greetingName)},</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.55;color:#374151;">${lede}</p>
              ${heroCard}
              ${scorecardSection}
              ${statsSection}
              ${reflectionsSection}
              ${coachSection}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px 24px;border-top:1px solid #e5e7eb;text-align:center;">
              <div style="font-size:12px;color:#9ca3af;">Sent from Elite Golf Realm</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
