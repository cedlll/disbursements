"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: options.y ?? 12,
      },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.3,
        stagger: options.stagger ?? 0.05,
        delay: options.delay ?? 0.05,
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
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: options.y ?? 10 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.3,
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
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      rows,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.25,
        stagger: 0.03,
        delay: 0.15,
        ease: "power2.out",
      }
    );
  }, []);

  return ref;
}
