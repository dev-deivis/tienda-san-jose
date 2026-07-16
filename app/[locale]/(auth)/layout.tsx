export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex items-start justify-center px-4 pt-5 pb-12">
      {children}
    </div>
  );
}
