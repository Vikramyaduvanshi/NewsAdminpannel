import { useState, useEffect, useCallback, useRef } from "react";

const BASE = "https://newsapp-rco5.onrender.com/news";

// ─── API ────────────────────────────────────────────────────────────────────
const api = {
  getNews: (p) => fetch(`${BASE}/get_news?${new URLSearchParams(p)}`).then((r) => r.json()),
  getTrades: (p) => fetch(`${BASE}/get_trade?${new URLSearchParams(p)}`).then((r) => r.json()),
  postNews: (b) => fetch(`${BASE}/post_news`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  postTrade: (b) => fetch(`${BASE}/post_trade`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  updateNews: (id, b) => fetch(`${BASE}/update_news/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  updateTrade: (id, b) => fetch(`${BASE}/update_trade/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  deleteNews: (id) => fetch(`${BASE}/delete_news/${id}`, { method: "DELETE" }).then((r) => r.json()),
  deleteTrade: (id) => fetch(`${BASE}/delete_trade/${id}`, { method: "DELETE" }).then((r) => r.json()),
};

// ─── FIELDS CONFIG ──────────────────────────────────────────────────────────
const NEWS_FIELDS = [
  { key: "title", label: "Title", type: "text", required: true, placeholder: "Article title" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Full article content..." },
  { key: "image", label: "Image URL", type: "text", placeholder: "https://..." },
  { key: "category", label: "Category", type: "text", placeholder: "e.g. Politics, Tech" },
  { key: "author", label: "Author", type: "text", placeholder: "Author name" },
];

const TRADE_FIELDS = [
  { key: "title", label: "Title", type: "text", required: true, placeholder: "Trade title" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Trade details..." },
  { key: "image", label: "Image URL", type: "text", placeholder: "https://..." },
  { key: "symbol", label: "Symbol", type: "text", placeholder: "e.g. AAPL, BTC" },
  { key: "type", label: "Type", type: "text", placeholder: "e.g. BUY, SELL" },
  { key: "price", label: "Price", type: "number", placeholder: "0.00" },
];

// ─── TOAST ──────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const show = useCallback((msg, type = "ok") => {
    clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, show };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: toast.type === "ok" ? "#ecfdf5" : "#fef2f2",
      color: toast.type === "ok" ? "#065f46" : "#991b1b",
      border: `1px solid ${toast.type === "ok" ? "#a7f3d0" : "#fecaca"}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      animation: "slideIn 0.2s ease",
    }}>
      {toast.type === "ok" ? "✓ " : "✕ "}{toast.msg}
    </div>
  );
}

// ─── MODAL ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 60, zIndex: 1000, backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: 580, maxWidth: "94vw",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          animation: "modalPop 0.2s ease",
          maxHeight: "80vh", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 28px 28px", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── FORM ───────────────────────────────────────────────────────────────────
function ItemForm({ fields, initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState(() => {
    const obj = {};
    fields.forEach((f) => { obj[f.key] = initial[f.key] ?? ""; });
    return obj;
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {};
    fields.forEach((f) => { if (String(form[f.key]).trim()) body[f.key] = form[f.key]; });
    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f) => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
            {f.label}{f.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={4}
              style={inputStyle}
            />
          ) : (
            <input
              type={f.type}
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              required={f.required}
              style={inputStyle}
            />
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading ? <Spinner size={14} white /> : "Save"}
        </button>
      </div>
    </form>
  );
}

// ─── DELETE CONFIRM ─────────────────────────────────────────────────────────
function DeleteConfirm({ title, onConfirm, onCancel, loading }) {
  return (
    <div>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 14, color: "#7f1d1d", lineHeight: 1.6 }}>
        You're about to permanently delete <strong>"{title}"</strong>. This action cannot be undone.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={ghostBtn}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{ ...primaryBtn, background: "#dc2626", borderColor: "#dc2626" }}>
          {loading ? <Spinner size={14} white /> : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── SPINNER ────────────────────────────────────────────────────────────────
function Spinner({ size = 20, white = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${white ? "rgba(255,255,255,0.3)" : "#e2e8f0"}`,
      borderTopColor: white ? "#fff" : "#3b82f6",
      animation: "spin 0.6s linear infinite", display: "inline-block", flexShrink: 0,
    }} />
  );
}

