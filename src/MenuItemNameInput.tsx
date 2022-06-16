import React from "react";
import { MaybeElement, MenuItem } from "@blueprintjs/core";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";

import { NameInput } from "./NameInput";

interface MenuItemNameInputProps {
    text: string;
    placeholder?: string;
    icon?: BlueprintIcons_16Id | MaybeElement;
    newNameSubmitted: (newName: string) => void;
}

export function MenuItemNameInput(props: MenuItemNameInputProps) {
    const [renaming, setRenaming] = React.useState(false);

    const newNameSubmitted = (newName: string | undefined) => {
        if (newName !== undefined) {
            props.newNameSubmitted(newName);
        }
        setRenaming(false);
    }

    return (
        (renaming) ?
            <NameInput
                placeholder={props.placeholder}
                icon={props.icon}
                newNameSubmitted={newNameSubmitted}
            />
            :
            <MenuItem
                text={props.text}
                icon={props.icon}
                shouldDismissPopover={false}
                onClick={() => setRenaming(true)}
            />
    );
}