type IngredientWithChecked = {
  name: string;
  quantity?: string;
  unit?: string;
  checked?: boolean;
};

type StepWithChecked = {
  text: string;
  checked?: boolean;
};

export function hasCookingProgress(
  ingredients: IngredientWithChecked[],
  steps: StepWithChecked[],
): boolean {
  return (
    ingredients.some((ingredient) => ingredient.checked === true) ||
    steps.some((step) => step.checked === true)
  );
}

export function setIngredientCheckedAtIndex(
  ingredients: IngredientWithChecked[],
  index: number,
  checked: boolean,
): IngredientWithChecked[] {
  return ingredients.map((ingredient, ingredientIndex) => {
    if (ingredientIndex !== index) {
      return ingredient;
    }

    if (!checked) {
      const { checked: _removed, ...rest } = ingredient;
      return rest;
    }

    return { ...ingredient, checked: true };
  });
}

export function setStepCheckedAtIndex(
  steps: StepWithChecked[],
  index: number,
  checked: boolean,
): StepWithChecked[] {
  return steps.map((step, stepIndex) => {
    if (stepIndex !== index) {
      return step;
    }

    if (!checked) {
      const { checked: _removed, ...rest } = step;
      return rest;
    }

    return { ...step, checked: true };
  });
}

export function clearCookingProgress<T extends IngredientWithChecked>(
  ingredients: T[],
): IngredientWithChecked[] {
  return ingredients.map((ingredient) => {
    if (ingredient.checked !== true) {
      return ingredient;
    }

    const { checked: _removed, ...rest } = ingredient;
    return rest;
  });
}

export function clearStepCookingProgress<T extends StepWithChecked>(
  steps: T[],
): StepWithChecked[] {
  return steps.map((step) => {
    if (step.checked !== true) {
      return step;
    }

    const { checked: _removed, ...rest } = step;
    return rest;
  });
}

