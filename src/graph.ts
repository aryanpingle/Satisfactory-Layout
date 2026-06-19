import { IOCONSTRUCT_ENTITY_NAME } from "./constants";
import { EntityManager } from "./entity/entity";
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

    /** Builds and caches the underlying Satisfactory graph */
    initializeConstructs() {
        const entities = this.manager.getActiveEntities();
        this.constructs = entities.filter(
            (entity) => entity.name === IOCONSTRUCT_ENTITY_NAME,
        ) as IOConstruct[];

        this.constructs.forEach((construct) => construct.staticAnalysis());
    }

    /**
     * Propagates part IDs and flow rates without any balancing.
     * Useful for determining which parts are going where and if part types are correct.
     * 
     * O(#IOConstructs) per iteration
     */
    staticAnalysis(iterations: number) {
        const startTime = performance.now();

        for (let i = 0; i < iterations; ++i) {
            this.constructs.forEach((construct) => construct.staticAnalysis());
        }

        const endTime = performance.now();
        console.log(
            `Static analysis completed in %c${endTime - startTime}ms.`,
            "background-color: white; color: black; font-weight: bold;",
        );
    }

    balance(iterations: number) {
        const startTime = performance.now();

        for (let i = 0; i < iterations; ++i) {
            this.constructs.forEach((construct) => construct.balance());
        }

        const endTime = performance.now();
        console.log(
            `Balancing completed in %c${endTime - startTime}ms.`,
            "background-color: white; color: black; font-weight: bold;",
        );
    }
}
