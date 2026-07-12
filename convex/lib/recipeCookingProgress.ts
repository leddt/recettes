type WithOptionalChecked = {
  checked?: boolean;
};

type WithClearedChecked<T extends WithOptionalChecked> = Omit<T, "checked"> &
  WithOptionalChecked;

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
): Array<WithClearedChecked<T>> {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    if (!checked) {
      const { checked: _removed, ...rest } = item;
      return rest;
    }

    return { ...item, checked: true };
  });
}

export function clearCheckedFlags<T extends WithOptionalChecked>(
  items: T[],
): Array<WithClearedChecked<T>> {
  return items.map((item) => {
    if (item.checked !== true) {
      return item;
    }

    const { checked: _removed, ...rest } = item;
    return rest;
  });
}
