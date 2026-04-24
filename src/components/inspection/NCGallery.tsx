import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import { getMediaUrl } from "@/api/media";
import type { SnagImage } from "@/types/api";

interface NCGalleryProps {
  images: SnagImage[];
  onLightbox: (url: string) => void;
}

export function NCGallery({ images, onLightbox }: NCGalleryProps) {
  const ncImages = images.filter((i) => i.kind === "NC");
  if (ncImages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Inspector Photos ({ncImages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ncImages.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onLightbox(getMediaUrl(img.minio_key))}
              className="block rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <img
                src={getMediaUrl(img.minio_key)}
                alt={img.original_filename ?? "Snag photo"}
                className="w-full h-40 object-cover"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
