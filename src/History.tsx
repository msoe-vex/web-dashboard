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
        // undo and then pop commands
        // add command to undoneCommands
        return status;
    }

    redo(): boolean {
        // execute and then pop undoneCommands
        return false;
    }
}