import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const COACH_PHONE = process.env.COACH_PHONE_NUMBER!;

export async function POST(request: NextRequest) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone || !COACH_PHONE) {
      console.error('Twilio SMS not configured');
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    const { studentName, courseName, roundDate, totalScore, scoreToPar, scorecardId } =
      await request.json();

    const scoreToParStr =
      scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

    const baseUrl =
      process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const reviewUrl = `${baseUrl}/coach/review/${scorecardId}`;

    const body =
      `${studentName} submitted a round for review.\n` +
      `Course: ${courseName}\n` +
      `Date: ${roundDate}\n` +
      `Score: ${totalScore} (${scoreToParStr})\n` +
      `Review: ${reviewUrl}`;

    await client.messages.create({ body, from: fromPhone, to: COACH_PHONE });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('notify-coach error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
