"use client";

export default function Toast({ toast }: { toast: { message: string; type: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  );
}
