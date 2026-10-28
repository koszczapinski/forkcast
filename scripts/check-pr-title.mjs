import assert from "node:assert/strict";
import { test } from "node:test";

const TITLE = /^(feat|fix|chore|docs|test|refactor|ci): \S(?:.*\S)?$/;

export function isValidPrTitle(title) {
  return typeof title === "string" && TITLE.test(title) && !title.endsWith(".");
}

const runningUnderTest = process.env.NODE_TEST_CONTEXT !== undefined;

if (!runningUnderTest && process.env.PR_TITLE !== undefined) {
  const title = process.env.PR_TITLE;
  if (!isValidPrTitle(title)) {
    console.error(`Invalid PR title: ${JSON.stringify(title)}`);
    console.error(
      "Use <type>: <short imperative summary> with no trailing period.",
    );
    console.error("Types: feat, fix, chore, docs, test, refactor, ci");
    console.error("Example: feat: Meal preferences form");
    process.exit(1);
  }
  console.log(`PR title ok: ${title}`);
}

test("accepts the documented title examples", () => {
  assert.equal(isValidPrTitle("feat: Meal preferences form"), true);
  assert.equal(isValidPrTitle("fix: Plan ignores nut allergy"), true);
  assert.equal(isValidPrTitle("chore: Add the project harness"), true);
  assert.equal(isValidPrTitle("docs: Describe the workflow"), true);
  assert.equal(isValidPrTitle("test: Cover serving labels"), true);
  assert.equal(isValidPrTitle("refactor: Split the plan parser"), true);
  assert.equal(isValidPrTitle("ci: Check pull request titles"), true);
});

test("rejects titles outside the format", () => {
  assert.equal(isValidPrTitle("feat:"), false);
  assert.equal(isValidPrTitle("feat: "), false);
  assert.equal(isValidPrTitle("feature: Meal preferences form"), false);
  assert.equal(isValidPrTitle("Feat: Meal preferences form"), false);
  assert.equal(isValidPrTitle("feat:Meal preferences form"), false);
  assert.equal(isValidPrTitle("feat: Meal preferences form."), false);
  assert.equal(isValidPrTitle("feat:  Meal preferences form"), false);
  assert.equal(isValidPrTitle(""), false);
  assert.equal(isValidPrTitle("Update README"), false);
});
