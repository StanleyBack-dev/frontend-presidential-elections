import type { ReceiptChoice } from "./receipt-choice";
import { BRAZILIAN_STATE_NAMES } from "../../../shared/constants/brazilian-states";

export interface ReceiptData {
  state: string;
  /** Server timestamp of the vote (ISO 8601). */
  votedAt: string;
  /** Only present when the voter chose to reveal their vote. */
  choice: ReceiptChoice | null;
  siteHost: string;
}

// Instagram Stories (9:16). The top ~250px and bottom ~340px are covered by
// the Stories UI (progress bar, profile, reply box), so everything that
// matters is laid out between SAFE_TOP and SAFE_BOTTOM.
export const RECEIPT_WIDTH = 1080;
export const RECEIPT_HEIGHT = 1920;
const SAFE_TOP = 250;
const SAFE_BOTTOM = RECEIPT_HEIGHT - 300;

const FONT =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const GREEN_DARK = "#064e3b";
const GREEN = "#047857";
const YELLOW = "#facc15";
const INK = "#0f172a";
const MUTED = "#64748b";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws `image` cropped to a circle (cover, anchored to the top). */
function drawCirclePhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  ringColor: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.fillStyle = ringColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const scale = (radius * 2) / Math.min(image.width, image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, cx - w / 2, cy - radius, w, h);
  ctx.restore();
}

/** Round badge with a check mark (used when there's no photo). */
function drawCheckBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  stroke: string,
) {
  const k = radius / 120;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.lineWidth = 26 * k;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.moveTo(cx - 55 * k, cy + 2 * k);
  ctx.lineTo(cx - 12 * k, cy + 45 * k);
  ctx.lineTo(cx + 62 * k, cy - 40 * k);
  ctx.stroke();
}

/** Shrinks the font until `text` fits `maxWidth`. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
) {
  let current = size;
  do {
    ctx.font = `${weight} ${current}px ${FONT}`;
    current -= 2;
  } while (ctx.measureText(text).width > maxWidth && current > 20);
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/**
 * Renders the shareable receipt as a PNG. Contains no personal data: no
 * name or e-mail — only the state, the time and, if the voter opted in,
 * their vote (candidate, blank or null).
 */
export async function renderReceiptImage(data: ReceiptData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_WIDTH;
  canvas.height = RECEIPT_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const centerX = RECEIPT_WIDTH / 2;

  await document.fonts?.ready;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, RECEIPT_HEIGHT);
  gradient.addColorStop(0, GREEN_DARK);
  gradient.addColorStop(1, GREEN);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT);

  // Brazilian flag accent stripes (decorative, fine under the Stories UI)
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, RECEIPT_WIDTH, 16);
  ctx.fillRect(0, RECEIPT_HEIGHT - 16, RECEIPT_WIDTH, 16);

  // Heading
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 38px ${FONT}`;
  ctx.fillText(
    "ELEIÇÕES PRESIDENCIAIS 2026 · 2º TURNO",
    centerX,
    SAFE_TOP + 50,
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 170px ${FONT}`;
  ctx.fillText("EU VOTEI!", centerX, SAFE_TOP + 230);

  // Card
  const cardX = 80;
  const cardY = SAFE_TOP + 270;
  const cardW = RECEIPT_WIDTH - cardX * 2;
  const cardH = 830;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = MUTED;
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText("COMPROVANTE DE PARTICIPAÇÃO", centerX, cardY + 90);

  const photoCenterY = cardY + 300;
  const photoRadius = 150;
  const titleY = cardY + 560;
  const subtitleY = cardY + 622;

  const choice = data.choice;
  if (choice) {
    const photo = choice.photoUrl ? await loadImage(choice.photoUrl) : null;
    if (photo) {
      drawCirclePhoto(
        ctx,
        photo,
        centerX,
        photoCenterY,
        photoRadius,
        choice.color,
      );
    } else {
      drawCheckBadge(
        ctx,
        centerX,
        photoCenterY,
        photoRadius,
        "#e2e8f0",
        choice.color,
      );
    }
    ctx.fillStyle = INK;
    fitText(ctx, choice.title, 800, 64, cardW - 80);
    ctx.fillText(choice.title, centerX, titleY);
    if (choice.subtitle) {
      ctx.fillStyle = choice.color;
      ctx.font = `700 46px ${FONT}`;
      ctx.fillText(choice.subtitle, centerX, subtitleY);
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = `500 40px ${FONT}`;
      ctx.fillText("Meu voto foi registrado", centerX, subtitleY);
    }
  } else {
    // Secret ballot: a check mark instead of the choice.
    drawCheckBadge(ctx, centerX, photoCenterY, photoRadius, "#d1fae5", GREEN);
    ctx.fillStyle = INK;
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText("Voto registrado", centerX, titleY);
    ctx.fillStyle = MUTED;
    ctx.font = `500 40px ${FONT}`;
    ctx.fillText("Meu voto é secreto", centerX, subtitleY);
  }

  // Divider + details
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 70, cardY + 680);
  ctx.lineTo(cardX + cardW - 70, cardY + 680);
  ctx.stroke();

  const stateName = BRAZILIAN_STATE_NAMES[data.state] ?? data.state;
  ctx.fillStyle = INK;
  ctx.font = `600 38px ${FONT}`;
  ctx.fillText(`${stateName} (${data.state})`, centerX, cardY + 740);
  ctx.fillStyle = MUTED;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText(
    `${dateFormatter.format(new Date(data.votedAt))} · horário de Brasília`,
    centerX,
    cardY + 787,
  );

  // Call to action — kept above the reply box area of Stories.
  ctx.fillStyle = YELLOW;
  ctx.font = `800 72px ${FONT}`;
  ctx.fillText("E você? Vote também!", centerX, SAFE_BOTTOM - 150);
  ctx.fillStyle = "#ffffff";
  fitText(ctx, data.siteHost, 700, 50, RECEIPT_WIDTH - 160);
  ctx.fillText(data.siteHost, centerX, SAFE_BOTTOM - 80);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(
    "Enquete popular não oficial · sem valor de pesquisa eleitoral",
    centerX,
    SAFE_BOTTOM - 24,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
