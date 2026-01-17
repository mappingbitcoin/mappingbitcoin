export function deslugify(text?: string): string | undefined {
    if (!text || text === '') return undefined
    return text.replaceAll("'", '')
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function normalize(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function tokenizeAndNormalize(str: string): string[] {
    return normalize(str).split(/\s+/).filter(Boolean);
}
