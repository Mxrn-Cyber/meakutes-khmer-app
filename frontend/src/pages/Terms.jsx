import LegalPage from "../components/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      updated="27 September 2026"
      intro="By using Meakutes-Khmer you agree to these simple rules. They keep the site useful and friendly for everyone."
      sections={[
        {
          title: "Your account",
          body: [
            "Keep your login details private. You are responsible for what is posted from your account.",
            "Please use your real name or a respectful display name.",
          ],
        },
        {
          title: "Reviews and comments",
          body: [
            "Share honest experiences. Do not post:",
            [
              "Insults, hate speech or harassment.",
              "Spam, advertising or links to unrelated sites.",
              "Other people's personal information.",
              "Content you do not have the right to share.",
            ],
            "Our team may hide or remove reviews and comments that break these rules, and may deactivate accounts that keep breaking them.",
          ],
        },
        {
          title: "Information on the site",
          body: [
            "We work to keep information about places and events accurate, but opening times, prices, access and event dates can change. Please check with official sources before you travel.",
          ],
        },
        {
          title: "Content and photos",
          body: [
            "You keep ownership of what you post. By posting, you allow Meakutes-Khmer to show it on the site.",
            "Photos and text created by Meakutes-Khmer may not be copied for commercial use without permission.",
          ],
        },
        {
          title: "Changes",
          body: ["We may update these terms. The date at the top of this page shows when they last changed."],
        },
        {
          title: "Contact",
          body: ["Questions? Email laothomorn@gmail.com."],
        },
      ]}
    />
  );
}
