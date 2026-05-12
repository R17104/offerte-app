// Standaard voorwaardentekst — elke sectie gescheiden door lege regel.
// Eerste regel van elke sectie = titel, overige regels = inhoud.
export const DEFAULT_TERMS_TEXT = `Aanbetaling en eindfactuur
Wanneer u akkoord gaat met de offerte, wordt na de technische schouw een aanbetaling in rekening gebracht. Het resterende bedrag wordt op de dag van installatie in twee delen gefactureerd. Deze facturen dienen uiterlijk binnen 2 dagen na oplevering te worden voldaan.
Van een volledig functionerende installatie is sprake wanneer de batterij en omvormer energie opwekken en kunnen terugleveren aan het net.
De betaling verloopt als volgt: 33% aanbetaling — u ontvangt op de dag van de schouw en op de dag van de installatie een factuur. Deze dient uiterlijk binnen 2 dagen te worden betaald.
Indien u uw aanvraag (deels) via het Warmtefonds laat verlopen hoeft u nog niets te betalen totdat de financiering is goedgekeurd. Krijgt u de financiering niet rond en kunt u ons een afwijzing overleggen, dan kunt u kosteloos de koop ontbinden.

Financiering via Nationaal Warmtefonds
Heeft u geen directe financiële middelen beschikbaar? Overweeg dan de aantrekkelijke financieringsopties via het Nationaal Warmtefonds. Alle informatie is te vinden op hun website: www.warmtefonds.nl.

Externe financiering en voorwaarden
Indien deze offerte onder voorbehoud van financiering wordt ondertekend, zal Bespaarhulp Friesland drie financieringsopties aandragen. Lukt financiering niet, dan wordt — in overleg — een technisch vergelijkbaar alternatief binnen het beschikbare budget aangeboden.
Bij onvoldoende medewerking aan het financieringsproces behouden wij ons het recht voor om een vergoeding in rekening te brengen voor de gemaakte advies- en voorbereidingstijd.
Indien na al deze stappen zwart-op-wit wordt aangetoond dat financiering structureel niet mogelijk is (bijvoorbeeld door een BKR-registratie of aantoonbare negatieve kredietwaardigheid), kan de klant kosteloos van de overeenkomst afzien.

Installatieplanning
Na goedkeuring van de offerte bedraagt de gemiddelde levertijd voor de installatie van uw batterij 1 tot 2 weken. Wij zorgen ervoor dat u wordt gekoppeld aan een kwalitatieve installatiepartner, zodat de installatie snel en professioneel kan worden uitgevoerd. De precieze planning stemmen we in overleg met u af.

Voorwaarden voor de meterkast
Om de batterij te kunnen installeren, moet uw meterkast voldoen aan de NEN 1010-norm. Controleer ook of uw netaansluiting geschikt is. Aanpassingen nodig? Wij kunnen uw meterkast upgraden tegen meerprijs.
Oude smeltzekeringen moeten worden vervangen door een moderne groepenkast. Omdat het om maatwerk gaat, is medewerking van uw kant noodzakelijk om de installatie volgens planning te kunnen uitvoeren. Indien dit niet mogelijk is, kunnen er aanvullende voorwaarden van toepassing zijn.

Verzekering
De meeste opstalverzekeringen dekken thuisbatterijen. Het is verstandig om dit vooraf te controleren bij uw verzekeraar. Vaak stellen zij als eis dat de installatie wordt uitgevoerd door een gecertificeerde professional. De installateurs van Bespaarhulp Friesland voldoen aan deze eisen.

Btw
Bij de aanschaf en installatie van thuisbatterijen geldt het standaard btw-tarief van 21%. Als u de thuisbatterij gebruikt voor de in- en verkoop van stroom via uw energiemaatschappij, bent u ondernemer voor de btw. Hierdoor kunt u de betaalde btw terugvragen. Dit geldt ook wanneer de batterij is uitgerust met een Energie Management Systeem (EMS) of als u een dynamisch energiecontract heeft.

Herroepingsrecht
Voor particuliere klanten geldt in principe het wettelijke herroepingsrecht. Houd er echter rekening mee dat in veel gevallen sprake is van maatwerk — het systeem, inclusief het EMS, wordt specifiek afgestemd op uw persoonlijke verbruikssituatie en woning.
In zulke gevallen kan het herroepingsrecht mogelijk beperkt zijn of vervallen, conform artikel 6:230p van het Burgerlijk Wetboek. Raadpleeg onze algemene voorwaarden voor meer informatie.

Registratie bij Energieleveren
Na de installatie dient u het systeem te registreren bij het netwerk. Dit kan eenvoudig via www.energieleveren.nl of door contact op te nemen met uw netbeheerder.

Energieleveranciers
Onze slimme batterijen hebben koppeling met dynamische energieleveranciers zoals Next Energy, frank energie, Hegg en Tibber, zodat u optimaal kunt profiteren van dynamische tarieven en energiemarktkoppelingen.
Let op: veel traditionele energieleveranciers zijn (nog) niet compatibel met een batterij. Ze kunnen het systeem niet aansturen of uitlezen, waardoor u geen voordeel heeft van uw investering. In de praktijk is overstappen dus bijna altijd nodig om écht rendement te behalen.

Onze partners
Onze installatiepartners zijn ervaren en gecertificeerde professionals. Met hun vakmanschap en oog voor detail garanderen zij een veilige, efficiënte en zorgeloze installatie van uw thuisbatterij.`

function parseTermsText(text: string): { title: string; content: string[] }[] {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length === 0) return null
      return { title: lines[0], content: lines.slice(1) }
    })
    .filter((s): s is { title: string; content: string[] } => s !== null && s.title.length > 0)
}

export default function TermsAndConditions({ text }: { text?: string | null }) {
  const sections = parseTermsText(text ?? DEFAULT_TERMS_TEXT)

  return (
    <div
      id="algemene-voorwaarden"
      style={{
        marginTop: 48,
        borderTop: '2px solid #e5e7eb',
        paddingTop: 40,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}
      >
        Algemene voorwaarden
      </h2>
      <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 32 }}>
        Door deze offerte te accepteren gaat u akkoord met onderstaande voorwaarden.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <h3
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#16a34a',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              {section.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.content.map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#4b5563',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
