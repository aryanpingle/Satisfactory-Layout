import DATABASE from "./data1.0.json";
import {
    BuildingId,
    BuildingInfo,
    PartId,
    PartInfo,
    RecipeId,
    RecipeInfo,
} from "./database-types";
import { PartFlowDict } from "./pfd";

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
        return !Database.getPartInfo(partId).liquid;
    }

    /**
     * Check whether a part is a fluid.
     */
    export function isFluid(partId: PartId) {
        return !isSolid(partId);
    }

    export function getProductPFD(recipe: RecipeInfo): PartFlowDict {
        const pfd = new PartFlowDict();

        const duration = recipe.time;
        recipe.products.forEach((o) => {
            pfd._add(o.item as PartId, (o.amount * 60) / duration);
        });

        return pfd;
    }

    export function getIngredientPFD(recipe: RecipeInfo): PartFlowDict {
        const pfd = new PartFlowDict();

        const duration = recipe.time;
        recipe.ingredients.forEach((o) => {
            pfd._add(o.item as PartId, (o.amount * 60) / duration);
        });

        return pfd;
    }
}
