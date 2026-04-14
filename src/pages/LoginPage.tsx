import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  isBackendConfigured,
  setBackendUrl,
  getBackendUrl,
} from "@/api/client";
import { testConnection } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Server,
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState("");

  // Server config — only shown if not yet configured
  const [backendConfigured, setBackendConfigured] = useState(
    isBackendConfigured()
  );
  const [serverUrl, setServerUrl] = useState(getBackendUrl() || "");
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [testError, setTestError] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onTestAndSave = async () => {
    if (!serverUrl.trim()) return;
    setIsTesting(true);
    setTestResult("idle");
    setTestError("");
    try {
      await testConnection(serverUrl.trim());
      setBackendUrl(serverUrl.trim());
      setTestResult("success");
      setBackendConfigured(true);
    } catch (err: unknown) {
      setTestResult("error");
      setTestError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  const onLogin = async (data: LoginFormData) => {
    if (!isBackendConfigured()) {
      setLoginError("Please configure the backend server first.");
      return;
    }

    setLoginError("");
    try {
      await login(data.username, data.password);
      navigate("/");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 401
      ) {
        setLoginError("Invalid username or password.");
      } else {
        setLoginError(
          "Login failed. Please check your connection and try again."
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Server config — only shown when not configured */}
        {!backendConfigured && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100">
                  <Server className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Connect to Server</CardTitle>
                  <CardDescription className="text-xs">
                    Enter your backend URL to get started
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="server-url">Backend URL</Label>
                <Input
                  id="server-url"
                  placeholder="https://xxxxx-8000.proxy.runpod.net"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                />
              </div>

              {testResult === "success" && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Connected and saved</span>
                </div>
              )}
              {testResult === "error" && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {testError || "Connection failed"}
                  </span>
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                onClick={onTestAndSave}
                disabled={isTesting || !serverUrl.trim()}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test & Save
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Nosara</CardTitle>
            <CardDescription>
              Sign in to your manager account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{loginError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
