// Extra languages through the free Google Translate website widget.
// English and Khmer are our own text (en.js / km.js). For the languages below the
// site shows English and Google translates the page in the visitor's browser.
// Google only loads its script after a visitor picks one of these languages.

export const MACHINE_LANGUAGES = [
  { code: "zh-CN", label: "简体中文", short: "中文" },
  { code: "ko", label: "한국어", short: "한국어" },
  { code: "ja", label: "日本語", short: "日本語" },
  { code: "th", label: "ไทย", short: "ไทย" },
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "fr", label: "Français", short: "FR" },
];

const CODES = MACHINE_LANGUAGES.map((l) => l.code);
export const isMachineLanguage = (code) => CODES.includes(code);

const SCRIPT_ID = "google-translate-script";
const CONTAINER_ID = "google_translate_element";

function cookieDomains() {
  const host = window.location.hostname;
  const parts = host.split(".");
  // Google sets the cookie on the host and on the parent domain; clear/set both.
  return parts.length > 1 ? [host, "." + parts.slice(-2).join(".")] : [host];
}

/** The language Google is set to translate into, from its cookie, or null. */
export function readGoogleCookie() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function setGoogleCookie(code) {
  const value = `/en/${code}`;
  document.cookie = `googtrans=${value}; path=/`;
  for (const d of cookieDomains()) document.cookie = `googtrans=${value}; path=/; domain=${d}`;
}

export function clearGoogleCookie() {
  const expire = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "googtrans" + expire;
  for (const d of cookieDomains()) document.cookie = "googtrans" + expire + "; domain=" + d;
}

// Google replaces text with its own <font> tags. When React later removes or moves
// those nodes it can crash ("Failed to execute 'removeChild'"). This well-known guard
// makes React skip nodes Google already moved. Installed only when Google is in use.
let guarded = false;
function guardReactAgainstGoogle() {
  if (guarded || typeof Node !== "function") return;
  guarded = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return removeChild.apply(this, arguments);
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return insertBefore.apply(this, arguments);
  };
}

function selectInWidget(code, attempt = 0) {
  const select = document.querySelector(".goog-te-combo");
  if (select) {
    select.value = code;
    select.dispatchEvent(new Event("change"));
    return;
  }
  if (attempt < 40) setTimeout(() => selectInWidget(code, attempt + 1), 150);
}

/** Translate the page into `code` with Google. Safe to call again to switch language. */
export function startGoogleTranslate(code) {
  guardReactAgainstGoogle();
  setGoogleCookie(code);

  if (!document.getElementById(CONTAINER_ID)) {
    const box = document.createElement("div");
    box.id = CONTAINER_ID;
    box.style.display = "none";
    document.body.appendChild(box);
  }

  if (window.google?.translate?.TranslateElement) {
    selectInWidget(code);
    return;
  }

  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      { pageLanguage: "en", includedLanguages: CODES.join(","), autoDisplay: false },
      CONTAINER_ID
    );
    selectInWidget(code);
  };

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
}
