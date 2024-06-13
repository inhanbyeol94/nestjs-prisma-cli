import { SchemaFactory } from "../../schema/schema.factory";
import { ICommand } from "../_interfaces/command.interface";
import chalk from "chalk";
import fs from "node:fs";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import { pascalToKebabCase } from "../../_global/functions/pascal-to-kebab-case.function";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";

export class RepositoryFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Repository Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the repository."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 스키마 추출 */
        const schema: ISchemaExport = this.schemaFactory.export(command.schemaFileName);

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 경로 검증 */
        if (!fs.existsSync(path)) fs.mkdirSync(path);

        /** 파일 검증 */
        if (fs.existsSync(`${path}${camelToKebabCase(command.name)}.repository.ts`)) fs.rmSync(`${path}${camelToKebabCase(command.name)}.repository.ts`);

        /** 파일 생성 */
        fs.writeFileSync(`${path}${camelToKebabCase(command.name)}.repository.ts`, this.template(command.name, schema));

        /** 레포지토리 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Repository`)} Completed.`));
    }

    private template(name: string, schema: ISchemaExport): string {
        /** 변수 영역 */
        const { camelCase, camelCaseToManagementIgnore, pascalCaseToManagementIgnore, pascalCase, kebabCase } = this.convertName(name);
        const id = schema.fields.find(field => field.isId);

        return `import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@common/prisma/prisma.service";
import { getPaginationOption } from "@function/pagination.function";
import { getMetadata } from "@function/metadata.function";
import { ResourceNotFoundException } from "@exception/not-found.exception";
import { I${pascalCase}FindList } from "./interfaces/${kebabCase}-find-list.interface";

@Injectable()
export class ${pascalCase}Repository {
    private ${camelCase}Repository = this.prisma.extendedClient.${camelCaseToManagementIgnore};

    constructor(private prisma: PrismaService) {}

    /** 생성 */
    async create(data: Prisma.${pascalCaseToManagementIgnore}CreateInput | Prisma.${pascalCaseToManagementIgnore}UncheckedCreateInput) {
        return this.${camelCase}Repository.create({ data });
    }

    /** 수정 */
    async update(${id?.name}: ${id?.type.request}, data: Prisma.${pascalCaseToManagementIgnore}UpdateInput | Prisma.${pascalCaseToManagementIgnore}UncheckedUpdateInput) {
        return this.${camelCase}Repository.update({ where: { ${id?.name} }, data });
    }

${
    schema.isDeletedAt
        ? `    /** 삭제 및 유효성 검증 */
    async softDelete(${id?.name}: ${id?.type.request}) {
        return this.${camelCase}Repository.softDelete({ ${id?.name} });
    }`
        : `    /** 영구 삭제 및 유효성 검증 */
    async delete(${id?.name}: ${id?.type.request}) {
        return this.${camelCase}Repository.delete({ where: { ${id?.name} } });
    }`
}

    /** 단일 조회 및 유효성 검증 */
    async findUniqueOrThrow(${id?.name}: ${id?.type.request}) {
        const resource = await this.${camelCase}Repository.findUnique({ where: { ${id?.name} } });
        if (!resource) throw new ResourceNotFoundException("${schema.description}");
        return resource;
    }

    /** 전체 조회 */
    async findMany() {
        return this.${camelCase}Repository.findMany();
    }

    /** 목록 조회 */
    async findList(data: I${pascalCase}FindList) {
        const options = getPaginationOption(data, Prisma.ModelName.${pascalCaseToManagementIgnore});
        const [resources, totalCount] = await this.prisma.$transaction([this.${camelCase}Repository.findMany(options), this.${camelCase}Repository.count({ where: options.where })]);
        return { resources, meta: getMetadata(data, totalCount) };
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
