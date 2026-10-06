"use client";
import { useEffect, useRef } from "react";
import { ui } from "@/data/content/platform";
export function useUnsavedChanges(dirty: boolean) {
  const state = useRef({ dirty, bypass: false });
  state.current.dirty = dirty;
  if (!dirty) state.current.bypass = false;
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (state.current.dirty && !state.current.bypass) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      if (
        !state.current.dirty ||
        state.current.bypass ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element)?.closest?.("a");
      if (!link || link.hasAttribute("download") || link.target === "_blank")
        return;
      const url = new URL(link.href, location.href);
      if (
        url.pathname === location.pathname &&
        url.search === location.search &&
        url.hash
      )
        return;
      if (!window.confirm(ui.admin.unsavedConfirm)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        state.current.bypass = true;
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return () => {
    state.current.bypass = true;
  };
}
