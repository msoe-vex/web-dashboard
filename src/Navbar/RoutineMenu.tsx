import React from 'react';
import { Button, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import { EntityId } from '@reduxjs/toolkit';

import { useAppDispatch, useAppSelector } from '../Store/hooks';
import {
    selectRoutineIds, selectRoutineById, selectActiveRoutineId,
    addedRoutine, deletedRoutine, selectedRoutine, copiedRoutine, renamedRoutine
} from './routinesSlice';

import { EditSubmenu } from './EditSubmenu';
import { NameInput } from './NameInput';

export function RoutineMenu(): JSX.Element {
    const dispatch = useAppDispatch();

    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const activeRoutineName = useAppSelector((state) => {
        const routine = selectRoutineById(state, activeRoutineId);
        return routine === undefined ? "" : routine.name;
    });

    const [isOpen, setIsOpen] = React.useState(false);

    let globalIsRenaming = false;
    const setGlobalIsRenaming = (isRenaming: boolean) => {
        globalIsRenaming = isRenaming;
    }

    const ownerButton = (!activeRoutineName ?
        <Button
            icon="add"
            text={"Add routine"}
            minimal={true}
            onClick={() => dispatch(addedRoutine())}
        /> :
        <Button
            icon="playbook"
            rightIcon="chevron-down"
            text={activeRoutineName}
            minimal={true}
            onClick={() => setIsOpen(true)}
        />);

    const addRoutineItem = (
        <MenuItem
            icon="add"
            text="Add routine"
            key="addRoutine"
            onClick={() => dispatch(addedRoutine())}
            shouldDismissPopover={false}
        />);

    const ids = useAppSelector(selectRoutineIds);
    const routineMenu = (
        <Menu>
            {ids.map((id) =>
                <RoutineItem
                    id={id}
                    selected={id === activeRoutineId}
                    setGlobalIsRenaming={setGlobalIsRenaming}
                />)}
            <MenuDivider />
            {addRoutineItem}
        </Menu>);

    return (!activeRoutineName ? ownerButton :
        <Popover2
            children={ownerButton}
            content={routineMenu}
            minimal={true}
            placement={"bottom-start"}
            matchTargetWidth={true}
            isOpen={isOpen}
            onClose={() => {
                setIsOpen(globalIsRenaming);
            }}
        />);
}

interface RoutineItemProps {
    id: EntityId;
    selected: boolean;
    setGlobalIsRenaming: (isRenaming: boolean) => void;
}

function RoutineItem(props: RoutineItemProps): JSX.Element {
    const dispatch = useAppDispatch();

    const name = useAppSelector((state) => {
        const routine = selectRoutineById(state, props.id);
        return (routine === undefined) ? "" : routine.name;
    });

    const [isRenaming, setIsRenaming] = React.useState(false);

    const setGlobalIsRenaming = props.setGlobalIsRenaming;
    React.useEffect(() => {
        if (isRenaming)
            setGlobalIsRenaming(true);
    }, [setGlobalIsRenaming, isRenaming]);

    return isRenaming ? (<NameInput
        initialName={name}
        icon="playbook"
        id={props.id}
        newNameSubmitted={(newName) => {
            if (newName !== undefined) {
                dispatch(renamedRoutine({ newName: newName, id: props.id }))
            }
            setIsRenaming(false);
        }}
    />) :
        (<MenuItem
            icon="playbook"
            text={name}
            key={props.id}
            selected={props.selected}
            onClick={() => dispatch(selectedRoutine(props.id))}
            children={
                <EditSubmenu
                    onRenameClick={() => setIsRenaming(true)}
                    onCopyClick={() => dispatch(copiedRoutine(props.id))}
                    onDeleteClick={() => dispatch(deletedRoutine(props.id))}
                />}
        />);
}