/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
	compiler: {
		// Disable SWC transforms that might interfere with JSX
		emotion: false,
	},
	experimental: {
		// Ensure proper JSX handling
		forceSwcTransforms: false,
	},
	webpack: (config) => {
		config.externals = config.externals || [];
		config.externals.push({
			canvas: "canvas",
		});

		// Ensure proper module resolution for Three.js
		config.resolve = config.resolve || {};
		config.resolve.alias = {
			...config.resolve.alias,
			three: "three",
		};

		return config;
	},
};

export default nextConfig;
