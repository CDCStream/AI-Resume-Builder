import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const firstName = name?.split(" ")[0] || "there";

    await resend.emails.send({
      from: "LinImpact.ai <hello@linimpact.ai>",
      to: email,
      subject: `Welcome to LinImpact.ai, ${firstName}! 🚀`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Lin<span style="opacity:0.9;">Impact</span><span style="opacity:0.7;">.ai</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
                Welcome, ${firstName}!
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Your account is ready. You're one step away from creating a resume that gets you hired.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="https://www.linimpact.ai/resume" 
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      Create My Resume →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;padding-top:24px;">
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="padding-right:12px;vertical-align:top;color:#22c55e;font-size:18px;">✓</td>
                      <td style="color:#374151;font-size:14px;line-height:1.5;"><strong>14 professional templates</strong> — all ATS-optimized</td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="padding-right:12px;vertical-align:top;color:#22c55e;font-size:18px;">✓</td>
                      <td style="color:#374151;font-size:14px;line-height:1.5;"><strong>AI-powered suggestions</strong> — stronger bullet points in seconds</td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="padding-right:12px;vertical-align:top;color:#22c55e;font-size:18px;">✓</td>
                      <td style="color:#374151;font-size:14px;line-height:1.5;"><strong>LinkedIn import</strong> — build your resume in one click</td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;background-color:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                © ${new Date().getFullYear()} LinImpact.ai — AI-Powered Resume Builder
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Welcome email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
