import { createContext, useContext } from "react";

// Styled replacements for window.confirm() and alert(). Needs <FeedbackProvider> (Feedback.jsx).
export const FeedbackContext = createContext(null);

export function useConfirm() {
  return useContext(FeedbackContext).confirm;
}

export function useToast() {
  return useContext(FeedbackContext).toast;
}
