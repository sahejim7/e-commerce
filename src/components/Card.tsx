import Image from "next/image";
import Link from "next/link";

export type BadgeTone = "red" | "green" | "orange";

export interface CardProps {
  title: string;
  description?: string;
  imageSrc: string;
  imageAlt?: string;
  price?: string | number;
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  className?: string;
}

const toneToBg: Record<BadgeTone, string> = {
  red: "bg-[--color-red]/10 text-[--color-red]",
  green: "bg-[--color-green]/10 text-[--color-green]",
  orange: "bg-[--color-orange]/10 text-[--color-orange]",
};

export default function Card({
  title,
  description,
  imageSrc,
  imageAlt = title,
  price,
  href,
  badge,
  className = "",
}: CardProps) {
  const content = (
    <article
      className={`group rounded-xl bg-[--color-light-100] ring-1 ring-[--color-light-300] transition-colors hover:ring-[--color-dark-500] ${className}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        {badge?.label && (
          <span
            className={`absolute left-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-caption ${
              badge.tone ? toneToBg[badge.tone] : "bg-[--color-orange]/10 text-[--color-orange]"
            }`}
          >
            {badge.label}
          </span>
        )}
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="text-heading-3 text-[--color-dark-900]">{title}</h3>
        {description && <p className="text-body text-[--color-dark-700]">{description}</p>}
        {price !== undefined && (
          <p className="text-lead text-[--color-dark-900]">
            {typeof price === "number" ? `$${price.toFixed(2)}` : price}
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
