// Экспорт компонентов и утилит 3D редактора

export {
	DEFAULT_WALL_HEIGHT,
	mmToMeters,
	nodeToVector3,
	computeWallGeometry,
	isLayerVisible,
	type WallGeometry,
} from "./utils3d";

export { Plan3DViewer } from "./Plan3DViewer";
export type { Plan3DViewerProps, CameraMode } from "./Plan3DViewer";

export { Floor3D } from "./Floor3D";
export type { Floor3DProps } from "./Floor3D";

export { Walls3D, computeWallBasis } from "./Walls3D";
export type {
	Walls3DProps,
	WallBasis,
	WallSegment,
	Editor3DObjectType,
	Editor3DUserData,
} from "./Walls3D";

export { FirstPersonCameraController } from "./FirstPersonCameraController";
export type { FirstPersonCameraControllerProps } from "./FirstPersonCameraController";

export { Doors3D } from "./Doors3D";
export type { WallCut, Doors3DProps } from "./Doors3D";

export { Windows3D } from "./Windows3D";
export type { Windows3DProps } from "./Windows3D";

export { Rooms3D } from "./Rooms3D";
export type { Rooms3DProps } from "./Rooms3D";

export { Furniture3D } from "./Furniture3D";
export type { Furniture3DProps } from "./Furniture3D";

export { FurnitureModel, preloadFurnitureModels } from "./FurnitureModel";
export type { FurnitureModelProps } from "./FurnitureModel";

export {
	FURNITURE_CATALOG,
	getFurnitureItemByType,
	getFurnitureItemById,
} from "./furnitureCatalog";
export type { FurnitureCatalogItem } from "./furnitureCatalog";
