export function schemaTypeConvert(type: string) {
    switch (type) {
        case "String":
            return { request: "string", response: "string", prisma: type, swagger: "String" };
        case "String[]":
            return { request: "string[]", response: "string[]", prisma: type, swagger: "[String]" };
        case "Int":
            return { request: "number", response: "number", prisma: type, swagger: "Number" };
        case "Boolean":
            return { request: "boolean", response: "boolean", prisma: type, swagger: "Boolean" };
        case "DateTime":
            return { request: "Date", response: "Date", prisma: type, swagger: "Date" };
        case "Decimal":
            return { request: "string", response: "Prisma.Decimal", prisma: type, swagger: "String" };
        default:
            return { request: `$Enums.${type}`, response: `$Enums.${type}`, prisma: type, swagger: `$Enums.${type}` };
    }
}
