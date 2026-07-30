import Link from 'next/link';

type BreadcrumbItem = {
  href: string;
  label: string;
};

type BreadcrumbsProps = {
  breadcrumbs: BreadcrumbItem[];
};

export function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <span key={crumb.href} className="inline-flex min-w-0 items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {isLast ? (
              <span aria-current="page" className="truncate font-medium text-zinc-800">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate rounded-sm px-0.5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
