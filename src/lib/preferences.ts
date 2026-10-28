import { z } from "zod";

export const SERVINGS_MESSAGE = "Enter a whole number from 1 to 6.";
export const BUDGET_MESSAGE =
  "Enter a positive amount in PLN, or leave this empty.";
export const PREFERENCES_STORAGE_KEY = "forkcast.preferences";

export const DIETS = [
  "omnivore",
  "vegetarian",
  "vegan",
  "pescatarian",
] as const;
export const ALLERGIES = [
  "gluten",
  "lactose",
  "nuts",
  "eggs",
  "fish",
  "soy",
] as const;

export const DIET_LABELS: Record<(typeof DIETS)[number], string> = {
  omnivore: "Omnivore",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
};

export const ALLERGY_LABELS: Record<(typeof ALLERGIES)[number], string> = {
  gluten: "Gluten",
  lactose: "Lactose",
  nuts: "Nuts",
  eggs: "Eggs",
  fish: "Fish",
  soy: "Soy",
};

const dietSchema = z.enum(DIETS);
const allergySchema = z.enum(ALLERGIES);

const allergiesSchema = z
  .array(allergySchema)
  .refine((ids) => new Set(ids).size === ids.length);

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

function storedServings(value: number): number | undefined {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    return undefined;
  }
  return value;
}

function storedBudget(value: number): number | undefined {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    !hasAtMostTwoDecimalPlaces(value)
  ) {
    return undefined;
  }
  return value;
}

function servingsFromInput(value: number | string): number | undefined {
  if (typeof value === "number") {
    return storedServings(value);
  }
  if (!/^[1-6]$/.test(value)) {
    return undefined;
  }
  return Number(value);
}

function budgetFromInput(
  value: number | string | null,
): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "number") {
    return storedBudget(value);
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    return undefined;
  }
  return storedBudget(Number(trimmed.replace(",", ".")));
}

const servingsSchema = z
  .union([z.number(), z.string()])
  .superRefine((value, ctx) => {
    if (servingsFromInput(value) === undefined) {
      ctx.addIssue(SERVINGS_MESSAGE);
    }
  })
  .transform((value) => servingsFromInput(value) ?? Number.NaN);

const budgetSchema = z
  .union([z.number(), z.string(), z.null()])
  .superRefine((value, ctx) => {
    if (budgetFromInput(value) === undefined) {
      ctx.addIssue(BUDGET_MESSAGE);
    }
  })
  .transform((value) => {
    const amount = budgetFromInput(value);
    return amount === undefined ? Number.NaN : amount;
  })
  .optional();

export const preferencesSchema = z.object({
  diet: dietSchema,
  allergies: allergiesSchema,
  servings: servingsSchema,
  budget: budgetSchema,
});
