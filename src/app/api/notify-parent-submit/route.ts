import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildParentScorecardEmail } from '@/lib/emails/parent-scorecard';

export async function POST(request: NextRequest) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.error('Email notification not configured');
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      parentEmail,
      parentFirstName,
      studentName,
      courseName,
      roundDate,
      holeScores,
      stats,
      reflections,
    } = body;

    if (!parentEmail) {
      return NextResponse.json({ error: 'Parent email missing' }, { status: 400 });
    }

    const { subject, html } = buildParentScorecardEmail({
      event: 'submit',
      parentFirstName,
      studentName,
      courseName,
      roundDate,
      holeScores: holeScores ?? [],
      stats,
      reflections: reflections ?? {
        mentalityRating: null,
        whatTranspired: null,
        howToRespond: null,
      },
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: `"Elite Golf Realm" <${gmailUser}>`,
      to: parentEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('notify-parent-submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
