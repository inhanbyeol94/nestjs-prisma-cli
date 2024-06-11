import chalk from "chalk";
import fs from "node:fs";
import { SchemaFactory } from "../../schema/schema.factory";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import { pascalToKebabCase } from "../../_global/functions/pascal-to-kebab-case.function";

export class ModelFactory {
    private readonly modelPath = `${process.cwd()}/src/_common/_utils/models`;

    constructor(private schemaFactory: SchemaFactory) {}

    responseCreate() {
        /** 모델 생성 시작 */
        console.log(chalk.white("Model Initializing..."));

        /** 기존 모델 검사 */
        if (fs.existsSync(this.modelPath)) {
            //기존 모델을 초기화 후 추출을 시작합니다.
            console.log(chalk.yellow("The existing model will be initialized and the extraction will begin."));

            /** 모델 삭제 */
            fs.rmSync(this.modelPath, { recursive: true });
        }

        /** 모델 경로 생성 */
        fs.mkdirSync(this.modelPath, { recursive: true });

        /** 스키마 추출 */
        const schemas = this.schemaFactory.exportMany();

        for (const schema of schemas) {
            /** 프로젝트 기본 제외 프로퍼티 추출 */
            const existsConfig = fs.existsSync(process.cwd() + "/src/config.ts");
            const configExposeMatch = existsConfig
                ? fs.readFileSync(process.cwd() + "/src/config.ts", "utf8").match(/static readonly APP_DATA_PROCESSING_EXPOSE\s*=\s*\[(.*?)\]\s*as const;/s) || []
                : [];
            const exposeFiled = configExposeMatch.length !== 0 ? configExposeMatch[1].split(",").map(item => item.trim().replace(/['"]/g, "")) : [];

            /** 파일경로 */
            const modelFile = `${this.modelPath}/${pascalToKebabCase(schema.name)}.model.ts`;

            /** file content  */
            const modelContent = `import { $Enums, Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger"

export class ${schema.name}Model {
${schema.fields
    .filter(field => !exposeFiled.includes(field.name))
    .map(
        field =>
            `    @ApiProperty({ description: "${field.description}", ${field.type.swagger.includes("$Enums.") ? `enum: ${field.type.swagger}` : `type: ${field.type.swagger}`}, nullable: ${!field.isRequired} })\n    ${field.name}!: ${field.type.response}${!field.isRequired ? " | null" : ""};`,
    )
    .join("\n\n")}
}`;

            /** 모델 파일 생성 */
            fs.writeFileSync(modelFile, modelContent);

            /** 모델 생성 종료 */
            console.log(chalk.white(`${schema.name} Model Creating...`));
        }

        /** 모델 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold("All Models")} Completed.`));
    }
}
