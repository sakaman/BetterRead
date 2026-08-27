export const READER_CSS = String.raw`
html[data-br-enabled="true"] {
  --br-bg: #f4f2ed;
  --br-surface: #fbfaf7;
  --br-text: #262b31;
  --br-muted: #727981;
  --br-border: rgba(38, 43, 49, 0.12);
  --br-accent: #2f7d68;
  --br-selection: rgba(47, 125, 104, 0.22);
}

html[data-br-theme="sepia"] {
  --br-bg: #eee5d3;
  --br-surface: #f8f0df;
  --br-text: #3a3026;
  --br-muted: #756859;
  --br-border: rgba(72, 56, 38, 0.14);
  --br-selection: rgba(161, 105, 52, 0.24);
}

html[data-br-theme="parchment"] {
  --br-bg: #d8c49f;
  --br-surface: #e7d5b1;
  --br-text: #4a3826;
  --br-muted: #806b50;
  --br-border: rgba(74, 56, 38, 0.18);
  --br-selection: rgba(139, 91, 48, 0.28);
}

html[data-br-theme="bean"] {
  --br-bg: #e7d8d4;
  --br-surface: #f0e4e0;
  --br-text: #493839;
  --br-muted: #796668;
  --br-border: rgba(73, 56, 57, 0.15);
  --br-selection: rgba(143, 90, 94, 0.24);
}

html[data-br-theme="forest"] {
  --br-bg: #e4eadf;
  --br-surface: #eef2ea;
  --br-text: #25322c;
  --br-muted: #607068;
  --br-border: rgba(37, 61, 49, 0.14);
  --br-selection: rgba(64, 119, 88, 0.23);
}

html[data-br-theme="midnight"] {
  --br-bg: #182431;
  --br-surface: #223140;
  --br-text: #d6e1ea;
  --br-muted: #94a8b8;
  --br-border: rgba(214, 225, 234, 0.13);
  --br-selection: rgba(94, 159, 196, 0.32);
}

html[data-br-theme="dark"] {
  --br-bg: #171a1f;
  --br-surface: #20242b;
  --br-text: #d9dde3;
  --br-muted: #929aa5;
  --br-border: rgba(232, 236, 241, 0.12);
  --br-selection: rgba(78, 184, 151, 0.3);
}

html[data-br-theme="oled"] {
  --br-bg: #000;
  --br-surface: #0a0b0d;
  --br-text: #d6d8dc;
  --br-muted: #878c94;
  --br-border: rgba(255, 255, 255, 0.14);
  --br-selection: rgba(77, 196, 159, 0.32);
}

html[data-br-enabled="true"] body.wr_page_reader,
html[data-br-enabled="true"] body[data-betterread-preview] {
  color: var(--br-text) !important;
  background-color: var(--br-bg) !important;
  transition: background-color 180ms ease, color 180ms ease;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.app, .routerView, .readerContent, .app_content),
html[data-br-enabled="true"] body[data-betterread-preview] :where(.app, .routerView, .readerContent, .app_content) {
  background-color: var(--br-bg) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]),
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent {
  color: var(--br-text) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) :where(p, li, h1, h2, h3, h4, blockquote),
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent :where(p, li, h1, h2, h3, h4, blockquote) {
  color: inherit !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerTopBar, .readerFooter, [class*="readerTopBar"], [class*="readerFooter"]),
html[data-br-enabled="true"] body[data-betterread-preview] :where(.readerTopBar, .readerFooter) {
  color: var(--br-muted) !important;
  background-color: color-mix(in srgb, var(--br-surface) 94%, transparent) !important;
  border-color: var(--br-border) !important;
}

html[data-br-enabled="true"] body.wr_page_reader .readerControls button,
html[data-br-enabled="true"] body[data-betterread-preview] .readerControls button {
  color: var(--br-muted) !important;
  background-color: var(--br-surface) !important;
  border-color: var(--br-border) !important;
}

html[data-br-enabled="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) blockquote,
html[data-br-enabled="true"] body[data-betterread-preview] .readerChapterContent blockquote {
  border-inline-start-color: var(--br-accent) !important;
  background-color: color-mix(in srgb, var(--br-surface) 82%, transparent) !important;
  color: var(--br-muted) !important;
}

html[data-br-enabled="true"] body.wr_page_reader ::selection,
html[data-br-enabled="true"] body[data-betterread-preview] ::selection {
  background: var(--br-selection) !important;
}

html[data-br-enabled="true"][data-br-theme="midnight"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="dark"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="oled"] body.wr_page_reader img,
html[data-br-enabled="true"][data-br-theme="midnight"] body[data-betterread-preview] img,
html[data-br-enabled="true"][data-br-theme="dark"] body[data-betterread-preview] img,
html[data-br-enabled="true"][data-br-theme="oled"] body[data-betterread-preview] img {
  filter: brightness(0.9) contrast(0.96);
}

html[data-br-enabled="true"][data-br-focus="true"][data-br-focus-hidden="true"] body.wr_page_reader :where(.readerTopBar, .readerHeaderButton, [class*="readerTopBar"]),
html[data-br-enabled="true"][data-br-focus="true"][data-br-focus-hidden="true"] body[data-betterread-preview] .readerTopBar {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 180ms ease !important;
}

html[data-br-enabled="true"][data-br-autohide="true"][data-br-controls-hidden="true"] body.wr_page_reader .readerControls,
html[data-br-enabled="true"][data-br-autohide="true"][data-br-controls-hidden="true"] body[data-betterread-preview] .readerControls {
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translate(18px, -50%) !important;
  transition: opacity 180ms ease, transform 180ms ease !important;
}

html[data-br-enabled="true"][data-br-line-focus="true"] body.wr_page_reader :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) :where(p, h1, h2, h3, h4, li, blockquote),
html[data-br-enabled="true"][data-br-line-focus="true"] body[data-betterread-preview] .readerChapterContent :where(p, h1, h2, h3, h4, li, blockquote) {
  opacity: 0.38;
  transition: opacity 120ms ease;
}

html[data-br-enabled="true"][data-br-line-focus="true"] body :where(.readerChapterContent, [class*="readerChapterContent"], [class*="chapterContent"]) .betterread-active-line {
  opacity: 1 !important;
}

#betterread-progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 2147483645;
  height: 3px;
  pointer-events: none;
  background: transparent;
}

#betterread-progress > span {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--br-accent, #2f7d68);
  box-shadow: 0 0 10px color-mix(in srgb, var(--br-accent, #2f7d68) 55%, transparent);
  transform: scaleX(var(--br-progress, 0));
  transform-origin: left center;
  transition: transform 80ms linear;
}

#betterread-progress[hidden] { display: none !important; }

#betterread-chapter-chip {
  position: fixed;
  z-index: 2147483644;
  top: 14px;
  left: 50%;
  max-width: min(540px, calc(100vw - 160px));
  padding: 6px 12px;
  overflow: hidden;
  color: var(--br-muted, #727981);
  background: color-mix(in srgb, var(--br-surface, #fff) 88%, transparent);
  border: 1px solid var(--br-border, rgba(0,0,0,.12));
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,.08);
  font: 500 12px/1.35 ui-sans-serif, system-ui, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -6px);
  transition: opacity 160ms ease, transform 160ms ease;
}

html[data-br-enabled="true"][data-br-focus="true"] #betterread-chapter-chip {
  opacity: 0.9;
  transform: translate(-50%, 0);
}

@media (max-width: 720px) {
  #betterread-chapter-chip { max-width: calc(100vw - 104px); }
}

@media (prefers-reduced-motion: reduce) {
  html[data-br-enabled="true"] *, #betterread-progress > span, #betterread-chapter-chip {
    transition-duration: 0.01ms !important;
  }
}
`;
