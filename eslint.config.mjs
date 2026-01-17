import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/navigation',
              importNames: ['useRouter'],
              message: 'Use useRouter from @/i18n/navigation instead',
            },
            {
              name: 'next/navigation',
              importNames: ['usePathname'],
              message: 'Use usePathname from @/i18n/navigation instead',
            },
            {
              name: 'next/link',
              message: 'Use Link from @/i18n/navigation instead',
            }
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
