type StepNumberProps = {
  index: number;
};

export function StepNumber({ index }: StepNumberProps) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
      {index + 1}
    </span>
  );
}
