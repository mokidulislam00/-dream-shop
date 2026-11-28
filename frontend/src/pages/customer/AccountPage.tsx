import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Container } from "@/components/layout/Container";
import { AccountStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  passwordSchema,
  profileSchema,
  type PasswordFormValues,
  type ProfileFormValues,
} from "@/schemas/account";
import { userService } from "@/services/user.service";
import { ApiError, getErrorMessage } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setFormError(null);

    // The backend accepts only the fields that changed.
    const changes: { fullName?: string; email?: string } = {};

    if (values.fullName !== user.fullName) {
      changes.fullName = values.fullName;
    }

    if (values.email.toLowerCase() !== user.email.toLowerCase()) {
      changes.email = values.email;
    }

    if (Object.keys(changes).length === 0) {
      return;
    }

    try {
      const updated = await userService.updateProfile(changes);
      setUser(updated);
      reset({ fullName: updated.fullName, email: updated.email });
      toast.success("Your profile has been updated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", {
          type: "server",
          message: "Another account already uses this email",
        });
        return;
      }

      if (applyFieldErrors(error, setError, ["fullName", "email"])) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <Input
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success("Your password has been changed");
    } catch (error) {
      if (error instanceof ApiError && /current password/i.test(error.message)) {
        setError("currentPassword", {
          type: "server",
          message: "Your current password is incorrect",
        });
        return;
      }

      if (
        applyFieldErrors(error, setError, ["currentPassword", "newPassword"])
      ) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" loading={isSubmitting}>
        Change password
      </Button>
      <p className="text-sm text-muted">
        Changing your password signs you out on your other devices.
      </p>
    </form>
  );
}

export default function AccountPage() {
  useDocumentTitle("Account settings");

  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Container narrow className="py-10">
      <h1 className="text-3xl sm:text-4xl">Account settings</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
        <AccountStatusBadge status={user.accountStatus} />
        <Link to="/orders" className="text-accent hover:underline">
          View my orders
        </Link>
      </div>

      <section
        aria-labelledby="profile-heading"
        className="mt-8 rounded border border-line bg-surface p-6"
      >
        <h2 id="profile-heading" className="text-xl">
          Profile
        </h2>
        <div className="mt-5">
          <ProfileForm />
        </div>
      </section>

      <section
        aria-labelledby="password-heading"
        className="mt-6 rounded border border-line bg-surface p-6"
      >
        <h2 id="password-heading" className="text-xl">
          Password
        </h2>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>
    </Container>
  );
}
