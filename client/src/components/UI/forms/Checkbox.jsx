
const Checkbox = ({ checked, onChange, disabled }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black transition-colors cursor-pointer disabled:opacity-50"
  />
);

export default Checkbox;