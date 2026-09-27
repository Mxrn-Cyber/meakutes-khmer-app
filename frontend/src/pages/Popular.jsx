import PlacesBrowser from "../components/PlacesBrowser";

export default function Popular() {
  return (
    <PlacesBrowser
      heroImage="/angkor-wat.png"
      eyebrow="Popular places"
      title="Cambodia's top-rated places"
      subtitle="Ranked by the ratings and reviews of travellers like you."
      defaultSort="rating"
      showRank
    />
  );
}
