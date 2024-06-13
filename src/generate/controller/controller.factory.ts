import { SchemaFactory } from "../../schema/schema.factory";
import chalk from "chalk";
import { ICommand } from "../_interfaces/command.interface";
import { ISchemaExport } from "../../schema/interfaces/schema-export.interface";
import fs from "node:fs";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";

export class ControllerFactory {
    constructor(private schemaFactory: SchemaFactory) {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Controller Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the controller."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 스키마 추출 */
        const schema: ISchemaExport = this.schemaFactory.export(command.schemaFileName);

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 경로 검증 */
        if (!fs.existsSync(path)) fs.mkdirSync(path);

        /** 파일 검증 */
        if (fs.existsSync(`${path}${camelToKebabCase(command.name)}.controller.ts`)) fs.rmSync(`${path}${camelToKebabCase(command.name)}.controller.ts`);

        /** 파일 생성 */
        fs.writeFileSync(`${path}${camelToKebabCase(command.name)}.controller.ts`, this.template(command.name, schema));

        /** 컨트롤러 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Controller`)} Completed.`));
    }

    private template(name: string, schema: ISchemaExport): string {
        /** 변수 영역 */
        const { camelCase, camelCaseToManagementIgnore, pascalCaseToManagementIgnore, pascalCase, kebabCase } = this.convertName(name);
        const id = schema.fields.find(field => field.isId);

        return `import { ApiController, ApiInformation } from "@decorator/controller.decorator";
import { Body, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ${pascalCase}Service } from "./${kebabCase}.service";
import { ${pascalCase}CreateDto } from "./dto/${kebabCase}-create.dto";
import { ${pascalCase}CreateResponseDto } from "./dto/response/${kebabCase}-create.dto";
import { ${pascalCase}UpdateDto } from "./dto/${kebabCase}-update.dto";
import { ${pascalCase}UpdateResponseDto } from "./dto/response/${kebabCase}-update.dto";
import { ${pascalCase}DeleteDto } from "./dto/${kebabCase}-delete.dto";
import { ${pascalCase}DeleteResponseDto } from "./dto/response/${kebabCase}-delete.dto";
import { ${pascalCase}FindUniqueDto } from "./dto/${kebabCase}-find-unique.dto";
import { ${pascalCase}FindUniqueResponseDto } from "./dto/response/${kebabCase}-find-unique.dto";
import { ${pascalCase}FindListDto } from "./dto/${kebabCase}-find-list.dto";
import { ${pascalCase}FindListResponseDto } from "./dto/response/${kebabCase}-find-list.dto";
import { Account } from "@decorator/account.decorator";
import { IPayload } from "@common/jwt/interfaces/payload.interface";
import { UseRoleGuard } from "@decorator/guard.decorator";

@ApiController("${this.apiPathConvert(kebabCase)}")
export class ${pascalCase}Controller {
    constructor(private ${camelCase}Service: ${pascalCase}Service) {}

    @Post()
    @UseRoleGuard()
    @ApiInformation("${schema.description} 생성", true)
    async create(@Account() account: IPayload, @Body() body: ${pascalCase}CreateDto): Promise<${pascalCase}CreateResponseDto> {
        return await this.${camelCase}Service.create(body);
    }

    @Put()
    @UseRoleGuard()
    @ApiInformation("${schema.description} 수정", true)
    async update(@Account() account: IPayload, @Body() body: ${pascalCase}UpdateDto): Promise<${pascalCase}UpdateResponseDto> {
        return await this.${camelCase}Service.update(body);
    }

${
    schema.isDeletedAt
        ? `    @Delete(":${id?.name}")
    @UseRoleGuard()
    @ApiInformation("${schema.description} 삭제", true)
    async delete(@Account() account: IPayload, @Param() param: ${pascalCase}DeleteDto): Promise<${pascalCase}DeleteResponseDto> {
        return await this.${camelCase}Service.delete(param);
    }`
        : `    @Delete(":${id?.name}")
    @UseRoleGuard()
    @ApiInformation("${schema.description} 영구 삭제", true)
    async delete(@Account() account: IPayload, @Param() param: ${pascalCase}DeleteDto): Promise<${pascalCase}DeleteResponseDto> {
        return await this.${camelCase}Service.delete(param);
    }`
}

    @Get("${id?.name}")
    @UseRoleGuard()
    @ApiInformation("${schema.description} 단일 조회", true)
    async findUnique(@Account() account: IPayload, @Param() param: ${pascalCase}FindUniqueDto): Promise<${pascalCase}FindUniqueResponseDto> {
        return await this.${camelCase}Service.findUnique(param);
    }

    @Get()
    @UseRoleGuard()
    @ApiInformation("${schema.description} 목록 조회", true)
    async findMany(@Account() account: IPayload, @Query() query: ${pascalCase}FindListDto): Promise<${pascalCase}FindListResponseDto> {
        return await this.${camelCase}Service.findList(query);
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

    private apiPathConvert(kebabCase: string) {
        if (kebabCase.includes("management")) {
            return `/management/${this.pluralize(kebabCase.replace("-management", ""))}`;
        }
    }

    private pluralize(word: string) {
        if (word.endsWith("y") && !"aeiou".includes(word[word.length - 2])) {
            // 단어가 'y'로 끝나고, 'y' 앞에 모음이 아닌 글자가 있는 경우
            return word.slice(0, -1) + "ies";
        } else if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
            // 단어가 's', 'x', 'z', 'ch', 'sh'로 끝나는 경우
            return word + "es";
        } else {
            // 일반적인 경우
            return word + "s";
        }
    }
}
