import { useTheme } from "@/components/theme-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{ value: ThemeOption; label: string }> = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(values) => {
        const next = values[0];
        if (next === "light" || next === "dark" || next === "system") {
          setTheme(next);
        }
      }}
      variant="outline"
      className="w-full sm:w-fit"
    >
      {THEME_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="flex-1 sm:flex-none">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
