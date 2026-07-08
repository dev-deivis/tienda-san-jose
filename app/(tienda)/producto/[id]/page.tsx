export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>Producto: {id} — próximamente</div>;
}
