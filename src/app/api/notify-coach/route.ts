import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const COACH_EMAIL = 'wenjyu@gmail.com'; // TODO: change to standumdumaya@gmail.com after verifying a domain in Resend

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { studentName, courseName, roundDate, totalScore, scoreToPar, scorecardId } =
      await request.json();

    const scoreToParStr =
      scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

    const baseUrl =
      process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const reviewUrl = `${baseUrl}/coach/review/${scorecardId}`;

    const { error } = await resend.emails.send({
      from: 'Elite Golf Realm <onboarding@resend.dev>',
      to: COACH_EMAIL,
      subject: `${studentName} submitted a round for review`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">${studentName} submitted a round</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Course</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${roundDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Score</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${totalScore} (${scoreToParStr})</td>
            </tr>
          </table>
          <a href="${reviewUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Review Round
          </a>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('notify-coach error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
