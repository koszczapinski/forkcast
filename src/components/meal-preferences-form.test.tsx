import { act } from "react";
import { renderToString } from "react-dom/server";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MealPreferencesForm } from "./meal-preferences-form";

const STORAGE_KEY = "forkcast.preferences";
const SERVINGS_ERROR = "Enter a whole number from 1 to 6.";
const BUDGET_ERROR = "Enter a positive amount in PLN, or leave this empty.";
const ALLERGY_LABELS = [
  "Gluten",
  "Lactose",
  "Nuts",
  "Eggs",
  "Fish",
  "Soy",
] as const;

type View = Pick<typeof screen, "getByRole" | "queryAllByRole">;

const CONTROL_ROLES = [
  "radio",
  "checkbox",
  "switch",
  "option",
  "button",
  "tab",
] as const;

function control(view: View, name: string): HTMLElement {
  const found = new Set<HTMLElement>();

  for (const role of CONTROL_ROLES) {
    for (const element of view.queryAllByRole(role, { name })) {
      found.add(element);
    }
  }

  if (found.size !== 1) {
    throw new Error(
      `Expected one control named "${name}", found ${found.size}.`,
    );
  }

  const [element] = found;
  if (!element) {
    throw new Error(`Expected one control named "${name}", found 0.`);
  }

  return element;
}

function isSelected(element: HTMLElement): boolean {
  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    return element.checked;
  }

  if (element instanceof HTMLOptionElement) {
    return element.selected;
  }

  return (
    element.getAttribute("aria-checked") === "true" ||
    element.getAttribute("aria-pressed") === "true" ||
    element.getAttribute("aria-selected") === "true"
  );
}

function servingsField(view: View = screen) {
  return view.getByRole("textbox", { name: "Servings" });
}

function budgetField(view: View = screen) {
  return view.getByRole("textbox", { name: "Weekly budget (PLN)" });
}

function savePreferences() {
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
}

function readPreferences(): unknown {
  const raw = localStorage.getItem(STORAGE_KEY);
  expect(raw, STORAGE_KEY).not.toBeNull();
  return JSON.parse(raw ?? "");
}

function expectNoSuccessMessage() {
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText(/saved/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
}

function expectDefaults(view: View = screen) {
  expect(isSelected(control(view, "Omnivore"))).toBe(true);
  expect(isSelected(control(view, "Vegetarian"))).toBe(false);
  expect(isSelected(control(view, "Vegan"))).toBe(false);
  expect(isSelected(control(view, "Pescatarian"))).toBe(false);

  for (const label of ALLERGY_LABELS) {
    expect(isSelected(control(view, label))).toBe(false);
  }

  expect(servingsField(view)).toHaveValue("");
  expect(budgetField(view)).toHaveValue("");
}

async function mountForm() {
  render(<MealPreferencesForm />);
  await act(async () => {
    await Promise.resolve();
  });
}

function serverHtml() {
  return renderToString(<MealPreferencesForm />);
}

function viewFromHtml(html: string): View {
  const container = document.createElement("div");
  container.innerHTML = html;
  return within(container);
}

function withoutLocalStorage<T>(run: () => T): T {
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "localStorage",
  );
  const globalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Reflect.deleteProperty(window, "localStorage");
  if (globalThis !== window) {
    Reflect.deleteProperty(globalThis, "localStorage");
  }

  try {
    return run();
  } finally {
    if (windowDescriptor) {
      Object.defineProperty(window, "localStorage", windowDescriptor);
    }
    if (globalThis !== window && globalDescriptor) {
      Object.defineProperty(globalThis, "localStorage", globalDescriptor);
    }
  }
}

