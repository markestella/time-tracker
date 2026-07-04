import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <LoginForm />
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © 2026 Mckbyte TimeTracker. All Rights Reserved.
      </p>
    </div>
  );
}
