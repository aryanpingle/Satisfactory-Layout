import DATABASE from "./data1.0.json";

export type PartId = keyof typeof DATABASE.items;
export type PartInfo = (typeof DATABASE.items)[PartId];

export type RecipeId = keyof typeof DATABASE.recipes;
export type RecipeInfo = (typeof DATABASE.recipes)[RecipeId];

export type BuildingId = keyof typeof DATABASE.buildings;
export type BuildingInfo = (typeof DATABASE.buildings)[BuildingId];
