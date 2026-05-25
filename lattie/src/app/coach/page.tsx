import CoachChat from "@/components/CoachChat";

export const dynamic = "force-dynamic";

export default function CoachPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl italic">Coach</h1>
        <p className="mt-1 font-sans-ui text-sm text-stone-600">
          A proactive coach that knows what you&rsquo;re juggling.
        </p>
      </header>
      <CoachChat />
    </div>
  );
}
