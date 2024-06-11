export interface ISchemaJoinFieldExport {
    /** 필드명 */
    name: string;

    /** 상위 리소스 아이디 */
    relationId: string | null;

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
}
