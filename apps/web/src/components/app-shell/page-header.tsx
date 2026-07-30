import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
