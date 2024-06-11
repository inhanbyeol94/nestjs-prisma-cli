import { SchemaFactory } from "../../schema/schema.factory";
import { ICommand } from "../interfaces/command.interface";
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
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${command.name}/`;

        /** 경로 검증 */
        if (!fs.existsSync(path)) fs.mkdirSync(path);

        /** 파일 생성 */
        fs.writeFileSync(`${path}${camelToKebabCase(command.name)}.repository.ts`, this.template(command.name, schema));

        /** 레포지토리 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Repository`)} Completed.`));
    }

    private template(name: string, schema: ISchemaExport): string {
        /** 변수 영역 */
        const { className, variableName, typeName, prismaTypeName, prismaVariableName, prismaModelName } = this.convertName(name);
        const id = schema.fields.find(field => field.isId);

        return `import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@common/prisma/prisma.service";
import { getPaginationOption } from "@function/pagination.function";
import { getMetadata } from "@function/metadata.function";
import { ResourceNotFoundException } from "@exception/not-found.exception";

@Injectable()
export class ${className}Repository {
    private ${variableName}Repository = this.prisma.extendedClient.${prismaVariableName};

    constructor(private prisma: PrismaService) {}

    /** 생성 */
    async create(data: Prisma.${prismaTypeName}CreateInput | Prisma.${prismaTypeName}UncheckedCreateInput) {
        return this.${variableName}Repository.create({ data });
    }

    /** 수정 */
    async update(${id?.name}: ${id?.type.request}, data: Prisma.${prismaTypeName}UpdateInput | Prisma.${prismaTypeName}UncheckedUpdateInput) {
        await this.findUniqueOrThrow(${id?.name});
        return this.${variableName}Repository.update({ where: { ${id?.name} }, data });
    }

${
    schema.isDeletedAt
        ? `    /** 삭제 및 유효성 검증 */
    async softDelete(${id?.name}: ${id?.type.request}) {
        await this.findUniqueOrThrow(${id?.name});
        return this.${variableName}Repository.softDelete({ ${id?.name} });
    }`
        : `    /** 영구 삭제 및 유효성 검증 */
    async delete(${id?.name}: ${id?.type.request}) {
        await this.findUniqueOrThrow(${id?.name});
        return this.${variableName}Repository.delete({ where: { ${id?.name} } });
    }`
}

    /** 단일 조회 및 유효성 검증 */
    async findUniqueOrThrow(${id?.name}: ${id?.type.request}) {
        const resource = await this.${variableName}Repository.findUnique({ where: { ${id?.name} } });
        if (!resource) throw new ResourceNotFoundException("${schema.description}");
        return resource;
    }

    /** 전체 조회 */
    async findMany() {
        return this.${variableName}Repository.findMany();
    }

    /** 목록 조회 */
    async findList(data: I${typeName}FindList) {
        const options = getPaginationOption(data, Prisma.ModelName.${prismaModelName});
        const [resources, totalCount] = await this.prisma.$transaction([this.${variableName}Repository.findMany(options), this.${variableName}Repository.count({ where: options.where })]);
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
            className: camelToPascalCase(name),
            variableName: name,
            fileName: camelToKebabCase(name),
            typeName: camelToPascalCase(name),
            prismaTypeName: camelToPascalCase(name).replace("Management", ""),
            prismaModelName: camelToPascalCase(name).replace("Management", ""),
            prismaVariableName: name.replace("Management", ""),
        };
    }
}
