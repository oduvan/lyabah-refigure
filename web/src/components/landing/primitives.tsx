import type { CSSProperties, ReactNode } from 'react'

export function Section({
  id,
  raised = false,
  first = false,
  className = '',
  children,
}: {
  id?: string
  /** Sections the design paints white instead of the page background. */
  raised?: boolean
  /** The hero has no rule above it. */
  first?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={[
        first ? '' : 'border-t border-line',
        raised ? 'bg-raised' : '',
        'px-6 py-16 sm:py-[88px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto max-w-[1040px]">{children}</div>
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[26px] font-bold tracking-[-0.01em] text-ink text-balance sm:text-[30px]">
      {children}
    </h2>
  )
}

export function SectionBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={`text-[15px] leading-[1.65] text-body text-pretty sm:text-base ${className}`}>
      {children}
    </p>
  )
}

/** A grey block standing in for a line of text inside a mock screenshot. */
export function Bar({
  w,
  h = 8,
  soft = false,
  className = '',
}: {
  w: string
  h?: number
  soft?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: w, height: h }}
      className={`block shrink-0 rounded-full ${soft ? 'bg-skeleton-soft' : 'bg-skeleton'} ${className}`}
    />
  )
}

/** A named cut: the dashed rectangle that becomes one exported image. */
export function Cut({
  style,
  name,
  labelPosition = 'top',
  tone = 'accent',
  wash = false,
  className = '',
}: {
  style: CSSProperties
  name?: string
  labelPosition?: 'top' | 'bottom' | 'top-right'
  tone?: 'accent' | 'soft'
  wash?: boolean
  className?: string
}) {
  const border = tone === 'accent' ? 'border-accent' : 'border-accent-soft'
  const chip = tone === 'accent' ? 'bg-accent' : 'bg-accent-soft'
  const place =
    labelPosition === 'bottom'
      ? '-bottom-[10px] left-1.5'
      : labelPosition === 'top-right'
        ? '-top-[10px] right-1.5'
        : '-top-[11px] left-2'

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`pointer-events-none absolute rounded border-[1.5px] border-dashed ${border} ${
        wash ? 'bg-accent-wash' : ''
      } ${className}`}
    >
      {name && (
        <span
          className={`absolute ${place} rounded px-1.5 py-px font-mono text-[9px] font-semibold text-on-accent ${chip}`}
        >
          {name}
        </span>
      )}
    </div>
  )
}

/** An arrow figure. `currentColor` so it follows the annotation colour. */
export function Arrow({
  width,
  height,
  viewBox,
  line,
  head,
  strokeWidth = 2.5,
  style,
  className = 'text-annot',
}: {
  width: number
  height: number
  viewBox: string
  line: { x1: number; y1: number; x2: number; y2: number }
  head: string
  strokeWidth?: number
  style?: CSSProperties
  className?: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={{ overflow: 'visible', ...style }}
      className={`absolute ${className}`}
      aria-hidden="true"
    >
      <line
        {...line}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polygon points={head} fill="currentColor" />
    </svg>
  )
}

/** A text figure — the red callout label. */
export function Callout({
  children,
  style,
  className = '',
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`absolute rounded-md bg-annot px-2.5 py-1 text-[11px] font-semibold text-on-annot ${className}`}
    >
      {children}
    </span>
  )
}

/** The dark terminal / YAML panel used throughout the page. */
export function CodePanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`overflow-x-auto bg-code font-mono text-[12.5px] leading-[1.7] text-code-fg ${className}`}
    >
      {children}
    </div>
  )
}

export function Comment({ children }: { children: ReactNode }) {
  return <span className="text-code-dim">{children}</span>
}
