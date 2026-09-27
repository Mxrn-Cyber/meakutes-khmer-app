import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

// Styled replacements for window.confirm() and alert().
//   const confirm = useConfirm();  if (!(await confirm({ title, message, danger: true }))) return;
//   const toast = useToast();      toast.error("Could not save"); toast.success("Saved");

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog({
          title: "Are you sure?",
          confirmLabel: "Confirm",
          cancelLabel: "Cancel",
          danger: false,
          ...(typeof opts === "string" ? { message: opts } : opts),
        });
      }),
    []
  );

  const close = (value) => {
    resolver.current?.(value);
    resolver.current = null;
    setDialog(null);
  };

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "error" ? 6000 : 3500);
  }, []);

  const toast = useRef(null);
  if (!toast.current) {
    toast.current = {
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    };
  }

  return (
    <FeedbackContext.Provider value={{ confirm, toast: toast.current }}>
      {children}
      {dialog && <ConfirmDialog {...dialog} onClose={close} />}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => setToasts((x) => x.filter((y) => y.id !== t.id))} />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onClose }) {
  const confirmRef = useRef(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={() => onClose(false)} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-lift ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
        <div className="flex gap-4">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              danger ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30" : "bg-brand-50 text-brand-600 dark:bg-brand-900/30"
            }`}
          >
            {danger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {message && <p className="mt-1.5 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{message}</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-800"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const TOAST_STYLE = {
  success: { Icon: CheckCircle2, cls: "text-emerald-500" },
  error: { Icon: XCircle, cls: "text-rose-500" },
  info: { Icon: Info, cls: "text-brand-500" },
};

function Toast({ type, message, onClose }) {
  const { Icon, cls } = TOAST_STYLE[type] || TOAST_STYLE.info;
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-lift ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10"
    >
      <Icon size={20} className={`mt-px shrink-0 ${cls}`} />
      <p className="flex-1 text-gray-800 dark:text-gray-100">{message}</p>
      <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export function useConfirm() {
  return useContext(FeedbackContext).confirm;
}

export function useToast() {
  return useContext(FeedbackContext).toast;
}
