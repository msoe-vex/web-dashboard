import React from "react";
import { Button, Classes, Menu, MenuDivider, Position } from "@blueprintjs/core";
import { MenuItem2, Popover2 } from "@blueprintjs/popover2";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import {
    addedRoutine,
    deletedRoutine,
    renamedRoutine,
    duplicatedRoutine,
    Routine,
    selectAllRoutines
} from "./routinesSlice";
import { selectActiveRoutine, selectActiveRoutineId, selectedActiveRoutine } from "../Tree/uiSlice";

import { NameInput } from "./NameInput";
import { DeleteMenuItem, DuplicateMenuItem, EditMenuItem, RenameMenuItem } from "../Tree/MenuItems";

export function RoutineMenu(): JSX.Element {
    const dispatch = useAppDispatch();

    const activeRoutine = useAppSelector(selectActiveRoutine);

    const [isOpen, setIsOpen] = React.useState(false);
    const [globalIsRenaming, setGlobalIsRenaming] = React.useState(false);

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
            onClick={() => dispatch(addedRoutine())}
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
                    setGlobalIsRenaming={setGlobalIsRenaming}
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
            onClose={() => { setIsOpen(globalIsRenaming); }} // setIsOpen to globalIsRenaming (which is usually false)
        />);
}

interface RoutineItemProps {
    routine: Routine;
    setGlobalIsRenaming: (isRenaming: boolean) => void;
    setIsOpen: (state: boolean) => void;
}

function RoutineItem(props: RoutineItemProps): JSX.Element {
    const dispatch = useAppDispatch();
    const routine = props.routine;
    const selected = (routine.id === useAppSelector(selectActiveRoutineId));

    const [isRenaming, setIsRenaming] = React.useState(false);
    return isRenaming ? (<NameInput
        initialName={routine.name}
        icon="playbook"
        newNameSubmitted={(newName) => {
            if (newName) { dispatch(renamedRoutine({ newName, id: routine.id })); }
            setIsRenaming(false);
            props.setGlobalIsRenaming(false);
        }}
    />) :
        (<MenuItem2
            className={selected ? Classes.SELECTED : ""}
            icon="playbook"
            text={routine.name}
            roleStructure="listoption"
            selected={selected}
            submenuProps={{ className: Classes.ELEVATION_2 }}
            onClick={() => {
                props.setIsOpen(false);
                dispatch(selectedActiveRoutine(routine.id));
            }}
        >
            < RoutineSubmenu
                id={routine.id}
                handleRenameClick={() => {
                    setIsRenaming(true);
                    props.setGlobalIsRenaming(true);
                }}
            />
        </MenuItem2>);
}

interface RoutineSubmenuProps {
    id: EntityId;
    handleRenameClick: React.MouseEventHandler;
}

function RoutineSubmenu(props: RoutineSubmenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    const dismissProps = { shouldDismissPopover: false };
    return (<>
        <EditMenuItem onClick={() => dispatch(selectedActiveRoutine(props.id))} />
        <RenameMenuItem {...dismissProps} onClick={props.handleRenameClick} />
        <DuplicateMenuItem {...dismissProps} onClick={() => { dispatch(duplicatedRoutine(props.id)); }} />
        <MenuDivider />
        <DeleteMenuItem {...dismissProps} onClick={() => { dispatch(deletedRoutine(props.id)); }} />
    </>);
}