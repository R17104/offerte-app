'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import WhatsAppButton from '@/components/marketing/WhatsAppButton'

type Product = {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  imageUrl: string | null
  category: string | null
  capacityKwh: number | null
  powerKw: number | null
  warrantyYears: number | null
  savingsKwhYear: number | null
  gasReductionM3Year: number | null
  notes: string | null
}

// Galerij per product — key = hoofdafbeelding URL
const GALLERIES: Record<string, string[]> = {
  // AlphaESS batterij 3.8kWh
  'https://www.vekto.nl/media/catalog/product/2/4/242247_label_2_1.png': [
    'https://www.vekto.nl/media/catalog/product/2/4/242247_label_2_1.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_006.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_007.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_008.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_002.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-003_1.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-002.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-005.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-008.png',
  ],
  // AlphaESS batterij 9.3kWh
  'https://www.vekto.nl/media/catalog/product/2/4/242248-1.png': [
    'https://www.vekto.nl/media/catalog/product/2/4/242248-1.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_006.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_007.png',
    'https://www.vekto.nl/media/catalog/product/t/h/thuisbatterij_bewerkt_002.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-003_1.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-002.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-005.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-008.png',
  ],
  // AlphaESS omvormer 5kW
  'https://www.vekto.nl/media/catalog/product/2/4/242242_label.png': [
    'https://www.vekto.nl/media/catalog/product/2/4/242242_label.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_002_1_2.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_003_1_2.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_001_1_1_2.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_004_1_2.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-004_1_2.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-006_1_1_2.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-003_2_1_2.png',
  ],
  // AlphaESS omvormer 10kW
  'https://www.vekto.nl/media/catalog/product/2/4/242246_label.png': [
    'https://www.vekto.nl/media/catalog/product/2/4/242246_label.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_002.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_003.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_001_1.png',
    'https://www.vekto.nl/media/catalog/product/o/m/omvormer_bewerkt_004.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-004.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-006_1.png',
    'https://www.vekto.nl/media/catalog/product/a/l/alphaess_sfeer-003_2.png',
  ],
  // Alpha ESS Backup box KIT 3 fase
  'https://www.vekto.nl/media/catalog/product/8/8/8847238ba12a395839ed90f6a06c793d.jpg': [
    'https://www.vekto.nl/media/catalog/product/8/8/8847238ba12a395839ed90f6a06c793d.jpg',
    'https://www.vekto.nl/media/catalog/product/c/f/cfb1f3de7af008a61dcb367f199fba90.jpg',
    'https://www.vekto.nl/media/catalog/product/c/d/cd774ce302afd5ae7c5cd18fcd909ad3.jpg',
    'https://www.vekto.nl/media/catalog/product/f/b/fb22480249003c9e37c76e132886a879.jpg',
    'https://www.vekto.nl/media/catalog/product/4/3/4313977a7fc109bdd974edd9f03744b7.jpg',
    'https://www.vekto.nl/media/catalog/product/c/9/c9624d2949b4e1dbb1e3514f612bdd5c.jpg',
  ],
  // 3 fase Backup Box beveiliging C25
  'https://www.vekto.nl/media/catalog/product/a/6/a643e6604691411778b6e53f0c18b712.jpg': [
    'https://www.vekto.nl/media/catalog/product/a/6/a643e6604691411778b6e53f0c18b712.jpg',
    'https://www.vekto.nl/media/catalog/product/4/b/4b0b3bae23733fb810bd17304ca38b2f.jpg',
    'https://www.vekto.nl/media/catalog/product/1/3/1300caf29d9b27c51080f157e1198bff.jpg',
    'https://www.vekto.nl/media/catalog/product/b/f/bfbe21249719a57396fced51a7122dfd.jpg',
    'https://www.vekto.nl/media/catalog/product/5/7/576a191b8e33162ec6def311c12c1729.jpg',
    'https://www.vekto.nl/media/catalog/product/c/9/c93f6bc9e91ce05de254b6440928f334.jpg',
    'https://www.vekto.nl/media/catalog/product/e/5/e5a776ba23b95ccd285a427de4156a67.jpg',
    'https://www.vekto.nl/media/catalog/product/f/0/f0eff5a28d3dfded2a51987875e5684d.jpg',
  ],
  // ATS 3 polig
  'https://www.vekto.nl/media/catalog/product/5/7/577a962dc0f0a04fc247e2813631adf2.jpg': [
    'https://www.vekto.nl/media/catalog/product/5/7/577a962dc0f0a04fc247e2813631adf2.jpg',
    'https://www.vekto.nl/media/catalog/product/0/a/0ad693ca2863fe8a4db238bf5bfd5579.jpg',
    'https://www.vekto.nl/media/catalog/product/2/a/2a2978d7daad95c53bd03c348e50381f.jpg',
    'https://www.vekto.nl/media/catalog/product/b/8/b857820021979a9ca851f1d0e0bec474.jpg',
    'https://www.vekto.nl/media/catalog/product/c/6/c6f678a7e755d065805df737c487ec29.jpg',
    'https://www.vekto.nl/media/catalog/product/b/c/bc34b93796e235047c6b70bbc281e16a.jpg',
    'https://www.vekto.nl/media/catalog/product/b/8/b8be3c9e7f792261edd92872e3ebaf57.jpg',
  ],
  // ATS 1 polig
  'https://www.vekto.nl/media/catalog/product/4/1/41a74cd1fe8700a6ac813a34fe70fbda.jpg': [
    'https://www.vekto.nl/media/catalog/product/4/1/41a74cd1fe8700a6ac813a34fe70fbda.jpg',
    'https://www.vekto.nl/media/catalog/product/6/6/66485fa4157cd2d7358494fa9b26076f.jpg',
    'https://www.vekto.nl/media/catalog/product/8/7/873d99a6cd234713f2d76e7678f859ac.jpg',
    'https://www.vekto.nl/media/catalog/product/c/5/c53a24671cea407117c4e0611e61ce6e.jpg',
    'https://www.vekto.nl/media/catalog/product/6/1/61a9319577dfb83b43e8709ea849b163.jpg',
    'https://www.vekto.nl/media/catalog/product/f/7/f781822d44316b52235774b1e0deaf44.jpg',
    'https://www.vekto.nl/media/catalog/product/c/b/cbcc28dca58b26fb889f42506751845a.jpg',
  ],
  // ZinVolt 3 fase verdeler
  'https://www.vekto.nl/media/catalog/product/0/5/05fcfc67a6184aeab9bbfa7574b04008.jpg': [
    'https://www.vekto.nl/media/catalog/product/0/5/05fcfc67a6184aeab9bbfa7574b04008.jpg',
    'https://www.vekto.nl/media/catalog/product/f/1/f1d6d74131e9517eb60e728a67abd08c.jpg',
    'https://www.vekto.nl/media/catalog/product/4/a/4aa103c06bee8513230373c4948387be.jpg',
    'https://www.vekto.nl/media/catalog/product/d/f/df0804ddaa520b36313530dc2ec590d0.jpg',
    'https://www.vekto.nl/media/catalog/product/7/8/78a6b2814482f7ec108c3d9a65ed62c0.jpg',
    'https://www.vekto.nl/media/catalog/product/a/3/a3ef2c6e4d0cccab938eac2c4e699a84.jpg',
    'https://www.vekto.nl/media/catalog/product/b/8/b8c25ed158efc6d2d7112216f07ff6ae.jpg',
    'https://www.vekto.nl/media/catalog/product/e/3/e39a2289788b5a60c838e191bab46ed5.jpg',
    'https://www.vekto.nl/media/catalog/product/5/2/52fe5fde304574bd8ece2b48755e7cf2.jpg',
  ],

  // Sigenergy EC SP hybride omvormer (1-fase)
  'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg': [
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg',
  ],

  // Sigenergy EC TP hybride omvormer (3-fase)
  'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg': [
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg',
  ],

  // Sigenergy SigenStor BAT 6.0
  'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg': [
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg',
  ],

  // Sigenergy SigenStor BAT 9.0
  'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg': [
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-thuisbatterij-10-kwh.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg',
  ],

  // Sigenergy Energy Gateway HomeMax SP (1-fase)
  'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg': [
    'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
  ],

  // Sigenergy Energy Gateway HomePro TP (3-fase)
  'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg': [
    'https://cdn.webshopapp.com/shops/252094/files/475447440/262x276x2/sigenergy-energy-gateway-3-fase.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/477042152/262x276x2/sigenergy-energy-gateway-1-fase.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/483240283/262x276x2/sigenergy-60-sigenstor-batterij-module.jpg',
  ],

  // Sigenergy AC Lader 7 kW
  'https://cdn.webshopapp.com/shops/252094/files/486711965/262x276x2/sigenergy-ac-lader-7-kw-met-vaste-ev-kabel-5-meter.jpg': [
    'https://cdn.webshopapp.com/shops/252094/files/486711965/262x276x2/sigenergy-ac-lader-7-kw-met-vaste-ev-kabel-5-meter.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/491189484/262x276x2/sigenergy-ac-lader-22kw.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-hybride-thuisbatterij.jpg',
  ],

  // Sigenergy AC Lader 22 kW
  'https://cdn.webshopapp.com/shops/252094/files/491189484/262x276x2/sigenergy-ac-lader-22kw.jpg': [
    'https://cdn.webshopapp.com/shops/252094/files/491189484/262x276x2/sigenergy-ac-lader-22kw.jpg',
    'https://cdn.webshopapp.com/shops/252094/files/486711965/262x276x2/sigenergy-ac-lader-7-kw-met-vaste-ev-kabel-5-meter.jpg',
    'https://zonnigewinkel.nl/wp-content/uploads/2026/01/Sinergy-omvormer-1.jpg',
  ],

  // WeHeat Blackbird P60 warmtepomp
  'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif': [
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-blackbird-p80-all-electric-compact-set-8kw-1.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
  ],

  // WeHeat Blackbird P80 warmtepomp
  'https://www.aircozonderstek.nl/wp-content/uploads/weheat-blackbird-p80-all-electric-compact-set-8kw-1.webp': [
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-blackbird-p80-all-electric-compact-set-8kw-1.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
  ],

  // WeHeat Sparrow P60 warmtepomp
  'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif': [
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
  ],

  // WeHeat Flint P40 warmtepomp
  'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp': [
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68122a8431ec990a5a3ffe18_Sparrow-outside.avif',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
  ],

  // WeHeat RVS Boilervat WBL-200
  'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp': [
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
  ],

  // WeHeat RVS Boilervat WBL-300
  'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp': [
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/681dea96fec3f1fba51b14e0_Blackbird%20-%20Product%20website.avif',
  ],

  // WeHeat RVS Buffervat WBF-50
  'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp': [
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-200l.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
  ],

  // WeHeat RVS Buffervat WBF-100
  'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp': [
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-100l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-buffer-tank-50l.webp',
    'https://www.aircozonderstek.nl/wp-content/uploads/weheat-rvs-boiler-tank-300l.webp',
    'https://cdn.prod.website-files.com/67ed5695314f69c537693240/68089931202a2dafe616a512_Flint-hero.webp',
  ],
}

