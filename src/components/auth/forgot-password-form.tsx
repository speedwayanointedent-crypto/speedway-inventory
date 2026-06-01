"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validations";
import type { z } from "zod";
import { requestPasswordReset } from "@/actions/auth";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(data.email);
      setSubmitted(true);
      toast.success("Check your email for the reset link");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-success" />
        </div>
        <div>
          <h2 className="font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-1">
            If an account exists with that email, we sent a reset link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" loading={submitting}>
        Send reset link
      </Button>
    </form>
  );
}
