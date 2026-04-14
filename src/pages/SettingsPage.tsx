import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { testConnection } from "@/api/auth";
import {
  getBackendUrl,
  setBackendUrl,
  isBackendConfigured,
} from "@/api/client";
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
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const serverSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
});

type ServerFormData = z.infer<typeof serverSchema>;

export default function SettingsPage() {
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">(
    isBackendConfigured() ? "success" : "idle"
  );
  const [testError, setTestError] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      url: getBackendUrl() || "",
    },
  });

  const onTestConnection = async () => {
    const url = getValues("url");
    if (!url) return;

    setIsTesting(true);
    setTestResult("idle");
    setTestError("");
    setSaved(false);

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

  const onSave = async (data: ServerFormData) => {
    setIsTesting(true);
    setTestResult("idle");
    setTestError("");
    setSaved(false);

    try {
      await testConnection(data.url);
      setBackendUrl(data.url);
      setTestResult("success");
      setSaved(true);
    } catch (err: unknown) {
      setTestResult("error");
      setTestError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your backend server connection
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100">
              <Server className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-base">Backend Server</CardTitle>
              <CardDescription>
                {isBackendConfigured()
                  ? `Connected to ${getBackendUrl()}`
                  : "Not configured — enter your RunPod backend URL"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-url">Server URL</Label>
              <Input
                id="server-url"
                placeholder="https://xxxxx-8000.proxy.runpod.net"
                {...register("url")}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url.message}</p>
              )}
            </div>

            {testResult === "success" && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">
                  {saved ? "Connected and saved" : "Connected"}
                </span>
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
                Test Connection
              </Button>
              <Button type="submit" className="flex-1" disabled={isTesting}>
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
