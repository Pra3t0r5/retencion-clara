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

  const stateClass = status === "done" ? "dropzone--done"
    : status === "error" ? "dropzone--error"
    : dragging ? "dropzone--dragging"
    : "";

  return (
    <div
      className={`dropzone ${stateClass}`}
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

      <div className="dropzone-label">{label}</div>

      {status === "idle" && (
        <div className="dropzone-hint">Arrastrá tu PDF aquí o hacé click</div>
      )}
      {status === "loading" && (
        <div className="dropzone-processing">Procesando {filename}…</div>
      )}
      {status === "done" && (
        <div className="dropzone-done">
          ✓ {filename}
          {lowConfidenceFields.length > 0 && (
            <span className="dropzone-warning">
              ⚠ revisar: {lowConfidenceFields.join(", ")}
            </span>
          )}
        </div>
      )}
      {status === "error" && (
        <div className="dropzone-error">✗ {error || "Error al procesar el PDF"}</div>
      )}
    </div>
  );
}
