import { SchemaFactory } from "../../schema/schema.factory";
import chalk from "chalk";
import { ICommand } from "../_interfaces/command.interface";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import fs from "node:fs";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";

export class ServiceFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Service Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the service."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 스키마 추출 */
        const schema: ISchemaExport = this.schemaFactory.export(command.schemaFileName);

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 경로 검증 */
        if (!fs.existsSync(path)) fs.mkdirSync(path);

        /** 파일 검증 */
        if (fs.existsSync(`${path}${camelToKebabCase(command.name)}.service.ts`)) fs.rmSync(`${path}${camelToKebabCase(command.name)}.service.ts`);

        /** 파일 생성 */
        fs.writeFileSync(`${path}${camelToKebabCase(command.name)}.service.ts`, this.template(command.name, schema));

        /** 서비스 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Service`)} Completed.`));
    }

    private template(name: string, schema: ISchemaExport): string {
        /** 변수 영역 */
        const { camelCase, camelCaseToManagementIgnore, pascalCaseToManagementIgnore, pascalCase, kebabCase } = this.convertName(name);
        const id = schema.fields.find(field => field.isId);

        return `import { Injectable } from "@nestjs/common";
import { getResponseData, getResponseDataWithMeta, getResponseNoData } from "@function/response.function";
import { ${pascalCase}Repository } from "./${kebabCase}.repository";
import { I${pascalCase}Create } from "./interfaces/${kebabCase}-create.interface";
import { I${pascalCase}Update } from "./interfaces/${kebabCase}-update.interface";
import { I${pascalCase}Delete } from "./interfaces/${kebabCase}-delete.interface";
import { I${pascalCase}FindList } from "./interfaces/${kebabCase}-find-list.interface";
import { I${pascalCase}FindUnique } from "./interfaces/${kebabCase}-find-unique.interface";

@Injectable()
export class ${pascalCase}Service {
    constructor(private ${camelCase}Repository: ${pascalCase}Repository) {}

    /** 생성 */
    async create(data: I${pascalCase}Create) {
        // 생성
        await this.${camelCase}Repository.create(data);

        // 반환
        return getResponseNoData("${schema.description} 생성이 완료되었습니다.");
    }

    /** 수정 */
    async update({ ${id?.name}, ...data }: I${pascalCase}Update) {
        // 유효성 검증
        await this.${camelCase}Repository.findUniqueOrThrow(${id?.name});

        // 수정
        await this.${camelCase}Repository.update(${id?.name}, data);

        // 반환
        return getResponseNoData("${schema.description} 수정이 완료되었습니다.");
    }

${
    schema.isDeletedAt
        ? `    /** 삭제 */
    async delete(data: I${pascalCase}Delete) {
        // 유효성 검증
        await this.${camelCase}Repository.findUniqueOrThrow(data.${id?.name});

        // 삭제
        await this.${camelCase}Repository.softDelete(data.${id?.name});

        // 반환
        return getResponseNoData("${schema.description} 삭제가 완료되었습니다.");
    }`
        : `    /** 영구 삭제 */
    async delete(data: I${pascalCase}Delete) {
        // 유효성 검증
        await this.${camelCase}Repository.findUniqueOrThrow(data.${id?.name});

        // 삭제
        await this.${camelCase}Repository.delete(data.${id?.name});

        // 반환
        return getResponseNoData("${schema.description} 삭제가 완료되었습니다.");
    }`
}

    /** 단일 조회 */
    async findUnique(data: I${pascalCase}FindUnique) {
        // 조회 및 유효성 검증
        const resource = await this.${camelCase}Repository.findUniqueOrThrow(data.${id?.name});

        // 반환
        return getResponseData("${schema.description} 단일 조회가 완료되었습니다.", resource);
    }

    /** 전체 조회 */
    async findMany() {
        // 조회
        const resources = await this.${camelCase}Repository.findMany();

        // 반환
        return getResponseData("${schema.description} 전체 조회가 완료되었습니다.", resources);
    }

    /** 목록 조회 */
    async findList(data: I${pascalCase}FindList) {
        // 조회
        const { resources, meta } = await this.${camelCase}Repository.findList(data);

        // 반환
        return getResponseDataWithMeta("${schema.description} 목록 조회가 완료되었습니다.", resources, meta);
    }
}
`;
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
}
