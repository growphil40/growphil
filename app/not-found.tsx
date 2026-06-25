import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function NotFound() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('growphil_user');
  let dashboardUrl = '/login';

  if (userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value));
      if (user?.role === 'agency_admin') {
        dashboardUrl = '/agency/clients';
      } else if (user?.role === 'client_owner') {
        dashboardUrl = '/client/leads';
      }
    } catch (e) {
      // Ignore
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-red-500 text-3xl font-bold shadow-lg">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Page Not Found</h1>
          <p className="text-zinc-405 text-sm">
            We couldn't find the page you were looking for. It might have been moved or deleted.
          </p>
        </div>
        <div>
          <Link
            href={dashboardUrl}
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-primary text-white hover:brightness-105 font-bold transition-all shadow-md shadow-primary/20"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
