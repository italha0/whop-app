export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Experience</h1>
      <p className="text-sm text-muted-foreground mt-2">ID: {params.experienceId}</p>
      <p className="mt-6">This is a placeholder page for the Whop dev proxy. Wire it to your product UI as needed.</p>
    </main>
  );
}
