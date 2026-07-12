type WithOptionalChecked = {
  checked?: boolean;
};

export function hasCookingProgress(
  ingredients: WithOptionalChecked[],
  steps: WithOptionalChecked[],
): boolean {
  return (
    ingredients.some((ingredient) => ingredient.checked === true) ||
    steps.some((step) => step.checked === true)
  );
}

export function setCheckedAtIndex<T extends WithOptionalChecked>(
  items: T[],
  index: number,
  checked: boolean,
): T[] {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    if (!checked) {
      const { checked: _removed, ...rest } = item;
      return rest as T;
    }

    return { ...item, checked: true };
  });
}

export function clearCheckedFlags<T extends WithOptionalChecked>(items: T[]): T[] {
  return items.map((item) => {
    if (item.checked !== true) {
      return item;
    }

    const { checked: _removed, ...rest } = item;
    return rest as T;
  });
}
