export function toKebabCase(x: string): string {
    return x.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}