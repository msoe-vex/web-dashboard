import React, { useEffect, useState, useRef } from 'react';
import { Button, InputGroup } from '@blueprintjs/core';

export interface NameInputProps {
    name: string,
    updateName: (newName: string) => void;
}

/**
 * Creates a NameInput field with an edit button that can be used to return a value.
 * The updateName function is only triggered when the name is changed to a new value. 
 */
export function NameInput(props: NameInputProps): JSX.Element {
    const inputRef: any = useRef(null);

    const [editName, setEditName] = useState(false);

    useEffect(() => {
        if (editName && inputRef !== null) {
            inputRef.current.focus();
        }
    }, [editName]);

    const onEditButtonClick: React.MouseEventHandler = () => {
        // setState callback is used so focus is only set after inputField is enabled
        setEditName(true);
    };

    const submitName = (): void => {
        setEditName(false);
        if (inputRef !== null && inputRef.current.value !== props.name) {
            props.updateName(inputRef.current.value);
        }
    }

    const onKeyPress: React.KeyboardEventHandler = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') { submitName(); }
    }

    return (
        <InputGroup
            inputRef={inputRef}
            disabled={!editName}
            defaultValue={props.name}
            rightElement={
                <EditButton
                    show={!editName}
                    onClick={onEditButtonClick}
                />
            }
            onBlur={submitName}
            onKeyPress={onKeyPress}
        />
    );
}

interface EditButtonProps {
    show: boolean | undefined;
    onClick: React.MouseEventHandler;
}

function EditButton(props: EditButtonProps): JSX.Element | null {
    return (props.show === undefined || props.show) ? (
        <Button
            icon="edit"
            minimal={true}
            onClick={props.onClick}
        />
    ) : null;
}

/*
A version of NameInput which does not use React Hooks.

export class NameInput extends React.Component<NameInputProps, NameInputState> {
    private inputRef: HTMLInputElement | null = null;

    private constructor(props: NameInputProps) {
        super(props);
        this.state = { editName: false };
    }

    private onEditButtonClick: React.MouseEventHandler = () =>
        // setState callback is used so focus is only set after inputField is enabled
        this.setState({ editName: true }, () => {
            if (this.inputRef !== null) {
                this.inputRef.focus();
            }
        });

    private submitName = (): void => {
        this.setState({ editName: false });
        if (this.inputRef !== null && this.inputRef.value !== this.props.name) {
            this.props.updateName(this.inputRef.value);
        }
    }

    private onKeyPress: React.KeyboardEventHandler = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') { this.submitName(); }
    }

    render() {
        return (
            <InputGroup
                inputRef={(inputRef: HTMLInputElement | null) => { this.inputRef = inputRef }}
                disabled={!this.state.editName}
                defaultValue={this.props.name}
                rightElement={
                    <EditButton
                        show={!this.state.editName}
                        onClick={this.onEditButtonClick}
                    />
                }
                onBlur={this.submitName}
                onKeyPress={this.onKeyPress}
            />
        );
    }
}

interface EditButtonProps {
    show: boolean | undefined;
    onClick: React.MouseEventHandler;
}

class EditButton extends React.Component<EditButtonProps> {
    render() {
        return (this.props.show === undefined || this.props.show) ? (
            <Button
                icon="edit"
                minimal={true}
                onClick={this.props.onClick}
            />
        ) : (undefined);
    }
}
*/
