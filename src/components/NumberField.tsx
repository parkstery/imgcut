import React, { useEffect, useRef, useState } from 'react';

interface NumberFieldProps {
  /** Current model value */
  value: number;
  /** Called with the parsed (and clamped) number whenever a valid value is typed */
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Round the committed value to an integer (default true) */
  integer?: boolean;
  id?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Number input that can be emptied completely.
 *
 * The text the user types is kept in a local draft, so backspacing the last
 * digit is not immediately overwritten by the model value (which made the
 * last digit impossible to delete). The model is only updated for text that
 * actually parses – an empty field simply keeps the current value.
 *
 * The draft is dropped again when the field loses focus or when the value is
 * changed from somewhere else (undo, another control).
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  integer = true,
  id,
  className,
  title,
  disabled,
  placeholder,
}) => {
  const format = (n: number) => (integer ? String(Math.round(n)) : String(n));
  const [draft, setDraft] = useState<string | null>(null);
  /** The value this field submitted last – used to tell our own updates apart */
  const lastSubmitted = useRef<number | null>(null);

  // While the user is editing, their own text is shown (even when empty).
  const display = draft !== null ? draft : format(value);

  useEffect(() => {
    // A change we did not cause (undo, another control) drops the draft.
    if (lastSubmitted.current !== null && Math.abs(value - lastSubmitted.current) < 1e-9) {
      return;
    }
    setDraft(null);
  }, [value]);

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === '') return; // cleared – keep the current model value
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed)) return; // intermediate input such as "-" or "e"
    let next = integer ? Math.round(parsed) : parsed;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    lastSubmitted.current = next;
    onChange(next);
  };

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={display}
      disabled={disabled}
      title={title}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => {
        setDraft(null);
        lastSubmitted.current = null;
      }}
      className={className}
    />
  );
};
