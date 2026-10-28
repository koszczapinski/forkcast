"use client";

import { useEffect, useRef, type FormEvent, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useForm, useFormContext, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ALLERGIES,
  ALLERGY_LABELS,
  DIETS,
  DIET_LABELS,
  PREFERENCES_STORAGE_KEY,
  preferencesSchema,
} from "@/lib/preferences";

type Preferences = z.infer<typeof preferencesSchema>;
type FormValues = {
  diet: Preferences["diet"];
  allergies: Preferences["allergies"];
  servings: string;
  budget: string;
};

const FOCUS_ORDER = ["diet", "allergies", "servings", "budget"] as const;

const defaultValues: FormValues = {
  diet: "omnivore",
  allergies: [],
  servings: "",
  budget: "",
};

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

function storedToFormValues(stored: Preferences): FormValues {
  return {
    diet: stored.diet,
    allergies: [...stored.allergies],
    servings: String(stored.servings),
    budget: stored.budget == null ? "" : String(stored.budget),
  };
}

function DietField() {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="diet"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Diet</FormLabel>
          <FormControl>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              {DIETS.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <RadioGroupItem value={id} id={`diet-${id}`} />
                  <Label htmlFor={`diet-${id}`}>{DIET_LABELS[id]}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AllergiesField() {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="allergies"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Allergies</FormLabel>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ALLERGIES.map((id) => {
              const selected = field.value.includes(id);
              return (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox
                    id={`allergy-${id}`}
                    name={field.name}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked === true
                          ? [...field.value, id]
                          : field.value.filter((item) => item !== id),
                      );
                    }}
                    onBlur={field.onBlur}
                  />
                  <Label htmlFor={`allergy-${id}`}>{ALLERGY_LABELS[id]}</Label>
                </div>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ServingsField({
  inputRef,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="servings"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Servings</FormLabel>
          <FormControl>
            <Input
              {...field}
              ref={(element) => {
                field.ref(element);
                inputRef.current = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function BudgetField({
  inputRef,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="budget"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Weekly budget (PLN)</FormLabel>
          <FormControl>
            <Input
              {...field}
              ref={(element) => {
                field.ref(element);
                inputRef.current = element;
              }}
              type="text"
              inputMode="decimal"
              autoComplete="off"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function MealPreferencesForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(preferencesSchema) as unknown as Resolver<FormValues>,
    defaultValues,
    shouldFocusError: true,
  });
  const servingsRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readStoredPreferences();
    if (!stored) {
      return;
    }
    // The server render and the first client render stay on the defaults and
    // do not read localStorage. Saved values are applied after mount.
    form.reset(storedToFormValues(stored));
  }, [form]);

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = preferencesSchema.safeParse(form.getValues());

    if (!parsed.success) {
      const messages = new Map<string, string>();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !messages.has(field)) {
          messages.set(field, issue.message);
        }
      }

      flushSync(() => {
        form.clearErrors();
        for (const [field, message] of messages) {
          form.setError(field as (typeof FOCUS_ORDER)[number], {
            type: "custom",
            message,
          });
        }
      });

      const firstInvalid = FOCUS_ORDER.find((field) => messages.has(field));
      if (firstInvalid) {
        // setFocus waits for a timer. Focus the field in this turn as well.
        form.setFocus(firstInvalid);
        if (firstInvalid === "servings") {
          servingsRef.current?.focus();
        } else if (firstInvalid === "budget") {
          budgetRef.current?.focus();
        }
      }
      return;
    }

    flushSync(() => {
      form.clearErrors();
    });
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(parsed.data));
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={savePreferences}>
        <DietField />
        <AllergiesField />
        <ServingsField inputRef={servingsRef} />
        <BudgetField inputRef={budgetRef} />
        <Button type="submit" className="self-start">
          Save preferences
        </Button>
      </form>
    </Form>
  );
}
