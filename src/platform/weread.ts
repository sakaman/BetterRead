const READER_PATH = /^\/web\/reader\/([^/?#]+)/;

export function getBookId(pathname = location.pathname): string | null {
  return READER_PATH.exec(pathname)?.[1] ?? null;
}

export function isReaderPage(pathname = location.pathname): boolean {
  return READER_PATH.test(pathname);
}

export const selectors = {
  readerBody: "body.wr_page_reader",
  chapter: [
    ".readerChapterContent",
    "[class*='readerChapterContent']",
    "[class*='chapterContent']",
  ].join(","),
  readingBlocks: "p,h1,h2,h3,h4,li,blockquote",
  chrome: [
    ".readerTopBar",
    ".readerControls",
    ".readerHeaderButton",
    ".readerFooter",
    "[class*='readerControls']",
    "[class*='readerTopBar']",
  ].join(","),
} as const;

export function findReadingScroller(): HTMLElement {
  const scrolling = document.scrollingElement;
  return scrolling instanceof HTMLElement ? scrolling : document.documentElement;
}
