import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// Choose images, check them against the backend's limits, and preview them.
export function ImagePicker({
  files,
  onChange,
  maxFiles,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles: number;
  disabled?: boolean;
}) {
  const [problems, setProblems] = useState<string[]>([]);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews]
  );

  const room = Math.max(maxFiles - files.length, 0);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    const issues: string[] = [];
    const accepted: File[] = [];

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        issues.push(`${file.name}: only JPG, PNG or WebP images are allowed.`);
      } else if (file.size > MAX_BYTES) {
        issues.push(`${file.name}: larger than 5 MB.`);
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length > room) {
      issues.push(
        room === 0
          ? "The image limit has been reached."
          : `Only ${room} more ${room === 1 ? "image" : "images"} can be added.`
      );
    }

    setProblems(issues);
    onChange([...files, ...accepted.slice(0, room)]);
  };

  return (
    <div>
      <label
        className={`inline-flex h-11 items-center gap-2 rounded border border-ink/25 bg-surface px-4 text-sm font-medium ${
          disabled || room === 0
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-ink"
        } focus-within:outline focus-within:outline-2 focus-within:outline-accent`}
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        Choose images
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || room === 0}
          onChange={handleSelect}
        />
      </label>
      <p className="mt-2 text-sm text-muted">
        JPG, PNG or WebP, up to 5 MB each. {room} {room === 1 ? "slot" : "slots"} left.
      </p>

      {problems.length > 0 ? (
        <ul role="alert" className="mt-2 space-y-1 text-sm text-danger">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative">
              <img
                src={previews[index]}
                alt={`Selected image ${index + 1}: ${file.name}`}
                className="aspect-square w-full rounded border border-line object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper shadow-card"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
