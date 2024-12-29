import { PartId, RecipeId, RecipeInfo } from "../database-types";
import { Database, PartFlowDict } from "../database";
import { IOConstruct } from "./ioconstruct";

/**
 * Abstract class denoting an IOConstruct with the ability to follow a recipe
 * and have a certain efficiency.
 */
export abstract class Machine extends IOConstruct {
    recipeId?: RecipeId;
    recipe?: RecipeInfo;

    setRecipe(recipeId: RecipeId) {
        this.recipeId = recipeId;
        this.recipe = Database.getRecipeInfo(recipeId);
        this.assignPartsToOutputs();
    }

    private ensureRecipeExists() {
        if (this.recipeId === undefined) {
            throw new Error(
                `Recipe has not been set for machine (id: ${this.id}).`,
            );
        }
    }

    getMaxTheoreticalInputFlows(): PartFlowDict {
        this.ensureRecipeExists();

        const recipe = this.recipe!;
        return Database.getIngredientPFD(recipe);
    }

    private assignPartsToOutputs(): void {
        // there will be max 2 outputs, a liquid and solid
        const recipe = this.recipe!;
        const products = recipe.products;

        if (products.length === 1) {
            // Only one output

            const partId = products[0].item as PartId;
            if (Database.isSolid(partId)) {
                this.outputs.filter((s) => s.acceptType === "solid")[0].partId =
                    partId;
            } else {
                this.outputs.filter((s) => s.acceptType === "fluid")[0].partId =
                    partId;
            }
        } else {
            // Two outputs - a solid and a fluid

            const solidPartId = products.filter((p) =>
                Database.isSolid(p.item as PartId),
            )[0].item as PartId;
            const fluidPartId = products.filter((p) =>
                Database.isFluid(p.item as PartId),
            )[0].item as PartId;

            this.outputs.filter((s) => s.acceptType === "solid")[0].partId =
                solidPartId;
            this.outputs.filter((s) => s.acceptType === "fluid")[0].partId =
                fluidPartId;
        }
    }

    getOrderedOutputPartIds(): PartId[] {
        this.ensureRecipeExists();
        return this.outputs.map((s) => s.partId!);
    }

    balance(): void {
        this.ensureRecipeExists();

        const recipeId = this.recipeId!;
        const recipe = this.recipe!;

        /**
         * STEPS
         * -----
         * 1. Calculate `maxPermittedEfficiency` using the `maxPermitted`
         *    variable of the output sockets (will be <= 1) (obviously)
         * 2. Calculate `minInputRatio` using the inputs' detected PartFlowDict
         *    based on the recipe
         * 3. The machine will be operating at
         *    efficiency = min(maxPermittedEfficiency, minInputRatio)
         * 4. Based on this efficiency, set the maxPermitted variables of the
         *    input sockets
         */

        // Step 1
        let maxPermittedEfficiency = Math.min(
            1,
            ...this.outputs.map((s) => s.maxPermitted),
        );

        // Step 2
        // input ratio - actual flow / required per minute (by recipe)
        const inputActualPartFlowDict: PartFlowDict = {};
        this.inputs.forEach((s) => {
            const partId = s.partId;
            if (partId === undefined) return;

            inputActualPartFlowDict[partId] = s.flow;
        });
        console.log(
            `[${this.id}] Receiving partFlowDict`,
            inputActualPartFlowDict,
        );

        const inputMaxPartFlowDict = this.getMaxTheoreticalInputFlows();
        const inputRatios = (Object.keys(inputMaxPartFlowDict) as PartId[]).map(
            (partId) =>
                inputActualPartFlowDict[partId]! /
                inputMaxPartFlowDict[partId]!,
        );

        const minInputRatio = Math.min(...inputRatios);

        // Step 3
        const actualEfficiency = Math.min(
            maxPermittedEfficiency,
            minInputRatio,
        );

        // Step 4
        // Assume one socket for each ingredient (may not be in order)
        this.inputs.forEach((s) => {
            const partId = s.partId!;
            if (partId === undefined) return;

            const maxPermitted =
                actualEfficiency * inputMaxPartFlowDict[partId]!;
            s.setMaxPermitted(maxPermitted);
        });

        // Actual balancing
        const o = Database.getProductPFD(recipe);
        for (const key in o) {
            o[key as PartId]! *= actualEfficiency;
        }
        this.outputs.forEach((s) => {
            s.flow = o[s.partId as PartId]!;
        });
    }
}
