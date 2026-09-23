import { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrencyInput, parseCurrency } from '../lib/format';

interface CurrencyInputProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  autoComplete?: string;
}

export function CurrencyInput({ value, onChange, disabled, autoFocus, id, autoComplete }: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => formatCurrencyInput(value));
  const ref = useRef<HTMLInputElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDisplay(formatCurrencyInput(value));
    }
  }, [value]);

  const handleFocus = useCallback(() => {
    focused.current = true;
    setDisplay(formatCurrencyInput(value));
    requestAnimationFrame(() => {
      ref.current?.select();
    });
  }, [value]);

  const handleBlur = useCallback(() => {
    focused.current = false;
    const n = parseCurrency(display);
    onChange(n);
    setDisplay(formatCurrencyInput(n));
  }, [display, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value);
    onChange(parseCurrency(e.target.value));
  }, [onChange]);

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete={autoComplete}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder="0,00"
    />
  );
}
