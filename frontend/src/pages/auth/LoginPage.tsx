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
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { ApiError, getErrorMessage } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";

interface FormError {
  message: string;
  blocked: boolean;
}

export default function LoginPage() {
  useDocumentTitle("Sign in");

  const { login } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<FormError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      // On success the guest-only route sends the user onward.
      const user = await login(values);
      toast.success(`Welcome back, ${user.fullName}`);
    } catch (error) {
      if (applyFieldErrors(error, setError, ["email", "password"])) {
        return;
      }

      setFormError({
        message: getErrorMessage(error),
        blocked: error instanceof ApiError && error.status === 403,
      });
    }
  });

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to see your cart, wishlist and orders."
      footer={
        <>
          <p>
            New to Dream Shop?{" "}
            <Link
              to="/register"
              state={location.state}
              className="font-medium text-accent hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-2">
            Forgotten your password?{" "}
            <Link to="/contact" className="font-medium text-accent hover:underline">
              Contact us
            </Link>{" "}
            for help.
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError ? (
          <FormAlert variant={formError.blocked ? "blocked" : "error"}>
            {formError.blocked ? (
              <>
                {formError.message}.{" "}
                <Link to="/contact" className="font-medium underline">
                  Contact us
                </Link>{" "}
                if you think this is a mistake.
              </>
            ) : (
              formError.message
            )}
          </FormAlert>
        ) : null}

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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
