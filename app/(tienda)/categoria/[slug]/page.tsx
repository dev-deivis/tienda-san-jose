export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>Categoría: {slug} — próximamente</div>;
}
