import { buildMetadata, LISTINGS_LABEL } from "@/lib/site";

const featuredBadges = [
  {
    href: "https://toolsaiapp.com/",
    image: "https://toolsaiapp.com/wp-content/uploads/2025/12/badge.png",
    alt: "Listado no Tools AI App",
    width: 200,
    height: 54,
  },
  {
    href: "https://newtool.site/item/scanlume",
    image: "https://newtool.site/badges/newtool-light.svg",
    alt: "Listado no NewTool.site",
    width: 200,
    height: 54,
  },
];

const profileLinks = [
  {
    href: "https://beforeitsnews.com/v3/contributor/bio/?uid=1056818",
    label: "Before It's News",
    note: "Contributor bio",
  },
  {
    href: "https://fazier.com/p/allie26415",
    label: "Fazier",
    note: "Public profile",
  },
  {
    href: "https://alliedatabaseoptimization.crevado.com/about",
    label: "Crevado",
    note: "About page",
  },
  {
    href: "https://doodleordie.com/profile/allie26415dod",
    label: "Doodle or Die",
    note: "Public profile",
  },
  {
    href: "https://www.wishlistr.com/xiaonagua/",
    label: "Wishlistr",
    note: "Public user page",
  },
  {
    href: "https://noti.st/allie26415nst/bio",
    label: "Notist",
    note: "Bio page",
  },
  {
    href: "https://www.insanelymac.com/forum/profile/2749732-allie26415im/",
    label: "InsanelyMac",
    note: "Forum profile",
  },
  {
    href: "https://www.affilorama.com/member/allie26415-affilorama20260515",
    label: "Affilorama",
    note: "Member profile",
  },
];

export const metadata = buildMetadata({
  title: LISTINGS_LABEL,
  description:
    "Diretorios, plataformas de lancamento e listas de ferramentas onde o Scanlume apareceu na fase inicial do produto.",
  pathname: "/featured-on",
  index: false,
});

export default function FeaturedOnPage() {
  return (
    <section className="section-band legal-band">
      <div className="container featured-page-shell">
        <div className="legal-copy featured-page-copy">
          <p className="eyebrow">{LISTINGS_LABEL}</p>
          <h1>Onde o Scanlume foi listado.</h1>
          <p>
            Esta pagina concentra badges e links de plataformas, listas e diretorios onde o projeto foi publicado.
            Assim mantemos o rodape principal mais limpo sem perder as referencias externas que ajudam no lancamento.
          </p>
        </div>

        <div className="featured-badge-grid">
          {featuredBadges.map((badge) => (
            <a
              key={badge.href}
              className="featured-badge-card"
              href={badge.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badge.image} alt={badge.alt} width={badge.width} height={badge.height} />
              <span>{badge.alt}</span>
            </a>
          ))}
        </div>

        <div className="featured-link-section">
          <div className="legal-copy featured-page-copy">
            <h2>Profile links publicados.</h2>
            <p>
              Alem dos badges, esta secao deixa visiveis paginas de perfil, bio e member pages publicas usadas em
              publicacoes externas. Os links ficam em HTML simples para facilitar descoberta e recrawl.
            </p>
          </div>

          <ul className="featured-link-list">
            {profileLinks.map((link) => (
              <li key={link.href} className="featured-link-item">
                <span className="featured-link-label">{link.label}</span>
                <span className="featured-link-note">{link.note}</span>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.href}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
