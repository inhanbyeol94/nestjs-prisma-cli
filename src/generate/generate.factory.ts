import { ICommand } from "./interfaces/command.interface";
import chalk from "chalk";
import * as fs from "node:fs";
import { endLog } from "../_global/functions/end-log.function";
import { SchemaFactory } from "../schema/schema.factory";
import { command as mainCommand } from "../main";
import { ModelFactory } from "../model/model.factory";

export class GenerateFactory {
    private readonly layer: string[] = ["model"];

    private processing(command: ICommand) {
        const ignoreOptions = command.args?.filter(arg => !arg.startsWith("--"));
        command.options = command.args?.filter(arg => arg.startsWith("--"));
        command.layer = ignoreOptions ? ignoreOptions[0] : null;
        command.name = ignoreOptions ? ignoreOptions[1] : null;
        return command;
    }

    constructor(
        private schemaFactory: SchemaFactory,
        private modelFactory: ModelFactory,
    ) {
        const command = this.processing(mainCommand);

        if (!command.layer) {
            //실행할 레이어를 입력하지 않았습니다.
            console.error(`${chalk.red("You have not specified the layer to execute.")}`);
            endLog();
            return;
        }

        if (!this.layer.includes(command.layer)) {
            //지원하지 않는 레이어입니다.
            console.error(chalk.red("The layer is not supported."));
            endLog();
            return;
        }

        switch (command.layer) {
            case "model":
                this.modelFactory.responseCreate();
                break;
            default:
                break;
        }
    }
}
