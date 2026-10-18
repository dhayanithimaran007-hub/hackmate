import { HackathonForm } from '../components/hackathons/HackathonForm';
import EarthBackground from '../components/ui/EarthBackground';

export default function PostHackathonPage() {
  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* Subtle orbital curves */}
      <EarthBackground variant="minimal" />

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-14 md:pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
          POST A <span className="text-accent">HACKATHON.</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-secondary font-sans max-w-md mx-auto leading-relaxed">
          Create an event listing, define open squad positions, and find complementary builders.
        </p>
      </div>

      <div className="relative z-10 w-full px-4 md:px-8 pb-16">
        <HackathonForm />
      </div>
    </div>
  );
}
