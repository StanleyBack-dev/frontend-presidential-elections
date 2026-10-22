import type { ReceiptChoice } from "./receipt-choice";

export function siteUrl(): string {
  return `${window.location.origin}/`;
}

export type ShareNetwork = "whatsapp" | "telegram" | "x" | "facebook";

/** The vote line of the message; `*...*` marks bold (WhatsApp only). */
function voteLine(choice: ReceiptChoice | null): string {
  switch (choice?.kind) {
    case "CANDIDATE":
      return `Meu voto na Enquete Presidencial 2026 🇧🇷 foi para *${choice.title}*${
        choice.subtitle ? ` (${choice.subtitle})` : ""
      } 💪`;
    case "BLANK":
      return "Na Enquete Presidencial 2026 🇧🇷 eu votei *em branco* ⬜";
    case "NULL_VOTE":
      return "Na Enquete Presidencial 2026 🇧🇷 eu votei *nulo* ❌";
    default:
      return "Participei da Enquete Presidencial 2026 🇧🇷 — meu voto é secreto 🤫";
  }
}

/**
 * Full message (without the link). WhatsApp renders `*bold*`; everywhere
 * else the asterisks would show up literally, so they're stripped.
 */
export function shareText(
  choice: ReceiptChoice | null,
  network: ShareNetwork | "native" = "native",
): string {
  if (network === "x") {
    // Short single paragraph: X counts characters and adds the link itself.
    const cta = "E você? Vote também e acompanhe o resultado ao vivo 👇";
    const vote =
      choice?.kind === "CANDIDATE"
        ? `meu voto foi para ${choice.title}`
        : choice?.kind === "BLANK"
          ? "eu votei em branco"
          : choice?.kind === "NULL_VOTE"
            ? "eu votei nulo"
            : null;
    return vote
      ? `🗳️✅ EU JÁ VOTEI! Na Enquete Presidencial 2026 🇧🇷 ${vote}. ${cta}`
      : `🗳️✅ EU JÁ VOTEI na Enquete Presidencial 2026 🇧🇷! ${cta}`;
  }

  const text = [
    "🗳️✅ *EU JÁ VOTEI!*",
    "",
    voteLine(choice),
    "",
    "👉 E você, já votou? Leva menos de 1 minuto ⏱️",
    "📊 Acompanhe o resultado ao vivo, estado por estado:",
  ].join("\n");

  return network === "whatsapp" ? text : text.replace(/\*/g, "");
}

/** Message + link, for share targets that take a single text field. */
export function shareTextWithUrl(
  choice: ReceiptChoice | null,
  url: string,
  network: ShareNetwork | "native" = "native",
): string {
  return `${shareText(choice, network)}\n${url}`;
}

/**
 * Web intents. They only carry text and a link — no app accepts an image
 * this way; the link preview (Open Graph tags in index.html) supplies one.
 */
export function socialShareLinks(choice: ReceiptChoice | null, url: string) {
  const u = encodeURIComponent(url);

  return [
    {
      key: "whatsapp" as const,
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(shareTextWithUrl(choice, url, "whatsapp"))}`,
    },
    {
      key: "telegram" as const,
      label: "Telegram",
      href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(shareText(choice, "telegram"))}`,
    },
    {
      key: "x" as const,
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(choice, "x"))}&url=${u}&hashtags=Eleicoes2026,EuVotei`,
    },
    {
      key: "facebook" as const,
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
  ];
}

/** Native share sheet with the image attached, where the device supports it. */
export async function shareNatively(
  file: File,
  message: string,
): Promise<"shared" | "cancelled" | "unsupported"> {
  const withFile = {
    files: [file],
    text: message,
    title: "Eu votei!",
  };

  try {
    if (navigator.canShare?.(withFile)) {
      await navigator.share(withFile);
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ text: message, title: "Eu votei!" });
      return "shared";
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") return "cancelled";
    throw error;
  }
  return "unsupported";
}

export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/**
 * Websites can't post to Instagram Stories directly (Instagram only allows
 * that to native apps). The closest path is the OS share sheet with the
 * image attached: on Android and iOS it lists Instagram, which offers
 * "Stories". Only the file is passed — with extra text attached, Instagram
 * tends to offer just Direct messages instead of Stories.
 */
export async function shareToInstagramStories(
  file: File,
): Promise<"shared" | "cancelled" | "unsupported"> {
  const payload = { files: [file] };
  if (!navigator.canShare?.(payload)) return "unsupported";

  try {
    await navigator.share(payload);
    return "shared";
  } catch (error) {
    if ((error as Error).name === "AbortError") return "cancelled";
    throw error;
  }
}
