import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticlePage } from "@/components/blog-article-page";
import { BLOG_POSTS, getBlogPost, getBlogPostUrl } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const post = getBlogPost(slug);

    if (!post) {
      return {
        title: `Blog | ${SITE_NAME}`,
      };
    }

    const canonical = getBlogPostUrl(post.slug);

    return {
      title: post.title,
      description: post.description,
      applicationName: SITE_NAME,
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title: post.title,
        description: post.description,
        url: canonical,
        siteName: SITE_NAME,
        type: "article",
        locale: "pt_BR",
        publishedTime: post.publishedAt,
        images: [
          {
            url: `${SITE_URL}${post.coverImage}`,
            alt: post.coverAlt,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
        images: [`${SITE_URL}${post.coverImage}`],
      },
    } satisfies Metadata;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogArticlePage post={post} />;
}
