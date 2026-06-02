"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle2,
  Wrench,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
} from "lucide-react";
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
      <div className="space-y-5 text-center py-2">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/10">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">You&rsquo;re in</h2>
          <p className="text-sm text-muted-foreground">
            We created a Staff account for{" "}
            <span className="font-semibold text-foreground">{createdEmail}</span>.
          </p>
        </div>
        <Button asChild className="w-full h-12 text-base shadow-lg shadow-primary/20">
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
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="name"
            placeholder="Kwame Asante"
            autoComplete="name"
            {...register("name")}
            className="h-12 pl-10 text-base"
          />
        </div>
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@shop.com"
              autoComplete="email"
              {...register("email")}
              className="h-12 pl-10 text-base"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="phone"
              type="tel"
              placeholder="+233 24 ..."
              autoComplete="tel"
              {...register("phone")}
              className="h-12 pl-10 text-base"
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className="h-12 pl-10 pr-10 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-md"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="h-12 pl-10 text-base"
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-3.5 text-xs space-y-1.5">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Password requirements
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 text-muted-foreground pl-1">
          <li>· At least 8 characters</li>
          <li>· Uppercase & lowercase</li>
          <li>· At least one number</li>
        </ul>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60">
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
          <Link href="/terms" className="text-primary font-medium hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            Privacy Policy
          </Link>
          , and confirm I&rsquo;m authorised to create this account.
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-xs text-destructive -mt-2">{errors.acceptTerms.message}</p>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Create my account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground pt-1">
        <Wrench className="inline h-3 w-3 mr-0.5" />
        {APP_CONFIG.name} · {APP_CONFIG.email}
      </p>
    </form>
  );
}
