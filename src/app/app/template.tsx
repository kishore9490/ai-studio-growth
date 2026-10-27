// Re-mounted on every navigation inside the app, giving pages a consistent,
// restrained entrance transition.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
