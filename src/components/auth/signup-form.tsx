"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { signup } from "@/actions/signup";
import { APP_CONFIG } from "@/lib/constants";

export function SignupForm() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: SignupInput) => {
    setSubmitting(true);
    try {
      const res = await signup(data);
      if (res.success) {
        setCreatedEmail(res.email ?? data.email);
        setDone(true);
        toast.success("Account created! You can sign in now.");
      } else {
        toast.error("error" in res && res.error ? res.error : "Sign-up failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">You&rsquo;re in</h2>
          <p className="text-sm text-muted-foreground">
            We created a Staff account for{" "}
            <span className="font-medium text-foreground">{createdEmail}</span>.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign in to your account
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          An admin can elevate your account to Admin from the Users page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Kwame Asante" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@shop.com" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+233 24 ..." {...register("phone")} />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-md bg-muted/40 border px-3 py-2 text-xs text-muted-foreground space-y-0.5">
        <p className="font-medium text-foreground">Password requirements:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>At least 8 characters long</li>
          <li>One uppercase and one lowercase letter</li>
          <li>At least one number</li>
        </ul>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) =>
            setValue("acceptTerms", checked === true, { shouldValidate: true })
          }
          className="mt-0.5"
        />
        <Label htmlFor="acceptTerms" className="text-xs font-normal cursor-pointer leading-snug">
          I agree to the{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , and confirm I&rsquo;m authorised to create this account.
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-xs text-destructive -mt-2">{errors.acceptTerms.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Create my account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground pt-2">
        <Wrench className="inline h-3 w-3 mr-0.5" />
        {APP_CONFIG.name} · {APP_CONFIG.email}
      </p>
    </form>
  );
}