const CAT: Record<string, { label: string; icon: string; gradient: string }> = {
  BATTERY:         { label: 'Thuisbatterij', icon: '🔋', gradient: 'linear-gradient(145deg,#0f2444,#1d4ed8)' },
  SOLAR:           { label: 'Zonnepanelen',  icon: '☀️', gradient: 'linear-gradient(145deg,#78350f,#ea580c)' },
  HEAT_PUMP:       { label: 'Warmtepomp',    icon: '🌡️', gradient: 'linear-gradient(145deg,#052e16,#059669)' },
  CHARGER:         { label: 'Laadpaal',      icon: '⚡',  gradient: 'linear-gradient(145deg,#1e1b4b,#6366f1)' },
  EMERGENCY_POWER: { label: 'Noodstroom',   icon: '🔌',  gradient: 'linear-gradient(145deg,#450a0a,#dc2626)' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function SavingsCalc({ capacityKwh, inclPrice }: { capacityKwh: number; inclPrice: number }) {
  const [feedbackKwh, setFeedbackKwh] = useState(2000)
  const absorbable = Math.min(capacityKwh * 365 * 0.9, feedbackKwh * 0.85)
  const annualSavings = Math.round(absorbable * (0.28 - 0.07))
  const payback = annualSavings > 0 ? (inclPrice / annualSavings).toFixed(1) : '—'
  const tenYr = annualSavings * 10 - inclPrice

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0a5c35', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        🧮 Bereken uw besparing
      </p>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12.5, color: '#374151' }}>Jaarlijkse teruglevering</label>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a5c35' }}>{feedbackKwh.toLocaleString('nl-NL')} kWh</span>
        </div>
        <input
          type="range" min={200} max={20000} step={100} value={feedbackKwh}
          onChange={e => setFeedbackKwh(+e.target.value)}
          style={{ width: '100%', accentColor: '#0a5c35' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>
          <span>200 kWh</span><span>20.000 kWh</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Besparing/jaar', value: `€ ${annualSavings}`, highlight: true },
          { label: 'Terugverdientijd', value: `${payback} jaar`, highlight: false },
          { label: 'Winst na 10 jaar', value: tenYr > 0 ? `€ ${tenYr.toLocaleString('nl-NL')}` : '–', highlight: tenYr > 0 },
        ].map(item => (
          <div key={item.label} style={{ background: item.highlight ? '#0a5c35' : '#fff', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: item.highlight ? '#fff' : '#111827' }}>{item.value}</div>
            <div style={{ fontSize: 10.5, color: item.highlight ? 'rgba(255,255,255,0.75)' : '#9ca3af', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 10, lineHeight: 1.5 }}>
        Indicatieve berekening op basis van uw teruglevering, stroomtarief €0,28/kWh en teruglevertarief €0,07/kWh. Werkelijke besparing afhankelijk van situatie.
      </p>

      {/* EMS / onbalansmarkt */}
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #86efac', borderRadius: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0a5c35', marginBottom: 6 }}>
          Extra opbrengst met EMS (Energie Management Systeem)
        </p>
        <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>
          Met een EMS kan uw thuisbatterij slim handelen op de <strong>onbalansmarkt</strong> — het netbeheerder-netwerk waar energieprijzen per kwartier variëren. De batterij laadt op bij lage prijzen en levert terug bij hoge prijzen, los van uw zonnepanelen.
        </p>
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: '#0a5c35', fontWeight: 600, marginBottom: 2 }}>Gemiddelde extra opbrengst</p>
            <p style={{ fontSize: 10.5, color: '#6b7280' }}>3-jaarsgemiddelde · AlphaESS 9,3 kWh + 10kW omvormer</p>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0a5c35', whiteSpace: 'nowrap' }}>+ €1.314/jaar</div>
        </div>
      </div>
    </div>
  )
}

