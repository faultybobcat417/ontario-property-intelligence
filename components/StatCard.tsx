/**
 * StatCard — a simple metric display card used on dashboards.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  subtext?: string;
  colorClass?: string;
  valueColorClass?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  subtext,
  colorClass = "bg-white border-gray-200",
  valueColorClass = "text-gray-900",
}: StatCardProps) {
  return (
    <div className={`card border p-5 ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${valueColorClass}`}>
            {typeof value === "number" ? value.toLocaleString("en-CA") : value}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-500">{subtext}</p>
          )}
        </div>
        {icon && (
          <span className="text-2xl ml-3 flex-shrink-0">{icon}</span>
        )}
      </div>
    </div>
  );
}
