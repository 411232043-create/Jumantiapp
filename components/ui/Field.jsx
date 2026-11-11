export function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-400 ml-1">*</span>}</label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
