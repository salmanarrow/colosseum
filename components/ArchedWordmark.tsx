/**
 * "THE COLOSSEUM" set on an arch, in brushed silver.
 * Pure inline SVG so it stays crisp at any size, inherits the display font,
 * and needs no image asset. `height` drives the rendered size.
 */
export default function ArchedWordmark({
  height = 34,
  title = "The Colosseum",
  idPrefix = "wm",
}: {
  height?: number;
  title?: string;
  idPrefix?: string;
}) {
  const gradId = `${idPrefix}-silver`;
  const arcId = `${idPrefix}-arc`;

  return (
    <svg
      viewBox="0 0 340 96"
      role="img"
      aria-label={title}
      style={{ height, width: "auto", display: "block", overflow: "visible" }}
    >
      <defs>
        {/* Brushed-silver sweep: bright crown, deeper shoulders */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="42%"  stopColor="var(--silver, #C8CDD9)" />
          <stop offset="72%"  stopColor="#9BA3B2" />
          <stop offset="100%" stopColor="var(--silver-deep, #8B93A3)" />
        </linearGradient>

        {/* The arc the big word rides on */}
        <path id={arcId} d="M 18,84 A 168,104 0 0,1 322,84" fill="none" />
      </defs>

      {/* Small straight "THE" sitting inside the arch */}
      <text
        x="170"
        y="30"
        textAnchor="middle"
        fill="var(--silver-deep, #8B93A3)"
        style={{
          fontFamily: "var(--font-display, 'Anton', sans-serif)",
          fontSize: "20px",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
        }}
      >
        THE
      </text>

      {/* Arched "COLOSSEUM" */}
      <text
        fill={`url(#${gradId})`}
        style={{
          fontFamily: "var(--font-display, 'Anton', sans-serif)",
          fontSize: "46px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          COLOSSEUM
        </textPath>
      </text>
    </svg>
  );
}