describe("MealPreferencesForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("selects Omnivore until the person chooses Vegetarian", async () => {
    await mountForm();

    expect(isSelected(control(screen, "Omnivore"))).toBe(true);

    fireEvent.click(control(screen, "Vegetarian"));

    expect(isSelected(control(screen, "Vegetarian"))).toBe(true);
    expect(isSelected(control(screen, "Omnivore"))).toBe(false);
    expect(isSelected(control(screen, "Vegan"))).toBe(false);
    expect(isSelected(control(screen, "Pescatarian"))).toBe(false);
  });

  it("selects Nuts and Soy together, clears both, and saves with none selected", async () => {
    await mountForm();

    fireEvent.click(control(screen, "Nuts"));
    fireEvent.click(control(screen, "Soy"));
    expect(isSelected(control(screen, "Nuts"))).toBe(true);
    expect(isSelected(control(screen, "Soy"))).toBe(true);

    fireEvent.click(control(screen, "Nuts"));
    fireEvent.click(control(screen, "Soy"));
    expect(isSelected(control(screen, "Nuts"))).toBe(false);
    expect(isSelected(control(screen, "Soy"))).toBe(false);

    fireEvent.change(servingsField(), { target: { value: "2" } });
    expect(budgetField()).toHaveValue("");
    savePreferences();

    expect(readPreferences()).toEqual({
      diet: "omnivore",
      allergies: [],
      servings: 2,
      budget: null,
    });
  });

  it("shows an empty servings field and an error when it is submitted empty", async () => {
    await mountForm();

    const servings = servingsField();
    expect(servings).toHaveValue("");

    savePreferences();

    expect(servings).toHaveAccessibleDescription(SERVINGS_ERROR);
  });

  it.each(["0", "7", "2.0", "02", "+2", "abc"])(
    "rejects servings text %s",
    async (value) => {
      await mountForm();

      const servings = servingsField();
      fireEvent.change(servings, { target: { value } });
      expect(servings).toHaveValue(value);

      savePreferences();

      expect(servings).toHaveValue(value);
      expect(servings).toHaveAccessibleDescription(SERVINGS_ERROR);
    },
  );

  it("shows no servings error for 4", async () => {
    await mountForm();

    const servings = servingsField();
    fireEvent.change(servings, { target: { value: "4" } });

    expect(servings).not.toHaveAccessibleDescription(SERVINGS_ERROR);

    savePreferences();

    expect(servings).not.toHaveAccessibleDescription(SERVINGS_ERROR);
  });

  it("names the budget field and saves an empty budget as null", async () => {
    await mountForm();

    const budget = budgetField();
    expect(budget).toHaveAccessibleName("Weekly budget (PLN)");
    expect(budget).toHaveValue("");

    fireEvent.change(servingsField(), { target: { value: "2" } });
    savePreferences();

    expect(readPreferences()).toEqual({
      diet: "omnivore",
      allergies: [],
      servings: 2,
      budget: null,
    });
    expect(budget).toHaveValue("");
  });

  it.each([
    ["150.50", 150.5],
    ["150,50", 150.5],
    ["150,5", 150.5],
  ] as const)("saves budget text %s as %s", async (typed, storedBudget) => {
    await mountForm();

    fireEvent.change(servingsField(), { target: { value: "2" } });
    fireEvent.change(budgetField(), { target: { value: typed } });
    savePreferences();

    expect(readPreferences()).toEqual({
      diet: "omnivore",
      allergies: [],
      servings: 2,
      budget: storedBudget,
    });
  });

  it.each(["0", "-1", "150.555", "1.000,50", "100 zł", "100 PLN"])(
    "rejects budget text %s",
    async (value) => {
      await mountForm();

      fireEvent.change(servingsField(), { target: { value: "2" } });
      const budget = budgetField();
      fireEvent.change(budget, { target: { value } });
      savePreferences();

      expect(budget).toHaveAccessibleDescription(BUDGET_ERROR);
    },
  );

  it("keeps the previous save and focuses servings when the next submit is invalid", async () => {
    await mountForm();

    fireEvent.click(control(screen, "Vegetarian"));
    fireEvent.click(control(screen, "Nuts"));
    fireEvent.change(servingsField(), { target: { value: "4" } });
    fireEvent.change(budgetField(), { target: { value: "100" } });
    savePreferences();

    const saved = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(saved ?? "")).toEqual({
      diet: "vegetarian",
      allergies: ["nuts"],
      servings: 4,
      budget: 100,
    });

    fireEvent.change(servingsField(), { target: { value: "0" } });
    fireEvent.change(budgetField(), { target: { value: "-1" } });
    savePreferences();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
    await waitFor(() => expect(servingsField()).toHaveFocus());
  });

  it("focuses the budget field when servings is valid and the budget is not", async () => {
    await mountForm();

    fireEvent.change(servingsField(), { target: { value: "2" } });
    fireEvent.change(budgetField(), { target: { value: "0" } });
    savePreferences();

    await waitFor(() => expect(budgetField()).toHaveFocus());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("does not create a preferences entry when the first submit is invalid", async () => {
    await mountForm();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    fireEvent.change(servingsField(), { target: { value: "0" } });
    savePreferences();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saves vegetarian preferences and keeps showing them without a success message", async () => {
    await mountForm();

    fireEvent.click(control(screen, "Vegetarian"));
    fireEvent.click(control(screen, "Nuts"));
    fireEvent.click(control(screen, "Soy"));
    fireEvent.change(servingsField(), { target: { value: "4" } });
    fireEvent.change(budgetField(), { target: { value: "100" } });
    savePreferences();

    expect(readPreferences()).toEqual({
      diet: "vegetarian",
      allergies: ["nuts", "soy"],
      servings: 4,
      budget: 100,
    });
    expect(isSelected(control(screen, "Vegetarian"))).toBe(true);
    expect(isSelected(control(screen, "Omnivore"))).toBe(false);
    expect(isSelected(control(screen, "Nuts"))).toBe(true);
    expect(isSelected(control(screen, "Soy"))).toBe(true);
    expect(servingsField()).toHaveValue("4");
    expect(budgetField()).toHaveValue("100");
    expectNoSuccessMessage();
  });

  it("saves an empty budget as null and shows it empty after mount", async () => {
    await mountForm();

    fireEvent.change(servingsField(), { target: { value: "1" } });
    expect(budgetField()).toHaveValue("");
    savePreferences();

    expect(readPreferences()).toEqual({
      diet: "omnivore",
      allergies: [],
      servings: 1,
      budget: null,
    });
    expect(budgetField()).toHaveValue("");

    cleanup();
    await mountForm();

    expect(isSelected(control(screen, "Omnivore"))).toBe(true);
    for (const label of ALLERGY_LABELS) {
      expect(isSelected(control(screen, label))).toBe(false);
    }
    expect(servingsField()).toHaveValue("1");
    expect(budgetField()).toHaveValue("");
  });

  it("shows defaults from the server and the saved record after the client mounts", async () => {
    const saved = {
      diet: "vegetarian",
      allergies: ["nuts", "soy"],
      servings: 4,
      budget: 100,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const getItem = vi.spyOn(Storage.prototype, "getItem");
    try {
      let html = "";
      expect(() => {
        html = serverHtml();
      }).not.toThrow();
      expect(getItem).not.toHaveBeenCalled();
      expectDefaults(viewFromHtml(html));
    } finally {
      getItem.mockRestore();
    }

    await mountForm();

    expect(isSelected(control(screen, "Vegetarian"))).toBe(true);
    expect(isSelected(control(screen, "Nuts"))).toBe(true);
    expect(isSelected(control(screen, "Soy"))).toBe(true);
    expect(servingsField()).toHaveValue("4");
    expect(budgetField()).toHaveValue("100");
  });

  it.each([
    { label: "truncated JSON", raw: "{" },
    { label: "an unknown diet", raw: '{"diet":"keto"}' },
    {
      label: "a partially valid record",
      raw: '{"diet":"vegan","allergies":["nuts"],"servings":9}',
    },
  ])("drops $label and shows defaults", async ({ raw }) => {
    localStorage.setItem(STORAGE_KEY, raw);

    await mountForm();

    expectDefaults();
    expect(isSelected(control(screen, "Vegan"))).toBe(false);
    expect(isSelected(control(screen, "Nuts"))).toBe(false);
  });

  it("renders defaults when localStorage is missing during server render", () => {
    withoutLocalStorage(() => {
      let html = "";
      expect(() => {
        html = serverHtml();
      }).not.toThrow();
      expectDefaults(viewFromHtml(html));
    });
  });
});
