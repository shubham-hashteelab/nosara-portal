import apiClient, { getBackendUrl, getToken } from "./client";

export async function uploadMedia(
  file: File,
  type: "image" | "voice" | "video",
  entryId: string
): Promise<{ minio_key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("inspection_entry_id", String(entryId));

  const response = await apiClient.post<{ minio_key: string }>(
    "/api/v1/files/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}

export function getMediaUrl(minioKey: string): string {
  const baseUrl = getBackendUrl();
  const token = getToken();
  return `${baseUrl}/api/v1/files/${minioKey}?token=${token}`;
}
