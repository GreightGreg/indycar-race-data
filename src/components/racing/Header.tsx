const Header = () => (
  <header className="sticky top-0 z-50 bg-racing-bg border-b-2 border-racing-yellow">
    <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <div className="shrink-0">
        <h1 className="font-heading text-[28px] leading-none text-racing-blue tracking-wide">RACEDAY PADDOCK</h1>
        <p className="font-condensed text-[10px] text-racing-muted uppercase tracking-[0.2em]">DATA CENTER</p>
      </div>
      <div className="text-right shrink min-w-0">
        <select
          className="bg-racing-surface border border-racing-border text-racing-text font-mono text-xs md:text-sm px-3 py-1.5 rounded cursor-pointer w-full max-w-md appearance-none"
          defaultValue="phoenix2026"
        >
          <option value="phoenix2026">Good Ranchers 250 — Phoenix Raceway — Round 2 — March 7, 2026</option>
          <optgroup label="2026 Season — More races coming">
          </optgroup>
        </select>
      </div>
    </div>
  </header>
);

export default Header;
