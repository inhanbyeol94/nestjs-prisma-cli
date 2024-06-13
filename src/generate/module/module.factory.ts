import { ICommand } from "../_interfaces/command.interface";
import chalk from "chalk";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import fs from "node:fs";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";

export class ModuleFactory {
    constructor() {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Module Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the module."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 경로 검증 */
        if (!fs.existsSync(path)) fs.mkdirSync(path);

        /** 파일 검증 */
        if (fs.existsSync(`${path}${camelToKebabCase(command.name)}.module.ts`)) fs.rmSync(`${path}${camelToKebabCase(command.name)}.module.ts`);

        /** 파일 생성 */
        fs.writeFileSync(`${path}${camelToKebabCase(command.name)}.module.ts`, this.template(command.name));

        /** 모듈 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Module`)} Completed.`));
    }

    private template(name: string) {
        const { pascalCase, kebabCase } = this.convertName(name);

        return `import { Module } from "@nestjs/common";
import { ${pascalCase}Controller } from "./${kebabCase}.controller";
import { ${pascalCase}Service } from "./${kebabCase}.service";
import { ${pascalCase}Repository } from "./${kebabCase}.repository";

@Module({
    controllers: [${pascalCase}Controller],
    providers: [${pascalCase}Service, ${pascalCase}Repository],
    exports: [${pascalCase}Service, ${pascalCase}Repository],
})
export class ${pascalCase}Module {}
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
