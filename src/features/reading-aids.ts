import type { BetterReadSettings } from "../core/settings.ts";
import { findReadingScroller, getNativeChapterTitle, selectors } from "../platform/weread.ts";

export class ReadingAidsController {
  private settings: BetterReadSettings | null = null;
  private progress: HTMLDivElement | null = null;
  private chapterChip: HTMLDivElement | null = null;
  private activeLine: Element | null = null;
  private frame = 0;
  private hideControlsTimer = 0;
  private lastScrollTop = 0;
  private scrollDirection = 0;
  private scrollDistance = 0;

  private readonly onActivity = () => {
    if (!this.settings?.enabled || !this.settings.autoHideControls) return;
    document.documentElement.dataset.brControlsHidden = "false";
    window.clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = window.setTimeout(() => {
      if (this.settings?.enabled && this.settings.autoHideControls) {
        document.documentElement.dataset.brControlsHidden = "true";
      }
    }, 1500);
  };

  private readonly scheduleUpdate = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.updateProgress();
      this.updateChapter();
    });
  };

  private readonly onScroll = () => {
    this.scheduleUpdate();
    const current = findReadingScroller().scrollTop;
    const delta = current - this.lastScrollTop;
    this.lastScrollTop = current;
    if (!this.settings?.enabled || !this.settings.focusMode || Math.abs(delta) < 2) return;

    const direction = delta > 0 ? 1 : -1;
    if (direction !== this.scrollDirection) {
      this.scrollDirection = direction;
      this.scrollDistance = 0;
    }
    this.scrollDistance += Math.abs(delta);
    if (direction < 0) {
      document.documentElement.dataset.brFocusHidden = "false";
      return;
    }
    if (this.scrollDistance < 18) return;
    document.documentElement.dataset.brFocusHidden = String(current > 24);
  };

  private readonly onWheel = (event: WheelEvent) => {
    if (!this.settings?.enabled || !this.settings.focusMode || event.deltaY >= -2) return;
    this.scrollDirection = -1;
    this.scrollDistance = 0;
    document.documentElement.dataset.brFocusHidden = "false";
  };

  private readonly onPointerOver = (event: PointerEvent) => {
    if (!this.settings?.enabled || !this.settings.lineFocus) return;
    const target = event.target instanceof Element ? event.target.closest(selectors.readingBlocks) : null;
    if (!target || !target.closest(selectors.chapter) || target === this.activeLine) return;
    this.activeLine?.classList.remove("betterread-active-line");
    target.classList.add("betterread-active-line");
    this.activeLine = target;
  };

  mount(): void {
    if (!this.progress) {
      this.progress = document.createElement("div");
      this.progress.id = "betterread-progress";
      this.progress.setAttribute("aria-hidden", "true");
      this.progress.innerHTML = "<span></span>";
      document.body.append(this.progress);
    }
    if (!this.chapterChip) {
      this.chapterChip = document.createElement("div");
      this.chapterChip.id = "betterread-chapter-chip";
      this.chapterChip.setAttribute("aria-hidden", "true");
      document.body.append(this.chapterChip);
    }
    this.lastScrollTop = findReadingScroller().scrollTop;
    window.addEventListener("scroll", this.onScroll, { passive: true });
    document.addEventListener("scroll", this.onScroll, { capture: true, passive: true });
    document.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("resize", this.scheduleUpdate, { passive: true });
    document.addEventListener("pointermove", this.onActivity, { passive: true });
    document.addEventListener("pointerdown", this.onActivity, { passive: true });
    document.addEventListener("keydown", this.onActivity);
    document.addEventListener("focusin", this.onActivity);
    document.addEventListener("pointerover", this.onPointerOver, { passive: true });
    this.scheduleUpdate();
  }

  apply(settings: BetterReadSettings): void {
    const focusWasActive = Boolean(this.settings?.enabled && this.settings.focusMode);
    const focusIsActive = settings.enabled && settings.focusMode;
    this.settings = settings;
    if (focusWasActive !== focusIsActive) {
      this.lastScrollTop = findReadingScroller().scrollTop;
      this.scrollDirection = 0;
      this.scrollDistance = 0;
      document.documentElement.dataset.brFocusHidden = "false";
    }
    if (this.progress) this.progress.hidden = !settings.enabled || !settings.showProgress;
    if (!settings.enabled || !settings.lineFocus) {
      this.activeLine?.classList.remove("betterread-active-line");
      this.activeLine = null;
    }
    if (settings.enabled && settings.autoHideControls) this.onActivity();
    else {
      window.clearTimeout(this.hideControlsTimer);
      document.documentElement.dataset.brControlsHidden = "false";
    }
    this.scheduleUpdate();
  }

  private updateProgress(): void {
    if (!this.progress || !this.settings?.enabled || !this.settings.showProgress) return;
    const scroller = findReadingScroller();
    const available = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const value = Math.min(1, Math.max(0, scroller.scrollTop / available));
    this.progress.style.setProperty("--br-progress", value.toFixed(4));
  }

  private updateChapter(): void {
    if (!this.chapterChip || !this.settings?.enabled) return;
    const headings = [...new Set(
      [...document.querySelectorAll(selectors.chapter)]
        .flatMap((container) => [...container.querySelectorAll("h1,h2,h3")]),
    )].filter((node): node is HTMLElement => node instanceof HTMLElement && node.offsetParent !== null);
    let current = headings[0] ?? null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 140) current = heading;
      else break;
    }
    const title = current?.textContent?.trim() || getNativeChapterTitle();
    this.chapterChip.textContent = title;
    this.chapterChip.hidden = !title;
  }

  destroy(): void {
    window.removeEventListener("scroll", this.onScroll);
    document.removeEventListener("scroll", this.onScroll, { capture: true });
    document.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("resize", this.scheduleUpdate);
    document.removeEventListener("pointermove", this.onActivity);
    document.removeEventListener("pointerdown", this.onActivity);
    document.removeEventListener("keydown", this.onActivity);
    document.removeEventListener("focusin", this.onActivity);
    document.removeEventListener("pointerover", this.onPointerOver);
    window.clearTimeout(this.hideControlsTimer);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.activeLine?.classList.remove("betterread-active-line");
    this.progress?.remove();
    this.chapterChip?.remove();
  }
}
