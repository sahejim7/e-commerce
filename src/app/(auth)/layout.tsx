import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-black text-white p-10">
        <div className="flex items-center">
          <Link href="/" className="h-12 w-12 border-2 border-white bg-white inline-flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Image src="/assets/logo.png" alt="SECRETLACE" width={40} height={40} className="max-w-full max-h-full object-contain" />
          </Link>
        </div>

        <div className="space-y-6">
          <h2 className="text-6xl font-bold text-white">Wear The Story</h2>
          <p className="max-w-md text-xl text-white">
            Create an account for early access to new collections and member-only drops.
          </p>
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="h-2 w-2 rounded-full bg-gray-400" />
          </div>
        </div>

        <p className="text-sm text-white">© 2025 SECRETLACE. All rights reserved.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
