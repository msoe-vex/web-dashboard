import { Command } from "./Command"

/**
 * Defines a stack of commands which are stored for undoing and redoing operations.
 */
export class History {
    private commands: Command[] = [];
    private undoneCommands: Command[] = [];

    push(command: Command): void {
        this.commands.push(command);
        this.undoneCommands = [];
    }

    clear(): void {
        this.commands = [];
        this.undoneCommands = [];
    }

    undo(): boolean {
        let status: boolean = this.commands[-1].undo();
        let undoneCommand: Command | undefined = this.commands.pop();
        if (undoneCommand !== undefined) {
            this.undoneCommands.push(undoneCommand);
        }
        return status;
    }

    redo(): boolean {
        // execute and then pop undoneCommands
        let command: Command | undefined = this.undoneCommands.pop();
        if (command !== undefined) {
            command.execute();
            this.commands.push(command);
            return true;
        }
        return false;
    }
}