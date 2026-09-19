import { useState, type ChangeEvent } from "react";
import { absoluteAssetUrl, errorMessage, uploadImage } from "../lib/api";
import { Alert, FieldLabel, TextInput } from "./ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploadButton({
  id,
  label,
  labelFa,
  onUploaded,
}: {
  id: string;
  label: string;
  labelFa?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onUploaded(await uploadImage(file));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center border border-outline px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cta focus-within:shadow-neon-sm"
        >
          <input
            id={id}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => void onPick(event)}
            className="sr-only"
          />
          {busy ? "Uploading…" : label}
        </label>
        {labelFa ? (
          <span className="text-xs text-on-surface-variant" dir="rtl" lang="fa">
            {labelFa}
          </span>
        ) : null}
      </div>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}

export function CoverUploadField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const preview = absoluteAssetUrl(value);

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor={id} hint="cover">
        جلد / Cover URL
      </FieldLabel>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <TextInput
          id={id}
          dir="ltr"
          value={value}
          placeholder="/api/media/…"
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <ImageUploadButton
          id={`${id}-file`}
          label="Upload cover"
          labelFa="بارگذاری جلد"
          onUploaded={onChange}
        />
      </div>
      {preview ? (
        <img
          src={preview}
          alt=""
          className="max-h-40 border border-outline bg-surface-container object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}
