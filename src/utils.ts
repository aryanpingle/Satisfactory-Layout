export function snap(value: number, mod: number) {
    return value - (value % mod);
}

export function getButton(event: MouseEvent): "LMB" | "MMB" | "RMB" | null {
    if (event.button === 0) return "LMB";
    if (event.button === 1) return "LMB";
    if (event.button === 2) return "LMB";
    return null;
}
