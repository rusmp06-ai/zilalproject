import { ui } from "@/data/content/platform";
import { SectionHeading, Landscape, Button } from "@/components/ui/Primitives";
export function About() {
  return (
    <div className="container public-page">
      <SectionHeading as="h1" {...ui.about} />
      <div className="grid-two about-intro">
        <Landscape src="/images/valley.svg" alt={ui.illustration} />
        <div>
          <p className="large-copy">{ui.about.intro}</p>
          <h2>{ui.about.title2}</h2>
          <p>{ui.about.body}</p>
        </div>
      </div>
      <div className="grid-three about-values">
        {ui.about.values.map((value, index) => (
          <article key={value.title}>
            <p className="eyebrow">0{index + 1}</p>
            <h3>{value.title}</h3>
            <p>{value.description}</p>
          </article>
        ))}
      </div>
      <section className="about-team">
        <h2>{ui.about.team}</h2>
        <p>{ui.about.teamNote}</p>
        <Button href="/plan">{ui.plan}</Button>
      </section>
    </div>
  );
}
