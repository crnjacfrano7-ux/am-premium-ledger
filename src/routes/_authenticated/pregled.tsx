import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BuildingPlan } from "@/components/BuildingPlan";
import { UnitPanel } from "@/components/UnitPanel";
import logo from "@/assets/am-premium-logo.jpg.asset.json";
import { eur } from "@/lib/format";
import {
  addBuilding,
  apartmentLabel,
  addFloor,
  deleteBuilding,
  fetchBuildings,
  renameBuilding,
  addPayment,
  addUnitToFloor,
  deleteFloor,
  deleteUnit,
  fetchPayments,
  fetchUnits,
  joinUnits,
  leaveGroup,
  paidFor,
  removePayment,
  unitTotal,
  updateUnit,
  updateStaircaseLayouts,
  type Unit,
} from "@/lib/units";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Link2, Plus, Building2, PencilRuler, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pregled")({
  head: () => ({
    meta: [
      { title: "Pregled zgrade · AM Premium" },
      { name: "description", content: "Evidencija stanova, uplata i preostalih iznosa za AM Premium Residence." },
      { property: "og:title", content: "Pregled zgrade · AM Premium" },
      {
        property: "og:description",
        content: "Evidencija stanova, uplata i preostalih iznosa za AM Premium Residence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pregled,
});

function Pregled() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [joinMode, setJoinMode] = useState(false);
  const [joinSelection, setJoinSelection] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const buildingsQ = useQuery({ queryKey: ["buildings"], queryFn: fetchBuildings });
  const buildings = useMemo(() => buildingsQ.data ?? [], [buildingsQ.data]);
  const currentBuilding = buildings.find((b) => b.id === buildingId) ?? buildings[0] ?? null;

  const unitsQ = useQuery({ queryKey: ["units"], queryFn: fetchUnits });
  const paymentsQ = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });

  const units = useMemo(
    () => (unitsQ.data ?? []).filter((u) => u.building_id === currentBuilding?.id),
    [unitsQ.data, currentBuilding?.id],
  );
  const payments = useMemo(() => paymentsQ.data ?? [], [paymentsQ.data]);
  const active = units.find((u) => u.id === activeId) ?? null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["units"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
    qc.invalidateQueries({ queryKey: ["buildings"] });
  };

  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = units.reduce(
    (acc, u) => {
      const t = unitTotal(u);
      const p = paidFor(u.id, payments);
      acc.total += t;
      acc.paid += p;
      acc.sqm += u.sqm;
      if (u.status === "prodan") acc.sold += 1;
      return acc;
    },
    { total: 0, paid: 0, sqm: 0, sold: 0 },
  );

  const nextFloor = units.length ? Math.max(...units.map((u) => u.floor)) + 1 : 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="AM Premium" className="size-10 rounded-md object-cover" />
            <div>
              <p className="font-display text-lg leading-none">AM PREMIUM</p>
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground">RESIDENCE</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              qc.clear();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" /> Odjava
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {buildings.map((b) => (
            <Button
              key={b.id}
              size="sm"
              variant={currentBuilding?.id === b.id ? "default" : "outline"}
              onClick={() => {
                setBuildingId(b.id);
                setActiveId(null);
              }}
              onDoubleClick={() => {
                const name = prompt("Naziv zgrade", b.name);
                if (name?.trim()) run.mutate(() => renameBuilding(b.id, name.trim()));
              }}
            >
              <Building2 className="size-4" /> {b.name}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              run.mutate(async () => {
                const id = await addBuilding(`Zgrada ${buildings.length + 1}`, buildings.length);
                setBuildingId(id);
                setActiveId(null);
              })
            }
          >
            <Plus className="size-4" /> Zgrada
          </Button>
          {currentBuilding ? (
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Preimenuj zgradu"
                onClick={() => {
                  const name = prompt("Naziv zgrade", currentBuilding.name);
                  if (name?.trim()) run.mutate(() => renameBuilding(currentBuilding.id, name.trim()));
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Obriši zgradu"
                onClick={() => {
                  if (!confirm(`Obrisati ${currentBuilding.name} i sve njene stanove?`)) return;
                  run.mutate(async () => {
                    await deleteBuilding(currentBuilding.id);
                    setBuildingId(null);
                    setActiveId(null);
                  });
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="animate-rise grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Ukupna vrijednost" value={eur(totals.total)} />
          <Stat label="Uplaćeno" value={eur(totals.paid)} />
          <Stat label="Preostalo" value={eur(Math.max(0, totals.total - totals.paid))} />
          <Stat label="Prodano" value={`${totals.sold} / ${units.length}`} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            variant={joinMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setJoinMode(!joinMode);
              setEditMode(false);
              setJoinSelection([]);
            }}
          >
            <Link2 className="size-4" />
            {joinMode ? "Otkaži spajanje" : "Spoji stanove"}
          </Button>
          {joinMode ? (
            <Button
              size="sm"
              disabled={joinSelection.length < 2}
              onClick={() =>
                run.mutate(async () => {
                  const labels = units
                    .filter((u) => joinSelection.includes(u.id))
                    .map((u) => u.label)
                    .join(" + ");
                  await joinUnits(joinSelection, labels);
                  setJoinMode(false);
                  setJoinSelection([]);
                  toast.success("Stanovi spojeni");
                })
              }
            >
              Spoji ({joinSelection.length})
            </Button>
          ) : null}
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setEditMode(!editMode);
              setJoinMode(false);
            }}
          >
            <PencilRuler className="size-4" />
            {editMode ? "Završi uređivanje" : "Uredi raspored"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentBuilding}
            onClick={() =>
              run.mutate(async () => {
                if (!currentBuilding) return;
                await addFloor(nextFloor, currentBuilding.id);
                toast.success(`Dodan ${nextFloor}. sprat`);
              })
            }
          >
            <Plus className="size-4" /> Dodaj sprat
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <BuildingPlan
            key={currentBuilding?.id ?? "empty"}
            units={units}
            payments={payments}
            activeId={activeId}
            joinMode={joinMode}
            editMode={editMode}
            onLayout={(id, layout) => run.mutate(() => updateUnit(id, layout))}
            staircaseLayouts={currentBuilding?.staircase_layouts ?? {}}
            onStairLayout={(floor, layout) => run.mutate(async () => {
              if (!currentBuilding) return;
              await updateStaircaseLayouts(currentBuilding.id, { ...currentBuilding.staircase_layouts, [floor]: layout });
            })}
            joinSelection={joinSelection}
            onSelect={(u: Unit) => setActiveId(u.id)}
            onToggleJoin={(id) =>
              setJoinSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
            }
            onDeleteFloor={(floor) =>
              run.mutate(async () => {
                if (!currentBuilding) return;
                if (!confirm(`Obrisati ${floor}. sprat?`)) return;
                await deleteFloor(floor, currentBuilding.id);
                setActiveId(null);
                toast.success("Sprat obrisan");
              })
            }
            onAddUnit={(floor, layout) =>
              run.mutate(async () => {
                if (!currentBuilding) return;
                const onFloor = units.filter((u) => u.floor === floor);
                const block = onFloor.length ? Math.max(...onFloor.map((u) => u.block)) : 1;
                const slot = Math.max(0, ...onFloor.map((u) => u.slot)) + 1;
                const number = slot;
                await addUnitToFloor(floor, block, slot, apartmentLabel(floor, number), currentBuilding.id, layout);
              })
            }
          />

          {active ? (
            <UnitPanel
              unit={active}
              units={units}
              payments={payments}
              onClose={() => setActiveId(null)}
              onPatch={(patch) => run.mutate(async () => updateUnit(active.id, patch))}
              onAddPayment={(amount, date, note) =>
                run.mutate(async () => {
                  await addPayment(active.id, amount, date, note);
                  toast.success("Uplata dodana");
                })
              }
              onRemovePayment={(id) => run.mutate(async () => removePayment(id))}
              onLeaveGroup={() => run.mutate(async () => leaveGroup(active.id))}
              onDeleteUnit={() =>
                run.mutate(async () => {
                  await deleteUnit(active.id);
                  setActiveId(null);
                })
              }
            />
          ) : (
            <aside className="surface hidden h-fit p-6 lg:block">
              <p className="font-display text-xl">Odaberite stan</p>
              <div className="gold-rule mt-4" />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
