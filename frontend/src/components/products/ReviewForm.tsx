import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormAlert } from "@/components/forms/FormAlert";
import { StarRatingInput } from "@/components/forms/StarRatingInput";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { reviewSchema, type ReviewFormValues } from "@/schemas/review";
import { getErrorMessage } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";

export function ReviewForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<ReviewFormValues>;
  submitLabel: string;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: defaultValues?.rating,
      comment: defaultValues?.comment ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      if (applyFieldErrors(error, setError, ["rating", "comment"])) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <Controller
        control={control}
        name="rating"
        render={({ field }) => (
          <StarRatingInput
            value={field.value}
            onChange={field.onChange}
            error={errors.rating?.message}
          />
        )}
      />

      <Textarea
        label="Your review"
        maxLength={1000}
        error={errors.comment?.message}
        {...register("comment")}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
