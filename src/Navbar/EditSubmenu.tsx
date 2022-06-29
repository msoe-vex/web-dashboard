import React from 'react';
import { Intent, MenuItem } from '@blueprintjs/core';

interface EditSubmenuProps {
    onEditClick?: () => void;
    onRenameClick?: () => void;
    onCopyClick?: () => void;
    onDeleteClick?: () => void;
}

/**
 * Returns a sub-menu which can be used to edit an element (edit, rename, copy, and delete).
 * Options become available only if a valid prop is passed in.
 */
export function EditSubmenu(props: EditSubmenuProps): JSX.Element {
    const { onEditClick, onRenameClick, onCopyClick, onDeleteClick } = props;

    // logical && returns undefined if onEditClick is undefined (short circuit)
    // equivalent to onEditClick === undefined ? undefined : (<MenuItem />);
    const editItem = onEditClick && (
        <MenuItem
            text="Edit"
            key="edit"
            icon="edit"
            onClick={onEditClick}
            shouldDismissPopover={false} // could be true?
        />);

    const renameItem = onRenameClick && (
        <MenuItem
            text="Rename"
            key="rename"
            icon="edit"
            onClick={onRenameClick}
            shouldDismissPopover={false}
        />);

    const copyItem = onCopyClick && (
        <MenuItem
            text="Copy"
            key="copy"
            icon="duplicate"
            onClick={onCopyClick}
            shouldDismissPopover={false}
        />);

    const deleteItem = onDeleteClick && (
        <MenuItem
            intent={Intent.DANGER}
            text="Delete"
            key="delete"
            icon="trash"
            onClick={onDeleteClick}
            shouldDismissPopover={false}
        />);

    return (
        <> { /*React fragment syntax, to prevent issues with unnested MenuItem components*/}
            {editItem}
            {renameItem}
            {copyItem}
            {deleteItem}
        </>
    );
}