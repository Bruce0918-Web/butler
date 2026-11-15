/** The butler's daily note: a signed card left on the desk. Renders nothing when there is nothing to say. */
export function Note({ lines, date }: { lines: string[]; date: string }) {
  if (lines.length === 0) return null;
  return (
    <section aria-label="管家简报" className="enter mt-8 rounded-md border border-line bg-surface px-6 py-6 md:px-8 md:py-8">
      <div className="space-y-4 font-serif text-lg font-normal">
        {lines.map((l) => (
          <p key={l} className="pretty">{l}</p>
        ))}
      </div>
      <p className="mt-8 text-right text-sm text-accent">— 管家 · {date}</p>
    </section>
  );
}
