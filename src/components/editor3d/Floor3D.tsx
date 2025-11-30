import React from "react";

interface Floor3DProps {
	bounds: {
		minX: number;
		maxX: number;
		minZ: number;
		maxZ: number;
		centerX: number;
		centerZ: number;
	};
}

/**
 * Компонент базового пола
 */
export function Floor3D({ bounds }: Floor3DProps) {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return (
		<mesh
			position={[bounds.centerX, 0, bounds.centerZ]}
			rotation={[-Math.PI / 2, 0, 0]}
			receiveShadow
		>
			<planeGeometry args={[width, depth]} />
			<meshStandardMaterial color="#f1f5f9" roughness={0.95} metalness={0.0} />
		</mesh>
	);
}
