import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/dark-logo-transparent.png"
              alt="Francolink"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-primary-200 text-sm">
            ©{new Date().getFullYear()} By Francolink. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
