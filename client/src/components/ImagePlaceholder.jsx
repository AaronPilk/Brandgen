export default function ImagePlaceholder({ label }) {
  return (
    <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-brand-purple/25 bg-brand-purple/[0.03] flex flex-col items-center justify-center gap-3 p-6">
      <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-brand-purple/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-brand-purple/60">Image Preview</p>
        <p className="text-[10px] text-content-muted mt-0.5">
          {label || 'Connect DALL-E to generate'}
        </p>
      </div>
    </div>
  );
}
