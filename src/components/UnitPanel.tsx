import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Trash2, Unlink } from "lucide-react";
import { eur, sqm, dateBs, STATUSES } from "@/lib/format";
import { paidFor, unitTotal, type Payment, type Unit } from "@/lib/units";

type Props = {
  unit: Unit;
  units: Unit[];
  payments: Payment[];
  onClose: () => void;
  onPatch: (patch: Partial<Unit>) => void;
  onAddPayment: (amount: number, date: string, note: string) => void;
  onRemovePayment: (id: string) => void;
  onLeaveGroup: () => void;
  onDeleteUnit: () => void;
};

export function UnitPanel({
  unit,
  units,
  payments,
  onClose,
  onPatch,
  onAddPayment,
  onRemovePayment,
  onLeaveGroup,
  onDeleteUnit,
}: Props) {
  const [area, setArea] = useState(unit.sqm);
  const [price, setPrice] = useState(unit.price_per_sqm);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");

  useEffect(() => {
    setArea(unit.sqm);
    setPrice(unit.price_per_sqm);
  }, [unit.id, unit.sqm, unit.price_per_sqm]);

  const groupUnits = unit.group_id ? units.filter((u) => u.group_id === unit.group_id) : [unit];
  const total = area * price;
  const groupTotal = groupUnits.reduce((s, u) => s + (u.id === unit.id ? total : unitTotal(u)), 0);
  const groupPaid = groupUnits.reduce((s, u) => s + paidFor(u.id, payments), 0);
  const unitPayments = payments.filter((p) => p.unit_id === unit.id);
  const paid = paidFor(unit.id, payments);
  const pct = groupTotal > 0 ? Math.min(100, (groupPaid / groupTotal) * 100) : 0;

  return (
    <aside className="animate-panel surface sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-display text-2xl leading-none">Stan {unit.label}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{unit.floor}. sprat</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Zatvori">
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Kvadratura</Label>
              <span className="font-display text-lg tabular-nums">{sqm(area)}</span>
            </div>
            <Slider
              className="mt-3"
              min={15}
              max={250}
              step={0.5}
              value={[area]}
              onValueChange={(v) => setArea(v[0] ?? area)}
              onValueCommit={(v) => onPatch({ sqm: v[0] ?? area })}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Cijena po m²</Label>
              <span className="font-display text-lg tabular-nums">{eur(price)}</span>
            </div>
            <Slider
              className="mt-3"
              min={500}
              max={5000}
              step={10}
              value={[price]}
              onValueChange={(v) => setPrice(v[0] ?? price)}
              onValueCommit={(v) => onPatch({ price_per_sqm: v[0] ?? price })}
            />
          </div>
        </div>

        <div className="rounded-lg bg-secondary p-4">
          <Row label="Ukupna cijena" value={eur(total)} />
          <Row label="Uplaćeno" value={eur(paid)} />
          <Row label="Preostalo" value={eur(Math.max(0, total - paid))} strong />
          {groupUnits.length > 1 ? (
            <>
              <div className="gold-rule my-3" />
              <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Spojeno ({groupUnits.map((u) => u.label).join(" + ")})
              </p>
              <Row label="Ukupno spojeno" value={eur(groupTotal)} />
              <Row label="Uplaćeno ukupno" value={eur(groupPaid)} />
              <Row label="Preostalo ukupno" value={eur(Math.max(0, groupTotal - groupPaid))} strong />
            </>
          ) : null}
          <div className="mt-3 h-1.5 w-full rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-gold transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-muted-foreground tabular-nums">{pct.toFixed(0)}%</p>
        </div>

        {unit.group_id ? (
          <Button variant="outline" size="sm" className="w-full" onClick={onLeaveGroup}>
            <Unlink className="size-4" /> Razdvoji ovaj stan
          </Button>
        ) : null}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Oznaka</Label>
            <Input value={unit.label} onChange={(e) => onPatch({ label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={unit.status} onValueChange={(v) => onPatch({ status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kupac</Label>
            <Input value={unit.buyer_name} onChange={(e) => onPatch({ buyer_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Bilješka</Label>
            <Textarea rows={3} value={unit.note} onChange={(e) => onPatch({ note: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg">Uplate</h3>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Iznos €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[9.5rem]"
            />
            <Input
              placeholder="Napomena"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="col-span-2"
            />
          </div>
          <Button
            className="w-full"
            disabled={!amount || Number(amount) <= 0}
            onClick={() => {
              onAddPayment(Number(amount), date, payNote);
              setAmount("");
              setPayNote("");
            }}
          >
            Dodaj uplatu
          </Button>

          <ul className="divide-y">
            {unitPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium tabular-nums">{eur(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateBs(p.paid_at)}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemovePayment(p.id)} aria-label="Obriši">
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
            {unitPayments.length === 0 ? (
              <li className="py-2 text-xs text-muted-foreground">Nema uplata.</li>
            ) : null}
          </ul>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={onDeleteUnit}>
          <Trash2 className="size-4" /> Obriši stan
        </Button>
      </div>
    </aside>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-lg tabular-nums" : "text-sm tabular-nums"}>{value}</span>
    </div>
  );
}
