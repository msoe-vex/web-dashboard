import React from 'react';
import { Intent, MenuItem } from '@blueprintjs/core';
import { EntityId } from '@reduxjs/toolkit';

import { MenuItemNameInput } from './MenuItemNameInput';

interface ItemEditMenuProps {
    id: EntityId;
    copied: (id: EntityId) => void;
    renamed: (val: { newName: string, id: EntityId }) => void;
    deleted: (id: EntityId) => void;
}

/**
 * Returns a sub-menu which can be used to edit an element (copy, rename, and delete).
 */
export function ItemEditMenu(props: ItemEditMenuProps): JSX.Element {
    return (
        <> { /*React fragment syntax, to prevent issues with unnested MenuItem components*/}
            <MenuItem
                text="Copy"
                icon="duplicate"
                onClick={() => props.copied(props.id)}
                shouldDismissPopover={false}
            />

            <MenuItemNameInput
                placeholder="New name"
                icon="edit"
                text="Rename"
                newNameSubmitted={(newName: string) => props.renamed({ newName: newName, id: props.id })}
            />

            <MenuItem
                intent={Intent.DANGER}
                text="Delete"
                icon="trash"
                onClick={() => props.deleted(props.id)}
                shouldDismissPopover={false}
            />
        </>
    );
}