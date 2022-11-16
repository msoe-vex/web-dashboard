import React from "react";
import { IconName, InputGroup } from "@blueprintjs/core";
import { ItemType, renamingCancelled } from "../Tree/tempUiSlice";
import { EntityId } from "@reduxjs/toolkit";
import { itemRenamed, selectItemById } from "../Tree/treeActions";
import { useAppDispatch, useAppSelector } from "../Store/hooks";

interface NameInputProps {
    id: EntityId;
    itemType: ItemType;
    icon?: IconName;
}

/**
 * Defines an InputGroup component which can be used with to implement in line renaming.
 */
export function NameInput(props: NameInputProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const item = useAppSelector(state => selectItemById(state, props.id, props.itemType));
    const [newName, setNewName] = React.useState(item?.name);

    React.useEffect(() => { setInputFocus(); });
    const inputRef: React.MutableRefObject<HTMLInputElement | null> = React.useRef(null);
    const setInputFocus = () => {
        if (inputRef !== null &&
            inputRef.current !== null) {
            inputRef.current.focus();
        }
    }

    const handleKeyDown: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { dispatch(itemRenamed(props.id, props.itemType, newName ?? "")); }
        else if (e.key === "Escape") { dispatch(renamingCancelled()); }
    }

    return !item ? null : (
        <InputGroup
            inputRef={inputRef}
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewName(e.target.value); }}
            leftIcon={props.icon}
            onBlur={() => { dispatch(itemRenamed(props.id, props.itemType, newName ?? "")); }}
            onKeyDown={handleKeyDown}
        />);
}