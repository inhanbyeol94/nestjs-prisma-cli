#!/usr/bin/env node

import { ICommand } from "./generate/interfaces/command.interface";
import { GenerateFactory } from "./generate/generate.factory";
import chalk from "chalk";
import { SchemaFactory } from "./schema/schema.factory";
import { ModelFactory } from "./model/model.factory";

/** TEST */
process.argv[2] = "generate";
process.argv[3] = "model";
// process.argv[4] = "--force";

export const command: ICommand = {
    action: process.argv[2],
    args: process.argv.slice(3),
};

/** 시작 로그 */
console.log(chalk.white("NPC Initializing..."));

switch (command.action) {
    case "generate" || "g":
        /** 시작 로그 */
        console.log(chalk.white("Generate Initializing..."));

        /** 메모리 영역 */
        const schemaFactory = new SchemaFactory();
        const modelFactory = new ModelFactory(schemaFactory);

        /** 최종 인스턴스 */
        new GenerateFactory(schemaFactory, modelFactory);
        break;
    default:
        console.log("Unknown command");
        break;
}
