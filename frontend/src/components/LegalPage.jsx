import { Container } from "./ui";
import { useLang } from "../i18n";

export default function LegalPage({ title, updated, intro, sections }) {
  const { t } = useLang();
  return (
    <>
      <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40">
        <Container className="py-14 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{t("legal.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("legal.updated", { date: updated })}</p>
          {intro && <p className="mt-5 max-w-3xl text-lg text-gray-600 dark:text-gray-300">{intro}</p>}
        </Container>
      </section>
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block" aria-label={t("legal.onThisPage")}>
            <ul className="sticky top-24 space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#section-${i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth" }); }} className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-3xl space-y-10">
            {sections.map((s, i) => (
              <section key={i} id={`section-${i}`} className="scroll-mt-24">
                <h2 className="text-xl font-bold">{s.title}</h2>
                <div className="mt-3 space-y-3 leading-relaxed text-gray-700 dark:text-gray-300">
                  {s.body.map((p, j) =>
                    Array.isArray(p) ? (
                      <ul key={j} className="list-disc space-y-1.5 pl-5">
                        {p.map((li) => (
                          <li key={li}>{li}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={j}>{p}</p>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
