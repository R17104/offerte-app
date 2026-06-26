function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'Bespaarhulp Friesland <info@bespaarhulpfriesland.nl>'
const DEFAULT_REPLY_TO = 'info@bespaarhulpfriesland.nl'

// Verstuurt e-mail via Resend (https://resend.com). Vereist RESEND_API_KEY in Vercel,
// en een geverifieerd domein (bespaarhulpfriesland.nl). Houdt de oude
// nodemailer-achtige interface aan (sendMail) zodat de mailfuncties ongewijzigd blijven.
async function createTransporter() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is niet ingesteld in Vercel')
  return {
    async sendMail(opts: { from?: string; to: string | string[]; cc?: string; replyTo?: string; subject: string; html: string }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: Array.isArray(opts.to) ? opts.to : [opts.to],
          subject: opts.subject,
          html: opts.html,
          reply_to: opts.replyTo || DEFAULT_REPLY_TO,
          ...(opts.cc ? { cc: [opts.cc] } : {}),
        }),
      })
      if (!res.ok) {
        throw new Error(`Resend fout (${res.status}): ${await res.text().catch(() => '')}`)
      }
    },
  }
}

export async function sendQuoteEmail({
  to,
  cc,
  customerName,
  senderName,
  quoteTitle,
  quoteUrl,
  quoteNumber,
}: {
  to: string
  cc?: string
  customerName: string
  senderName: string
  quoteTitle: string
  quoteUrl: string
  quoteNumber: string
}) {
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`

  const subject = `Uw offerte van Bespaarhulp Friesland, ${quoteTitle}`

  customerName = escapeHtml(customerName)
  senderName = escapeHtml(senderName)
  quoteTitle = escapeHtml(quoteTitle)
  quoteNumber = escapeHtml(quoteNumber)

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a5c35;padding:28px 36px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Uw persoonlijk energieadvies</p>
        </td></tr>
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

  await transporter.sendMail({
    from,
    to,
    ...(cc ? { cc } : {}),
    subject,
    html,
  })
}

// ── Informatiemail naar leads (bulk mailing) ─────────────────────────────────

export async function sendLeadInfoEmail({ to, firstName, senderName }: { to: string; firstName: string; senderName: string }) {
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`
  const safeName = escapeHtml(firstName || 'daar')
  const safeSender = escapeHtml(senderName)

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a5c35;padding:24px 36px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
        </td></tr>
        <tr><td style="padding:32px 36px 28px;font-size:14px;color:#374151;line-height:1.7;">
          <p style="margin:0 0 16px;">Hallo ${safeName},</p>
          <p style="margin:0 0 16px;">Ik stuur je even een bericht omdat veel huishoudens vragen hebben over het stoppen van de salderingsregeling.</p>
          <p style="margin:0 0 16px;">Wij geven momenteel vrijblijvend informatie over wat dit betekent in jouw situatie. Je ontvangt daarbij direct een persoonlijk advies en een berekening op maat.</p>
          <p style="margin:0 0 16px;">Zou je het prettig vinden als we hiervoor een afspraak inplannen? Dat kan gewoon vrijblijvend.</p>
          <p style="margin:24px 0 0;">Groet,</p>
          <p style="margin:4px 0 0;font-weight:600;color:#111827;">${safeSender}</p>
          <p style="margin:0;color:#0a5c35;">BespaarhulpFriesland.nl</p>
          <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">📞 06 38 92 25 13 &nbsp;·&nbsp; ✉️ <a href="mailto:info@bespaarhulpfriesland.nl" style="color:#0a5c35;">info@bespaarhulpfriesland.nl</a></p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Bespaarhulp Friesland · KVK 71128174 · Actief in heel Friesland<br>
            Liever geen e-mail meer ontvangen? Antwoord met &quot;afmelden&quot; en we halen u uit onze lijst.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from,
    to,
    replyTo: 'info@bespaarhulpfriesland.nl',
    subject: 'Informatie over het stoppen van de salderingsregeling',
    html,
  })
}

