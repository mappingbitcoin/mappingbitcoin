# Development Guidelines

This document outlines coding standards and best practices for the MappingBitcoin project.

---

## 1. Icons and SVG Assets

### Rule: Never use inline SVG in components

All SVG icons MUST be stored in the `/public/assets/icons/` folder and used via the `Icon` component.

### Folder Structure

```
public/assets/icons/
├── ui/           # Navigation, action, and status icons
│   ├── checkmark.svg
│   ├── close.svg
│   ├── chevron-down.svg
│   ├── search.svg
│   ├── plus.svg
│   ├── settings.svg
│   └── ...
├── social/       # Social media brand icons
│   ├── twitter.svg
│   ├── instagram.svg
│   └── ...
├── contact/      # Contact-related icons
│   ├── phone.svg
│   ├── email.svg
│   └── ...
├── location/     # Location and map icons
│   ├── pin.svg
│   ├── building.svg
│   └── ...
└── [custom]/     # Project-specific icons (atm.svg, merchant.svg, etc.)
```

### Using the Icon Component

```tsx
import { Icon } from "@/components/ui";

// Basic usage
<Icon name="checkmark" size={24} />

// With custom color (inherits text color)
<Icon name="twitter" size={20} className="text-blue-400" />

// With accessibility label
<Icon name="search" size={24} aria-label="Search" />

// Custom dimensions
<Icon name="settings" width={32} height={32} />
```

### Adding a New Icon

1. Create the SVG file in the appropriate subfolder
2. Use `viewBox="0 0 24 24"` for consistency (or appropriate viewBox)
3. For stroke-based icons: use `stroke="currentColor"` and remove `fill`
4. For fill-based icons: use `fill="currentColor"`
5. Add the icon to `ICON_PATHS` in `/components/ui/Icon/index.tsx`
6. Use the Icon component instead of inline SVG

### DO NOT

```tsx
// ❌ WRONG - Inline SVG
<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M5 13l4 4L19 7" />
</svg>

// ✅ CORRECT - Use Icon component
<Icon name="checkmark" size={24} />
```

---

## 2. Internationalization (i18n)

### Rule: All user-facing text MUST use translations

Never hardcode text strings in components. Always use the `useTranslations` hook from `next-intl`.

### Using Translations

```tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
    const t = useTranslations("namespace");

    return (
        <div>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
            <Button>{t("buttons.submit")}</Button>
        </div>
    );
}
```

### Translation File Structure

```
public/locales/
├── en/
│   ├── common.json      # Shared translations
│   ├── login.json       # Auth-related translations
│   ├── places.json      # Place-related translations
│   └── ...
└── [other-locales]/
```

### Adding New Translations

1. Add the key-value pair to the appropriate JSON file in `/public/locales/en/`
2. Use nested objects for organization
3. Use descriptive key names

```json
// ✅ Good
{
    "buttons": {
        "submit": "Submit",
        "cancel": "Cancel"
    },
    "errors": {
        "required": "This field is required"
    }
}

// ❌ Bad - flat structure with unclear naming
{
    "btn1": "Submit",
    "err": "This field is required"
}
```

### DO NOT

```tsx
// ❌ WRONG - Hardcoded text
<button>Submit</button>
<p>Welcome to our app</p>

// ✅ CORRECT - Use translations
<button>{t("buttons.submit")}</button>
<p>{t("welcome")}</p>
```

---

## 3. Component Reusability

### Rule: Always check for existing components before creating new ones

Before creating a new component, search the codebase for similar functionality.

### Shared Components Location

```
components/
├── ui/              # Base UI components (Button, Modal, Icon, etc.)
├── auth/            # Authentication components (LoginStep, LoginModal)
├── common/          # Shared feature components (FAQSection, Newsletter)
├── layout/          # Layout components (NavBar, Footer, Sidebar)
├── place/           # Place-related components
├── map/             # Map-related components
└── verification/    # Verification components
```

### Component Checklist

Before creating a new component, ask:

1. Does a similar component already exist in `/components/ui/`?
2. Can an existing component be extended with props?
3. Is this component specific to one feature or reusable?

### Extending Components

```tsx
// ✅ Good - Extend existing component with props
<StepIndicator
    variant="compact"
    steps={[...]}
    currentStep={1}
/>

// ❌ Bad - Creating a duplicate component
// Don't create CompactStepIndicator when StepIndicator has a variant prop
```

### Exporting Components

Always export reusable components from their category index:

```tsx
// components/ui/index.ts
export { default as Icon } from './Icon';
export { default as Button } from './Button';
export { default as Modal } from './Modal';
```

---

## 4. Quick Reference

| Task | Solution |
|------|----------|
| Display an icon | Use `<Icon name="..." />` |
| Display text | Use `useTranslations` hook |
| Create a modal | Use existing `Modal` component |
| Show steps/progress | Use `StepIndicator` component |
| Authentication UI | Use `LoginStep` or `LoginModal` |
| Need a button | Use `Button`, `ButtonSecondary`, etc. |

---

## 5. Code Review Checklist

Before submitting code, verify:

- [ ] No inline SVG icons (use Icon component)
- [ ] No hardcoded user-facing text (use translations)
- [ ] No duplicate components (check existing ui/ components)
- [ ] Translations added to appropriate locale files
- [ ] New icons added to Icon component's ICON_PATHS
- [ ] Components exported from their index files