function ProductGallery({ product }: { product: Product }) {
  const images = (product.imageUrl && GALLERIES[product.imageUrl]) || (product.imageUrl ? [product.imageUrl] : [])
  const [active, setActive] = useState(0)
  const [err, setErr] = useState<Record<number, boolean>>({})
  const cat = CAT[product.category ?? '']

  if (images.length === 0) {
    return (
      <div style={{ aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', background: cat?.gradient ?? 'linear-gradient(145deg,#1f2937,#374151)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{cat?.icon ?? '📦'}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{cat?.label ?? 'Product'}</span>
      </div>
    )
  }

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  return (
    <div>
      {/* Hoofdafbeelding */}
      <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb', marginBottom: 10 }}>
        {!err[active] ? (
          <img
            key={active}
            src={images[active]}
            alt={`${product.name} ${active + 1}`}
            onError={() => setErr(e => ({ ...e, [active]: true }))}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 28, boxSizing: 'border-box' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 32 }}>📷</div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>›</button>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 64, height: 64, borderRadius: 8, overflow: 'hidden', padding: 0, cursor: 'pointer',
                border: `2px solid ${i === active ? '#0a5c35' : '#e5e7eb'}`,
                background: '#f9fafb', flexShrink: 0,
                boxShadow: i === active ? '0 0 0 2px rgba(10,92,53,0.2)' : 'none',
              }}
            >
              {!err[i] ? (
                <img
                  src={src}
                  alt=""
                  onError={() => setErr(e => ({ ...e, [i]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4, boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetailPage({ product }: { product: Product }) {
  const cat = CAT[product.category ?? '']
  const inclPrice = product.unitPrice * (1 + product.vatRate / 100)
  const articleNr = product.notes?.match(/Art\. nr\. (\S+)/)?.[1]

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo-bespaarhulp.jpg" alt="Bespaarhulp Friesland" width={216} height={54} priority style={{ display: 'block' }} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link href="/producten" style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '7px 14px' }}>Alle producten</Link>
            <Link href="/#contact" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a5c35', padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>
              Gratis advies
            </Link>
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <div style={{ background: '#0a5c35', padding: '10px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 'clamp(16px,3vw,40px)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Gratis en vrijblijvend advies','Gecertificeerde installateurs','Heel Friesland','Geen verkoopdruk'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,48px)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#9ca3af', marginBottom: 24 }}>
          <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/producten" style={{ color: '#9ca3af', textDecoration: 'none' }}>Producten</Link>
          <span>/</span>
          <span style={{ color: '#374151' }}>{product.name}</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,480px)', gap: 48, alignItems: 'start' }}>

          {/* Image panel */}
          <div>
            <ProductGallery product={product} />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {cat && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <span>{cat.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0a5c35' }}>{cat.label}</span>
                </div>
              )}
              {articleNr && (
                <p style={{ fontSize: 11.5, color: '#9ca3af' }}>Art. nr. {articleNr}</p>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div>
            <h1 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 16 }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{fmt(inclPrice)}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{fmt(product.unitPrice)} excl. {product.vatRate}% btw</div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link
                  href={`/offerte-aanvragen?product=${product.id}`}
                  style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 10, background: '#0a5c35', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                >
                  Vraag offerte aan
                </Link>
                <Link
                  href={`/offerte-aanvragen?product=${product.id}`}
                  style={{ display: 'block', textAlign: 'center', padding: '11px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
                >
                  Gratis adviesgesprek inplannen
                </Link>
              </div>
            </div>

            {/* Specs */}
            {(product.capacityKwh || product.powerKw || product.warrantyYears || product.savingsKwhYear || product.gasReductionM3Year) && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Specificaties</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  {product.capacityKwh != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Capaciteit</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.capacityKwh} kWh</span>
                    </div>
                  )}
                  {product.powerKw != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Vermogen</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.powerKw} kW</span>
                    </div>
                  )}
                  {product.warrantyYears != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Garantie</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.warrantyYears} jaar</span>
                    </div>
                  )}
                  {product.savingsKwhYear != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Stroombesparing/jaar</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.savingsKwhYear} kWh</span>
                    </div>
                  )}
                  {product.gasReductionM3Year != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Gasbesparing/jaar</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.gasReductionM3Year} m³</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Savings calculator — only for batteries with capacity */}
            {product.category === 'BATTERY' && product.capacityKwh != null && (
              <SavingsCalc capacityKwh={product.capacityKwh} inclPrice={inclPrice} />
            )}

            {/* USPs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Professionele installatie inbegrepen',
                'Inclusief inbedrijfstelling en uitleg',
                '10 jaar garantie op installatie',
                'Subsidies en BTW-teruggaaf worden geregeld',
              ].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#0a5c35', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ marginTop: 48, maxWidth: 800 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Productomschrijving</h2>
            <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75 }}>{product.description}</p>
          </div>
        )}

        {/* CTA block */}
        <div style={{ marginTop: 56, background: 'linear-gradient(160deg,#052e1a,#0a5c35)', borderRadius: 20, padding: 'clamp(28px,4vw,48px)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: '#fff', maxWidth: 600 }}>
            Interesse in {product.name}?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 500, lineHeight: 1.65 }}>
            Onze adviseurs berekenen gratis of dit product rendabel is voor uw situatie. Geen verkoopdruk, gewoon eerlijk advies.
          </p>
          <Link
            href={`/offerte-aanvragen?product=${product.id}`}
            style={{ padding: '14px 32px', borderRadius: 12, background: '#f5c442', color: '#052e1a', fontSize: 15, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
          >
            Gratis advies aanvragen →
          </Link>
          <Link href="/producten" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Terug naar alle producten
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#03180d', marginTop: 64, padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', marginLeft: 7, textTransform: 'uppercase' }}>Friesland</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Bespaarhulp Friesland · Onafhankelijk energieadvies</p>
          <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Medewerker login</Link>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
