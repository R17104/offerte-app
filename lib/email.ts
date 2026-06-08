import { Resend } from 'resend'

export async function sendQuoteEmail({
  to,
  customerName,
  senderName,
  quoteTitle,
  quoteUrl,
  quoteNumber,
}: {
  to: string
  customerName: string
  senderName: string
  quoteTitle: string
  quoteUrl: string
  quoteNumber: string
}) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is niet ingesteld in Vercel omgevingsvariabelen')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM ?? 'Bespaarhulp Friesland <onboarding@resend.dev>'

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0a5c35;padding:28px 36px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Uw persoonlijk energieadvies</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">
          <p style="margin:0 0 8px;font-size:16px;color:#111827;">Beste ${customerName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
            ${senderName} heeft een offerte voor u klaarstaan. U kunt deze bekijken, downloaden en direct ondertekenen via de knop hieronder.
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Offerte: <strong style="color:#111827;">${quoteTitle}</strong> (${quoteNumber})</p>

          <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td style="background:#0a5c35;border-radius:8px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Offerte bekijken →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            Of kopieer deze link in uw browser:<br>
            <a href="${quoteUrl}" style="color:#0a5c35;word-break:break-all;">${quoteUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Dit bericht is verstuurd door ${senderName} via Bespaarhulp Friesland. U hoeft niet te reageren op dit e-mailadres.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from,
    to,
    subject: `Uw offerte van Bespaarhulp Friesland — ${quoteTitle}`,
    html,
  })
}
