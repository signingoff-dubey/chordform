import type { TrackedHand } from './tracker';

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const LANDMARK_RADIUS = 3;
const CONNECTION_WIDTH = 1.5;

export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();
}

export function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  leftHand: TrackedHand | null,
  rightHand: TrackedHand | null
): void {
  if (leftHand) {
    drawHand(ctx, width, height, leftHand, false);
  }
  if (rightHand) {
    drawHand(ctx, width, height, rightHand, false);
  }
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hand: TrackedHand,
  _isMirrored: boolean
): void {
  const landmarks = hand.landmarks;
  if (!landmarks || landmarks.length < 21) return;

  const toPixel = (lm: { x: number; y: number }) => ({
    x: (1 - lm.x) * width,
    y: lm.y * height,
  });

  const points = landmarks.map(toPixel);

  ctx.strokeStyle = 'rgba(45, 110, 94, 0.35)';
  ctx.lineWidth = CONNECTION_WIDTH;
  ctx.lineCap = 'round';

  for (const [i, j] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[j].x, points[j].y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(45, 110, 94, 0.6)';
  for (const pt of points) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, LANDMARK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  drawConfidenceRing(ctx, hand, width, height, toPixel);
}

function drawConfidenceRing(
  ctx: CanvasRenderingContext2D,
  hand: TrackedHand,
  width: number,
  height: number,
  toPixel: (lm: { x: number; y: number }) => { x: number; y: number }
): void {
  const centroid = toPixel(hand.centroid);
  const progress = hand.debounceProgress ?? 0;
  const ringRadius = Math.min(width, height) * 0.07;
  const circumference = 2 * Math.PI * ringRadius;

  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(169, 201, 192, 0.3)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(centroid.x, centroid.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  const isCommitted = progress >= 1;
  ctx.strokeStyle = isCommitted
    ? 'rgba(45, 110, 94, 0.9)'
    : 'rgba(45, 110, 94, 0.6)';
  ctx.lineWidth = 3;

  const dashLength = circumference * progress;
  const gapLength = circumference - dashLength;

  if (progress > 0 && progress < 1) {
    ctx.setLineDash([dashLength, gapLength]);
  } else if (progress >= 1) {
    ctx.setLineDash([]);
  } else {
    ctx.setLineDash([0, circumference]);
  }

  ctx.beginPath();
  ctx.arc(centroid.x, centroid.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
}

export function drawChordHUD(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  chordName: string | null,
  isSounding: boolean
): void {
  const text = chordName ?? '—';
  const fontSize = Math.max(28, Math.min(width * 0.07, 64));

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `700 ${fontSize}px 'Courier New', Consolas, monospace`;

  const y = fontSize * 0.6;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = isSounding ? 'rgba(45, 110, 94, 1)' : 'rgba(169, 201, 192, 1)';
  ctx.fillText(text, width / 2, y);
  ctx.restore();
}
