import { SchemaFactory } from "../../schema/schema.factory";
import chalk, { level } from "chalk";
import { ICommand } from "../_interfaces/command.interface";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import fs from "node:fs";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";
import { ISchemaFieldExport } from "../../schema/interfaces/schema-field-export.interface";
import { pascalToKebabCase } from "../../_global/functions/pascal-to-kebab-case.function";

export class ResponseDtoFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Response DTO Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the Response DTO."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 스키마 추출 */
        const schema: ISchemaExport = this.schemaFactory.export(command.schemaFileName);

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 메인 경로 검증 */
        if (!fs.existsSync(path)) return console.error(chalk.red(`The ${command.name} path does not exist.`));
        if (!fs.existsSync(`${path}dto`)) fs.mkdirSync(`${path}dto`);
        if (!fs.existsSync(`${path}dto/response`)) fs.mkdirSync(`${path}dto/response`);

        /** 파일 검증 */
        if (fs.readdirSync(`${path}dto/response`).length !== 0) fs.readdirSync(`${path}dto/response`).map(file => fs.rmSync(`${path}dto/response/${file}`));

        const level = command.name.includes("Management") ? "management" : "default";

        /** 파일 생성 */
        this.template(command.name, schema, level).forEach(t => fs.writeFileSync(`${path}dto/response/${t.fileName}`, t.template));

        /** Request DTO 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Request DTO`)} Completed.`));
    }

    private template(name: string, schema: ISchemaExport, level: "default" | "management") {
        /** 변수 영역 */
        const { camelCase, camelCaseToManagementIgnore, pascalCaseToManagementIgnore, pascalCase, kebabCase } = this.convertName(name);

        const actions = [
            { action: "create", ex: "NoDataResponseDto" },
            { action: "update", ex: "NoDataResponseDto" },
            { action: "delete", ex: "NoDataResponseDto" },
            { action: "findUnique", ex: "ResponseDto" },
            { action: "findList", ex: "ResponseWithMetadataDto" },
        ];

        const templates = actions.map(x => ({
            fileName: `${kebabCase}-${camelToKebabCase(x.action)}.dto.ts`,
            template: `import { ${x.ex} } from "@dto/response.dto";
import { ResponseService } from "@type/response-service";
import { OmitType, PickType } from "@nestjs/swagger";
import { ${pascalCase}Service } from "../../${kebabCase}.service";
import { ${pascalCase}Model } from "@model/${kebabCase}.model";${schema.joins.map(
                j => `
import { ${j?.type.prisma}Model } from "@model/${pascalToKebabCase(j.type?.prisma)}.model";`,
            )}

/** Response Dto */
export class ${pascalCase}${camelToPascalCase(x.action)}ResponseDto extends ${x.ex} implements ResponseService<${pascalCase}Service["${x.action}"]> {
    data: ${x.ex === "NoDataResponseDto" ? "null" : x.action === "findList" ? `${pascalCase}${camelToPascalCase(x.action)}Model[]` : `${pascalCase}${camelToPascalCase(x.action)}Model`};
}

/** Model */
class ${pascalCase}${camelToPascalCase(x.action)}Model extends OmitType(${pascalCase}Model, [${["findList", "findUnique"].includes(x.action) ? schema.fields.filter(t => t?.dtoOptions[level][x.action as "findUnique" | "findList"] === "RESPONSE_EXPOSE").map(e => `"${e.name}"`) : ""}]) {}${
                schema.joins.length !== 0
                    ? `

/** Include Models */
${schema.joins
    .map(
        j => `class ${pascalCase}${camelToPascalCase(x.action)}With${j?.type.prisma}Model extends OmitType(${j?.type.prisma}Model, []) {}
`,
    )
    .join("")}`
                    : ""
            }`,
        }));
        return templates;
    }

    private findDir(name: string, path: string): string | void {
        const items = fs.readdirSync(path);
        name = camelToKebabCase(name);

        for (const [index, item] of items.entries()) {
            if (fs.lstatSync(`${path}/${item}`).isDirectory()) {
                if (item === name) return `${path}/${item}/`;

                const foundPath = this.findDir(name, `${path}/${item}`);
                if (foundPath) return foundPath;
            }
        }
    }

    private convertName(name: string) {
        return {
            pascalCase: camelToPascalCase(name),
            camelCase: name,
            kebabCase: camelToKebabCase(name),
            pascalCaseToManagementIgnore: camelToPascalCase(name).replace("Management", ""),
            camelCaseToManagementIgnore: name.replace("Management", ""),
        };
    }

    private generateProperty(field: ISchemaFieldExport) {}
}
