"use client";

import * as React from "react";
import { ImagePlus, Link, X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/actions/upload";
import { toast } from "sonner";

interface Props {
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export function ImageUpload({ value = [], onChange }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const images = value;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadImage(formData);
      if (res.success && res.url) {
        onChange?.([...images, res.url]);
        toast.success("Image uploaded");
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlAdd = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onChange?.([...images, trimmed]);
    setUrlValue("");
    setShowUrlInput(false);
  };

  const remove = (index: number) => {
    onChange?.(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Product Images</Label>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group size-20 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-0.5 right-0.5 size-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <Link className="h-4 w-4" /> Add URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Paste image URL..."
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleUrlAdd(); }
            }}
          />
          <Button type="button" size="sm" onClick={handleUrlAdd}>Add</Button>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <ImagePlus className="h-5 w-5 mx-auto mb-1 text-muted-foreground/60" />
        Drop images here or click to browse
      </div>
    </div>
  );
}
