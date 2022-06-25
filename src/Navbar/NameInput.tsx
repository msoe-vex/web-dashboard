import React from "react";
import { InputGroup } from "@blueprintjs/core";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";
import { EntityId } from "@reduxjs/toolkit";

interface NameInputProps {
    id: EntityId;
    newNameSubmitted: (newName: string | undefined) => void;
    initialName?: string;
    placeholder?: string;
    icon?: BlueprintIcons_16Id;
}

/**
 * Defines an InputGroup component that gains focus when first mounted.
 * @param props.newNameSubmitted A callback function which is fired when the name is submitted.
 */
export function NameInput(props: NameInputProps): JSX.Element {
    const [newName, setNewName] = React.useState(props.initialName ?? "");

    React.useEffect(() => { setInputFocus(); });
    const inputRef: React.MutableRefObject<HTMLInputElement | null> = React.useRef(null);

    const setInputFocus = () => {
        if (inputRef !== null &&
            inputRef.current !== null) {
            inputRef.current.focus();
        }
    }

    const onKeyDown: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            props.newNameSubmitted(newName);
        }
        else if (e.key === "Escape") {
            props.newNameSubmitted(undefined);
        }
    }

    return (
        <InputGroup
            inputRef={inputRef}
            value={newName}
            key={props.id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            placeholder={props.placeholder}
            leftIcon={props.icon}
            onBlur={() => props.newNameSubmitted(newName)}
            onKeyDown={onKeyDown}
        />);
}