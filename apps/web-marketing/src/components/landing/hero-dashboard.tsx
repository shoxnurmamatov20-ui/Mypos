export function HeroDashboard() {
  return (
    <div className="select-none bg-[#F5F5F7] p-5">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#1d1d1f]">Manager Dashboard</span>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
          ● Jonli
        </span>
      </div>

      {/* Revenue card */}
      <div className="mb-3 rounded-2xl border border-black/6 bg-white p-4">
        <p className="text-[12px] text-[#6e6e73]">Bugungi tushum</p>
        <p className="tabular mt-1 text-[30px] font-semibold text-[#1d1d1f]">
          4,280,000{' '}
          <span className="text-[15px] font-normal text-[#6e6e73]">so&apos;m</span>
        </p>
        <p className="mt-1 text-[12px] font-medium text-green-600">↑ 18% kechadan</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Buyurtmalar', value: '47', sub: 'bugun' },
          { label: 'Avg check', value: '91K', sub: "so'm" },
          { label: 'KDS navbat', value: '3', sub: 'buyurtma' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-black/6 bg-white p-3">
            <p className="text-[11px] text-[#6e6e73]">{s.label}</p>
            <p className="tabular mt-0.5 text-[20px] font-semibold text-[#1d1d1f]">{s.value}</p>
            <p className="text-[11px] text-[#6e6e73]">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
