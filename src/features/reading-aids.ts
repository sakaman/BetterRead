import type { BetterReadSettings } from "../core/settings.ts";
import { findReadingScroller, selectors } from "../platform/weread.ts";

export class ReadingAidsController {
  private settings: BetterReadSettings | null = null;
  private progress: HTMLDivElement | null = null;
  private chapterChip: HTMLDivElement | null = null;
  private activeLine: Element | null = null;
  private frame = 0;

  private readonly scheduleUpdate = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.updateProgress();
      this.updateChapter();
    });
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
    window.addEventListener("scroll", this.scheduleUpdate, { passive: true });
    window.addEventListener("resize", this.scheduleUpdate, { passive: true });
    document.addEventListener("pointerover", this.onPointerOver, { passive: true });
    this.scheduleUpdate();
  }

  apply(settings: BetterReadSettings): void {
    this.settings = settings;
    if (this.progress) this.progress.hidden = !settings.enabled || !settings.showProgress;
    if (!settings.enabled || !settings.lineFocus) {
      this.activeLine?.classList.remove("betterread-active-line");
      this.activeLine = null;
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
    this.chapterChip.textContent = current?.textContent?.trim() || "";
  }

  destroy(): void {
    window.removeEventListener("scroll", this.scheduleUpdate);
    window.removeEventListener("resize", this.scheduleUpdate);
    document.removeEventListener("pointerover", this.onPointerOver);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.activeLine?.classList.remove("betterread-active-line");
    this.progress?.remove();
    this.chapterChip?.remove();
  }
}
