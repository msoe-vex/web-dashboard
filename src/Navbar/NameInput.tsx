import React from "react";
import { IconName, InputGroup } from "@blueprintjs/core";

interface NameInputProps {
    newNameSubmitted: (newName: string | undefined) => void;
    initialName: string;
    icon?: IconName;
}

/**
 * Defines an InputGroup component which can be used with a MenuItem to implement in line renaming.
 * Automatically gains focus when first mounted and fires a callback when editing is finished.
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

    const handleKeyDown: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            leftIcon={props.icon}
            onBlur={() => props.newNameSubmitted(newName)}
            onKeyDown={handleKeyDown}
        />);
}