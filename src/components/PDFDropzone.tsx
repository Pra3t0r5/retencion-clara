import { useState, useRef } from "react";

type Status = "idle" | "loading" | "done" | "error";

type Props = {
  label: string;
  onExtract: (file: File) => Promise<{ _lowConfidence: string[] }>;
  lowConfidenceFields?: string[];
};

export function PDFDropzone({ label, onExtract, lowConfidenceFields = [] }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function process(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setError("Debe ser un archivo PDF");
      setStatus("error");
      return;
    }
    setFilename(file.name);
    setStatus("loading");
    setError("");
    try {
      const result = await onExtract(file);
      setStatus("done");
      if (result._lowConfidence.length > 0) {
        setError(`Campos con baja confianza: ${result._lowConfidence.join(", ")}`);
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Error al procesar el PDF");
    }
  }

  function handleFile(file: File | undefined) {
    if (file) process(file);
  }

  const borderColor = status === "done" ? "#16a34a"
    : status === "error" ? "#dc2626"
    : dragging ? "#2563eb"
    : "#d1d5db";

  const bg = status === "done" ? "#f0fdf4"
    : status === "error" ? "#fef2f2"
    : dragging ? "#eff6ff"
    : "#f9fafb";

  return (
    <div
      style={{
        border: `2px dashed ${borderColor}`, borderRadius: 8,
        padding: "16px 12px", background: bg, cursor: "pointer",
        transition: "all 0.15s", marginBottom: 12,
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
        {label}
      </div>

      {status === "idle" && (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          Arrastrá tu PDF aquí o hacé click
        </div>
      )}
      {status === "loading" && (
        <div style={{ fontSize: 13, color: "#2563eb" }}>Procesando {filename}…</div>
      )}
      {status === "done" && (
        <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
          ✓ {filename}
          {lowConfidenceFields.length > 0 && (
            <span style={{ color: "#d97706", fontWeight: 400, marginLeft: 6 }}>
              ⚠ revisar: {lowConfidenceFields.join(", ")}
            </span>
          )}
        </div>
      )}
      {status === "error" && (
        <div style={{ fontSize: 13, color: "#dc2626" }}>
          ✗ {error || "Error al procesar el PDF"}
        </div>
      )}
    </div>
  );
}
