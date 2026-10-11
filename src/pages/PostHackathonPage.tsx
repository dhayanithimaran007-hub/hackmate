
import { HackathonForm } from '../components/hackathons/HackathonForm';

export default function PostHackathonPage() {
  return (
    <div className="w-full flex flex-col py-12 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full mb-10 text-center">
        <h1 className="heading-page mb-3">POST A HACKATHON</h1>
        <p className="font-mono text-xs sm:text-sm tracking-wider text-muted-foreground uppercase">
          BUILD YOUR DREAM TEAM
        </p>
      </div>

      <HackathonForm />
    </div>
  );
}
