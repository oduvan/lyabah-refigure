// The English dictionary is the source of truth: every other locale is typed
// against it (see uk.ts), so a missing or misspelt key fails the build.
//
// Strings marked "rich" are rendered through <Rich>, which understands
// **bold**, `code` and [label](href). Everything else is plain text.
export const en = {
  meta: {
    locale: 'en-GB',
    htmlLang: 'en',
    name: 'English',
    home: {
      title: 'Refigure — annotate once, update forever',
      description:
        'Refigure keeps tutorial screenshots current. Arrows, labels and crops are stored as data, not baked into pixels, so when the UI changes you adjust instead of starting again.',
    },
    privacy: {
      title: 'Privacy — Refigure',
      description:
        'Refigure has no account, no analytics and no server. Your projects stay on your computer.',
    },
    notFound: {
      title: 'Page not found — Refigure',
      description: 'That page does not exist.',
    },
  },

  nav: {
    skipToContent: 'Skip to content',
    home: 'Home',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
  },

  hero: {
    title: 'Annotate once. Update forever.',
    subtitle:
      'Refigure keeps tutorial screenshots current. Arrows, labels and crops are stored as data, not baked into pixels — so when the UI changes, you adjust instead of starting again.',
    freeNote: 'Free. No limits.',
    platforms: 'macOS, Windows, Linux',
    otherPlatforms: 'Other platforms',
  },

  // The fake Refigure window in the hero.
  editor: {
    app: 'Refigure',
    path: 'docs-screenshots / settings.yaml',
    tools: {
      cut: 'Cut',
      arrow: 'Arrow',
      rect: 'Rect',
      text: 'Text',
      export: 'Export',
    },
    status: '1 cut · 2 figures',
    file: 'settings@2x.png',
    saved: 'saved',
  },

  // The fake application being screenshotted.
  mock: {
    windowTitle: 'Acme — Settings',
    windowTitleLong: 'Acme — Settings · Integrations',
    nav: {
      general: 'General',
      integrations: 'Integrations',
      team: 'Team',
      billing: 'Billing',
    },
    apiAccess: 'API access',
    apiBlurb: 'Connect an external service by pasting its access token below.',
    tokenPlaceholder: 'tok_ ············',
    tokenPlaceholderShort: 'tok_ ·······',
    connect: 'Connect',
    tokenNote: 'Tokens are stored locally and never leave this machine.',
    tokenError: 'Token was rejected. Check it has the read scope.',
    annotationPaste: 'Paste the token here',
    annotationClick: 'Click Connect',
  },

  rot: {
    title: 'Screenshots rot.',
    body: 'Every product ships a redesign, a rebrand, or moves a button. Then every annotated image has to be captured, cropped, drawn and exported again — so in practice it doesn’t happen, and the documentation quietly goes stale.',
    aside:
      'Outdated screenshots are worse than none. They confuse the people following them.',
    captionThen: 'The tutorial, written in March',
    captionNow: 'The same screen today — the button moved',
  },

  data: {
    title: 'Your work is data, not pixels.',
    body: 'A project is a folder. Screenshots go in; on top you define **cuts** — named rectangles, each exporting as one image — and **figures**: arrows, rectangles, lines and text. All of it is saved as readable YAML beside the images.',
  },

  loop: {
    title: 'Then the UI changes, and you adjust.',
    steps: [
      {
        label: '1 · Create.',
        body: 'Drop screenshots. Draw cuts. Add arrows. Export the set.',
      },
      {
        label: '2 · Ship.',
        body: 'The product changes. The screenshots are now wrong.',
      },
      {
        label: '3 · Update.',
        body: 'Drop the new screenshots in, map them to the screens they replace, nudge what moved, re-export everything.',
      },
    ],
    nudged: '↑ nudged',
    kicker:
      'Five minutes of adjusting, instead of an hour of recreating. Every release.',
  },

  compare: {
    title: 'See exactly what moved.',
    body: 'Fade between the old screenshot and the new one under your existing annotations. Anything out of place is obvious, and a nudge is one arrow key.',
    old: 'old',
    new: 'new',
    caption:
      'The old button fades out where it was; the annotations haven’t moved yet.',
    sliderLabel: 'Fade between the old and the new screenshot',
  },

  many: {
    title: 'One screenshot. As many images as you need.',
    body: 'Cuts are named, and the name becomes the file name. One screenshot of a settings page can produce six tutorial images, each staying in step with the others.',
  },

  restyle: {
    title: 'Change a colour once. Re-export the set.',
    body: 'Style cascades from the project to a screen to a single figure. A rebrand is one edit and one export, not an afternoon.',
    caption: 'One line changed in the project file. Three images re-exported.',
  },

  files: {
    title: 'A folder you can commit.',
    body: 'Plain images and plain YAML in one folder. Diff it, review it, keep it in the docs repository next to the docs. No cloud account, no lock-in, no proprietary file.',
    diffCaption: '2 lines changed — a new screenshot, one cut nudged 16px down.',
  },

  cli: {
    title: 'The same exporter, without the app.',
    body: 'Every image Refigure writes is produced by [refigure-cli](https://github.com/oduvan/refigure-cli) — one static binary, open source, no runtime to install. The app runs it for you. On a build machine you run it yourself, so the images in your docs are rebuilt from the project file on every push and can never drift from it.',
    comments: {
      npx: '# A docs project that already has Node — nothing to install',
      brew: '# macOS and Linux, with Homebrew',
      curl: '# Any platform: one file from the releases page',
      go: '# With a Go toolchain',
    },
    copy: 'Copy',
    copied: 'Copied',
    copyLabel: 'Copy the command to the clipboard',
    pinNote:
      'In CI, pin the version you tested with — `latest` makes your images change when the exporter does.',
    shortest: 'Then the shortest thing that shows the point:',
    sameBinary:
      'Same binary, same pixels, whether it runs on your laptop or in CI.',
    repository: 'Repository →',
  },

  assistants: {
    title: 'Works with Claude and other assistants',
    body: 'A project is plain YAML that an assistant can read and write. The exporter describes its own format and checks what was written, so the work can be handed over without anyone guessing:',
    schemaComments: {
      schema: '# the format, explained by the tool itself',
      example: '# a complete file that validates',
      validate: '# every mistake at once, with line numbers',
    },
    readsOnly:
      'The exporter only ever reads your project. It writes images, never the project file — so an assistant can propose annotations and check them, and you keep the last word.',
    validate: {
      warning: 'warning',
      line: 'line 11: unknown key',
      didYouMean: '— did you mean',
      ok: 'ok',
      summary: '3 files checked · 1 warning · 0 errors',
    },
  },

  download: {
    title: 'Free, with no limits.',
    body: 'Unlimited projects, screens and cuts. Nothing locked, nothing counted, nothing to buy.',
    mac: 'Download for macOS',
    macMeta: 'Intel & Apple silicon',
    windows: 'Get it from the Microsoft Store',
    windowsMeta: 'Windows 10 and later',
    linux: 'Download for Linux',
    linuxMeta: 'AppImage, .deb',
  },

  footer: {
    github: 'GitHub',
    privacy: 'Privacy',
    contact: 'Contact',
  },

  privacy: {
    title: 'Refigure — Privacy Policy',
    updated: 'Last updated',
    updatedIso: '2026-09-03',
    intro:
      'Refigure is a desktop application for creating and maintaining tutorial screenshots. It runs on your computer and keeps your work there.',
    sections: [
      {
        heading: 'We do not collect anything',
        paragraphs: ['Refigure has no account and no sign-in. It sends us nothing:'],
        list: [
          'No analytics, no telemetry, no crash reporting.',
          'No usage statistics of any kind.',
          'We operate no server that could receive your data.',
        ],
        after: [
          'We therefore hold no personal information about you, and there is nothing for us to share, sell, or disclose.',
        ],
      },
      {
        heading: 'Your projects stay on your computer',
        paragraphs: [
          'A Refigure project is a folder you choose: your screenshot image files, and a plain-text `refigure.yaml` file describing the annotations you have drawn.',
        ],
        list: [
          'Those files are read and written only on your own computer.',
          'They are never uploaded anywhere.',
          'Refigure opens only the folders you select yourself, through the standard Windows file picker.',
        ],
        after: ['Exported images are written to the destination folder you choose.'],
      },
      {
        heading: 'When Refigure uses the network',
        paragraphs: [
          'Refigure works offline. It contacts the internet in one situation only.',
          '**Downloading the exporter.** Images are produced by a separate open-source program, refigure-cli. The first time you export, Refigure downloads that program from GitHub (`github.com` and `api.github.com`), checks it against the checksum published with the release, and keeps a copy on your computer. This happens once — not on every export, and never when the application starts. Afterwards Refigure checks at most once a day whether a newer version exists.',
          'As with visiting any website, GitHub can see the IP address of the computer making that request. Refigure sends GitHub nothing about you, your projects, or what you export. GitHub’s privacy statement covers that request: [docs.github.com/site-policy/privacy-policies](https://docs.github.com/site-policy/privacy-policies)',
          'On Windows, Refigure does not check for application updates — updates are delivered by the Microsoft Store.',
        ],
        list: [],
        after: [],
      },
      {
        heading: 'Files Refigure keeps on your computer',
        paragraphs: [
          'Refigure stores a small amount of data in your user application folder: your settings, the list of recently opened projects, and the downloaded exporter. None of it leaves your computer, and uninstalling the application removes it.',
        ],
        list: [],
        after: [],
      },
      {
        heading: 'Children',
        paragraphs: [
          'Refigure is a tool for writing documentation. It is not directed at children, and it collects no information from anyone.',
        ],
        list: [],
        after: [],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'If this policy changes, the updated version will be published here with a new date.',
        ],
        list: [],
        after: [],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about this policy: [a.lyabah@checkio.org](mailto:a.lyabah@checkio.org)',
        ],
        list: [],
        after: [],
      },
    ],
    backHome: '← Back to the home page',
  },

  notFound: {
    title: 'Page not found',
    body: 'That page does not exist — it may have moved, or the link may be wrong.',
    backHome: '← Back to the home page',
  },
}

/** The shape every locale must provide. English is the reference. */
export type Dictionary = typeof en
