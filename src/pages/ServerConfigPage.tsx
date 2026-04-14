import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { testConnection } from "@/api/auth";
import { setBackendUrl, isBackendConfigured } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const schema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
});

type FormData = z.infer<typeof schema>;

export default function ServerConfigPage() {
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [testError, setTestError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "",
    },
  });

  const onTest = async () => {
    const url = getValues("url");
    if (!url) return;

    setTestResult("idle");
    setTestError("");

    try {
      await testConnection(url);
      setTestResult("success");
    } catch (err: unknown) {
      setTestResult("error");
      const message =
        err instanceof Error ? err.message : "Connection failed";
      setTestError(message);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await testConnection(data.url);
      setBackendUrl(data.url);
      navigate("/login");
    } catch (err: unknown) {
      setTestResult("error");
      const message =
        err instanceof Error ? err.message : "Connection failed";
      setTestError(message);
    }
  };

  // If already configured, allow bypassing
  const alreadyConfigured = isBackendConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Nosara Portal</CardTitle>
          <CardDescription>
            Connect to your Nosara backend server to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Backend Server URL</Label>
              <Input
                id="url"
                placeholder="https://xxxxx-8000.proxy.runpod.net"
                {...register("url")}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url.message}</p>
              )}
            </div>

            {/* Test result */}
            {testResult === "success" && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Connection successful</span>
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
                onClick={onTest}
                disabled={isSubmitting}
              >
                Test Connection
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Connect & Continue
              </Button>
            </div>

            {alreadyConfigured && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Skip — use existing server
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
