import { ICommand } from "./_interfaces/command.interface";
import chalk from "chalk";
import * as fs from "node:fs";
import { endLog } from "../_global/functions/end-log.function";
import { SchemaFactory } from "../schema/schema.factory";
import { command as mainCommand } from "../main";
import { ModelFactory } from "./model/model.factory";
import { RepositoryFactory } from "./repository/repository.factory";
import { InfoFactory } from "./info/info.factory";
import { ServiceFactory } from "./service/service.factory";
import { ControllerFactory } from "./controller/controller.factory";
import { ModuleFactory } from "./module/module.factory";
import { InterfacesFactory } from "./interfaces/interfaces.factory";
import { RequestDtoFactory } from "./request-dto/request-dto.factory";
import { ResponseDtoFactory } from "./response-dto/response-dto.factory";

export class GenerateFactory {
    private readonly layer: string[] = [
        "model",
        "repository",
        "repo",
        "service",
        "s",
        "controller",
        "co",
        "module",
        "mo",
        "info",
        "interfaces",
        "requestDTO",
        "responseDTO",
        "package",
        "p",
    ];

    private processing(command: ICommand) {
        const ignoreOptions = command.args?.filter(arg => !arg.startsWith("--"));
        command.options = command.args?.filter(arg => arg.startsWith("--"));
        command.layer = ignoreOptions ? ignoreOptions[0] : null;
        command.name = ignoreOptions ? ignoreOptions[1] : null;
        command.name ? (command.schemaFileName = `${command.name}.prisma`) : null;
        return command;
    }

    constructor(
        private modelFactory: ModelFactory,
        private repositoryFactory: RepositoryFactory,
        private serviceFactory: ServiceFactory,
        private controllerFactory: ControllerFactory,
        private moduleFactory: ModuleFactory,
        private infoFactory: InfoFactory,
        private interfacesFactory: InterfacesFactory,
        private requestDTOFactory: RequestDtoFactory,
        private responseDTOFactory: ResponseDtoFactory,
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

        this.switch(command);
    }

    switch(command: ICommand) {
        switch (command.layer) {
            case "model":
                this.modelFactory.responseCreate();
                break;
            case "repository":
            case "repo":
                this.repositoryFactory.create(command);
                break;
            case "service":
            case "s":
                this.serviceFactory.create(command);
                break;
            case "controller":
            case "co":
                this.controllerFactory.create(command);
                break;
            case "module":
            case "mo":
                this.moduleFactory.create(command);
                break;
            case "info":
                this.infoFactory.create();
                break;
            case "interfaces":
                this.interfacesFactory.create(command);
                break;
            case "requestDTO":
                this.requestDTOFactory.create(command);
                break;
            case "responseDTO":
                this.responseDTOFactory.create(command);
                break;
            case "package":
            case "p":
                this.moduleFactory.create(command);
                this.controllerFactory.create(command);
                this.serviceFactory.create(command);
                this.repositoryFactory.create(command);
                this.interfacesFactory.create(command);
                this.requestDTOFactory.create(command);
                this.responseDTOFactory.create(command);
                break;
            default:
                break;
        }
    }
}
