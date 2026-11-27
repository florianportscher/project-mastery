"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light and dark mode via the `dark` class on <html>. next-themes injects a
 * blocking script that applies the stored or system theme before the first
 * paint, so there is no flash on load.
 *
 * On the client the script gets `type="text/plain"`: React 19 warns about a
 * script element it creates there (pacocoursey/next-themes#385), and the
 * browser never runs a script that hydration adds. The server render keeps
 * `text/javascript`, which is the one that runs.
 */
export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
      {...props}
    />
  );
}
