import * as React from "react";
import { CheckIcon, SunMoonIcon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{ value: ThemeOption; label: string }> = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const handleSelectTheme = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Choisir le thème"
        onClick={() => setIsOpen((open) => !open)}
      >
        <SunMoonIcon />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Options de thème"
          className="absolute top-10 right-0 z-50 w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.value}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
              )}
              onClick={() => handleSelectTheme(option.value)}
            >
              <span>{option.label}</span>
              <CheckIcon
                className={cn(
                  "size-4",
                  theme === option.value ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
