import LegalPage from "../components/LegalPage";

const CONTACT = "laothomorn@gmail.com";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="27 September 2026"
      intro="This page explains what Meakutes-Khmer stores about you, why, and how to have it removed."
      sections={[
        {
          title: "What we store",
          body: [
            "When you create an account we store:",
            [
              "Your first name, last name and email address.",
              "Your phone number, only if you add one.",
              "A profile photo, only if you upload one.",
              "Your password, stored only as a secure one-way hash. We cannot read it.",
            ],
            "When you use the site we store the reviews, ratings and comments you post and the places you save to your favourites.",
          ],
        },
        {
          title: "Signing in with Google",
          body: [
            "If you sign in with Google, Google shares your name, email address and a Google account ID with us. We use these only to create and sign in to your account. We never see your Google password.",
          ],
        },
        {
          title: "Cookies",
          body: [
            "We use one cookie, named mk_session, to keep you logged in. It is removed when you log out or when your session expires. We do not use advertising or tracking cookies.",
            "Your choice of light or dark mode is saved in your own browser.",
          ],
        },
        {
          title: "What others can see",
          body: [
            "Your display name and profile photo are shown next to the reviews and comments you post. Your email address and phone number are never shown publicly.",
          ],
        },
        {
          title: "Where your data is kept",
          body: [
            "The website runs on Cloudflare, the server on Render, account data in a MySQL database hosted by TiDB Cloud, and uploaded images in Cloudflare R2. Google Maps is used to show maps of places.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "You can change your name, phone number, email address, password and photo at any time on your Profile page.",
            `To delete your account and everything linked to it (reviews, comments and saved places), email ${CONTACT}.`,
          ],
        },
        {
          title: "Contact",
          body: [`Questions about your data? Email ${CONTACT}.`],
        },
      ]}
    />
  );
}
