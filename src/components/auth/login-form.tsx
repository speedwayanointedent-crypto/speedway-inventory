"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Mail, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const remember = watch("remember");

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        remember: data.remember ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "PENDING_APPROVAL") {
          toast.error("Your account is pending admin approval.", {
            description: "Contact an admin to activate your account.",
          });
          router.push("/pending");
          return;
        }
        if (result.error === "ACCOUNT_DISABLED") {
          toast.error("Your account is suspended. Contact an admin.");
          return;
        }
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className="h-12 pl-10 text-base"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline font-medium"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="h-12 pl-10 pr-10 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-md"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
        <Checkbox
          id="remember"
          checked={remember}
          onCheckedChange={(checked) => setValue("remember", Boolean(checked))}
        />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer flex-1 leading-snug">
          {remember ? "Stay signed in for 30 days" : "Sign out when I close the browser"}
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
        loading={submitting}
      >
        {!submitting && <LogIn className="h-4 w-4" />}
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&rsquo;t have an account?{" "}
        <Link
          href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Create one
        </Link>
      </p>

      <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-3.5 sm:p-4 text-xs space-y-1.5">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Demo credentials
        </p>
        <p className="text-muted-foreground font-mono text-[11px] sm:text-xs">
          Admin: <span className="text-foreground">admin@speedway.com</span> / Admin@123456
        </p>
        <p className="text-muted-foreground font-mono text-[11px] sm:text-xs">
          Staff: <span className="text-foreground">staff@speedway.com</span> / Staff@123456
        </p>
      </div>
    </form>
  );
}