// ── Herinnering: offerte nog niet getekend ────────────────────────────────────

export async function sendQuoteReminderEmail({
  to, cc, customerName, quoteTitle, quoteNumber, quoteUrl,
}: {
  to: string
  cc?: string
  customerName: string
  quoteTitle: string
  quoteNumber: string
  quoteUrl: string
}) {
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`
  const safeName = escapeHtml(customerName)
  const safeTitle = escapeHtml(quoteTitle)
  const safeNumber = escapeHtml(quoteNumber)

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a5c35;padding:28px 36px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Herinnering aan uw offerte</p>
        </td></tr>
        <tr><td style="padding:36px 36px 28px;">
          <p style="margin:0 0 8px;font-size:16px;color:#111827;">Beste ${safeName},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.7;">
            Onlangs hebben we u een offerte gestuurd. Misschien is die aan uw aandacht ontsnapt. U kunt 'm hieronder bekijken en direct online ondertekenen. Heeft u vragen? Reageer gerust, we helpen u graag verder.
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Offerte: <strong style="color:#111827;">${safeTitle}</strong> (${safeNumber})</p>
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:#0a5c35;border-radius:8px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Offerte bekijken &amp; ondertekenen →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            Of kopieer deze link:<br>
            <a href="${quoteUrl}" style="color:#0a5c35;word-break:break-all;">${quoteUrl}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Bespaarhulp Friesland · KVK 71128174 · Vragen? App ons via WhatsApp 06 38 92 25 13</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({ from, to, ...(cc ? { cc } : {}), subject: `Herinnering: uw offerte ${safeNumber} van Bespaarhulp Friesland`, html })
}

// ── Bevestiging naar de aanvrager van een lead/offerte ────────────────────────

export async function sendLeadConfirmationEmail({
  to,
  name,
  quoteNumber,
}: {
  to: string
  name: string
  quoteNumber?: string
}) {
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`
  const safeName = escapeHtml(name)

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a5c35;padding:28px 36px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Uw persoonlijk energieadvies</p>
        </td></tr>
        <tr><td style="padding:36px 36px 28px;">
          <p style="margin:0 0 8px;font-size:16px;color:#111827;">Beste ${safeName},</p>
          <p style="margin:0 0 18px;font-size:14px;color:#4b5563;line-height:1.7;">
            Bedankt voor uw aanvraag! Eén van onze adviseurs neemt <strong>binnen één werkdag</strong> persoonlijk contact met u op, geen callcenter, gewoon iemand uit Friesland die uw situatie doorneemt.
          </p>
          ${quoteNumber ? `<p style="margin:0 0 18px;font-size:13px;color:#6b7280;">Uw offerte wordt voorbereid onder nummer <strong style="color:#111827;">${escapeHtml(quoteNumber)}</strong>.</p>` : ''}
          <p style="margin:0 0 8px;font-size:14px;color:#4b5563;line-height:1.7;">
            Heeft u in de tussentijd een vraag? App ons gerust via WhatsApp: <a href="https://wa.me/31638922513" style="color:#0a5c35;font-weight:600;">06 38 92 25 13</a>.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Bespaarhulp Friesland · KVK 71128174 · Actief in heel Friesland
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from,
    to,
    subject: 'Aanvraag ontvangen, wij bellen u binnen één werkdag',
    html,
  })
}

// ── Bevestiging naar de klant ná ondertekenen ─────────────────────────────────

