"use client";

import { useEffect, useState } from "react";

// Sample for the MSW setup. Not mounted in the app.
export const KITCHEN_STATUS_URL = "http://localhost:3000/api/kitchen";

type KitchenResponse = {
  open: boolean;
};

function labelFor(open: boolean): string {
  return open ? "Kitchen is open" : "Kitchen is closed";
}

export function KitchenStatus() {
  const [label, setLabel] = useState("Checking the kitchen…");

  useEffect(() => {
    const controller = new AbortController();

    fetch(KITCHEN_STATUS_URL, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setLabel("Kitchen status unavailable");
          return;
        }

        const data = (await response.json()) as KitchenResponse;
        setLabel(labelFor(data.open));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLabel("Kitchen status unavailable");
      });

    return () => {
      controller.abort();
    };
  }, []);

  return <p>{label}</p>;
}
