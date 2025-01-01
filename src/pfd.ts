import { PartId } from "./database-types";

export class PartFlowDict {
    data: Partial<Record<PartId, number>> = {};

    _add(partId: PartId, flow: number): void {
        let original = this.data[partId];
        if (original === undefined) original = 0;
        this.data[partId] = original + flow;
    }

    add(partId: PartId, flow: number): PartFlowDict {
        const clone = this.clone();
        clone._add(partId, flow);
        return clone;
    }

    clone(): PartFlowDict {
        const clone = new PartFlowDict();
        clone.data = structuredClone(this.data);
        return clone;
    }

    _div(value: number): void {
        for (const partId in this.data) {
            this.data[partId as PartId]! /= value;
        }
    }

    div(value: number): PartFlowDict {
        const clone = this.clone();
        clone._div(value);
        return clone;
    }

    get(partId: PartId): number | undefined {
        return this.data[partId];
    }

    getParts(): PartId[] {
        return Object.keys(this.data) as PartId[];
    }

    hasSameParts(other: PartFlowDict): boolean {
        const p1 = this.getParts();
        const p2 = other.getParts();

        if (p1.length !== p2.length) return false;

        return p1.every((partId) => other.get(partId) !== undefined);
    }

    _mult(value: number): void {
        for (const partId in this.data) {
            this.data[partId as PartId]! *= value;
        }
    }

    mult(value: number): PartFlowDict {
        const clone = this.clone();
        clone._mult(value);
        return clone;
    }
}
