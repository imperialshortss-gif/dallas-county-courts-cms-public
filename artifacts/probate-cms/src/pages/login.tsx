import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import dallasSeal from "@/assets/dallas-county-seal.png";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img
          src={dallasSeal}
          alt="Dallas County Seal"
          className="w-28 h-28 mx-auto mb-4 drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
          style={{ filter: "drop-shadow(0 0 16px rgba(200,180,120,0.35))" }}
        />
        <h1 className="text-2xl font-bold text-white font-serif">Statutory Probate Courts</h1>
        <p className="text-blue-300 text-sm mt-1">Dallas County, Texas — Staff Portal</p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access the case management system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-white/40 text-center">
        Restricted access — authorized court personnel only.
      </p>
    </div>
  );
}
