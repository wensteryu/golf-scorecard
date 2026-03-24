import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.error('Email notification not configured');
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const { studentEmail, studentName, courseName, roundDate, totalScore, scoreToPar, scorecardId } =
      await request.json();

    if (!studentEmail) {
      return NextResponse.json({ error: 'Student email missing' }, { status: 400 });
    }

    const scoreToParStr =
      scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

    const baseUrl =
      process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const summaryUrl = `${baseUrl}/student/round/${scorecardId}/summary`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"Elite Golf Realm" <${gmailUser}>`,
      to: studentEmail,
      subject: `Coach Reviewed Your Round — ${courseName} (${scoreToParStr})`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Your Round Has Been Reviewed</h2>
          <p>Coach has reviewed your round, <strong>${studentName}</strong>.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Course</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${courseName}</strong></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${roundDate}</strong></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Score</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${totalScore} (${scoreToParStr})</strong></td></tr>
          </table>
          <a href="${summaryUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Feedback</a>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">Sent from Elite Golf Realm</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('notify-student error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