// ─── TABLE ──────────────────────────────────────────────────────────────────
function DataTable({ data, loading, onEdit, onDelete, tab }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <Spinner size={32} />
      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 14 }}>Loading from API…</p>
    </div>
  );
  if (!data.length) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <p style={{ fontSize: 14 }}>No items found</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
            <th style={th}>Title</th>
            {tab === "trade" && <th style={th}>Symbol</th>}
            {tab === "trade" && <th style={th}>Type</th>}
            {tab === "news" && <th style={th}>Category</th>}
            {tab === "news" && <th style={th}>Author</th>}
            <th style={{ ...th, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {item.image && (
                    <img src={item.image} alt="" onError={(e) => e.target.style.display = "none"}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #f0f0f0" }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, color: "#0f172a", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || "—"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(item.description || "").substring(0, 70)}{item.description?.length > 70 ? "…" : ""}
                    </div>
                  </div>
                </div>
              </td>
              {tab === "trade" && <td style={td}>{item.symbol ? <span style={pillStyle("#dbeafe", "#1e40af")}>{item.symbol}</span> : "—"}</td>}
              {tab === "trade" && <td style={td}>{item.type ? <span style={pillStyle(item.type?.toUpperCase() === "BUY" ? "#dcfce7" : "#fee2e2", item.type?.toUpperCase() === "BUY" ? "#166534" : "#991b1b")}>{item.type}</span> : "—"}</td>}
              {tab === "news" && <td style={td}>{item.category ? <span style={pillStyle("#f3f4f6", "#374151")}>{item.category}</span> : "—"}</td>}
              {tab === "news" && <td style={{ ...td, color: "#64748b" }}>{item.author || "—"}</td>}
              <td style={{ ...td, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => onEdit(item)} style={iconBtn("#f1f5f9", "#334155")}>Edit</button>
                  <button onClick={() => onDelete(item)} style={iconBtn("#fef2f2", "#dc2626")}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── PAGINATION ─────────────────────────────────────────────────────────────
function Pagination({ page, hasMore, onPrev, onNext }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
      <button onClick={onPrev} disabled={page <= 1} style={{ ...ghostBtn, opacity: page <= 1 ? 0.4 : 1 }}>← Previous</button>
      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Page {page}</span>
      <button onClick={onNext} disabled={!hasMore} style={{ ...ghostBtn, opacity: !hasMore ? 0.4 : 1 }}>Next →</button>
    </div>
  );
}

// ─── STAT CARD ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "#3b82f6" }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState("news");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { type: "create"|"edit"|"delete", item? }
  const [formLoading, setFormLoading] = useState(false);
  const { toast, show: showToast } = useToast();
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const fetchData = useCallback(async (pg = page, q = search, t = tab) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (q.trim()) params.searchword = q.trim();
      const res = t === "news" ? await api.getNews(params) : await api.getTrades(params);
      setData(res.news || res.trades || []);
    } catch (e) {
      showToast("Failed to load data — check API", "err");
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, showToast]);

  useEffect(() => { fetchData(page, search, tab); }, [tab, page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchData(1, val, tab); }, 380);
  };

  const handleTabSwitch = (t) => {
    setTab(t); setPage(1); setSearch(""); setData([]);
    fetchData(1, "", t);
  };

  const closeModal = () => setModal(null);

  const handleCreate = async (body) => {
    setFormLoading(true);
    try {
      const res = tab === "news" ? await api.postNews(body) : await api.postTrade(body);
      if (res.success || res.succees) { showToast("Created successfully!"); closeModal(); fetchData(); }
      else showToast(res.message || "Failed to create", "err");
    } catch (e) { showToast(e.message, "err"); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (body) => {
    setFormLoading(true);
    try {
      const res = tab === "news" ? await api.updateNews(modal.item._id, body) : await api.updateTrade(modal.item._id, body);
      showToast("Updated successfully!"); closeModal(); fetchData();
    } catch (e) { showToast(e.message, "err"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const res = tab === "news" ? await api.deleteNews(modal.item._id) : await api.deleteTrade(modal.item._id);
      showToast("Deleted successfully!"); closeModal(); fetchData();
    } catch (e) { showToast(e.message, "err"); }
    finally { setFormLoading(false); }
  };

  const fields = tab === "news" ? NEWS_FIELDS : TRADE_FIELDS;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f8fafc; color: #0f172a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes modalPop { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        input, textarea, select { outline: none; font-family: 'DM Sans', sans-serif; }
        textarea { resize: vertical; }
        button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      <Toast toast={toast} />

      {/* Layout */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <aside style={{
          width: 230, background: "#0f172a", display: "flex", flexDirection: "column",
          padding: "28px 16px", gap: 4, flexShrink: 0, position: "sticky", top: 0, height: "100vh",
        }}>
          <div style={{ padding: "0 10px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.4px" }}>
              News<span style={{ color: "#60a5fa" }}>Admin</span>
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
              newsapp-rco5.onrender.com
            </div>
          </div>

          {[
            { key: "news", label: "News Articles", icon: "📰" },
            { key: "trade", label: "Trades", icon: "📈" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabSwitch(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500,
                background: tab === item.key ? "#1e3a5f" : "transparent",
                color: tab === item.key ? "#60a5fa" : "#94a3b8",
                cursor: "pointer", width: "100%", textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: "auto", padding: "0 10px" }}>
            <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6 }}>
              API Base<br />
              <span style={{ fontFamily: "'DM Mono', monospace", color: "#475569", fontSize: 10 }}>/news</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "36px 40px", maxWidth: "100%", overflow: "auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
                {tab === "news" ? "News Articles" : "Trade Posts"}
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                Manage, edit and publish your {tab === "news" ? "news" : "trade"} content
              </p>
            </div>
            <button onClick={() => setModal({ type: "create" })} style={primaryBtn}>
              + Add {tab === "news" ? "News" : "Trade"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
            <StatCard label="Items loaded" value={data.length} color="#3b82f6" />
            <StatCard label="Current page" value={page} color="#8b5cf6" />
            <StatCard label="Per page" value={LIMIT} color="#10b981" />
          </div>

          {/* Content card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "24px" }}>

            {/* Search + refresh */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15 }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={`Search ${tab === "news" ? "news" : "trades"} by title…`}
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              </div>
              <button onClick={() => fetchData()} style={ghostBtn}>↻ Refresh</button>
            </div>

            <DataTable
              data={data}
              loading={loading}
              tab={tab}
              onEdit={(item) => setModal({ type: "edit", item })}
              onDelete={(item) => setModal({ type: "delete", item })}
            />

            <Pagination
              page={page}
              hasMore={data.length === LIMIT}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <Modal title={`Add ${tab === "news" ? "News" : "Trade"}`} onClose={closeModal}>
          <ItemForm fields={fields} onSubmit={handleCreate} loading={formLoading} />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title={`Edit ${tab === "news" ? "News" : "Trade"}`} onClose={closeModal}>
          <ItemForm fields={fields} initial={modal.item} onSubmit={handleUpdate} loading={formLoading} />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal title="Confirm deletion" onClose={closeModal}>
          <DeleteConfirm
            title={modal.item?.title}
            onConfirm={handleDelete}
            onCancel={closeModal}
            loading={formLoading}
          />
        </Modal>
      )}
    </>
  );
}

// ─── STYLE CONSTANTS ─────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "9px 13px", border: "1px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, color: "#0f172a", background: "#fff", transition: "border 0.15s",
};

const primaryBtn = {
  padding: "9px 20px", borderRadius: 9, border: "1px solid #2563eb",
  background: "#3b82f6", color: "#fff", fontSize: 14, fontWeight: 600,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
  transition: "background 0.15s",
};

const ghostBtn = {
  padding: "9px 16px", borderRadius: 9, border: "1px solid #e2e8f0",
  background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500,
  cursor: "pointer", transition: "background 0.15s",
};

const iconBtn = (bg, color) => ({
  padding: "6px 12px", borderRadius: 7, border: "none",
  background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer",
  transition: "opacity 0.15s",
});

const th = {
  padding: "10px 12px", color: "#94a3b8", fontWeight: 600,
  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px",
  textAlign: "left", whiteSpace: "nowrap",
};

const td = { padding: "12px 12px", color: "#334155", verticalAlign: "middle" };

const pillStyle = (bg, color) => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 20,
  fontSize: 11, fontWeight: 600, background: bg, color,
});