# Supplier photo import

Place operator-owned or properly licensed photographs under `Supplier Photos/` in the repository root. Subfolders may be organised by supplier and category. Use descriptive filenames such as `gold-chiavari-chair-01.jpg`.

Run `pnpm --filter api simulation:audit-photos`. The audit never changes the catalogue or copies photographs. It creates `outputs/simulation/supplier-photo-audit.json` with confident matches, review items, exact duplicates and missing catalogue coverage.

Every imported photograph must be reviewed for ownership, supplier permission and Marketplace publication approval before it is copied into a public application asset folder. The simulator must not silently publish third-party supplier content.
