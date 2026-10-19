@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

html,
body,
#root {
  height: 100%;
}

body {
  @apply bg-stone-50 font-sans text-stone-800 antialiased;
}

/* Ajustes finos de React Flow */
.react-flow__edge-textbg {
  fill: #fafaf9;
}

.react-flow__controls {
  @apply overflow-hidden rounded-lg border border-stone-200 shadow-sm;
}

.react-flow__controls-button {
  @apply border-stone-200;
}

.react-flow__attribution {
  @apply bg-transparent text-[10px];
}

/* Bienvenida */
@keyframes welcome-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes welcome-rise {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

.welcome-overlay {
  animation: welcome-fade 250ms ease-out both;
}

.welcome-card {
  animation: welcome-rise 450ms 80ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .welcome-overlay,
  .welcome-card {
    animation: none;
  }
}
