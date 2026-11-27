import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { ApiError, getErrorMessage } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";

export default function RegisterPage() {
  useDocumentTitle("Create account");

  const { register: registerUser } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      // The backend signs the new customer in; the guest-only route then
      // sends them onward.
      const user = await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      toast.success(`Your account is ready, ${user.fullName}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", {
          type: "server",
          message: "An account with this email already exists",
        });
        return;
      }

      if (
        applyFieldErrors(error, setError, ["fullName", "email", "password"])
      ) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save a cart and wishlist, check out and follow your orders."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
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

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
