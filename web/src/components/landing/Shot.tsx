/**
 * A real screenshot of the application.
 *
 * Everything else on this page is drawn in HTML, which keeps it crisp and
 * translatable — but a person deciding whether to download something wants to
 * see the actual window. These come from the end-to-end harness
 * (`e2e/store-shots.spec.ts` in the app repository), so they are the real app
 * rather than a mockup, and they are regenerated rather than retouched.
 *
 * Two files per picture: the site's light/dark switch is a `dark` class, and a
 * light screenshot on a dark page is a white slab.
 */
export function Shot({
  name,
  alt,
  priority = false,
}: {
  /** Base name in `public/shots`; `-dark.png` is expected beside it. */
  name: string
  alt: string
  /** The first one on the page is worth fetching early. */
  priority?: boolean
}) {
  const common =
    'w-full rounded-xl border border-line shadow-card ' +
    (priority ? '' : '')

  return (
    <div className="overflow-hidden rounded-xl">
      <img
        src={`/shots/${name}.png`}
        alt={alt}
        width={1800}
        height={1128}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${common} dark:hidden`}
      />
      <img
        src={`/shots/${name}-dark.png`}
        alt={alt}
        width={1800}
        height={1128}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${common} hidden dark:block`}
      />
    </div>
  )
}
