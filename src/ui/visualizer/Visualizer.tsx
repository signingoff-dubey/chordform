import { useEffect, useRef } from 'react';
import './visualizer.css';

interface VisualizerProps {
  getWaveform: () => Float32Array | null;
  isSounding: boolean;
}

export function Visualizer({ getWaveform, isSounding }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSoundingRef = useRef(isSounding);
  isSoundingRef.current = isSounding;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId: number | null = null;
    let intervalId: number | null = null;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const data = getWaveform();
      const midY = height / 2;
      const sounding = isSoundingRef.current;

      ctx.beginPath();
      if (data && data.length > 0 && sounding) {
        const step = width / (data.length - 1);
        for (let i = 0; i < data.length; i++) {
          const x = i * step;
          const y = midY + data[i] * midY * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
      }

      ctx.strokeStyle = sounding ? 'rgba(45, 110, 94, 0.55)' : 'rgba(169, 201, 192, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    if (reduceMotionQuery.matches) {
      draw();
      intervalId = window.setInterval(draw, 500);
    } else {
      const loop = () => {
        draw();
        rafId = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [getWaveform]);

  return <canvas ref={canvasRef} className="visualizer" aria-hidden="true" />;
}
