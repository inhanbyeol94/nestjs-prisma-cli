import { SchemaFactory } from "../../schema/schema.factory";
import chalk from "chalk";
import { ICommand } from "../_interfaces/command.interface";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import fs from "node:fs";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";
import { ISchemaFieldExport } from "../../schema/interfaces/schema-field-export.interface";

export class RequestDtoFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Request DTO Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the Request DTO."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 스키마 추출 */
        const schema: ISchemaExport = this.schemaFactory.export(command.schemaFileName);

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        const level = command.name.includes("Management") ? "management" : "default";

        /** 메인 경로 검증 */
        if (!fs.existsSync(path)) return console.error(chalk.red(`The ${command.name} path does not exist.`));
        if (!fs.existsSync(`${path}dto`)) fs.mkdirSync(`${path}dto`);

        /** 파일 검증 */
        if (fs.readdirSync(`${path}dto`).length !== 0) fs.readdirSync(`${path}dto`).map(file => fs.rmSync(`${path}dto/${file}`));

        /** 파일 생성 */
        this.template(command.name, schema).forEach(t => fs.writeFileSync(`${path}dto/${t.fileName}`, t.template));

        /** Request DTO 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Request DTO`)} Completed.`));
    }

    private item(schema: ISchemaExport, type: "create" | "update" | "delete" | "findUnique" | "findList", level: "default" | "management") {
        const id = schema.fields.find(field => field.isId);

        switch (type) {
            case "create":
                return schema.fields
                    .filter(field => field.dtoOptions[level][type])
                    .map(
                        field => `    /** ${field.description} */
    @${field.dtoOptions[level][type] === "CREATE_REQUIRED" ? "IsNotEmpty" : "IsOptional"}()
    @${field?.type.validator}
    ${field.name}${field.dtoOptions[level][type] === "CREATE_REQUIRED" ? "!" : "?"}: ${field.type.request};
`,
                    );
            case "update":
                return [
                    `    /** ${id?.description} */
    @IsNotEmpty()
    @${id?.type.validator}
    ${id?.name}: ${id?.type.request};
`,
                    ...schema.fields
                        .filter(field => field.dtoOptions[level][type])
                        .map(
                            field => `    /** ${field.description} */
    @IsOptional()
    @Is${field.type.validator}
    ${field.name}?: ${field.type.request};
`,
                        ),
                ];
            case "findUnique":
                return [
                    `    /** ${id?.description} */
    @IsNotEmpty()
    @${id?.type.validator}
    ${id?.name}: ${id?.type.request};`,
                ];
            case "delete":
                return [
                    `    /** ${id?.description} */
    @IsNotEmpty()
    @${id?.type.validator}
    ${id?.name}: ${id?.type.request};`,
                ];
            case "findList":
                return [];
        }
    }

    private template(name: string, schema: ISchemaExport): { fileName: string; template: string }[] {
        /** 변수 영역 */
        const { camelCase, camelCaseToManagementIgnore, pascalCaseToManagementIgnore, pascalCase, kebabCase } = this.convertName(name);

        const actions = ["create", "update", "delete", "findUnique", "findList"];

        return actions.map(a => ({
            fileName: `${kebabCase}-${camelToKebabCase(a)}.dto.ts`,
            template: `import { IsNotEmpty, IsOptional, IsArray, IsBoolean, IsInt, IsString, IsDate, IsDecimal } from "@inhanbyeol/class-validator";
import { I${pascalCase}${camelToPascalCase(a)} } from "../interfaces/${kebabCase}-${camelToKebabCase(a)}.interface";${
                a === "findList"
                    ? `
import { PaginationDto } from "@dto/request.dto";`
                    : ""
            }

export class ${pascalCase}${camelToPascalCase(a)}Dto${
                a === "findList"
                    ? ` extends PaginationDto implements I${pascalCase}${camelToPascalCase(a)} {}
`
                    : ` implements I${pascalCase}${camelToPascalCase(a)} ${
                          this.item(schema, a as any, "default").length !== 0
                              ? `{
${this.item(schema, a as any, name.includes("Management") ? "management" : "default")
    .join("\n")
    .trimEnd()}
}`
                              : `{}`
                      }
`
            }`,
        }));
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
