import PlacesBrowser from "../components/PlacesBrowser";

export default function Discover() {
  return (
    <PlacesBrowser
      heroImage="/Landscape.png"
      eyebrow="Discover Cambodia"
      title="Explore every corner of the kingdom"
      subtitle="Temples, islands, mountains, markets and more, across Cambodia's provinces."
      defaultSort="name"
    />
  );
}
