import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

export default function UploadCard() {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");
    setUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:8000/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          setStatus(data.message || "Uploaded successfully");
          setProgress(100);
        } catch {
          setStatus("Uploaded successfully");
          setProgress(100);
        }
      } else {
        setStatus(`Upload failed: ${xhr.statusText || xhr.status}`);
        setProgress(null);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setProgress(null);
      setStatus("Upload failed. Please try again.");
    };

    xhr.send(formData);
  };

  const clearFile = () => {
    setStatus("");
    setProgress(null);
    setUploading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          onChange={uploadFile}
          accept="application/pdf"
        />
        {progress !== null && (
          <div className="w-full h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-primary transition-[width] duration-200"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        <Button className="w-full" disabled={uploading}>
          {uploading
            ? `Uploading ${progress !== null ? `${progress}%` : ""}`
            : status || "Upload PDF"}
        </Button>
        {(status || progress !== null) && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={clearFile}
            disabled={uploading}
          >
            Remove file
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
