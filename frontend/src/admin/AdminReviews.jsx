import { useEffect, useState } from "react";
import { Star, Flag, CheckCircle, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/useFeedback";

const STATUS_FILTERS = ["all", "published", "flagged", "removed"];

const AdminReviews = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const [reviews, setReviews] = useState(null);
  const [destinationNames, setDestinationNames] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const load = (status) => {
    setError("");
    api
      .adminListReviews({ status })
      .then(setReviews)
      .catch((err) => {
        setReviews([]);
        setError(err.message || "Failed to load reviews");
      });
  };

  useEffect(() => {
    api
      .listDestinations({ status: "all" })
      .then((list) => setDestinationNames(Object.fromEntries(list.map((d) => [d.id, d.name]))))
      .catch(() => {});
  }, []);

  useEffect(() => load(statusFilter), [statusFilter]);

  const moderate = async (review, newStatus) => {
    try {
      await api.moderateReview(review.id, newStatus);
      load(statusFilter);
    } catch (err) {
      toast.error(err.message || "Failed to update review");
    }
  };

  const handleDelete = async (review) => {
    if (!(await confirm({ title: "Please confirm", message: "Permanently delete this review?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.deleteReview(review.id);
      toast.success("Review deleted.");
      load(statusFilter);
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Reviews</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border-0 bg-white py-2 pl-3.5 pr-9 text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-900">
          {error}
        </div>
      )}

      {reviews === null ? (
        <div className="text-gray-500 dark:text-gray-400">Loading reviews...</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {destinationNames[r.destination_id] || `Destination #${r.destination_id}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "published"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : r.status === "flagged"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                      />
                    ))}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      by {r.user_display_name || `User #${r.user_id}`}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status !== "published" && (
                    <button
                      onClick={() => moderate(r, "published")}
                      title="Publish"
                      className="p-2 text-gray-500 hover:text-emerald-600"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {r.status !== "flagged" && (
                    <button
                      onClick={() => moderate(r, "flagged")}
                      title="Flag"
                      className="p-2 text-gray-500 hover:text-amber-600"
                    >
                      <Flag size={18} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(r)} title="Delete" className="rounded-full p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-800">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-gray-400 py-16">No reviews to show for this filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
