import { cn } from "@/lib/utils";
import { eur, sqm } from "@/lib/format";
import { paidFor, unitTotal, type Payment, type Unit } from "@/lib/units";
import { Link2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  units: Unit[];
  payments: Payment[];
  activeId: string | null;
  joinMode: boolean;
  joinSelection: string[];
  onSelect: (u: Unit) => void;
  onToggleJoin: (id: string) => void;
  onDeleteFloor: (floor: number) => void;
  onAddUnit: (floor: number) => void;
};

function statusClasses(u: Unit, pct: number) {
  if (u.status === "prodan") return "bg-navy text-primary-foreground border-navy";
  if (u.status === "rezervisan" || pct > 0) return "bg-gold-soft border-gold";
  return "bg-free";
}

export function BuildingPlan({
  units,
  payments,
  activeId,
  joinMode,
  joinSelection,
  onSelect,
  onToggleJoin,
  onDeleteFloor,
  onAddUnit,
}: Props) {
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {floors.map((floor, i) => {
        const floorUnits = units.filter((u) => u.floor === floor);
        const blocks = [...new Set(floorUnits.map((u) => u.block))].sort((a, b) => a - b);
        return (
          <section
            key={floor}
            className="animate-rise surface p-4 sm:p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">{floor}. sprat</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onAddUnit(floor)} aria-label="Dodaj stan">
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFloor(floor)}
                  aria-label="Obriši sprat"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-3">
              {blocks.map((block) => (
                <div key={block} className="grid gap-2">
                  {floorUnits
                    .filter((u) => u.block === block)
                    .sort((a, b) => a.slot - b.slot)
                    .map((u) => {
                      const total = unitTotal(u);
                      const paid = paidFor(u.id, payments);
                      const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                      const picked = joinSelection.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => (joinMode ? onToggleJoin(u.id) : onSelect(u))}
                          className={cn(
                            "unit-cell overflow-hidden px-3 py-3 text-left",
                            statusClasses(u, pct),
                            activeId === u.id && !joinMode && "ring-2 ring-gold ring-offset-2",
                            picked && "ring-2 ring-navy ring-offset-2",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-lg leading-none">{u.label}</span>
                            {u.group_id ? <Link2 className="size-3.5 opacity-70" /> : null}
                          </div>
                          <div className="mt-1 text-[11px] opacity-75">{sqm(u.sqm)}</div>
                          <div className="mt-2 text-xs font-medium tabular-nums">{eur(total)}</div>
                          <div className="mt-2 h-1 w-full rounded-full bg-current/15">
                            <div
                              className="h-1 rounded-full bg-current transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
