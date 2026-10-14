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
  building_id: string | null;
  grid_x: number | null;
  grid_y: number | null;
  grid_w: number | null;
  grid_h: number | null;
};

export type StairLayout = { grid_x: number; grid_y: number; grid_w: number; grid_h: number };
export type Building = { id: string; name: string; position: number; staircase_layouts: Record<string, StairLayout> };

export async function fetchBuildings(): Promise<Building[]> {
  const { data, error } = await supabase.from("buildings").select("id,name,position,staircase_layouts").order("position").order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as Building[];
}

export async function updateStaircaseLayouts(id: string, layouts: Record<string, StairLayout>) {
  const { error } = await supabase.from("buildings").update({ staircase_layouts: layouts }).eq("id", id);
  if (error) throw error;
}

export async function addBuilding(name: string, position: number) {
  const { data, error } = await supabase.from("buildings").insert({ name, position }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function renameBuilding(id: string, name: string) {
  const { error } = await supabase.from("buildings").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteBuilding(id: string) {
  const { error } = await supabase.from("buildings").delete().eq("id", id);
  if (error) throw error;
}

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
    .select("id,floor,block,slot,label,sqm,price_per_sqm,status,buyer_name,note,group_id,building_id,grid_x,grid_y,grid_w,grid_h")
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

export const DEFAULT_LAYOUT = [
  { grid_x: 0, grid_y: 0, grid_w: 4, grid_h: 2 },
  { grid_x: 0, grid_y: 2, grid_w: 4, grid_h: 2 },
  { grid_x: 4, grid_y: 0, grid_w: 4, grid_h: 2 },
  { grid_x: 8, grid_y: 0, grid_w: 4, grid_h: 2 },
  { grid_x: 8, grid_y: 2, grid_w: 4, grid_h: 2 },
];

export function apartmentLabel(floor: number, number: number): string {
  return `${floor}${String(number).padStart(2, "0")}`;
}

export async function addFloor(floor: number, buildingId: string) {
  const rows = DEFAULT_LAYOUT.map((l, i) => ({
    floor, block: 1, slot: i + 1, label: apartmentLabel(floor, i + 1), building_id: buildingId, ...l,
  }));
  const { error } = await supabase.from("units").insert(rows);
  if (error) throw error;
}

export async function addUnitToFloor(
  floor: number, block: number, slot: number, label: string, buildingId: string,
  layout: { grid_x: number; grid_y: number; grid_w: number; grid_h: number },
) {
  const { error } = await supabase.from("units").insert({ floor, block, slot, label, building_id: buildingId, ...layout });
  if (error) throw error;
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteFloor(floor: number, buildingId: string) {
  const { error } = await supabase.from("units").delete().eq("floor", floor).eq("building_id", buildingId);
  if (error) throw error;
}

export function unitTotal(u: Unit) {
  return u.sqm * u.price_per_sqm;
}

export function paidFor(unitId: string, payments: Payment[]) {
  return payments.filter((p) => p.unit_id === unitId).reduce((s, p) => s + p.amount, 0);
}
