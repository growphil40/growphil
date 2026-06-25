export default function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-border"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="text-text-secondary text-sm font-semibold tracking-wide animate-pulse">
          Loading GrowPhil CRM...
        </p>
      </div>
    </div>
  );
}
