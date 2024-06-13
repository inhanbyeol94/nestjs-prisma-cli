#!/usr/bin/env node

import { ICommand } from "./generate/_interfaces/command.interface";
import { GenerateFactory } from "./generate/generate.factory";
import chalk from "chalk";
import { SchemaFactory } from "./schema/schema.factory";
import { ModelFactory } from "./generate/model/model.factory";
import { RepositoryFactory } from "./generate/repository/repository.factory";
import { InfoFactory } from "./generate/info/info.factory";
import { ServiceFactory } from "./generate/service/service.factory";
import { ControllerFactory } from "./generate/controller/controller.factory";
import { ModuleFactory } from "./generate/module/module.factory";
import * as module from "node:module";
import { InterfacesFactory } from "./generate/interfaces/interfaces.factory";
import { RequestDtoFactory } from "./generate/request-dto/request-dto.factory";
import { ResponseDtoFactory } from "./generate/response-dto/response-dto.factory";

/** 테스트 */
// process.argv[2] = "g";
// process.argv[3] = "responseDTO";
// process.argv[4] = "user";

/** 명령어 */
export const command: ICommand = {
    action: process.argv[2],
    args: process.argv.slice(3),
};

/** 시작 로그 */
console.log(chalk.white("NPC Initializing..."));

switch (command.action) {
    case "generate":
    case "g":
        /** 시작 로그 */
        console.log(chalk.white("Generate Initializing..."));

        /** 메모리 영역 - Sub */
        const schemaFactory = new SchemaFactory();

        /** 메모리 영역 - Generate */
        const modelFactory = new ModelFactory(schemaFactory);
        const repositoryFactory = new RepositoryFactory(schemaFactory);
        const serviceFactory = new ServiceFactory(schemaFactory);
        const controllerFactory = new ControllerFactory(schemaFactory);
        const moduleFactory = new ModuleFactory();
        const infoFactory = new InfoFactory(schemaFactory);
        const interfacesFactory = new InterfacesFactory();
        const requestDTOFactory = new RequestDtoFactory(schemaFactory);
        const responseDTOFactory = new ResponseDtoFactory(schemaFactory);

        /** 최종 인스턴스 */
        new GenerateFactory(
            modelFactory,
            repositoryFactory,
            serviceFactory,
            controllerFactory,
            moduleFactory,
            infoFactory,
            interfacesFactory,
            requestDTOFactory,
            responseDTOFactory,
        );
        break;
    default:
        console.log("Unknown command");
        break;
}
