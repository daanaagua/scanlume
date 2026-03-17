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
      </div>
    </section>
  );
}
