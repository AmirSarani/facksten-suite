import { collaboratorLabel } from "../lib/projectPayload";
import { TextArea, TextInput } from "./ui";

type PairProps = {
  id: string;
  labelFa: string;
  labelEn: string;
  valueFa: string;
  valueEn: string;
  onChangeFa: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
};

export function BilingualField({
  id,
  labelFa,
  labelEn,
  valueFa,
  valueEn,
  onChangeFa,
  onChangeEn,
  multiline,
  required,
}: PairProps) {
  const Field = multiline ? TextArea : TextInput;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        id={`${id}-fa`}
        label={labelFa}
        hint="FA · RTL"
        dir="rtl"
        lang="fa"
        value={valueFa}
        required={required}
        onChange={(event) => onChangeFa(event.currentTarget.value)}
      />
      <Field
        id={`${id}-en`}
        label={labelEn}
        hint="EN · LTR"
        dir="ltr"
        lang="en"
        value={valueEn}
        required={required}
        onChange={(event) => onChangeEn(event.currentTarget.value)}
      />
    </div>
  );
}

export function LineList({
  id,
  label,
  labelFa,
  values,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  labelFa: string;
  values: readonly unknown[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const rows = values.length ? values : [""];
  const labels = rows.map(collaboratorLabel);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm text-on-surface">
          {labelFa} <span className="text-on-surface-variant">/ {label}</span>
        </p>
        <button
          type="button"
          className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-cta focus-cta"
          onClick={() => onChange([...labels, ""])}
        >
          + add
        </button>
      </div>
      <div className="space-y-2">
        {labels.map((value, index) => (
          <div key={`${id}-${index}`} className="flex gap-2">
            <input
              id={`${id}-${index}`}
              value={value}
              dir="ltr"
              placeholder={placeholder}
              onChange={(event) => {
                const next = [...labels];
                next[index] = event.currentTarget.value;
                onChange(next);
              }}
              className="w-full border border-outline bg-surface-container-low px-3 py-2 text-sm text-on-surface focus-cta"
            />
            <button
              type="button"
              className="cursor-pointer border border-outline px-3 font-mono text-xs text-on-surface-variant hover:text-error focus-cta"
              onClick={() => onChange(labels.filter((_, i) => i !== index))}
              aria-label="Remove line"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function cleanLines(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
