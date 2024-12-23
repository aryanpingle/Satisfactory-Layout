export function snap(value: number, mod: number) {
    return value - value % mod;
}
