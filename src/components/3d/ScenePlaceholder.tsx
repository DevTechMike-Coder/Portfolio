interface ScenePlaceholderProps {
  label?: string;
  unavailable?: boolean;
}

/** A static, server-renderable illustration; no canvas, animation, or image request. */
export function ScenePlaceholder({
  label = "SECURITY_CORE",
  unavailable = false,
}: ScenePlaceholderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center" data-scene-placeholder>
      <svg
        viewBox="0 0 320 320"
        className="h-full max-h-[420px] w-full text-emerald-400"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="160" cy="150" r="104" opacity="0.12" />
          <ellipse cx="160" cy="150" rx="116" ry="48" transform="rotate(-32 160 150)" opacity="0.5" />
          <ellipse cx="160" cy="150" rx="100" ry="58" transform="rotate(48 160 150)" stroke="#06b6d4" opacity="0.45" />
          <path d="M160 87 215 120 215 183 160 215 105 183 105 120Z M160 87V215 M105 120 215 183 M215 120 105 183" opacity="0.3" />
          <path d="M160 112 189 150 160 188 131 150Z" fill="#064e3b" fillOpacity="0.4" opacity="0.8" />
        </g>
        <g fill="currentColor">
          <circle cx="160" cy="150" r="9" opacity="0.85" />
          <circle cx="64" cy="206" r="3" opacity="0.7" />
          <circle cx="233" cy="220" r="3" fill="#38bdf8" opacity="0.7" />
          <circle cx="69" cy="97" r="2" opacity="0.25" />
          <circle cx="247" cy="72" r="2" opacity="0.25" />
        </g>
        <text x="160" y="287" textAnchor="middle" fill="currentColor" opacity="0.55" fontFamily="monospace" fontSize="10" letterSpacing="2">
          {label}
        </text>
      </svg>
      {unavailable && (
        <p className="absolute bottom-2 px-4 text-center font-mono text-[11px] text-zinc-400" role="status">
          3D unavailable — static view active
        </p>
      )}
    </div>
  );
}