export async function sendSignedQuoteEmail({
  to,
  customerName,
  quoteTitle,
  quoteNumber,
  quoteTotal,
  quoteUrl,
  missingPhotos,
}: {
  to: string
  customerName: string
  quoteTitle: string
  quoteNumber: string
  quoteTotal: string
  quoteUrl: string
  missingPhotos: string[] // bv. ['een foto van de meterkast']
}) {
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`

  const safeName = escapeHtml(customerName)
  const safeTitle = escapeHtml(quoteTitle)
  const safeNumber = escapeHtml(quoteNumber)
  const safeTotal = escapeHtml(quoteTotal)

  const photoBlock = missingPhotos.length
    ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
            <tr><td style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px 18px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400e;">📷 Nog even dit: foto's voor de schouw</p>
              <p style="margin:0 0 12px;font-size:13.5px;color:#78350f;line-height:1.6;">
                We hebben nog ${escapeHtml(missingPhotos.join(' en '))} nodig. Met deze foto('s) kunnen wij de installatie goed voorbereiden. U kunt ze eenvoudig toevoegen via dezelfde pagina als uw offerte (ook met uw telefoon).
              </p>
              <a href="${quoteUrl}" style="display:inline-block;padding:10px 20px;background:#b45309;border-radius:8px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;">
                Foto's toevoegen →
              </a>
            </td></tr>
          </table>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a5c35;padding:28px 36px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bespaarhulp Friesland</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Bevestiging van uw ondertekende offerte</p>
        </td></tr>
        <tr><td style="padding:36px 36px 28px;">
          <p style="margin:0 0 8px;font-size:16px;color:#111827;">Beste ${safeName},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.7;">
            Bedankt voor het ondertekenen van uw offerte! Hieronder vindt u uw getekende offerte. Wij nemen <strong>binnen één werkdag</strong> contact met u op om de vervolgstappen te bespreken.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#166534;">Offerte: <strong style="color:#111827;">${safeTitle}</strong> (${safeNumber})</p>
              <p style="margin:6px 0 0;font-size:13px;color:#166534;">Totaalbedrag: <strong style="color:#111827;">${safeTotal}</strong></p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:#0a5c35;border-radius:8px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Getekende offerte bekijken →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;line-height:1.6;">
            Op die pagina kunt u uw offerte ook downloaden of printen.
          </p>
          ${photoBlock}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Bespaarhulp Friesland · KVK 71128174 · Vragen? App ons via WhatsApp 06 38 92 25 13
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from,
    to,
    subject: `Uw getekende offerte (${safeNumber}) · Bespaarhulp Friesland`,
    html,
  })
}

// ── Interne notificatie bij acceptatie/afwijzing ──────────────────────────────

export async function sendQuoteStatusNotification({
  to,
  outcome,
  customerName,
  quoteTitle,
  quoteNumber,
  quoteTotal,
  dashboardUrl,
}: {
  to: string[]
  outcome: 'accepted' | 'rejected'
  customerName: string
  quoteTitle: string
  quoteNumber: string
  quoteTotal: string
  dashboardUrl: string
}) {
  if (!to.length) return
  const transporter = await createTransporter()
  const from = `Bespaarhulp Friesland <${process.env.GMAIL_USER}>`

  const accepted = outcome === 'accepted'
  const subject = accepted
    ? `✅ Offerte ondertekend: ${quoteTitle} (${quoteNumber})`
    : `❌ Offerte afgewezen: ${quoteTitle} (${quoteNumber})`

  const safeCustomer = escapeHtml(customerName)
  const safeTitle = escapeHtml(quoteTitle)
  const safeNumber = escapeHtml(quoteNumber)
  const color = accepted ? '#0a5c35' : '#b91c1c'

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="560" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:${color};padding:20px 28px;">
      <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff;">
        Offerte ${accepted ? 'ondertekend' : 'afgewezen'}
      </p>
    </td></tr>
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14px;color:#111827;">
        <strong>${safeCustomer}</strong> heeft offerte <strong>${safeTitle}</strong> (${safeNumber}, ${escapeHtml(quoteTotal)}) ${accepted ? 'ondertekend' : 'afgewezen'}.
      </p>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
        ${accepted ? 'Neem binnen 24 uur contact op met de klant om de installatie in te plannen.' : 'Bekijk de offerte in het dashboard voor een eventuele opvolging.'}
      </p>
      <a href="${dashboardUrl}" style="display:inline-block;padding:11px 22px;background:${color};border-radius:8px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
        Bekijk in dashboard →
      </a>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({ from, to, subject, html })
}
