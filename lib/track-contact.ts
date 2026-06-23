// Vuurt een TikTok 'Contact'-event bij een WhatsApp-/belklik.
// Werkt alleen als de bezoeker marketingcookies heeft geaccepteerd (dan bestaat
// window.ttq). Zonder toestemming gebeurt er niets, AVG-proof.
export function trackWhatsAppClick() {
  try {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('Contact', { content_type: 'whatsapp' })
    }
  } catch {
    // tracking mag een klik nooit blokkeren
  }
}

export function trackPhoneClick() {
  try {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('Contact', { content_type: 'phone' })
    }
  } catch {
    /* noop */
  }
}
