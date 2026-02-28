import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SettingsModal from "../components/SettingsModal";

describe("SettingsModal", () => {
  it("shows connection success without mutating saved settings", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onTestConnection = vi.fn().mockResolvedValue({
      state: "success",
      message: "Reachable (200) · servizio confermato",
    });

    render(
      <SettingsModal
        open
        onClose={vi.fn()}
        demoMode={false}
        demoScenario="fast-success"
        integrationSettings={{
          webhookUrl: "http://localhost:5678/webhook/edugen-process",
          requestTimeoutMs: 60000,
        }}
        onSave={onSave}
        onTestConnection={onTestConnection}
      />,
    );

    await user.click(screen.getByRole("button", { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reachable \(200\)/i)).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows validation feedback for invalid timeout before testing", async () => {
    const user = userEvent.setup();
    const onTestConnection = vi.fn();

    render(
      <SettingsModal
        open
        onClose={vi.fn()}
        demoMode
        demoScenario="slow-success"
        integrationSettings={{
          webhookUrl: "http://localhost:5678/webhook/edugen-process",
          requestTimeoutMs: 60000,
        }}
        onSave={vi.fn()}
        onTestConnection={onTestConnection}
      />,
    );

    const timeoutInput = screen.getByDisplayValue("60000");
    await user.clear(timeoutInput);
    await user.type(timeoutInput, "1000");
    await user.click(screen.getByRole("button", { name: /test connection/i }));

    expect(screen.getByText(/Timeout minimo consigliato/i)).toBeTruthy();
    expect(onTestConnection).not.toHaveBeenCalled();
  });
});
