import { ICommand } from "../_interfaces/command.interface";
import chalk from "chalk";
import { camelToKebabCase } from "../../_global/functions/camel-to-kebab-case.function";
import fs from "node:fs";
import { camelToPascalCase } from "../../_global/functions/camel-to-pascal-case.function";
import { pascalToKebabCase } from "../../_global/functions/pascal-to-kebab-case.function";

export class InterfacesFactory {
    constructor() {}

    create(command: ICommand) {
        /** 시작 로그 */
        console.log(chalk.white("Interfaces Initializing..."));

        /** 검증 */
        if (!command.name) return console.error(chalk.red("Please enter the name of the module."));
        if (!command.schemaFileName) return console.error(chalk.red("Please enter your model."));

        /** 메인 경로 추적 */
        const path = this.findDir(command.name, `${process.cwd()}/src`) || `${process.cwd()}/src/${camelToKebabCase(command.name)}/`;

        /** 메인 경로 검증 */
        if (!fs.existsSync(path)) return console.error(chalk.red(`The ${command.name} path does not exist.`));
        if (!fs.existsSync(`${path}interfaces`)) fs.mkdirSync(`${path}interfaces`);

        /** 파일 검증 */
        if (fs.readdirSync(`${path}interfaces`).length !== 0) fs.readdirSync(`${path}interfaces`).map(file => fs.rmSync(`${path}interfaces/${file}`));

        /** 파일 생성 */
        this.template(command.name).forEach(t => fs.writeFileSync(`${path}interfaces/${t.fileName}`, t.template));

        /** 인터페이스 그룹 생성 종료 */
        console.log(chalk.green(`Generate ${chalk.bold(`${camelToPascalCase(command.name)} Interfaces`)} Completed.`));
    }

    private template(name: string) {
        const { pascalCase, kebabCase } = this.convertName(name);

        const actions = ["create", "update", "findList", "findUnique", "delete"];

        return actions.map(i => ({
            fileName: `${kebabCase}-${camelToKebabCase(i)}.interface.ts`,
            template: `import { ${pascalCase}${camelToPascalCase(i)}Dto } from "../dto/${kebabCase}-${camelToKebabCase(i)}.dto";

export interface I${pascalCase}${camelToPascalCase(i)} extends ${pascalCase}${camelToPascalCase(i)}Dto {}
`,
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
}
