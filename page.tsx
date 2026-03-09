export default function HomePage() {
  const features = [
    {
      title: "Fast by default",
      description: "Built to feel instant, with a clean structure that fits modern Vercel deployments."
    },
    {
      title: "Repository-ready",
      description: "Easy to expand into docs, product pages, changelogs, or marketing."
    },
    {
      title: "Made to scale",
      description: "Start with a sharp landing page, then grow into a full product site."
    }
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#0f172a" }}>
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 48 }}>RepoSite Starter</h1>
        <p style={{ fontSize: 18, color: "#475569", maxWidth: 700 }}>
          A simple starter site for a GitHub repository deployed on Vercel.
          Replace this content with your project information.
        </p>
      </section>

      <section style={{ background: "#f8fafc", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32 }}>Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 20, borderRadius: 16 }}>
                <h3>{f.title}</h3>
                <p style={{ color: "#475569" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2>Deploy on Vercel</h2>
        <p style={{ color: "#475569" }}>Push this repo to GitHub and import it into Vercel to deploy.</p>
        <div style={{ marginTop: 20 }}>
          <a href="https://github.com" style={{ marginRight: 10 }}>GitHub</a>
          <a href="https://vercel.com">Vercel</a>
        </div>
      </section>
    </main>
  );
}
