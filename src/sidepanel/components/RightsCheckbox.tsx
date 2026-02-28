interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RightsCheckbox({ checked, onChange }: Props) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>I confirm I have the right to download this content.</span>
    </label>
  );
}
