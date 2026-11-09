import TransitionLink from "@/components/ui/TransitionLink";
import RollText from "@/components/ui/RollText";

export default function NotFound() {
  return (
    <section className="px-gutter flex min-h-[100svh] flex-col justify-center pt-28">
      <p className="mono mb-6 text-mute">(404)</p>
      <h1 className="text-display">
        Lost in <span className="serif text-accent">space</span>.
      </h1>
      <p className="mt-8 max-w-md text-lg text-bone/60">This page drifted off somewhere. Let&apos;s get you back.</p>
      <TransitionLink href="/" data-cursor-stick className="mono mt-10 inline-block text-bone">
        <RollText>← Back home</RollText>
      </TransitionLink>
    </section>
  );
}
