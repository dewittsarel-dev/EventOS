import {
  ROLE_PERMISSION_ACTIONS,
  ROLE_PERMISSION_GROUPS,
  type RolePermissions,
} from '../../../../lib/roles-types';

type PermissionsGridProps = {
  permissions: RolePermissions;
  onChange: (next: RolePermissions) => void;
};

export function PermissionsGrid({ permissions, onChange }: PermissionsGridProps) {
  function setValue(group: (typeof ROLE_PERMISSION_GROUPS)[number], action: (typeof ROLE_PERMISSION_ACTIONS)[number], checked: boolean) {
    onChange({
      ...permissions,
      [group]: {
        ...permissions[group],
        [action]: checked,
      },
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-800">Permissions</p>
      <div className="space-y-3">
        {ROLE_PERMISSION_GROUPS.map((group) => (
          <section
            key={group}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
          >
            <p className="text-sm font-medium text-zinc-900">{group}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {ROLE_PERMISSION_ACTIONS.map((action) => {
                const inputId = `${group}-${action}`;
                return (
                  <label
                    htmlFor={inputId}
                    key={action}
                    className="inline-flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={permissions[group][action]}
                      onChange={(event) =>
                        setValue(group, action, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    {action}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
