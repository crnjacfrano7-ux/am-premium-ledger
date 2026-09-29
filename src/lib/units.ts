import { supabase } from "@/integrations/supabase/client";

export type Unit = {
  id: string;
  floor: number;
  block: number;
  slot: number;
  label: string;
  sqm: number;
  price_per_sqm: number;
  status: string;
  buyer_name: string;
  note: string;
  group_id: string | null;
};

export type Payment = {
  id: string;
  unit_id: string;
  amount: number;
  paid_at: string;
  note: string;
};

export type UnitGroup = { id: string; name: string };

export async function fetchUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id,floor,block,slot,label,sqm,price_per_sqm,status,buyer_name,note,group_id")
    .order("floor", { ascending: false })
    .order("block")
    .order("slot");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    ...u,
    sqm: Number(u.sqm),
    price_per_sqm: Number(u.price_per_sqm),
  })) as Unit[];
}

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id,unit_id,amount,paid_at,note")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[];
}

export async function fetchGroups(): Promise<UnitGroup[]> {
  const { data, error } = await supabase.from("unit_groups").select("id,name");
  if (error) throw error;
  return (data ?? []) as UnitGroup[];
}

export async function updateUnit(id: string, patch: Partial<Unit>) {
  const { error } = await supabase
    .from("units")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function addPayment(unitId: string, amount: number, paidAt: string, note: string) {
  const { error } = await supabase
    .from("payments")
    .insert({ unit_id: unitId, amount, paid_at: paidAt, note });
  if (error) throw error;
}

export async function removePayment(id: string) {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}

export async function joinUnits(unitIds: string[], name: string) {
  const { data, error } = await supabase.from("unit_groups").insert({ name }).select("id").single();
  if (error) throw error;
  const { error: uErr } = await supabase.from("units").update({ group_id: data.id }).in("id", unitIds);
  if (uErr) throw uErr;
}

export async function leaveGroup(unitId: string) {
  const { error } = await supabase.from("units").update({ group_id: null }).eq("id", unitId);
  if (error) throw error;
}

export async function addFloor(floor: number, blocks = 3, slots = 2) {
  const letters = "ABCDEFGHIJ";
  const rows: { floor: number; block: number; slot: number; label: string }[] = [];
  for (let b = 1; b <= blocks; b++) {
    for (let s = 1; s <= slots; s++) {
      rows.push({ floor, block: b, slot: s, label: `${floor}-${letters[(b - 1) * slots + (s - 1)]}` });
    }
  }
  const { error } = await supabase.from("units").insert(rows);
  if (error) throw error;
}

export async function addUnitToFloor(floor: number, block: number, slot: number, label: string) {
  const { error } = await supabase.from("units").insert({ floor, block, slot, label });
  if (error) throw error;
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteFloor(floor: number) {
  const { error } = await supabase.from("units").delete().eq("floor", floor);
  if (error) throw error;
}

export function unitTotal(u: Unit) {
  return u.sqm * u.price_per_sqm;
}

export function paidFor(unitId: string, payments: Payment[]) {
  return payments.filter((p) => p.unit_id === unitId).reduce((s, p) => s + p.amount, 0);
}
