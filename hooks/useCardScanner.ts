"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ScanResult = {
  playerName?: string;
  team?: string;
  year?: number;
  product?: string;
  psaGrade?: number;
  certNumber?: string;
  confidence?: string;
  frontBoundingBox?: { x: number; y: number; width: number; height: number };
  backBoundingBox?: { x: number; y: number; width: number; height: number };
};

export function useCardScanner(
  onScanComplete: (data: ScanResult) => void,
  fetchPsaCert: (certNumber: string) => void
) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanConfidence, setScanConfidence] = useState<string | null>(null);
  const [scanFrontFile, setScanFrontFile] = useState<File | null>(null);
  const [scanBackFile, setScanBackFile] = useState<File | null>(null);
  const [scanFrontPreview, setScanFrontPreview] = useState<string | null>(null);
  const [scanBackPreview, setScanBackPreview] = useState<string | null>(null);
  const [croppedFrontUrl, setCroppedFrontUrl] = useState<string | null>(null);
  const [croppedBackUrl, setCroppedBackUrl] = useState<string | null>(null);

  const reset = () => {
    setScanError(null);
    setScanConfidence(null);
    setScanFrontFile(null);
    setScanBackFile(null);
    setScanFrontPreview(null);
    setScanBackPreview(null);
    setCroppedFrontUrl(null);
    setCroppedBackUrl(null);
  };

  const fileToBase64 = (file: File): Promise<{ data: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(url);
        resolve({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });

  const cropCardImage = (
    file: File,
    bbox: { x: number; y: number; width: number; height: number }
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const sx = Math.round(bbox.x * img.width);
        const sy = Math.round(bbox.y * img.height);
        const sw = Math.round(bbox.width * img.width);
        const sh = Math.round(bbox.height * img.height);

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to crop image"));
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for cropping"));
      };
      img.src = url;
    });

  const uploadCardImage = async (
    blob: Blob,
    side: "front" | "back"
  ): Promise<string | null> => {
    try {
      const fileName = `${side}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const filePath = `cards/${fileName}`;

      const { error } = await supabase.storage
        .from("card-images")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const triggerScan = async (front: File, back: File) => {
    setScanning(true);
    setScanError(null);
    setScanConfidence(null);

    try {
      const images = [
        await fileToBase64(front),
        await fileToBase64(back),
      ];

      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setScanError(data.error || "Scan failed");
        setScanning(false);
        return;
      }

      const card = data.card;

      onScanComplete(card);
      setScanConfidence(card.confidence);

      if (card.certNumber) {
        fetchPsaCert(card.certNumber);
      }

      const blobToDataUrl = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      try {
        const frontBlob = card.frontBoundingBox
          ? await cropCardImage(front, card.frontBoundingBox)
          : front;
        setScanFrontPreview(URL.createObjectURL(frontBlob));
        const frontUrl = await uploadCardImage(frontBlob, "front");
        setCroppedFrontUrl(frontUrl || await blobToDataUrl(frontBlob));

        const backBlob = card.backBoundingBox
          ? await cropCardImage(back, card.backBoundingBox)
          : back;
        setScanBackPreview(URL.createObjectURL(backBlob));
        const backUrl = await uploadCardImage(backBlob, "back");
        setCroppedBackUrl(backUrl || await blobToDataUrl(backBlob));
      } catch (cropErr) {
        console.error("Crop/upload error:", cropErr);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

  const handleScanFile = (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setScanFrontFile(file);
      setScanFrontPreview(url);
      if (scanBackFile) {
        setTimeout(() => triggerScan(file, scanBackFile), 100);
      } else {
        setTimeout(() => {
          const backInput = document.getElementById("scan-back");
          if (backInput) backInput.click();
        }, 300);
      }
    } else {
      setScanBackFile(file);
      setScanBackPreview(url);
      if (scanFrontFile) {
        setTimeout(() => triggerScan(scanFrontFile, file), 100);
      }
    }
    setScanError(null);
  };

  const handleScanSubmit = async () => {
    if (!scanFrontFile || !scanBackFile) {
      setScanError("Please take photos of both the front and back of the card.");
      return;
    }
    triggerScan(scanFrontFile, scanBackFile);
  };

  return {
    scanning, scanError, scanConfidence,
    scanFrontFile, scanBackFile,
    scanFrontPreview, scanBackPreview,
    croppedFrontUrl, croppedBackUrl,
    reset, handleScanFile, handleScanSubmit,
  };
}
