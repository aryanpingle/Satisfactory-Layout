import DATASET from "./data1.0.json";

export const Dataset = DATASET;

export type PartId = keyof typeof DATASET.items;
export type PartInfo = (typeof DATASET.items)[PartId];

export type RecipeId = keyof typeof DATASET.recipes;
export type RecipeInfo = (typeof DATASET.recipes)[RecipeId];

export type BuildingId = keyof typeof DATASET.buildings;
export type BuildingInfo = (typeof DATASET.buildings)[BuildingId];

// Utility Functions

export function getPartInfo(partId: PartId): PartInfo | null {
    return DATASET["items"][partId];
}

export function getRecipeInfo(recipeId: RecipeId): RecipeInfo | null {
    return DATASET["recipes"][recipeId];
}

export function getBuildingInfo(buildingId: BuildingId): BuildingInfo | null {
    return DATASET["buildings"][buildingId];
}
