import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm font-medium text-muted-foreground">Meal planner</p>
      <h1 className="text-4xl font-semibold tracking-tight">Forkcast</h1>
      <p className="max-w-prose text-lg leading-8 text-muted-foreground">
        Tell it what you eat and what you avoid. It drafts a week of meals and a
        shopping list. The planner is not built yet. This repository is the
        harness it will be built in.
      </p>
      <div className="flex flex-col items-start gap-2">
        <Button type="button" disabled>
          Plan a week
        </Button>
        <p className="text-sm text-muted-foreground">
          Preferences, the weekly plan, and the shopping list come next.
        </p>
      </div>
    </main>
  );
}
