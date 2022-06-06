import * as React from 'react';
import { Button, InputGroup } from '@blueprintjs/core';

export interface NameInputProps {
    name: string,
    updateName: (newName: string) => void;
}

interface NameInputState {
    name: string;
    editName: boolean;
}

export class NameInput extends React.Component<NameInputProps, NameInputState> {
    private inputRef: HTMLInputElement | null = null;

    private constructor(props: NameInputProps) {
        super(props);
        this.state = { name: this.props.name, editName: false };
    }

    private onEditButtonClick: React.MouseEventHandler = () =>
        // setState callback is used so focus is only set after inputField is enabled
        this.setState({ editName: true }, () => {
            if (this.inputRef != null) {
                this.inputRef.focus();
            }
        });

    private submitName = (): void => {
        this.setState({ editName: false });
        if (this.inputRef != null && this.inputRef.value != this.props.name) {
            this.props.updateName(this.inputRef.value);
        }
    }

    private onKeyPress: React.KeyboardEventHandler = (e: React.KeyboardEvent): void => {
        if (e.key == 'Enter') { this.submitName(); }
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