import { SchemaFactory } from "../../schema/schema.factory";
import chalk from "chalk";
import fs from "node:fs";
import { pascalToCamelCase } from "../../_global/functions/pascal-to-camel-case.function";
import { pascalToKebabCase } from "../../_global/functions/pascal-to-kebab-case.function";

export class InfoFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create() {
        /** 시작 로그 */
        console.log(chalk.white("Info Initializing..."));

        /** 모델 유효성 검증 */
        const existsInfo = fs.existsSync(`${process.cwd()}/prisma/schema/models/info`);
        if (!existsInfo) return console.error(chalk.red("The info model does not exist."));

        /** 경로 유효성 검증 */
        const existsInfoPath = fs.existsSync(`${process.cwd()}/src/info`);
        if (!existsInfoPath) return console.error(chalk.red("The info module path does not exist."));

        const infoFiles = fs.readdirSync(`${process.cwd()}/prisma/schema/models/info`);
        if (infoFiles.length === 0) return console.error(chalk.red("The info model does not exist."));

        const repository = this.repositoryCreateTemplate(infoFiles);
        fs.writeFileSync(`${process.cwd()}/src/info/info.repository.ts`, repository);

        const service = this.serviceCreateTemplate(infoFiles);
        fs.writeFileSync(`${process.cwd()}/src/info/info.service.ts`, service);

        const controller = this.controllerCreateTemplate(infoFiles);
        fs.writeFileSync(`${process.cwd()}/src/info/info.controller.ts`, controller);

        this.requestDTOCreateTemplate(infoFiles).forEach(({ template, fileName }) => fs.writeFileSync(`${process.cwd()}/src/info/dto/${fileName}`, template));
        this.responseDTOCreateTemplate(infoFiles).forEach(({ template, fileName }) => fs.writeFileSync(`${process.cwd()}/src/info/dto/response/${fileName}`, template));

