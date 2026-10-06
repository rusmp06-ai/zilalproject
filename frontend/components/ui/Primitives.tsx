import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
export function Button({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`button ${secondary ? "button-secondary" : ""}`}
      href={href}
    >
      {children}
      <span aria-hidden="true">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M5 19 19 5M5 5h14v14" />
        </svg>
      </span>
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  as: Tag = "h2",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`section-heading ${light ? "light" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <Tag>{title}</Tag>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}
export function Landscape({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`landscape ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        priority={priority}
      />
    </div>
  );
}
