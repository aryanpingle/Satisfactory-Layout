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
import { EVENT_EMITTER } from "./utils";

let ALL_PART_IDS: PartId[] = [];

function createAllParts() {
    const partSet: Set<PartId> = new Set();
    for (const recipeInfo of Object.values(DATABASE.recipes)) {
        // Only look at recipes that can be followed by machines
        if (recipeInfo.inMachine === false) continue;

        // Scan ingredients
        for (const ing of recipeInfo.ingredients) {
            partSet.add(ing.item as any);
        }
        // Scan products
        for (const pro of recipeInfo.products) {
            partSet.add(pro.item as any);
        }
    }

    ALL_PART_IDS = Array.from(partSet).sort();
}

export namespace Database {
    export function getAllPartIds(): PartId[] {
        if (ALL_PART_IDS.length === 0) createAllParts();
        return ALL_PART_IDS;
    }

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

    export function getPartIconURL(partId: PartId | undefined): string {
        if (partId === undefined) {
            return "/items/undefined.png";
        }

        let converted = partId.toLowerCase();
        converted = converted.replace(/_/g, "-");
        return `/items/${converted}_256.png`;
    }

    const partIconImages: Partial<
        Record<PartId | "undefined", HTMLImageElement>
    > = {};

    export async function loadPartIcon(partId: PartId | undefined) {
        // If it's already loaded, ignore
        const sanitized = partId ?? "undefined";
        if (sanitized in partIconImages) {
            return;
        }

        const img = new Image();
        img.src = getPartIconURL(partId);
        await new Promise((resolve, reject) => {
            img.onload = () => {
                EVENT_EMITTER.emit("part_icon_loaded");
                resolve(undefined);
            };
            img.onerror = reject;
        });
        partIconImages[sanitized] = img;
    }

    /**
     * My GOAT function.
     *
     * Return the icon for a given part, or the icon for "undefined" if the icon
     * has not yet been loaded.
     */
    export function getPartIcon(partId: PartId | undefined): HTMLImageElement {
        if (partId === undefined) {
            return getUndefinedIcon();
        } else if (partIconImages[partId] === undefined) {
            loadPartIcon(partId);
            return getUndefinedIcon();
        } else {
            return partIconImages[partId];
        }
    }

    export function getUndefinedIcon(): HTMLImageElement {
        return partIconImages["undefined"]!;
    }
}
