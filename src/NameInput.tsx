import React from "react";
import { InputGroup, MaybeElement } from "@blueprintjs/core";

import { ConfirmButton } from "./ConfirmButton";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";

interface MenuNameInputProps {
    newNameSubmitted: (newName: string | undefined) => void;
    placeholder?: string;
    icon?: BlueprintIcons_16Id | MaybeElement;
}

export function NameInput(props: MenuNameInputProps): JSX.Element {
    const [newName, setNewName] = React.useState("");

    React.useEffect(() => {
        setInputFocus();
    });

    const inputRef: React.MutableRefObject<HTMLInputElement | null> = React.useRef(null);

    const setInputFocus = () => {
        if (inputRef !== null &&
            inputRef.current !== null) {
            inputRef.current.focus();
        }
    }

    const onKeyDown: React.KeyboardEventHandler = (e: React.KeyboardEvent) => {
        console.log(e.key);
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
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewName(event.target.value)}
            placeholder={props.placeholder}
            leftIcon={props.icon}
            // onBlur={() => props.newNameSubmitted(newName)}
            onKeyDown={onKeyDown}
            rightElement={
                <ConfirmButton
                    onConfirm={() => props.newNameSubmitted(newName)}
                    onReject={() => props.newNameSubmitted(undefined)}
                />}
        />);
}