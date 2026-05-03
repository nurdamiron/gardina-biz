/**
 * Маркетинговый лендинг (статика из /landing.html).
 * Ссылки с target="_top" ведут в основное SPA (логин, приложение).
 */
export default function Landing() {
  return (
    <iframe
      title="Gardina"
      src="/landing.html"
      className="fixed inset-0 z-0 h-[100dvh] w-full border-0"
    />
  );
}
