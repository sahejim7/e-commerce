import Link from "next/link";
import { MapPin } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Size Guides", href: "/size-guides" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Delivery & Return Policy", href: "/delivery" },
  { label: "FAQ", href: "/faq" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-black h-auto py-4 md:h-[70px] md:py-0 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Side - Location and Copyright */}
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-light-100" />
              <span className="text-[12px] font-normal text-light-100 font-['Helvetica_Neue']">
                Sri Lanka
              </span>
            </div>
            <span className="text-[12px] font-normal text-dark-500 font-['Helvetica_Neue']">
              © 2025 SECRETLACE. All Rights Reserved
            </span>
          </div>

          {/* Right Side - Footer Links */}
          <div className="flex items-center justify-center gap-7 md:justify-start">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] font-normal text-dark-500 font-['Helvetica_Neue'] hover:text-light-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
