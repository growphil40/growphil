import Link from 'next/link';

export default function ClientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-white p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 text-3xl font-bold shadow-lg">
          !
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Client Not Found</h1>
          <p className="text-zinc-400 text-sm">
            The client you are looking for does not exist or has been removed.
          </p>
        </div>
        <div>
          <Link
            href="/agency/clients"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#3B82F6] text-black hover:bg-[#3B82F6]/90 font-bold transition-all text-sm shadow-md shadow-[#3B82F6]/10"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    </div>
  );
}
