import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { Comment } from './primitives'

/** One install recipe with a copy button; the block is the clipboard payload. */
export function CopyableCommand({
  comment,
  lines,
  className = '',
}: {
  comment: string
  lines: string[]
  className?: string
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked (insecure context, denied permission) — the text is
      // still selectable, so there is nothing useful to report.
    }
  }

  return (
    <div
      className={`flex items-start justify-between gap-4 bg-code px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-code-fg ${className}`}
    >
      <div className="min-w-0 overflow-x-auto">
        <div>
          <Comment>{comment}</Comment>
        </div>
        {lines.map((line) => (
          <div key={line} className="whitespace-pre">
            {line}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={t.cli.copyLabel}
        className="shrink-0 rounded-md border border-code-line px-2.5 py-1 text-[11px] text-code-dim transition-colors hover:border-code-dim hover:text-code-fg"
      >
        {copied ? t.cli.copied : t.cli.copy}
      </button>
    </div>
  )
}
