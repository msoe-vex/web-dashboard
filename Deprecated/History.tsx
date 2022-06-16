import { Command } from "./Command"

/**
 * Defines a stack of commands which are stored for undoing and redoing operations.
 */
export class History {
    private _commands: Command[] = [];
    private _undoneCommands: Command[] = [];

    push(command: Command): void {
        this._commands.push(command);
        this._undoneCommands = [];
    }

    clear(): void {
        this._commands = [];
        this._undoneCommands = [];
    }

    undo(): boolean {
        let status: boolean = this._commands[-1].undo();
        let undoneCommand: Command | undefined = this._commands.pop();
        if (undoneCommand !== undefined) {
            this._undoneCommands.push(undoneCommand);
        }
        return status;
    }

    redo(): boolean {
        // execute and then pop undoneCommands
        let command: Command | undefined = this._undoneCommands.pop();
        if (command !== undefined) {
            command.execute();
            this._commands.push(command);
            return true;
        }
        return false;
    }
}