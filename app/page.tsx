import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-grid">
      {/* NAV */}
      <nav className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🌱</span> GrowIt
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/app" className="px-4 py-2 rounded-full bg-leaf-600 hover:bg-leaf-500 text-white font-semibold transition">
            Open my garden
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-20 text-center">
        <p className="text-leaf-300 font-medium mb-4">🌿 A habit tracker that literally grows something</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
          Stop breaking promises to yourself.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-leaf-300 to-leaf-500">
            Grow something beautiful instead.
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg text-leaf-100/80">
          Every habit you keep waters a seed that blooms in real&nbsp;time — and the moment you skip a day, it wilts.
          Turn your daily wins into a living garden you&apos;ll never want to abandon.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/app"
            className="px-7 py-3 rounded-full bg-leaf-500 hover:bg-leaf-400 text-leaf-950 font-bold text-lg shadow-lg shadow-leaf-500/20 transition"
          >
            Grow your first seed — free
          </Link>
          <Link
            href="/app"
            className="px-7 py-3 rounded-full glass hover:bg-white/5 font-semibold text-lg transition"
          >
            Watch it grow →
          </Link>
        </div>
        <p className="mt-6 text-sm text-leaf-300/60">No app store. Works on your phone in seconds. PWA.</p>
      </section>

      {/* LIVE DEMO — seed → golden */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="glass rounded-3xl p-6 md:p-10">
          <div className="grid grid-cols-5 gap-2 md:gap-6 items-end text-center">
            {[
              { e: "🌰", l: "Seed", d: "Day 0" },
              { e: "🌱", l: "Sprout", d: "Day 3" },
              { e: "🌿", l: "Sapling", d: "Day 8" },
              { e: "🌳", l: "Blooming", d: "Day 31" },
              { e: "🌟", l: "Golden Fruit", d: "Day 100+" },
            ].map((s, i) => (
              <div key={s.l} className={`floaty ${i === 4 ? "text-3xl" : "text-4xl md:text-5xl"}`}>
                <div className="text-3xl md:text-6xl drop-shadow">{s.e}</div>
                <div className="mt-2 font-semibold text-leaf-100">{s.l}</div>
                <div className="text-xs text-leaf-300/60">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 h-2 rounded-full bg-leaf-900/40 overflow-hidden">
            <div className="h-full progress-bar rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="mt-4 text-sm text-leaf-200/70 text-center">
            Your consistency is the water and the sun. Consistency compounds into a tree that becomes your legacy.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Habits that actually stick</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <Feature emoji="💧" title="Loss aversion, not fear">
            Skip a day and your plant droops, wilts, then goes dormant. It never dies — so you fix it instead of quitting.
          </Feature>
          <Feature emoji="🔥" title="Streaks that feel real">
            Watch your garden grow as you stack days. Every 6 XP is a win. Every streak is a milestone worth sharing.
          </Feature>
          <Feature emoji="📣" title="Made to be shared">
            One tap generates a share card of your plant + streak. Post it, brag about it, bring your friends in.
          </Feature>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-4xl mx-auto px-5 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Simple, plant-friendly pricing</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <Pricing name="Free" price="$0" highlight={false} features={["3 habit", "Grow your first plant", "Weekly share card", "Daily reminders"]} cta="Start free" />
          <Pricing name="GrowIt Plus" price="$4.99/mo" highlight={true} features={["Unlimited habits & plants", "Rare & fantasy species", "Real-tree planting 🌳", "Multi-device sync", "Advanced streak stats"]} cta="Try Plus" />
        </div>
        <p className="text-center text-sm text-leaf-300/60 mt-6">Or <span className="text-leaf-200 font-semibold">$29.99/year</span> · or a lifetime pass for the true growers.</p>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 pb-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold">Your plant is waiting for its first habit.</h2>
        <p className="mt-3 text-leaf-100/70">It&apos;ll wilt if you don&apos;t show up. Don&apos;t let it down.</p>
        <Link href="/app" className="inline-block mt-7 px-8 py-4 rounded-full bg-leaf-500 hover:bg-leaf-400 text-leaf-950 font-bold text-lg shadow-xl shadow-leaf-500/20 transition">
          Plant your seed now
        </Link>
      </section>
    </div>
  );
}

function Feature({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-3 font-bold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-leaf-100/70">{children}</p>
    </div>
  );
}

function Pricing({ name, price, highlight, features, cta }: { name: string; price: string; highlight?: boolean; popular?: boolean; features: string[]; cta: string }) {
  return (
    <div className={`rounded-3xl p-7 ${highlight ? "bg-leaf-600 text-leaf-950" : "glass"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl">{name}</h3>
        {highlight && <span className="text-xs bg-leaf-950 text-leaf-200 px-2 py-1 rounded-full font-semibold">MOST POPULAR</span>}
      </div>
      <div className="mt-3 text-3xl font-extrabold">{price}</div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2"><span>✓</span> {f}</li>
        ))}
      </ul>
      <Link
        href="/app"
        className={`mt-6 block text-center rounded-full py-3 font-semibold transition ${
          highlight ? "bg-leaf-950 text-leaf-100 hover:bg-leaf-900" : "bg-leaf-500 text-white hover:bg-leaf-400"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}