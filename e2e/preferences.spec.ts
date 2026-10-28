import { expect, test, type Page } from "@playwright/test";

function choice(page: Page, name: string) {
  return page
    .getByRole("radio", { name, exact: true })
    .or(page.getByRole("checkbox", { name, exact: true }))
    .or(page.getByRole("switch", { name, exact: true }))
    .or(page.getByRole("option", { name, exact: true }))
    .or(page.getByRole("button", { name, exact: true }));
}

function isHydrationError(message: string) {
  return /hydrat/i.test(message);
}

async function expectChosen(page: Page, name: string, chosen: boolean) {
  const control = choice(page, name);

  await expect
    .poll(async () =>
      control.evaluate((element) => {
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
      }),
    )
    .toBe(chosen);
}

test("saves meal preferences and restores them after reload", async ({
  page,
}) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });

  await page.goto("/");
  await expect(choice(page, "Vegetarian")).toBeVisible();
  await choice(page, "Vegetarian").click();
  await choice(page, "Nuts").click();
  await choice(page, "Soy").click();
  await page.getByRole("textbox", { name: "Servings", exact: true }).fill("4");
  await page
    .getByRole("textbox", { name: "Weekly budget (PLN)", exact: true })
    .fill("100");
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();

  await expect(page.getByText(/saved/i)).toHaveCount(0);
  await expect(page.getByText(/success/i)).toHaveCount(0);

  await page.reload();
  await expectChosen(page, "Vegetarian", true);
  await expectChosen(page, "Omnivore", false);
  await expectChosen(page, "Nuts", true);
  await expectChosen(page, "Soy", true);
  await expect(
    page.getByRole("textbox", { name: "Servings", exact: true }),
  ).toHaveValue("4");
  await expect(
    page.getByRole("textbox", { name: "Weekly budget (PLN)", exact: true }),
  ).toHaveValue("100");
  await expect(page.getByText(/saved/i)).toHaveCount(0);
  await expect(page.getByText(/success/i)).toHaveCount(0);
  expect(messages.filter(isHydrationError)).toEqual([]);
});

test("shows the preferences form and a disabled Plan a week button", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Save preferences", exact: true }),
  ).toBeVisible();
  await expect(choice(page, "Omnivore")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Servings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Weekly budget (PLN)", exact: true }),
  ).toBeVisible();

  const plan = page.getByRole("button", { name: "Plan a week", exact: true });
  await expect(plan).toBeVisible();
  await expect(plan).toBeDisabled();
  await expect(
    page.getByRole("heading", { level: 1, name: "Forkcast" }),
  ).toBeVisible();
});
