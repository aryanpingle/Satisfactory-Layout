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
    manager: EntityManager;
    constructs: IOConstruct[] = [];

    constructor(manager: EntityManager) {
        this.manager = manager;
    }

    initializeConstructs() {
        const entities = this.manager.getActiveEntities();
        this.constructs = entities.filter(
            (entity) => entity.name === IOCONSTRUCT_ENTITY_NAME,
        ) as IOConstruct[];

        this.constructs.forEach((construct) => construct.assignSocketParts());
    }

    balance(iterations: number) {
        console.log("SatisfactoryGraph: Balancing");

        for (let i = 0; i < iterations; ++i) {
            this.constructs.forEach((construct) => construct.balance());
        }

        const info = this.constructs.map((c) => c.getOperatingInformation());
        console.log(info);
    }
}
