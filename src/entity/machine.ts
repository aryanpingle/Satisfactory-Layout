import { Database, RecipeId, RecipeInfo } from "../dataset";
import { IOConstruct } from "./ioconstruct";

/**
 * Abstract class denoting an IOConstruct with the ability to follow a recipe
 * and have a certain efficiency.
 */
export abstract class Machine extends IOConstruct {
    recipeId?: RecipeId;
    recipe?: RecipeInfo;

    efficiency: number = 0;

    setRecipe(recipeId: RecipeId) {
        this.recipeId = recipeId;
        this.recipe = Database.getRecipeInfo(recipeId);
    }
}
