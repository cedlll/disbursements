"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export function useStaggerReveal<T extends HTMLElement>(
  options: {
    y?: number;
    stagger?: number;
    duration?: number;
    delay?: number;
    ease?: string;
  } = {}
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = el.children;
    if (children.length === 0) return;

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: options.y ?? 16,
      },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.5,
        stagger: options.stagger ?? 0.08,
        delay: options.delay ?? 0.1,
        ease: options.ease ?? "power2.out",
      }
    );
  }, [options.y, options.stagger, options.duration, options.delay, options.ease]);

  return containerRef;
}

export function useFadeIn<T extends HTMLElement>(
  options: {
    y?: number;
    duration?: number;
    delay?: number;
  } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: options.y ?? 12 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.5,
        delay: options.delay ?? 0,
        ease: "power2.out",
      }
    );
  }, [options.y, options.duration, options.delay]);

  return ref;
}

export function useTableReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rows = el.querySelectorAll("tbody tr");
    if (rows.length === 0) return;

    gsap.fromTo(
      rows,
      { opacity: 0, x: -8 },
      {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.04,
        delay: 0.3,
        ease: "power2.out",
      }
    );
  }, []);

  return ref;
}
