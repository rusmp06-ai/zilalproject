"use client";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { SectionHeading, Button } from "@/components/ui/Primitives";
export function Contacts() {
  const { data } = usePlatform();
  return (
    <div className="container public-page">
      <SectionHeading as="h1" {...ui.contacts} />
      <div className="grid-two contact-grid">
        <div className="contact-panel">
          {(["address", "email", "phone"] as const).map((key) => (
            <div key={key}>
              <p className="eyebrow">{ui.contacts[key]}</p>
              {data.settings[key] ? (
                key === "email" ? (
                  <a href={`mailto:${data.settings.email}`}>
                    {data.settings.email}
                  </a>
                ) : key === "phone" ? (
                  <a
                    href={`tel:${data.settings.phone.replace(/[^+0-9]/g, "")}`}
                  >
                    {data.settings.phone}
                  </a>
                ) : (
                  <p>{data.settings.address}</p>
                )
              ) : (
                <p>{ui.contacts.pending}</p>
              )}
            </div>
          ))}
        </div>
        <div className="contact-prompt">
          <h2>{ui.contacts.form}</h2>
          <p>{ui.contacts.note}</p>
          <Button href="/plan">{ui.plan}</Button>
        </div>
      </div>
    </div>
  );
}
