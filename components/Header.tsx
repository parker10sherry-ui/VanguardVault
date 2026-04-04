"use client";

type HeaderProps = {
  proView: boolean;
  onToggleProView: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onAddCard: () => void;
  onToggleEbayCheck: () => void;
  onTogglePsaLookup: () => void;
};

export default function Header({
  proView, onToggleProView, search, onSearchChange,
  onAddCard, onToggleEbayCheck, onTogglePsaLookup,
}: HeaderProps) {
  return (
    <header>
      <div className="header-left">
        <h1 className="logo">
          VANGUARD <span>VAULT</span>
        </h1>
        <p className="subtitle">Sherry&apos;s Trading Cards</p>
      </div>
      <div className="header-right">
        <div className="view-toggle" onClick={onToggleProView} title={proView ? "Switch to Classic" : "Switch to Pro"}>
          <span className={`view-toggle-label ${!proView ? "active" : ""}`}>Classic</span>
          <div className={`view-toggle-track ${proView ? "on" : ""}`}>
            <div className="view-toggle-thumb" />
          </div>
          <span className={`view-toggle-label ${proView ? "active" : ""}`}>Pro</span>
        </div>
        <button className="ebay-check-btn" onClick={onToggleEbayCheck}>
          Price Check
        </button>
        <button className="psa-lookup-btn" onClick={onTogglePsaLookup}>
          PSA Lookup
        </button>
        <button className="add-card-btn" onClick={onAddCard}>
          + Add Card
        </button>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search players, cards..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
