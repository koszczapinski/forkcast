"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  ALLERGIES,
  ALLERGY_LABELS,
  BUDGET_MESSAGE,
  DIETS,
  DIET_LABELS,
  PREFERENCES_STORAGE_KEY,
  SERVINGS_MESSAGE,
  preferencesSchema,
} from "@/lib/preferences";

type Preferences = z.infer<typeof preferencesSchema>;

const fieldClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function readStoredPreferences(): Preferences | null {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = preferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function budgetText(budget: Preferences["budget"]): string {
  return budget == null ? "" : String(budget);
}

export function MealPreferencesForm() {
  const [diet, setDiet] = useState<Preferences["diet"]>("omnivore");
  const [allergies, setAllergies] = useState<Preferences["allergies"]>([]);
  const [servings, setServings] = useState("");
  const [budget, setBudget] = useState("");
  const [servingsError, setServingsError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const dietRef = useRef<HTMLInputElement>(null);
  const allergyRef = useRef<HTMLInputElement>(null);
  const servingsRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const servingsErrorId = useId();
  const budgetErrorId = useId();

  useEffect(() => {
    const stored = readStoredPreferences();
    if (!stored) {
      return;
    }
    // The server render and the first client render must stay on the defaults
    // and must not read localStorage. The saved record is applied after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount localStorage read
    setDiet(stored.diet);
    setAllergies(stored.allergies);
    setServings(String(stored.servings));
    setBudget(budgetText(stored.budget));
  }, []);

  function toggleAllergy(id: Preferences["allergies"][number]) {
    setAllergies((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = preferencesSchema.safeParse({
      diet,
      allergies,
      servings,
      budget,
    });

    if (!parsed.success) {
      const fields = new Set(
        parsed.error.issues.map((issue) => String(issue.path[0])),
      );
      const servingsInvalid =
        fields.has("servings") ||
        parsed.error.issues.some((issue) => issue.message === SERVINGS_MESSAGE);
      const budgetInvalid =
        fields.has("budget") ||
        parsed.error.issues.some((issue) => issue.message === BUDGET_MESSAGE);
      setServingsError(servingsInvalid);
      setBudgetError(budgetInvalid);

      if (fields.has("diet")) {
        dietRef.current?.focus();
      } else if (fields.has("allergies")) {
        allergyRef.current?.focus();
      } else if (servingsInvalid) {
        servingsRef.current?.focus();
      } else if (budgetInvalid) {
        budgetRef.current?.focus();
      }
      return;
    }

    setServingsError(false);
    setBudgetError(false);
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(parsed.data));
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={savePreferences}>
      <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Diet</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {DIETS.map((id, index) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input
                ref={index === 0 ? dietRef : undefined}
                type="radio"
                name="diet"
                value={id}
                checked={diet === id}
                onChange={() => setDiet(id)}
                className="size-4 accent-primary"
              />
              {DIET_LABELS[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Allergies</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ALLERGIES.map((id, index) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input
                ref={index === 0 ? allergyRef : undefined}
                type="checkbox"
                name="allergies"
                value={id}
                checked={allergies.includes(id)}
                onChange={() => toggleAllergy(id)}
                className="size-4 accent-primary"
              />
              {ALLERGY_LABELS[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="servings" className="text-sm font-medium">
          Servings
        </label>
        <input
          ref={servingsRef}
          id="servings"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={servings}
          aria-invalid={servingsError || undefined}
          aria-describedby={servingsError ? servingsErrorId : undefined}
          onChange={(event) => setServings(event.target.value)}
          className={fieldClassName}
        />
        {servingsError ? (
          <p id={servingsErrorId} className="text-sm text-destructive">
            {SERVINGS_MESSAGE}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="weekly-budget" className="text-sm font-medium">
          Weekly budget (PLN)
        </label>
        <input
          ref={budgetRef}
          id="weekly-budget"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={budget}
          aria-invalid={budgetError || undefined}
          aria-describedby={budgetError ? budgetErrorId : undefined}
          onChange={(event) => setBudget(event.target.value)}
          className={fieldClassName}
        />
        {budgetError ? (
          <p id={budgetErrorId} className="text-sm text-destructive">
            {BUDGET_MESSAGE}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="self-start">
        Save preferences
      </Button>
    </form>
  );
}
