import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface RoutineForEmail {
  name: string;
  scheduledTime: string;
  steps: {
    order: number;
    action: string;
    isMixingStep: boolean;
    products: {
      product: { name: string };
    }[];
  }[];
}

export async function sendEmailReminder(
  email: string,
  userName: string | null,
  routine: RoutineForEmail
) {
  const stepsHtml = routine.steps
    .map(
      (step) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666;">
            ${step.order}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">
            <strong>${step.action}</strong>
            ${step.isMixingStep ? ' <span style="color: #7c3aed; font-size: 11px;">🧪 MIX</span>' : ""}
            <br/>
            <span style="color: #888; font-size: 12px;">
              ${step.products.map((p) => p.product.name).join(" + ")}
            </span>
          </td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <tr>
          <td>
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 16px 16px 0 0; padding: 24px;">
              <tr>
                <td align="center">
                  <div style="font-size: 28px; margin-bottom: 8px;">🧴</div>
                  <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">
                    Time for your routine!
                  </h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">
                    Hey ${userName || "there"}, "${routine.name}" is coming up at ${routine.scheduledTime}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="padding: 20px;">
                  <h2 style="margin: 0 0 12px; font-size: 16px; color: #333;">
                    Your ${routine.steps.length} steps:
                  </h2>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${stepsHtml}
                  </table>
                  <div style="margin-top: 20px; text-align: center;">
                    <p style="color: #888; font-size: 12px;">
                      💜 Your skin thanks you for being consistent!
                    </p>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 16px;">
              <tr>
                <td align="center">
                  <p style="color: #aaa; font-size: 11px; margin: 0;">
                    Sent by Routine · You can manage notifications in Settings
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Routine <onboarding@resend.dev>",
    to: email,
    subject: `🧴 ${routine.name} — Time for your skincare routine!`,
    html,
  });
}
