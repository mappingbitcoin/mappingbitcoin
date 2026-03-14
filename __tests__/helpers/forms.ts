import type { VenueForm } from "@/models/VenueForm";

/**
 * Creates a minimal valid VenueForm for testing.
 * Override individual fields as needed.
 */
export function makeVenueForm(overrides: Partial<VenueForm> = {}): VenueForm {
  return {
    name: "Test Bitcoin Cafe",
    category: "food-and-drink" as VenueForm["category"],
    subcategory: "cafe" as VenueForm["subcategory"],
    additionalTags: {},
    about: "",
    lat: "40.7128",
    lon: "-74.0060",
    address: {
      street: "123 Main St",
      housenumber: "123",
      district: "",
      state: "NY",
      postcode: "10001",
      city: "New York",
      country: "US",
    },
    payment: {
      onchain: true,
      lightning: true,
      lightning_contactless: false,
    },
    contact: {
      website: "https://testcafe.com",
      phone: "+1-555-0100",
      email: "hello@testcafe.com",
    },
    opening_hours: "Mo-Fr 09:00-17:00",
    notes: "",
    role: "owner",
    ...overrides,
  };
}
