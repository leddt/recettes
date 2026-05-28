import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StepNumberProps = {
  index: number;
  completed?: boolean;
};

export function StepNumber({ index, completed = false }: StepNumberProps) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
        completed
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {completed ? <CheckIcon /> : index + 1}
    </span>
  );
}
