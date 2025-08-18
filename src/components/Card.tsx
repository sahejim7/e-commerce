import Image from "next/image";
import Link from "next/link";

export type BadgeTone = "red" | "green" | "orange";

export interface CardProps {
  title: string;
  description?: string;
  subtitle?: string;
  meta?: string | string[];
  imageSrc: string;
  imageAlt?: string;
  price?: string | number;
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  className?: string;
}

const toneToBg: Record<BadgeTone, string> = {
  red: "text-[--color-red]",
  green: "text-[--color-green]",
  orange: "text-[--color-orange]",
};

export default function Card({
  title,
  description,
  subtitle,
  meta,
  imageSrc,
  imageAlt = title,
  price,
  href,
  badge,
  className = "",
}: CardProps) {
  const displayPrice =
    price === undefined ? undefined : typeof price === "number" ? `$${price.toFixed(2)}` : price;
  const content = (
    <article
      className={`group rounded-xl bg-[--color-light-100] ring-1 ring-[--color-light-300] transition-colors hover:ring-[--color-dark-500] ${className}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-[--color-light-200]">
        {badge?.label && (
          <span
            className={`absolute left-4 top-4 z-10 inline-flex items-center rounded-full px-3 py-1 text-caption bg-[--color-light-100] ring-1 ring-[--color-light-300] shadow-sm ${
              badge.tone ? toneToBg[badge.tone] : "text-[--color-orange]"
            }`}
          >
            {badge.label}
          </span>
        )}
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 className="text-heading-3 text-[--color-dark-900]">{title}</h3>
          {displayPrice && <span className="text-body-medium text-[--color-dark-900]">{displayPrice}</span>}
        </div>
        {description && <p className="text-body text-[--color-dark-700]">{description}</p>}
        {subtitle && <p className="text-body text-[--color-dark-700]">{subtitle}</p>}
        {meta && (
          <p className="mt-1 text-caption text-[--color-dark-700]">
            {Array.isArray(meta) ? meta.join(" • ") : meta}
          </p>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link
      href={href}
      aria-label={title}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
