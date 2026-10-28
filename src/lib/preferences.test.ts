import { describe, expect, it } from "vitest";
import { z } from "zod";
import { preferencesSchema } from "./preferences";

const validPreferences = {
  diet: "omnivore",
  allergies: [],
  servings: 1,
  budget: null,
} satisfies z.infer<typeof preferencesSchema>;

function accept(value: unknown, label: string) {
  expect(preferencesSchema.safeParse(value).success, label).toBe(true);
}

function reject(value: unknown, label: string) {
  expect(preferencesSchema.safeParse(value).success, label).toBe(false);
}

describe("preferencesSchema", () => {
  it("accepts one diet id and rejects any other diet value", () => {
    for (const diet of ["omnivore", "vegetarian", "vegan", "pescatarian"]) {
      accept({ ...validPreferences, diet }, diet);
    }

    reject({ ...validPreferences, diet: "keto" }, "keto");
    reject(
      { ...validPreferences, diet: ["omnivore"] },
      "diet must be one string",
    );
  });

  it("accepts a unique subset of the allergy ids", () => {
    accept({ ...validPreferences, allergies: [] }, "no allergies");

    for (const allergy of [
      "gluten",
      "lactose",
      "nuts",
      "eggs",
      "fish",
      "soy",
    ]) {
      accept({ ...validPreferences, allergies: [allergy] }, allergy);
    }

    accept({ ...validPreferences, allergies: ["nuts", "soy"] }, "nuts and soy");
    reject({ ...validPreferences, allergies: ["peanuts"] }, "peanuts");
    reject(
      { ...validPreferences, allergies: ["nuts", "nuts"] },
      "duplicate nuts",
    );
  });

  it("accepts a whole number of servings from 1 to 6", () => {
    accept({ ...validPreferences, servings: 1 }, "1");
    accept({ ...validPreferences, servings: 6 }, "6");
    reject({ ...validPreferences, servings: 0 }, "0");
    reject({ ...validPreferences, servings: 7 }, "7");
    reject({ ...validPreferences, servings: 1.5 }, "1.5");
  });

  it("accepts an empty budget or a positive amount with at most two decimal places", () => {
    const { diet, allergies, servings } = validPreferences;

    accept({ diet, allergies, servings }, "omitted budget");
    accept({ ...validPreferences, budget: null }, "null budget");

    for (const budget of [100, 0.01, 150.5, 999999.99]) {
      accept({ ...validPreferences, budget }, String(budget));
    }

    reject({ ...validPreferences, budget: 0 }, "0");
    reject({ ...validPreferences, budget: -1 }, "-1");
    reject({ ...validPreferences, budget: 150.555 }, "150.555");
  });

  it("parses the stored preferences shape", () => {
    const stored = {
      diet: "vegetarian",
      allergies: ["nuts", "soy"],
      servings: 4,
      budget: 100,
    } satisfies z.infer<typeof preferencesSchema>;

    expect(preferencesSchema.parse(stored)).toEqual(stored);
    reject(
      {
        diet: "keto",
        allergies: ["nuts"],
        servings: 4,
        budget: 100,
      },
      "stored shape rejects keto",
    );
  });
});
