"use client";

type WatchlistModalProps = {
  watchModalOpen: boolean;
  onClose: () => void;
  watchPlayer: string; setWatchPlayer: (v: string) => void;
  watchYear: string; setWatchYear: (v: string) => void;
  watchProduct: string; setWatchProduct: (v: string) => void;
  watchPSA: string; setWatchPSA: (v: string) => void;
  watchTarget: string; setWatchTarget: (v: string) => void;
  watchNotes: string; setWatchNotes: (v: string) => void;
  handleAddWatchlist: () => void;
};

export default function WatchlistModal({
  watchModalOpen, onClose,
  watchPlayer, setWatchPlayer, watchYear, setWatchYear,
  watchProduct, setWatchProduct, watchPSA, setWatchPSA,
  watchTarget, setWatchTarget, watchNotes, setWatchNotes,
  handleAddWatchlist,
}: WatchlistModalProps) {
  if (!watchModalOpen) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add to Watchlist</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="watch-form">
          <div className="form-row">
            <div className="form-group">
              <label>Player Name</label>
              <input type="text" placeholder="e.g. Patrick Mahomes" value={watchPlayer} onChange={(e) => setWatchPlayer(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group year-group">
              <label>Year</label>
              <input type="number" value={watchYear} onChange={(e) => setWatchYear(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Product</label>
              <input type="text" placeholder="e.g. Prizm Silver" value={watchProduct} onChange={(e) => setWatchProduct(e.target.value)} />
            </div>
            <div className="form-group year-group">
              <label>PSA</label>
              <select value={watchPSA} onChange={(e) => setWatchPSA(e.target.value)}>
                <option value="10">10</option><option value="9">9</option><option value="8">8</option><option value="0">Raw</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Price ($)</label>
              <input type="number" placeholder="Max you'd pay" value={watchTarget} onChange={(e) => setWatchTarget(e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" placeholder="Optional notes" value={watchNotes} onChange={(e) => setWatchNotes(e.target.value)} />
            </div>
          </div>
          <button className="form-submit" onClick={handleAddWatchlist} disabled={!watchPlayer.trim() || !watchProduct.trim()}>
            Add to Watchlist
          </button>
        </div>
      </div>
    </div>
  );
}
