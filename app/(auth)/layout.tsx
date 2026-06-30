export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main style={{ minHeight: "100dvh" }}>
      {children}
    </main>
  );
}
