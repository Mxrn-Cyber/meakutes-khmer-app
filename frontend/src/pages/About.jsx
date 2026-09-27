import { Link } from "react-router-dom";
import { MapPinned, MessageSquareHeart, Star, Camera, Search, GraduationCap } from "lucide-react";
import { Container, PageHero, buttonClass } from "../components/ui";

const TEAM = [
  { name: "Ky SokLay", role: "Advisor", photo: "/avatar.png" },
  { name: "Lao Thomorn", role: "Developer", photo: "/avatar.png" },
];

const OFFERS = [
  { Icon: MapPinned, title: "Destination guides", text: "Places across the provinces of Cambodia, with maps and practical tips." },
  { Icon: MessageSquareHeart, title: "Real experiences", text: "Stories, reviews and comments shared by travellers." },
  { Icon: Star, title: "Ratings", text: "Recommendations to help you choose your next adventure." },
  { Icon: Camera, title: "Photos", text: "See each place before you go." },
  { Icon: Search, title: "Search & filters", text: "Find places by name, province or popularity." },
];

export default function About() {
  return (
    <>
      <PageHero
        image="/Tumnail.png"
        eyebrow="About us"
        title="Bringing Cambodia's beauty closer to every traveller"
        subtitle="Meakutes-Khmer is a tourism website built to promote and revitalise Cambodia's tourism industry."
        tall
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="space-y-5 text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <GraduationCap size={16} /> Final-year capstone project, RUPP
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Our story</h2>
            <p>
              <strong className="text-gray-900 dark:text-white">Meakutes-Khmer</strong> was developed as a final-year
              capstone project by a Year 4 student at the <strong>Royal University of Phnom Penh (RUPP)</strong>, majoring in{" "}
              <strong>Information Technology Engineering (ITE)</strong>, under the guidance of <strong>Doctor Ky Soklay</strong>.
            </p>
            <p>
              The platform has two goals: to apply the technical skills learned over four years of study, and to help
              promote and revitalise Cambodia's tourism industry, which was heavily affected by global events in recent
              years.
            </p>
            <p>
              It reflects a passion for technology, innovation and national pride. By making tourism information easier to
              find and more engaging, we hope to inspire both local and international travellers to discover more of the
              Kingdom of Wonder.
            </p>
            <p>
              Special thanks to <strong>Doctor Ky Soklay</strong> for his advice, mentorship and continuous support, which
              shaped the vision and execution of Meakutes-Khmer.
            </p>
          </div>
          <img
            src="/Trip-Image/about-team.png"
            alt="The Meakutes-Khmer team"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </Container>

      <section className="bg-white py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What you'll find here</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl p-6 ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our team</h2>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center">
              <img src={m.photo} alt={m.name} loading="lazy" className="mx-auto aspect-square w-full max-w-[200px] rounded-3xl object-cover shadow-card" />
              <p className="mt-4 font-semibold">{m.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{m.role}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-brand-700 to-sky-500 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Thank you for visiting. Let's explore Cambodia together.</h2>
          <p className="font-khmer text-white/85">សូមអរគុណ! តោះទៅស្វែងយល់ពីកម្ពុជាជាមួយគ្នា</p>
          <Link to="/discover" className={`${buttonClass.secondary} !text-gray-900`}>
            Start exploring
          </Link>
        </div>
      </Container>
    </>
  );
}
