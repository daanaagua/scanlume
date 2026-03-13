import { buildMetadata } from "@/lib/site";

const featuredBadges = [
  {
    href: "https://toolsaiapp.com/",
    image: "https://toolsaiapp.com/wp-content/uploads/2025/12/badge.png",
    alt: "Featured on Tools AI App",
    width: 200,
    height: 54,
  },
  {
    href: "https://deeplaunch.io",
    image: "https://deeplaunch.io/badge/badge_transparent.svg",
    alt: "Featured on DeepLaunch.io",
    width: 200,
    height: 54,
  },
  {
    href: "https://newtool.site/item/scanlume",
    image: "https://newtool.site/badges/newtool-light.svg",
    alt: "Featured on NewTool.site",
    width: 200,
    height: 54,
  },
];

export const metadata = buildMetadata({
  title: "Featured on",
  description:
    "Diretorios, launchpads e plataformas onde o Scanlume foi listado durante a fase inicial do produto.",
  pathname: "/featured-on",
});

export default function FeaturedOnPage() {
  return (
    <section className="section-band legal-band">
      <div className="container featured-page-shell">
        <div className="legal-copy featured-page-copy">
          <p className="eyebrow">Featured on</p>
          <h1>Onde o Scanlume foi listado.</h1>
          <p>
            Esta pagina concentra badges e links de plataformas, launchpads e diretorios onde o projeto foi publicado.
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
