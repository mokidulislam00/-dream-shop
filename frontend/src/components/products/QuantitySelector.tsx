import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const clamp = (next: number) => Math.min(Math.max(next, 1), Math.max(max, 1));

  const buttonStyle =
    "inline-flex h-11 w-11 items-center justify-center hover:bg-ink/5 disabled:opacity-40";

  return (
    <div
      className="inline-flex items-center rounded border border-line bg-surface"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        className={buttonStyle}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          onChange(clamp(Number.isNaN(parsed) ? 1 : parsed));
        }}
        aria-label="Quantity"
        className="h-11 w-14 border-x border-line bg-transparent text-center text-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={buttonStyle}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
