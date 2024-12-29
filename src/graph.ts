import { IOCONSTRUCT_ENTITY_NAME } from "./constants";
import { Entity, EntityManager } from "./entity/entity";
import { IOConstruct } from "./entity/ioconstruct";

/**
 * Machine Entity
 * Solid Merger Entity
 * Solid Splitter Entity
 * Fluid Merger
 * Fluid Splitter
 */

/**
 * Steps:
 * 1. Forward propagation
 * 2. Back Propagation
 */

export class SatisfactoryGraph {
    constructs: IOConstruct[];

    constructor(manager: EntityManager) {
        const entities = manager.getActiveEntities();

        this.constructs = entities.filter(
            (entity) => entity.name === IOCONSTRUCT_ENTITY_NAME,
        ) as IOConstruct[];
    }

    balance(iterations: number) {
        console.log("SatisfactoryGraph: Balancing");
        for (let i = 0; i < iterations; ++i) {
            this.constructs.forEach((construct) => construct.balance());
        }

        console.log(this.constructs);
    }
}
