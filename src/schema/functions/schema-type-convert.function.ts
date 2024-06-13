export function schemaTypeConvert(type: string, isArray: boolean) {
    switch (type) {
        case "String":
            return {
                request: !isArray ? "string" : "string[]",
                response: !isArray ? "string" : "string[]",
                prisma: !isArray ? type : `${type}[]`,
                swagger: !isArray ? "String" : "[String]",
                validator: !isArray ? "IsString()" : "IsArray()",
            };
        case "Int":
            return { request: "number", response: "number", prisma: type, swagger: "Number", validator: "IsInt()" };
        case "Boolean":
            return { request: "boolean", response: "boolean", prisma: type, swagger: "Boolean", validator: "IsBoolean()" };
        case "DateTime":
            return { request: "Date", response: "Date", prisma: type, swagger: "Date", validator: "IsDate()" };
        case "Decimal":
            return { request: "string", response: "Prisma.Decimal", prisma: type, swagger: "String", validator: "IsDecimal()" };
        default:
            return { request: `$Enums.${type}`, response: `$Enums.${type}`, prisma: type, swagger: `$Enums.${type}`, validator: `IsIn()` };
    }
}
