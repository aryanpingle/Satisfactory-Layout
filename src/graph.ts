import { IOCONSTRUCT_ENTITY_NAME } from "./constants";
import { Database } from "./database";
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

        this.constructs.forEach((construct) =>
            construct.staticAnalysis(),
        );
    }

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

        const info = this.constructs.map((c) => c.getOperatingInformation());
        console.log(info);
    }
}
