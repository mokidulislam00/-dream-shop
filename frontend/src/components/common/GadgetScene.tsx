import { useReducedMotion } from "@/hooks/useReducedMotion";

// Original decorative illustration: headphones, a wireless mouse, a
// smartphone and a smartwatch connected by flowing circuit traces.
// Animations are CSS classes (see styles/index.css) that only exist when
// the visitor has not requested reduced motion. The watch's second hand
// uses SVG animation and is skipped for reduced motion in code.
export function GadgetScene({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Circuit traces */}
      <g
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-accent/60"
      >
        <path className="gs-trace" d="M122 310 H165 V230 H200" />
        <path className="gs-trace" d="M340 150 H372 V120 H440" />
        <path className="gs-trace" d="M340 250 H360" />
        <path className="gs-trace" d="M270 70 V44 H350" />
      </g>
      <g className="fill-accent">
        <circle cx="200" cy="230" r="4" />
        <circle cx="440" cy="120" r="4" />
        <circle cx="350" cy="44" r="4" />
        <circle className="gs-blink" cx="30" cy="230" r="3" />
        <circle className="gs-blink" cx="462" cy="52" r="3" style={{ animationDelay: "1s" }} />
        <circle className="gs-blink" cx="170" cy="372" r="3" style={{ animationDelay: "1.8s" }} />
      </g>

      {/* Headphones */}
      <g transform="translate(10 20)">
        <g className="gs-float gs-d2">
          <path
            d="M12 96 C12 10 120 10 120 96"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-paper/80"
          />
          <rect x="0" y="86" width="26" height="52" rx="13" strokeWidth="3" className="fill-paper/10 stroke-paper/80" />
          <rect x="106" y="86" width="26" height="52" rx="13" strokeWidth="3" className="fill-paper/10 stroke-paper/80" />
          <circle className="gs-blink fill-accent" cx="13" cy="112" r="3" />
          <g fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-accent">
            <path className="gs-wave" d="M142 100 q12 12 0 24" />
            <path className="gs-wave" style={{ animationDelay: "0.35s" }} d="M152 94 q18 18 0 36" />
            <path className="gs-wave" style={{ animationDelay: "0.7s" }} d="M162 88 q24 24 0 48" />
          </g>
        </g>
      </g>

      {/* Wireless mouse */}
      <g transform="translate(40 250)">
        <g className="gs-float gs-d3">
          <path
            d="M0 40 C0 10 20 0 40 0 C60 0 80 10 80 40 V70 C80 100 60 120 40 120 C20 120 0 100 0 70 Z"
            strokeWidth="2.5"
            className="fill-paper/5 stroke-paper/80"
          />
          <path d="M0 45 V40 C0 10 20 0 40 0 V45 Z" className="gs-click fill-accent" />
          <path d="M40 0 V45 M0 45 H80" fill="none" strokeWidth="2" className="stroke-paper/60" />
          <rect x="35" y="12" width="10" height="26" rx="5" strokeWidth="2" className="fill-paper/10 stroke-paper/70" />
          <rect x="38" y="16" width="4" height="8" rx="2" className="gs-wheel fill-accent" />
        </g>
      </g>

      {/* Smartphone */}
      <g transform="translate(200 70)">
        <g className="gs-float">
          <rect x="0" y="0" width="140" height="250" rx="24" strokeWidth="2.5" className="fill-paper/5 stroke-paper/80" />
          <rect x="10" y="10" width="120" height="230" rx="16" className="fill-paper/5" />
          <rect x="52" y="16" width="36" height="7" rx="3.5" className="fill-paper/20" />
          {Array.from({ length: 9 }, (_, index) => (
            <rect
              key={index}
              className={`gs-tile ${index % 3 === 1 ? "fill-paper" : "fill-accent"}`}
              x={22 + (index % 3) * 38}
              y={52 + Math.floor(index / 3) * 38}
              width="30"
              height="30"
              rx="8"
              style={{ animationDelay: `${(index % 5) * 0.55}s` }}
            />
          ))}
          <rect x="22" y="178" width="106" height="34" rx="10" className="fill-paper/10" />
          <rect x="30" y="192" width="54" height="6" rx="3" className="fill-paper/50" />
          <rect x="52" y="228" width="40" height="4" rx="2" className="fill-paper/40" />
        </g>
      </g>

      {/* Smartwatch */}
      <g transform="translate(360 200)">
        <g className="gs-float gs-d2">
          <rect x="24" y="-34" width="52" height="40" rx="10" className="fill-paper/10 stroke-paper/60" strokeWidth="2" />
          <rect x="24" y="94" width="52" height="40" rx="10" className="fill-paper/10 stroke-paper/60" strokeWidth="2" />
          <rect x="100" y="30" width="6" height="18" rx="3" className="fill-paper/60" />
          <rect x="0" y="0" width="100" height="100" rx="28" strokeWidth="2.5" className="fill-paper/5 stroke-paper/80" />
          <rect x="8" y="8" width="84" height="84" rx="22" className="fill-paper/5" />
          <circle cx="50" cy="40" r="3.5" className="fill-accent" />
          <line x1="50" y1="40" x2="50" y2="18" strokeWidth="3" strokeLinecap="round" className="stroke-accent">
            {reducedMotion ? null : (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 40"
                to="360 50 40"
                dur="8s"
                repeatCount="indefinite"
              />
            )}
          </line>
          <path
            className="gs-beat stroke-paper/80"
            d="M16 74 H34 L40 62 L48 86 L56 68 L62 74 H84"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
