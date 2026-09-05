import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Deliberately tiny: the dictionaries only ever need emphasis, inline code and
// links, and a full markdown parser would be more bytes than the copy itself.
const TOKEN = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g

function renderLink(label: string, href: string, key: number): ReactNode {
  if (href.startsWith('/')) {
    return (
      <Link key={key} to={href} className="text-accent hover:underline">
        {label}
      </Link>
    )
  }
  const external = /^https?:/i.test(href)
  return (
    <a
      key={key}
      href={href}
      className="text-accent hover:underline"
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {label}
    </a>
  )
}

/**
 * Renders a dictionary string that contains **bold**, `code` or [links](href).
 * Internal links (starting with "/") route through React Router.
 */
export function Rich({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0

  TOKEN.lastIndex = 0
  for (let m = TOKEN.exec(text); m !== null; m = TOKEN.exec(text)) {
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index))
    const [, bold, code, label, href] = m
    if (bold !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {bold}
        </strong>,
      )
    } else if (code !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-mute px-1 py-0.5 font-mono text-[0.9em] text-ink"
        >
          {code}
        </code>,
      )
    } else if (label !== undefined && href !== undefined) {
      nodes.push(renderLink(label, href, key++))
    }
    cursor = m.index + m[0].length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))

  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  )
}
