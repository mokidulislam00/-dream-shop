import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/hooks/useCatalog";

interface ProductFiltersProps {
  showCategory: boolean;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured: boolean;
  activeCount: number;
  onChange: (patch: Record<string, string | undefined>) => void;
  onClear: () => void;
}

export function ProductFilters({
  showCategory,
  category,
  brand,
  minPrice,
  maxPrice,
  featured,
  activeCount,
  onChange,
  onClear,
}: ProductFiltersProps) {
  const { data: categories } = useCategories();

  // Text fields apply on submit; they reset whenever the URL values change.
  const formKey = `${brand ?? ""}|${minPrice ?? ""}|${maxPrice ?? ""}`;

  return (
    <div className="space-y-6 rounded border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-base font-semibold tracking-normal">
          Filters
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-accent hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {showCategory ? (
        <Select
          label="Category"
          value={category ?? ""}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          <option value="">All categories</option>
          {categories?.categories.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </Select>
      ) : null}

      <TextFilters
        key={formKey}
        brand={brand}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onApply={onChange}
      />

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) =>
            onChange({ featured: event.target.checked ? "true" : undefined })
          }
          className="h-5 w-5 rounded border-line accent-accent"
        />
        Featured products only
      </label>
    </div>
  );
}

function TextFilters({
  brand,
  minPrice,
  maxPrice,
  onApply,
}: {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  onApply: (patch: Record<string, string | undefined>) => void;
}) {
  const [brandValue, setBrandValue] = useState(brand ?? "");
  const [min, setMin] = useState(minPrice?.toString() ?? "");
  const [max, setMax] = useState(maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState<string>();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const minNumber = min === "" ? undefined : Number(min);
    const maxNumber = max === "" ? undefined : Number(max);

    if (
      (minNumber !== undefined && (!Number.isFinite(minNumber) || minNumber < 0)) ||
      (maxNumber !== undefined && (!Number.isFinite(maxNumber) || maxNumber < 0))
    ) {
      setPriceError("Enter prices of 0 or more.");
      return;
    }

    if (
      minNumber !== undefined &&
      maxNumber !== undefined &&
      minNumber > maxNumber
    ) {
      setPriceError("The minimum price can't be higher than the maximum.");
      return;
    }

    setPriceError(undefined);
    onApply({
      brand: brandValue.trim() || undefined,
      minPrice: minNumber?.toString(),
      maxPrice: maxNumber?.toString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Brand"
        value={brandValue}
        maxLength={100}
        onChange={(event) => setBrandValue(event.target.value)}
        hint="Matches part of the brand name"
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Price (৳)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Min"
            type="number"
            inputMode="decimal"
            min={0}
            value={min}
            onChange={(event) => setMin(event.target.value)}
            aria-label="Minimum price"
          />
          <Input
            label="Max"
            type="number"
            inputMode="decimal"
            min={0}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            aria-label="Maximum price"
          />
        </div>
        {priceError ? (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {priceError}
          </p>
        ) : null}
      </fieldset>

      <Button type="submit" variant="secondary" className="w-full">
        Apply
      </Button>
    </form>
  );
}
