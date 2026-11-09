"use client";
import { MoonIcon, SunIcon } from "./icons";

// Which icon shows is decided by CSS (the .dark class on <html>), so there is
// no state to sync and no flash on load.
export default function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="החלפה בין מצב בהיר לכהה"
      className="flex h-11 w-11 items-center justify-center rounded-full text-muted"
    >
      <span className="dark:hidden"><MoonIcon /></span>
      <span className="hidden dark:inline"><SunIcon /></span>
    </button>
  );
}
