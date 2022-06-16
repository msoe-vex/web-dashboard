import React from 'react';
import { Menu, MenuItem, MaybeElement } from '@blueprintjs/core';
import { BlueprintIcons_16Id } from '@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16';
import { EntityId } from '@reduxjs/toolkit';

import { ItemEditMenu } from './ItemEditMenu';
import { RootState } from './Store/store';
import { useAppSelector } from './Store/hooks';
import { MenuItemNameInput } from './MenuItemNameInput';

interface AppMenuProps {
    itemName: string;

    selectAll: (state: RootState) => { id: EntityId, name: string }[];
    selectActiveId: (state: RootState) => EntityId | undefined;

    created: (newName: string) => void;
    selected: (id: EntityId) => void;

    icon?: BlueprintIcons_16Id | MaybeElement;
    copied: (id: EntityId) => void;
    renamed: (arg: { newName: string, id: EntityId }) => void;
    deleted: (id: EntityId) => void;
}

/**
 * Renders routines as a list of selectable and editable elements.
 * Intended to be wrapped by a higher level popover in RoutineSelect.
 */
export function AppMenu(props: AppMenuProps): JSX.Element {
    const items = useAppSelector(props.selectAll);

    return (
        <Menu>
            {items.map((item) => {
                return (
                    <AppMenuItem
                        item={item}

                        selectActiveId={props.selectActiveId}
                        selected={props.selected}

                        icon={props.icon}
                        copied={props.copied}
                        renamed={props.renamed}
                        deleted={props.deleted}
                    />
                )
            })}
            <MenuItemNameInput
                text={"Add " + props.itemName}
                placeholder={"New " + props.itemName}
                icon="add"
                newNameSubmitted={props.created}
            />
        </Menu>
    );
}
export interface AppMenuItemProps {
    item: { id: EntityId, name: string }

    selectActiveId: (state: RootState) => EntityId | undefined;
    selected: (id: EntityId) => void;

    icon?: BlueprintIcons_16Id | MaybeElement;
    copied: (id: EntityId) => void;
    renamed: (arg: { newName: string, id: EntityId }) => void;
    deleted: (id: EntityId) => void;
}
function AppMenuItem(props: AppMenuItemProps): JSX.Element {
    return (
        <MenuItem
            key={props.item.id}
            text={props.item.name}
            icon={props.icon}
            selected={useAppSelector(props.selectActiveId) === props.item.id}
            onClick={() => props.selected(props.item.id)}
        >
            <ItemEditMenu
                id={props.item.id}
                copied={props.copied}
                renamed={props.renamed}
                deleted={props.deleted}
            />
        </MenuItem>
    );
}
