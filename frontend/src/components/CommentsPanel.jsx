import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

// Comments for a news/event article (newsEventId) or a place (destinationId).
export default function CommentsPanel({ newsEventId, destinationId }) {
  const { user, isAuthenticated, isEditor } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const target = newsEventId ? { news_event_id: newsEventId } : { destination_id: destinationId };

  useEffect(() => {
    if (!newsEventId && !destinationId) return;
    let cancelled = false;
    setLoading(true);
    api
      .listComments(target)
      .then((rows) => !cancelled && setComments(rows))
      .catch(() => !cancelled && setError("Could not load comments."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsEventId, destinationId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate("/login");
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    try {
      const created = await api.createComment({ ...target, body });
      setComments((rows) => [...rows, created]);
      setBody("");
    } catch (err) {
      setError(err.message || "Could not post your comment.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteComment(id);
      setComments((rows) => rows.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || "Could not delete the comment.");
    }
  };

  return (
    <section>
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Comments {comments.length > 0 && <span className="text-gray-400">({comments.length})</span>}
        </h2>

        <form onSubmit={submit} className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={!isAuthenticated || posting}
            placeholder={isAuthenticated ? "Write a comment..." : "Log in to comment"}
            className="w-full rounded-xl border-0 bg-gray-50 p-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || (isAuthenticated && !body.trim())}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isAuthenticated ? (posting ? "Posting..." : "Post comment") : "Log in to comment"}
            </button>
          </div>
        </form>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Start the conversation.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                {c.user_avatar_url ? (
                  <img
                    src={api.mediaUrl(c.user_avatar_url)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-gray-200 flex items-center justify-center font-semibold shrink-0">
                    {(c.user_display_name || "T").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {c.user_display_name || "Traveler"}
                    </span>
                    <span className="text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {(user?.id === c.user_id || isEditor) && (
                      <button
                        onClick={() => remove(c.id)}
                        className="ml-auto text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
