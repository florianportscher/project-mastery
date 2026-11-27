# next-themes

Verified 2026-11-26 with `next-themes@0.4.6` (latest stable) and React 19.3.1, in a jsdom render.

- next-themes renders its blocking script as a React element. React 19.3.1 warns when it creates a script element on the client ("Encountered a script tag while rendering React component", pacocoursey/next-themes#385, open).
- Fix in `src/components/theme-provider.tsx`: `scriptProps={{ type: typeof window === "undefined" ? "text/javascript" : "text/plain" }}`, the route in the Next.js guide `preventing-flash-before-hydration.md`. The server render outputs `type="text/javascript"`, so the script still runs before first paint; on the client the element is inert, which is fine because the server's already applied the theme.
- `theme-provider.test.tsx` fails without the prop.
