import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
	{
		ignores: [
			".next/**",
			"out/**",
			"build/**",
			"node_modules/**",
			"next-env.d.ts",
			".next",
			"dist",
			"coverage",
		],
	},
	...compat.config({
		extends: ["next/core-web-vitals", "next/typescript"],
	}),
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
];

export default eslintConfig;
