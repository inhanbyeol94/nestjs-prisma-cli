import * as fs from "node:fs";
import { schemaTypeConvert } from "./functions/schema-type-convert.function";
import { ISchemaFieldExport } from "./interfaces/schema-field-export.interface";
import chalk from "chalk";
import { ISchemaExport } from "./interfaces/schema-export.interface";
import * as process from "node:process";
import { ISchemaJoinFieldExport } from "./interfaces/schema-join-field-export.interface";

export class SchemaFactory {
    /** 스키마 파일 경로 */
    private readonly schemaModelPath = `${process.cwd()}/prisma/schema/models`;
    private readonly schemaInfoModelPath = `${process.cwd()}/prisma/schema/models/info`;

    /** 스키마 파일 목록 */
    private schemaModelFiles = fs.readdirSync(this.schemaModelPath).filter(file => file.endsWith(".prisma"));
    private schemaInfoModelFiles = fs.readdirSync(this.schemaInfoModelPath).filter(file => file.endsWith(".prisma"));

    /** 모델명 목록 */
    private modelNameList: string[] = [];

    /** 스키마 정보 목록 */
    private schemaList: ISchemaExport[] = [];

    constructor() {
        /** Default Model */
        for (const schemaFile of this.schemaModelFiles) {
            const modelNameMatch = fs.readFileSync(`${this.schemaModelPath}/${schemaFile}`, "utf-8").match(/model\s+(\w+)\s+{/) || [];
            this.modelNameList.push(modelNameMatch[1]);
        }

        /** Info Model */
        for (const schemaFile of this.schemaInfoModelFiles) {
            const modelNameMatch = fs.readFileSync(`${this.schemaInfoModelPath}/${schemaFile}`, "utf-8").match(/model\s+(\w+)\s+{/) || [];
            this.modelNameList.push(modelNameMatch[1]);
        }

        this.modelNameList = this.modelNameList.filter(Boolean);
    }

    export(schemaFile: string): ISchemaExport {
        /** 변수 영역 */
        const exportFields: ISchemaFieldExport[] = [];
        const joinFields: ISchemaJoinFieldExport[] = [];

        const isInfoPathValid = fs.existsSync(`${this.schemaInfoModelPath}/${schemaFile}`);
        const isDefaultPathValid = fs.existsSync(`${this.schemaModelPath}/${schemaFile}`);

        /** 스키마 파일 없음 */
        if (!isInfoPathValid && !isDefaultPathValid)
            throw new Error(chalk.red(`The file ${schemaFile} does not exist, Are the file name and model name the same? (example.prisma -> model Example { ... })`));

        const schema = fs.existsSync(`${this.schemaModelPath}/${schemaFile}`)
            ? fs.readFileSync(`${this.schemaModelPath}/${schemaFile}`, "utf-8")
            : fs.readFileSync(`${this.schemaInfoModelPath}/${schemaFile}`, "utf-8");

        /** 모델 정규식 */
        const modelNameMatch = schema.match(/model\s+(\w+)\s+{/) || [];
        const modelDescriptionMatch = schema.match(/\/\/\s*(.*?)\s*(?=\bmodel\b)/) || [];

        /** 모델 검증 */
        if (!modelNameMatch[1]) throw new Error(chalk.red(`${chalk.underline(schemaFile)} of No model name found.`));
        if (!modelDescriptionMatch[1]) throw new Error(chalk.red(`${chalk.underline(schemaFile)} of No model description found.`));

        /** 필드 읽기 */
        const readFields = schema.match(/\{([\s\S]*?)\}/)![1].trim() || "";

        /** 필드 데이터 추출 */
        for (const field of readFields
            .trim()
            .split("\n")
            .filter(Boolean)
            .filter(x => !x.includes("@@"))) {
            const fieldMatch = field.match(/\s*(\w+)\s+(\w+)(\[\])?\s*(\??)\s*(@.+)?\s*\/\/\s*(.+)/);

            if (fieldMatch) {
                /** 일반 필드 */
                if (!this.modelNameList.includes(fieldMatch[2])) {
                    exportFields.push({
                        name: fieldMatch[1],
                        type: schemaTypeConvert(fieldMatch[2], fieldMatch[3]?.includes("[]") ?? false),
                        isArray: fieldMatch[3]?.includes("[]") ?? false,
                        isRequired: !fieldMatch[4],
                        isId: fieldMatch[5]?.includes("@id"),
                        dtoOptions: {
                            default: {
                                create: fieldMatch[6].includes("#CR") ? "CREATE_REQUIRED" : fieldMatch[6].includes("#CO") ? "CREATE_OPTIONAL" : null,
                                update: fieldMatch[6].includes("#U") ? "UPDATE" : null,
                                findUnique: fieldMatch[6].includes("#FUE") ? "RESPONSE_EXPOSE" : null,
                                findList: fieldMatch[6].includes("#FLE") ? "RESPONSE_EXPOSE" : null,
                            },
                            management: {
                                create: fieldMatch[6].includes("#MCR") ? "CREATE_REQUIRED" : fieldMatch[6].includes("#MCO") ? "CREATE_OPTIONAL" : null,
                                update: fieldMatch[6].includes("#MU") ? "UPDATE" : null,
                                findUnique: fieldMatch[6].includes("#MFUE") ? "RESPONSE_EXPOSE" : null,
                                findList: fieldMatch[6].includes("#MFLE") ? "RESPONSE_EXPOSE" : null,
                            },
                        },
                        description: fieldMatch[6]
                            .replace("#CR", "")
                            .replace("#CO", "")
                            .replace("#MCR", "")
                            .replace("#MCO", "")
                            .replace("#U", "")
                            .replace("#MU", "")
                            .replace("#FUE", "")
                            .replace("#MFUE", "")
                            .replace("#FLE", "")
                            .replace("#MFLE", "")
                            .trim(),
                    });
                } else {
                    joinFields.push({
                        name: fieldMatch[1],
                        relationId: fieldMatch[5]?.match(/@relation\(fields: \[(.*?)\], references: \[.*?\]\)/)
                            ? fieldMatch[5]?.match(/@relation\(fields: \[(.*?)\], references: \[.*?\]\)/)![1]
                            : null,
                        type: schemaTypeConvert(fieldMatch[2], fieldMatch[3]?.includes("[]") ?? false),
                        isArray: fieldMatch[3]?.includes("[]") ?? false,
                        description: fieldMatch[6],
                    });
                }
            } else {
                throw new Error(
                    chalk.red(`${chalk.underline(schemaFile)} of There was a problem with the field data The field data must contain the following data (name, type, description)`),
                );
            }
        }

        return {
            name: modelNameMatch[1],
            description: modelDescriptionMatch[1],
            isDeletedAt: exportFields.some(field => field.name === "deletedAt"),
            fields: exportFields,
            joins: joinFields,
        };
    }

    exportMany() {
        /** 시작 로그 */
        console.log(chalk.white("Schema Extracting..."));

        /** 스키마 정보 목록 초기화 */
        this.schemaList = [];

        /** 스키마 정보 추출 */
        for (const schemaFile of [...this.schemaModelFiles, ...this.schemaInfoModelFiles]) {
            this.schemaList.push(this.export(schemaFile));
        }

        /** 반환 */
        return this.schemaList;
    }
}
