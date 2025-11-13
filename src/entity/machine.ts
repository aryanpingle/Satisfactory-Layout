import { PartId, RecipeId, RecipeInfo } from "../database-types";
import { Database } from "../database";
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
    }

    private ensureRecipeExists() {
        if (this.recipeId === undefined) {
            throw new Error(
                `Recipe has not been set for machine (id: ${this.id}).`,
            );
        }
    }

    getOrderedOutputPartIds(): PartId[] {
        this.ensureRecipeExists();
        return this.outputs.map((s) => s.partId!);
    }

    private inputsMatchIngredients() {
        const recipe = this.recipe!;
        const inputPFD = this.getInputPFD();
        const recipeIngredientPFD = Database.getIngredientPFD(recipe);

        return inputPFD.hasSameParts(recipeIngredientPFD);
    }

    /**
     * If the recipe has not been set, keep the outputs as undefined.
     * If it has, and all ingredients are detected in the input sockets,
     * set the `partId` on output sockets.
     */
    override staticAnalysis(): void {
        if (this.recipeId === undefined) {
            this.outputs.forEach((s) => s.propagate(undefined, 0));
            return;
        }

        // Step 1: Ensure all ingredients are part of the inputs
        if (!this.inputsMatchIngredients()) {
            console.warn(
                `${this.constructName} [${this.id}] does not have the correct inputs set.`,
            );
            this.debug(this.getInputPFD());
            this.outputs.forEach((s) => s.propagate(undefined, 0));
            return;
        }

        // Step 2: Assign parts to the output sockets
        const products = this.recipe!.products;

        const solidPartId: PartId | undefined = products.filter((o) =>
            Database.isSolid(o.item as PartId),
        )[0]?.item as PartId;
        const fluidPartId: PartId | undefined = products.filter((o) =>
            Database.isFluid(o.item as PartId),
        )[0]?.item as PartId;

        this.outputs.forEach((s) => {
            if (s.acceptType === "solid") {
                s.propagate(solidPartId, 0);
            } else {
                s.propagate(fluidPartId, 0);
            }
        });
    }

    override balance(): void {
        this.ensureRecipeExists();

        if (!this.inputsMatchIngredients()) {
            this.outputs.forEach((s) => s.propagate(undefined, 0));
            this.inputs.forEach((s) => s.setMaxPermitted(0));
            return;
        }

        // At this stage, we know the machine is getting its required inputs
        // with >= 0 flow

        /**
         * STEPS
         * -----
         * 1. Calculate `maxPermittedEfficiency` using the `maxPermitted`
         *    variable of the output sockets (will be <= 1) (obviously)
         * 2. Calculate `minInputRatio` using the inputs' detected PartFlowDict
         *    based on the recipe
         * 3. The machine will be operating at
         *    efficiency = min(maxPermittedEfficiency, minInputRatio)
         * 4. For all non-bottleneck inputs, set the `maxPermitted` variable
         */

        const recipeId = this.recipeId!;
        const recipe = this.recipe!;

        // Step 1
        let maxPermittedEfficiency = Math.min(
            1,
            ...this.outputs.map((s) => s.maxPermitted),
        );

        // Step 2
        // input ratio - actual flow / required per minute (by recipe)
        const inputActualPartFlowDict = this.getInputPFD();
        const recipeIngredientPFD = Database.getIngredientPFD(recipe);
        const inputRatios = recipeIngredientPFD
            .getParts()
            .map(
                (partId) =>
                    inputActualPartFlowDict.get(partId)! /
                    recipeIngredientPFD.get(partId)!,
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
                actualEfficiency * recipeIngredientPFD.get(partId)!;
            if (Number.isNaN(maxPermitted))
                console.error(actualEfficiency, recipeIngredientPFD);

            const ratio =
                inputActualPartFlowDict.get(partId)! /
                recipeIngredientPFD.get(partId)!;

            // if this is the bottleneck, there should be no maximum limit here
            if (ratio === actualEfficiency) {
                // this.debug(s);
                s.setMaxPermitted(recipeIngredientPFD.get(partId)!);
            }
            // if not, then set a maximum limit (this enables manifolds to work)
            else {
                s.setMaxPermitted(maxPermitted);
            }
        });

        // Actual balancing
        const o = Database.getProductPFD(recipe);
        o._mult(actualEfficiency);
        this.outputs.forEach((s) => {
            const socketPart = s.partId!;
            s.propagate(socketPart, o.get(socketPart)!);
        });
    }
}
