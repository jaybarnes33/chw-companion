"use client";

import { useRouter } from "next/navigation";

export function DashboardFilters({
  initial,
}: {
  initial: {
    risk?: string;
    type?: string;
    status?: string;
    chw?: string;
  };
}) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["risk", "type", "status", "chw"]) {
      const v = String(fd.get(key) ?? "").trim();
      if (v) params.set(key, v);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 border border-indigo-ink/15 p-4 md:grid-cols-5"
    >
      <select
        name="risk"
        defaultValue={initial.risk ?? ""}
        className="h-12 border-2 border-indigo-ink bg-shea px-3 text-sm"
      >
        <option value="">All risk</option>
        <option value="RED">RED</option>
        <option value="YELLOW">YELLOW</option>
        <option value="GREEN">GREEN</option>
      </select>
      <select
        name="type"
        defaultValue={initial.type ?? ""}
        className="h-12 border-2 border-indigo-ink bg-shea px-3 text-sm"
      >
        <option value="">All types</option>
        <option value="MATERNAL">Maternal</option>
        <option value="NEWBORN">Newborn</option>
        <option value="UNDER5">Under-5</option>
      </select>
      <select
        name="status"
        defaultValue={initial.status ?? ""}
        className="h-12 border-2 border-indigo-ink bg-shea px-3 text-sm"
      >
        <option value="">All referral status</option>
        <option value="REFERRED">Referred</option>
        <option value="IN_TRANSIT">In transit</option>
        <option value="ARRIVED">Arrived</option>
        <option value="RESOLVED">Resolved</option>
      </select>
      <input
        name="chw"
        defaultValue={initial.chw ?? ""}
        placeholder="CHW id"
        className="h-12 border-2 border-indigo-ink bg-shea px-3 text-sm"
      />
      <button
        type="submit"
        className="h-12 bg-clay text-xs font-bold uppercase tracking-widest text-white"
      >
        Filter
      </button>
    </form>
  );
}
