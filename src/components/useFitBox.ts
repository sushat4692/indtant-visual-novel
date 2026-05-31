import { useEffect, useRef, useState } from "react";

export interface FitSize {
  width: number;
  height: number;
}

/**
 * Measure a container and compute the largest box of the given aspect ratio
 * (width / height) that fits inside it. This produces reliable letterboxing for
 * a fixed-ratio stage where pure-CSS approaches collapse or distort.
 */
export function useFitBox(ratio: number): {
  ref: React.RefObject<HTMLDivElement | null>;
  size: FitSize | null;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<FitSize | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0 || ch <= 0) return;
      // Fit by width first; if the resulting height is too tall, fit by height.
      let width = cw;
      let height = width / ratio;
      if (height > ch) {
        height = ch;
        width = height * ratio;
      }
      setSize({ width: Math.round(width), height: Math.round(height) });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  return { ref, size };
}
