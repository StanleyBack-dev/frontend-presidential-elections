/**
 * Copies text to the clipboard. `navigator.clipboard` only exists in secure
 * contexts (HTTPS or localhost) — e.g. it's undefined when the site is opened
 * from a phone over the LAN IP, and in some in-app browsers — so this falls
 * back to the legacy `execCommand("copy")` on a temporary textarea.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or document not focused: try the fallback.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  // Off-screen but still selectable; font-size ≥16px avoids iOS zooming in.
  textarea.style.cssText =
    "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange = selection?.rangeCount ? selection.getRangeAt(0) : null;

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length); // iOS Safari

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  if (previousRange && selection) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }

  return copied;
}
