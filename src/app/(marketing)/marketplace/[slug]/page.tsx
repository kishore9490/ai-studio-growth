import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/product-detail";
import { getProductBySlug, getProductPreview, getPublishedProducts } from "@/lib/server/catalog";

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/marketplace/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  return product ? { title: product.name, description: product.tagline } : { title: "Product not found" };
}

export default async function PublicProductPage(props: PageProps<"/marketplace/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const preview = await getProductPreview(product.id);
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6">
      <ProductDetail product={product} preview={preview} state={{ kind: "guest" }} catalogHref="/marketplace" />
    </div>
  );
}
