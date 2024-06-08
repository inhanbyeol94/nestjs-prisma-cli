export interface ICommand {
    action: string | null;
    args?: string[];
    options?: string[];
    layer?: string | null;
    name?: string | null;
}
