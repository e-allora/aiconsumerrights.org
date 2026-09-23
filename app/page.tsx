import Link from "next/link";

import { Button } from "@/components/ui/button";

// Placeholder until the home page phase. Points visitors to the guide.
export default function HomePage() {
  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <h1>AI Consumer Rights</h1>
      <p className="text-xl">
        <strong>Plain-language help when AI makes decisions about you.</strong>
      </p>
      <Button asChild size="lg" className="self-start">
        <Link href="/guide">Read the guide</Link>
      </Button>
    </main>
  );
}
