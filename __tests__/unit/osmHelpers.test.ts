import { describe, it, expect, vi } from "vitest";
import {
  buildTagsFromForm,
  buildOsmChangeXML,
  buildOsmModifyXML,
  parseTags,
} from "@/utils/OsmHelpers";
import { makeVenueForm } from "../helpers/forms";

describe("buildTagsFromForm", () => {
  it("always includes currency:XBT and source tags", () => {
    const form = makeVenueForm();
    const tags = buildTagsFromForm(form);

    expect(tags["currency:XBT"]).toBe("yes");
    expect(tags["check_date:currency:XBT"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tags.source).toBe("MappingBitcoin.com user submission");
  });

  it("sets name from form", () => {
    const tags = buildTagsFromForm(makeVenueForm({ name: "Sats Cafe" }));
    expect(tags.name).toBe("Sats Cafe");
  });

  it("trims name whitespace", () => {
    const tags = buildTagsFromForm(makeVenueForm({ name: "  Sats Cafe  " }));
    expect(tags.name).toBe("Sats Cafe");
  });

  it("sets address tags with addr: prefix", () => {
    const form = makeVenueForm({
      address: {
        street: "Bitcoin Blvd",
        housenumber: "21",
        district: "",
        state: "TX",
        postcode: "73301",
        city: "Austin",
        country: "US",
      },
    });
    const tags = buildTagsFromForm(form);

    expect(tags["addr:street"]).toBe("Bitcoin Blvd");
    expect(tags["addr:housenumber"]).toBe("21");
    expect(tags["addr:city"]).toBe("Austin");
    expect(tags["addr:country"]).toBe("US");
    // Empty district should not appear
    expect(tags["addr:district"]).toBeUndefined();
  });

  it("sets payment: tags for enabled methods", () => {
    const form = makeVenueForm({
      payment: { onchain: true, lightning: true, lightning_contactless: false },
    });
    const tags = buildTagsFromForm(form);

    expect(tags["payment:onchain"]).toBe("yes");
    expect(tags["payment:lightning"]).toBe("yes");
    expect(tags["payment:lightning_contactless"]).toBeUndefined();
  });

  it("sets contact: tags", () => {
    const form = makeVenueForm({
      contact: { website: "https://test.com", phone: "+1-555-0100", email: "hi@test.com" },
    });
    const tags = buildTagsFromForm(form);

    expect(tags["contact:website"]).toBeDefined();
    expect(tags["contact:phone"]).toBeDefined();
    expect(tags["contact:email"]).toBeDefined();
  });

  it("sets role and nostr pubkey metadata", () => {
    const form = makeVenueForm({ role: "owner" });
    const tags = buildTagsFromForm(form, { nostrPubkey: "npub123" });

    expect(tags["note:submitted_by_role"]).toBe("owner");
    expect(tags["note:submitted_by_nostr"]).toBe("npub123");
  });

  it("skips empty role", () => {
    const form = makeVenueForm({ role: "" });
    const tags = buildTagsFromForm(form);
    expect(tags["note:submitted_by_role"]).toBeUndefined();
  });

  it("sets category tag", () => {
    const form = makeVenueForm({ category: "food-and-drink" as VenueFormCategory });
    const tags = buildTagsFromForm(form);
    expect(tags.category).toBe("food-and-drink");
  });
});

// Use a type alias to avoid importing the exact union
type VenueFormCategory = Parameters<typeof makeVenueForm>[0] extends { category?: infer C } ? C : never;

describe("buildOsmChangeXML", () => {
  it("produces valid XML structure with create element", () => {
    const xml = buildOsmChangeXML(40.7128, -74.006, { name: "Test", "currency:XBT": "yes" });

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<osmChange");
    expect(xml).toContain("<create>");
    expect(xml).toContain('lat="40.7128"');
    expect(xml).toContain('lon="-74.006"');
    expect(xml).toContain('k="name" v="Test"');
    expect(xml).toContain('k="currency:XBT" v="yes"');
    expect(xml).toContain("CHANGESET_ID");
  });

  it("escapes XML special characters in tag values", () => {
    const xml = buildOsmChangeXML(0, 0, { name: 'Foo & Bar "Café" <3' });
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&lt;");
  });
});

describe("buildOsmModifyXML", () => {
  it("produces valid XML structure with modify element", () => {
    const xml = buildOsmModifyXML(12345, 3, 51.5074, -0.1278, { name: "London Pub" });

    expect(xml).toContain("<modify>");
    expect(xml).toContain('id="12345"');
    expect(xml).toContain('version="3"');
    expect(xml).toContain('lat="51.5074"');
    expect(xml).toContain('lon="-0.1278"');
    expect(xml).toContain('k="name" v="London Pub"');
  });
});

describe("parseTags", () => {
  it("separates payment methods from tags", () => {
    const result = parseTags({
      "payment:onchain": "yes",
      "payment:lightning": "yes",
      name: "Test",
    });

    expect(result.paymentMethods).toEqual({ onchain: "yes", lightning: "yes" });
  });

  it("adds onchain if currency:XBT is yes", () => {
    const result = parseTags({ "currency:XBT": "yes" });
    expect(result.paymentMethods.onchain).toBe("yes");
  });

  it("does not add onchain if currency:XBT is not yes", () => {
    const result = parseTags({ "currency:XBT": "no" });
    expect(result.paymentMethods.onchain).toBeUndefined();
  });

  it("extracts contact info from contact: prefix", () => {
    const result = parseTags({
      "contact:website": "https://test.com",
      "contact:email": "hi@test.com",
    });
    expect(result.contact.website).toBe("https://test.com");
    expect(result.contact.email).toBe("hi@test.com");
  });

  it("falls back to direct website/email/phone tags", () => {
    const result = parseTags({
      website: "https://direct.com",
      email: "direct@test.com",
      phone: "+1-555-0100",
    });
    expect(result.contact.website).toBe("https://direct.com");
    expect(result.contact.email).toBe("direct@test.com");
    expect(result.contact.phone).toBe("+1-555-0100");
  });

  it("extracts address with addr: prefix stripped", () => {
    const result = parseTags({
      "addr:street": "Main St",
      "addr:city": "Austin",
    });
    expect(result.address).toEqual({ street: "Main St", city: "Austin" });
  });

  it("extracts name, opening_hours, source, description", () => {
    const result = parseTags({
      name: "Test Place",
      opening_hours: "Mo-Fr 09:00-17:00",
      source: "survey",
      description: "A nice place",
    });
    expect(result.name).toBe("Test Place");
    expect(result.openingHours).toBe("Mo-Fr 09:00-17:00");
    expect(result.source).toBe("survey");
    expect(result.description).toBe("A nice place");
  });

  it("extracts localized descriptions and notes", () => {
    const result = parseTags({
      "description:en": "English desc",
      "description:es": "Spanish desc",
      "note:submitted_by_role": "owner",
    });
    expect(result.descriptionsByLocale).toEqual({ en: "English desc", es: "Spanish desc" });
    expect(result.notesByLocale).toEqual({ submitted_by_role: "owner" });
  });

  it("extracts special tags (cuisine, operator, etc.)", () => {
    const result = parseTags({
      cuisine: "coffee",
      operator: "Bitcoin Corp",
    });
    expect(result.specialTags.cuisine).toBe("coffee");
    expect(result.specialTags.operator).toBe("Bitcoin Corp");
  });

  it("extracts amenities tags", () => {
    const result = parseTags({
      internet_access: "wlan",
      wheelchair: "yes",
      outdoor_seating: "yes",
    });
    expect(result.amenitiesTags.internet_access).toBe("wlan");
    expect(result.amenitiesTags.wheelchair).toBe("yes");
    expect(result.amenitiesTags.outdoor_seating).toBe("yes");
  });

  it("returns empty defaults for null-ish tags", () => {
    // @ts-expect-error testing null input
    const result = parseTags(null);
    expect(result.name).toBe("");
    expect(result.paymentMethods).toEqual({});
    expect(result.contact).toEqual({});
  });
});
