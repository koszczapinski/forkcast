export function formatServings(count: number): string {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("Servings must be a non-negative integer");
  }

  if (count === 1) {
    return "1 serving";
  }

  return `${count} servings`;
}
