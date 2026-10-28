import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { KITCHEN_STATUS_URL, KitchenStatus } from "./kitchen-status";

describe("KitchenStatus", () => {
  it("shows that the kitchen is open", async () => {
    server.use(
      http.get(KITCHEN_STATUS_URL, () => {
        return HttpResponse.json({ open: true });
      }),
    );

    render(<KitchenStatus />);

    expect(await screen.findByText("Kitchen is open")).toBeInTheDocument();
  });

  it("shows that the kitchen is closed", async () => {
    server.use(
      http.get(KITCHEN_STATUS_URL, () => {
        return HttpResponse.json({ open: false });
      }),
    );

    render(<KitchenStatus />);

    expect(await screen.findByText("Kitchen is closed")).toBeInTheDocument();
  });
});
