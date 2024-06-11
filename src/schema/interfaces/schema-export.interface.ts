import { ISchemaFieldExport } from "./schema-field-export.interface";
import { ISchemaJoinFieldExport } from "./schema-join-field-export.interface";

export interface ISchemaExport {
    /** 모델명 */
    name: string;

    /** 모델 설명 */
    description: string;

    /** 소프트 삭제 여부 */
    isDeletedAt: boolean;

    fields: ISchemaFieldExport[];

    joins: ISchemaJoinFieldExport[];

    // joins?: {
    //     /** 조인 타입 */
    //     type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";
    //
    //     /** 조인 필드명 */
    //     field: string;
    //
    //     /** 조인 모델명 */
    //     model: string;
    //
    //     /** 조인 필드 타입 */
    //     fieldType: string;
    //
    //     /** 조인 필드 설명 */
    //     fieldDescription: string;
    //
    //     /** 조인 필드 배열 여부 */
    //     isArray: boolean;
    //
    //     /** 조인 필드 필수 여부 */
    //     isRequired: boolean;
    // }[];
}
