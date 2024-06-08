export interface ISchemaFieldExport {
    /** 필드명 */
    name: string;

    /** 필드 타입 */
    type: {
        request: string;
        response: string;
        prisma: string;
        swagger: string;
    };

    /** 필드 설명 */
    description: string;

    /** 배열 여부 */
    isArray: boolean;

    /** 필수 여부 */
    isRequired: boolean;
}
