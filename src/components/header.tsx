// src/components/header.tsx
import { LanguageSwitcher } from './language-switcher';
import { CurrencySwitcher } from './currency-switcher';

export function Header() {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="font-bold text-xl">FrancoLink</div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-6">
          {/* ... nav links ... */}
        </nav>

        {/* Right side: Switchers + Auth */}
        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <LanguageSwitcher />
          {/* Auth buttons */}
        </div>
      </div>
    </header>
  );
}