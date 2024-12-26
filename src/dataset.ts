import DATABASE from "./data1.0.json";

export type PartId = keyof typeof DATABASE.items;
export type PartInfo = (typeof DATABASE.items)[PartId];

export type RecipeId = keyof typeof DATABASE.recipes;
export type RecipeInfo = (typeof DATABASE.recipes)[RecipeId];

export type BuildingId = keyof typeof DATABASE.buildings;
export type BuildingInfo = (typeof DATABASE.buildings)[BuildingId];

export namespace Database {
    export function getPartInfo(partId: PartId): PartInfo {
        if (!(partId in DATABASE["items"]))
            throw new Error(`Part id '${partId}' does not exist in database.`);

        return DATABASE["items"][partId];
    }

    export function getRecipeInfo(recipeId: RecipeId): RecipeInfo {
        if (!(recipeId in DATABASE["recipes"]))
            throw new Error(
                `Recipe id '${recipeId}' does not exist in database.`,
            );

        return DATABASE["recipes"][recipeId];
    }

    export function getBuildingInfo(buildingId: BuildingId): BuildingInfo {
        if (!(buildingId in DATABASE["buildings"]))
            throw new Error(
                `Building id '${buildingId}' does not exist in database.`,
            );

        return DATABASE["buildings"][buildingId];
    }

    /**
     * Check whether a part is a solid.
     */
    export function isSolid(partId: PartId) {
        return Database.getPartInfo(partId).liquid;
    }

    /**
     * Check whether a part is a fluid.
     */
    export function isFluid(partId: PartId) {
        return !isSolid(partId);
    }
}
