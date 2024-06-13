export interface ISchemaFieldExport {
    /** 필드명 */
    name: string;

    /** 필드 타입 */
    type: {
        request: string;
        response: string;
        prisma: string;
        swagger: string;
        validator: string;
    };

    /** 필드 설명 */
    description: string;

    /** 배열 여부 */
    isArray: boolean;

    /** 아이디 여부 */
    isId: boolean;

    /** 필수 여부 */
    isRequired: boolean;

    dtoOptions: {
        default: {
            create: "CREATE_REQUIRED" | "CREATE_OPTIONAL" | null;
            update: "UPDATE" | null;
            findUnique: "RESPONSE_EXPOSE" | null;
            findList: "RESPONSE_EXPOSE" | null;
        };
        management: {
            create: "CREATE_REQUIRED" | "CREATE_OPTIONAL" | null;
            update: "UPDATE" | null;
            findUnique: "RESPONSE_EXPOSE" | null;
            findList: "RESPONSE_EXPOSE" | null;
        };
    };
}