        console.log(chalk.green(`Generate ${chalk.bold(`Info Module`)} Completed.`));
    }

    private repositoryCreateTemplate(schemaFiles: string[]) {
        const methodArray: string[] = [];
        const variableArray: string[] = [];

        schemaFiles.forEach(schemaFile => {
            /** 스키마 불러오기 */
            const schema = this.schemaFactory.export(schemaFile);

            /** 모델명 */
            const modelName = schema.name.replace("Info", "");

            const _includes = schema.joins
                .filter(j => !j.isArray)
                .map(m => ({ [m.name]: true }))
                .filter(Boolean);
            const includes = _includes.length > 0 ? `include: { ${_includes.map(i => Object.keys(i)[0]).join(", ")}: true }` : "";

            const _parameters = schema.joins
                .map(join => (join.relationId ? `${join.relationId}?: ${schema.fields.find(f => f.name === join.relationId)?.type.request}` : ""))
                .filter(Boolean)
                .join();
            const where = schema.joins
                .map(join => (join.relationId ? join.relationId : ""))
                .filter(Boolean)
                .map(m => `...(${m} ? { where: { ${m} } } : { where: {} })`)
                .join();

            const args = where && includes ? `{ ${where}, ${includes} }` : where ? `{ ${where} }` : includes ? `{ ${includes} }` : "";

            methodArray.push(`/** ${schema.description} */
async ${pascalToCamelCase(modelName)}FindMany(${_parameters}) {
    return this.${pascalToCamelCase(modelName)}Repository.findMany(${args});
}
`);
            variableArray.push(`private ${pascalToCamelCase(modelName)}Repository = this.prisma.extendedClient.${pascalToCamelCase(schema.name)};`);
        });

        return `import { Injectable } from "@nestjs/common";
import { PrismaService } from "@common/prisma/prisma.service";

@Injectable()
export class InfoRepository {

    ${variableArray.join("\n    ")}

    constructor(private prisma: PrismaService) {}

    ${methodArray
        .map(method =>
            method
                .split("\n")
                .map(line => "    " + line)
                .join("\n"),
        )
        .join("\n")
        .trim()}
}`;
    }
    private serviceCreateTemplate(schemaFiles: string[]) {
        const methodArray: string[] = [];

        schemaFiles.forEach(schemaFile => {
            /** 스키마 불러오기 */
            const schema = this.schemaFactory.export(schemaFile);

            /** 모델명 Info 제외 */
            const modelName = schema.name.replace("Info", "");

            const inputParameter = schema.joins
                .map(join => (join.relationId ? `${join.relationId}?: ${schema.fields.find(f => f.name === join.relationId)?.type.request}` : ""))
                .filter(Boolean)
                .join();

            const outputParameter = schema.joins
                .map(join => (join.relationId ? join.relationId : ""))
                .filter(Boolean)
                .join();

            methodArray.push(`/** ${schema.description} */
async ${pascalToCamelCase(modelName)}FindMany(${inputParameter}) {
    const ${pascalToCamelCase(modelName)} = await this.infoRepository.${pascalToCamelCase(modelName)}FindMany(${outputParameter});
    return getResponseData("${schema.description} 리소스 정상 반환", ${pascalToCamelCase(modelName)});
}
`);
        });

        return `import { Injectable } from "@nestjs/common";
import { InfoRepository } from "./info.repository";
import { getResponseData } from "@function/response.function";

@Injectable()
export class InfoService {

    constructor(private infoRepository: InfoRepository) {}
    
    ${methodArray
        .map(method =>
            method
                .split("\n")
                .map(line => "    " + line)
                .join("\n"),
        )
        .join("\n")
        .trim()}
}`;
    }

    private controllerCreateTemplate(schemaFiles: string[]) {
        const methodArray: string[] = [];
        const importArray: string[] = [];

        schemaFiles.forEach(schemaFile => {
            /** 스키마 불러오기 */
            const schema = this.schemaFactory.export(schemaFile);

            const modelName = pascalToCamelCase(schema.name.replace("Info", ""));
            const path = `/${pascalToKebabCase(schema.name.replace("Info", ""))}`;
            const isParam = schema.joins.filter(f => f.type.prisma.includes("Info")).filter(t => !t.isArray).length > 0;

            /** Request Dto Import */
            importArray.push(`import { ${schema.name}FindManyDto } from "./dto/${schemaFile.replace(".prisma", "-find-many.dto")}";`);

            /** Response Dto Import */
            importArray.push(`import { ${schema.name}FindManyResponseDto } from "./dto/response/${schemaFile.replace(".prisma", "-find-many.dto")}";`);

            methodArray.push(`    @Get("${path}")
    @ApiInformation("${schema.description} 조회", false)
    async ${modelName}FindMany(${
        isParam
            ? schema.joins
                  .filter(f => f.type.prisma.includes("Info"))
                  .filter(x => !x.isArray)
                  .map(m => `@Query() query: ${schema.name}FindManyDto`)
            : ""
    }): Promise<${schema.name}FindManyResponseDto> {
        return await this.infoService.${modelName}FindMany(${
            isParam
                ? schema.joins
                      .filter(f => f.type.prisma.includes("Info"))
                      .filter(x => !x.isArray)
                      .map(m => `query.${m.relationId}`)
                : ""
        });
    }
    `);
        });

        return `import { Get, Query } from "@nestjs/common";
import { InfoService } from "./info.service";
import { ApiController, ApiInformation } from "@decorator/controller.decorator";
${importArray.join("\n").trim()}

@ApiController("info")
export class InfoController {
    constructor(private infoService: InfoService) {}

    ${methodArray.join("\n").trim()}
}
`;
    }

    private requestDTOCreateTemplate(schemaFiles: string[]) {
        return schemaFiles.map(schemaFile => {
            const schema = this.schemaFactory.export(schemaFile);

            return {
                template: `import { IsOptional, IsString, IsInt } from "@inhanbyeol/class-validator";

export class ${schema.name}FindManyDto {${schema.joins
                    .map(join =>
                        join.relationId
                            ? `\n    /** ${schema.fields.find(f => f.name === join.relationId)?.description}*/\n    @IsOptional()\n    @Is${schema.fields.find(f => f.name === join.relationId)?.type.prisma}()\n    ${join.relationId}?: ${schema.fields.find(f => f.name === join.relationId)?.type.request};\n`
                            : "",
                    )
                    .join("")}}`,
                fileName: schemaFile.replace(".prisma", "-find-many.dto.ts"),
            };
        });
    }

    private responseDTOCreateTemplate(schemaFiles: string[]) {
        return schemaFiles.map(schemaFile => {
            const schema = this.schemaFactory.export(schemaFile);

            return {
                template: `import { ResponseDto } from "@dto/response.dto";
import { OmitType } from "@nestjs/swagger";
import { ResponseService } from "@type/response-service";
import { InfoService } from "../../info.service";
import { ${schema.name}Model } from "@model/${pascalToKebabCase(schema.name)}.model";
${schema.joins.filter(x => x.type.prisma.includes("Info")).length > 0 ? schema.joins.filter(x => x.type.prisma.includes("Info")).map(m => `import { ${m.type.prisma}Model } from "@model/${pascalToKebabCase(m.type.prisma)}.model";`) : ""}

/** Response Dto */
export class ${schema.name}FindManyResponseDto extends ResponseDto implements ResponseService<InfoService["${pascalToCamelCase(schema.name.replace("Info", ""))}FindMany"]> {
    data: ${schema.name}FindManyModel[];
}

/** Main Model */
class ${schema.name}FindManyModel extends OmitType(${schema.name}Model, []) ${
                    schema.joins.filter(x => x.type.prisma.includes("Info")).filter(t => !t.isArray).length > 0
                        ? `{
${schema.joins
    .filter(f => f.type.prisma.includes("Info"))
    .filter(t => !t.isArray)
    .map(
        m => `    /** ${m.description} */
    ${m.name}: ${schema.name}FindManyWith${m.type.prisma}Model${m.isArray ? "[]" : ""};`,
    )}
}`
                        : "{}"
                }${
                    schema.joins.filter(x => x.type.prisma.includes("Info")).length > 0
                        ? `

/** Include Model */
${schema.joins.filter(x => x.type.prisma.includes("Info")).map(m => `class ${schema.name}FindManyWith${m.type.prisma}Model extends OmitType(${m.type.prisma}Model, []) {}`)}
`
                        : ""
                }`,
                fileName: schemaFile.replace(".prisma", "-find-many.dto.ts"),
            };
        });
    }
}
