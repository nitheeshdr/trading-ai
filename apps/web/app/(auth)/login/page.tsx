import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">TradeView</h1>
          <p className="mt-2 text-muted-foreground">AI-powered trading platform</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
