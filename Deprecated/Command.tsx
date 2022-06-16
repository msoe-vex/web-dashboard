/**
 * An interface defining a simple Command which can be used to manipulate elements in the Application.
 */
export interface Command {
    undo(): boolean;
    execute(): boolean;
}