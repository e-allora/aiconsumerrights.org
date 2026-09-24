// Shown for URLs outside any locale. It has no locale, so it speaks both.
export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground">
        <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
          <h1 className="text-display-lg">Page not found</h1>
          <p lang="es" className="text-xl">
            No encontramos esta página.
          </p>
          <ul className="flex flex-wrap gap-4 text-lg font-semibold">
            <li>
              <a href="/en" hrefLang="en" className="tap-target text-link underline underline-offset-4">
                Go to the home page
              </a>
            </li>
            <li>
              <a href="/es" hrefLang="es" lang="es" className="tap-target text-link underline underline-offset-4">
                Ir a la página de inicio
              </a>
            </li>
          </ul>
        </main>
      </body>
    </html>
  );
}
