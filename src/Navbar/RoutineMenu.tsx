import React from "react";
import { Button, Classes, Menu, MenuDivider, Position } from "@blueprintjs/core";
import { MenuItem2, Popover2 } from "@blueprintjs/popover2";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import {
    addedRoutine,
    deletedRoutine,
    duplicatedRoutine,
    Routine,
    selectAllRoutines
} from "./routinesSlice";
import { selectActiveRoutine, selectActiveRoutineId, selectedActiveRoutine } from "../Tree/uiSlice";
import { NameInput } from "./NameInput";
import { DeleteMenuItem, DuplicateMenuItem, EditMenuItem, RenameMenuItem } from "../Tree/MenuItems";
import { ItemType, selectIsRenaming } from "../Tree/tempUiSlice";

export function RoutineMenu(): JSX.Element {
    const dispatch = useAppDispatch();

    const activeRoutine = useAppSelector(selectActiveRoutine);

    const [isOpen, setIsOpen] = React.useState(false);

    const ownerButton = (activeRoutine ?
        <Button
            icon="playbook"
            rightIcon="chevron-down"
            text={activeRoutine.name}
            minimal={true}
            onClick={() => { setIsOpen(true); }}
        /> :
        <Button
            icon="add"
            text={"Add routine"}
            minimal={true}
            onClick={() => { dispatch(addedRoutine()); }}
        />);

    const addRoutineItem = (
        <MenuItem2
            icon="add"
            text="Add routine"
            onClick={() => { dispatch(addedRoutine()); }}
            shouldDismissPopover={false}
        />);

    const routines = useAppSelector(selectAllRoutines);
    const routineMenu = (
        <Menu className={Classes.ELEVATION_2}>
            {routines.map(routine =>
                <RoutineItem
                    key={routine.id} // key here to make React happy
                    routine={routine}
                    setIsOpen={setIsOpen}
                />)}
            <MenuDivider />
            {addRoutineItem}
        </Menu>);

    return (!activeRoutine ? ownerButton :
        <Popover2
            children={ownerButton}
            content={routineMenu}
            usePortal={true}
            minimal={true}
            position={Position.BOTTOM_LEFT}
            matchTargetWidth={true}
            isOpen={isOpen}
            onClose={() => { setIsOpen(false); }} // setIsOpen to globalIsRenaming (which is usually false)
        />);
}

interface RoutineItemProps {
    routine: Routine;
    setIsOpen: (state: boolean) => void;
}

function RoutineItem(props: RoutineItemProps): JSX.Element {
    const dispatch = useAppDispatch();
    const routine = props.routine;
    const isSelected = (routine.id === useAppSelector(selectActiveRoutineId));

    const isRenaming = useAppSelector(state => selectIsRenaming(state, routine.id));
    return isRenaming ? (<NameInput
        id={routine.id}
        itemType={ItemType.ROUTINE}
        icon="playbook"
    />) :
        (<MenuItem2
            className={isSelected ? Classes.SELECTED : ""}
            icon="playbook"
            text={routine.name}
            roleStructure="listoption"
            selected={isSelected}
            submenuProps={{ className: Classes.ELEVATION_2 }}
            onClick={() => {
                props.setIsOpen(false);
                dispatch(selectedActiveRoutine(routine.id));
            }}
        >
            < RoutineSubmenu id={routine.id} />
        </MenuItem2>);
}

interface RoutineSubmenuProps {
    id: EntityId;
}

function RoutineSubmenu(props: RoutineSubmenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    const dismissProps = { shouldDismissPopover: false };
    return (<>
        <EditMenuItem onClick={() => { dispatch(selectedActiveRoutine(props.id)); }} />
        <RenameMenuItem {...dismissProps} id={props.id} />
        <DuplicateMenuItem {...dismissProps} onClick={() => { dispatch(duplicatedRoutine(props.id)); }} />
        <MenuDivider />
        <DeleteMenuItem {...dismissProps} onClick={() => { dispatch(deletedRoutine(props.id)); }} />
    </>);
}