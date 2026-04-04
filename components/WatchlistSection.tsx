"use client";

type WatchItem = { player: string; year: number; product: string; psa: number; targetPrice: number; notes: string };

type Props = {
  watchlist: WatchItem[];
  onRemove: (index: number) => void;
  onOpenAddModal: () => void;
};

export default function WatchlistSection({ watchlist, onRemove, onOpenAddModal }: Props) {
  return (
    <div className="watchlist-section">
      <div className="watchlist-header">
        <h2 className="watchlist-title">Watchlist</h2>
        <button className="add-card-btn" onClick={onOpenAddModal}>+ Add</button>
      </div>
      {watchlist.length === 0 ? (
        <div className="no-results">No cards on your watchlist yet.</div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item, i) => (
            <div key={i} className="watchlist-card">
              <div className="watchlist-card-info">
                <span className="watchlist-card-player">{item.player}</span>
                <span className="watchlist-card-product">{item.year} {item.product}</span>
                <span className="watchlist-card-meta">
                  {item.psa === 0 ? "Raw" : `PSA ${item.psa}`}
                  {item.targetPrice > 0 && ` | Target: $${item.targetPrice}`}
                </span>
                {item.notes && <span className="watchlist-card-notes">{item.notes}</span>}
              </div>
              <button className="watchlist-remove" onClick={() => onRemove(i)} title="Remove">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
