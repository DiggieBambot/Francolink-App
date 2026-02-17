import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-primary-200 text-sm">
            ©{new Date().getFullYear()} By Franco Link. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}