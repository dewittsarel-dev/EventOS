import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          ClientOS workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p> : null}
      </div>
      {actions ? (
        <div className="-mx-1 flex w-[calc(100%+0.5rem)] flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [&>*]:shrink-0 md:mx-0 md:w-auto md:max-w-[60%] md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
