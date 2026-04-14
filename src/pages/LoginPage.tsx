import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  isBackendConfigured,
  getBackendUrl,
  setBackendUrl,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const serverSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ServerFormData = z.infer<typeof serverSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState("");

  // Server config state
  const backendConfigured = isBackendConfigured();
  const [serverOpen, setServerOpen] = useState(!backendConfigured);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">(
    backendConfigured ? "success" : "idle"
  );
  const [testError, setTestError] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const serverForm = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      url: getBackendUrl() || "",
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onTestConnection = async () => {
    const url = serverForm.getValues("url");
    if (!url) return;

    setIsTesting(true);
    setTestResult("idle");
    setTestError("");

    try {
      await testConnection(url);
      setTestResult("success");
    } catch (err: unknown) {
      setTestResult("error");
      setTestError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  const onSaveServer = async (data: ServerFormData) => {
    setIsTesting(true);
    setTestResult("idle");
    setTestError("");

    try {
      await testConnection(data.url);
      setBackendUrl(data.url);
      setTestResult("success");
      // Collapse the server card after successful save
      setTimeout(() => setServerOpen(false), 800);
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
      setServerOpen(true);
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
        {/* Server Configuration Card */}
        <Card>
          <button
            type="button"
            className="w-full"
            onClick={() => setServerOpen(!serverOpen)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100">
                    <Server className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base">Backend Server</CardTitle>
                    <CardDescription className="text-xs">
                      {isBackendConfigured()
                        ? getBackendUrl()
                        : "Not configured"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResult === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {testResult === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  {serverOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
          </button>

          {serverOpen && (
            <CardContent className="pt-0">
              <form
                onSubmit={serverForm.handleSubmit(onSaveServer)}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="server-url">Server URL</Label>
                  <Input
                    id="server-url"
                    placeholder="https://xxxxx-8000.proxy.runpod.net"
                    {...serverForm.register("url")}
                  />
                  {serverForm.formState.errors.url && (
                    <p className="text-sm text-red-500">
                      {serverForm.formState.errors.url.message}
                    </p>
                  )}
                </div>

                {testResult === "success" && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Test
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isTesting}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

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
            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4"
            >
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
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting && (
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
