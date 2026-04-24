import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { getMediaUrl } from "@/api/media";
import type { SnagImage } from "@/types/api";

interface ClosureGalleryProps {
  images: SnagImage[];
  onLightbox: (url: string) => void;
}

export function ClosureGallery({ images, onLightbox }: ClosureGalleryProps) {
  const closureImages = images.filter((i) => i.kind === "CLOSURE");

  return (
    <Card>
      <CardHeader className="bg-amber-50/50 border-b border-amber-100 rounded-t-2xl">
        <CardTitle className="text-base flex items-center gap-2 text-amber-900">
          <CheckCircle2 className="h-4 w-4" />
          Closure Photos ({closureImages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {closureImages.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No closure photos uploaded yet.
            <p className="text-xs text-gray-400 mt-1">
              The Business Associate uploads closure photos from the mobile app
              after completing the fix.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {closureImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onLightbox(getMediaUrl(img.minio_key))}
                className="block rounded-lg overflow-hidden border hover:ring-2 hover:ring-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <img
                  src={getMediaUrl(img.minio_key)}
                  alt={img.original_filename ?? "Closure photo"}
                  className="w-full h-40 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
