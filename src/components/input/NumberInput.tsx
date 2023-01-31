import { useCallback } from "react";

type Props = {
  value: number;
  label?: {
    value: string;
    postfix?: string;
  };
  maxLength?: number;
  onChange: (v: number) => void;
  normalize?: (v: string) => string | undefined;
};

export default function NumberInput({
  value,
  label,
  maxLength,
  onChange,
  normalize,
}: Props) {
  const { value: labelValue, postfix: labelPostfix } = label || {};
  const handleChange = useCallback(
    (v: string) => {
      const value = v.slice(0, maxLength);
      if (normalize) onChange(Number(normalize(value)));
      else onChange(Number(value));
    },
    [maxLength, onChange, normalize]
  );
  return (
    <div className="input">
      {label && (
        <label>
          {labelValue}
          {labelPostfix && (
            <span style={{ fontSize: "70%" }}>&nbsp;{labelPostfix}</span>
          )}
        </label>
      )}
      <input
        value={value}
        name="startBalance"
        type="number"
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
