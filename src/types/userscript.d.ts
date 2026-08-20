declare function GM_addStyle(css: string): HTMLStyleElement;
declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue<T>(key: string, value: T): void;
declare function GM_deleteValue(key: string): void;
declare function GM_registerMenuCommand(label: string, handler: () => void): void;
declare const __BETTERREAD_VERSION__: string;
