export function convertBigIntToString(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }

    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
            key,
            typeof value === 'bigint' ? value.toString() : convertBigIntToString(value),
        ])
    );
}
