import React from 'react';
import { Button, Classes } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import { EntityId } from '@reduxjs/toolkit';

import { RootState, selectAllRoutines, selectRoutine, selectActiveRoutineId } from './Store/store';
import { addedRoutine, deletedRoutine, selectedRoutine, copiedRoutine, renamedRoutine } from './Store/routinesSlice';
import { useAppDispatch, useAppSelector } from './Store/hooks';
import { AppMenu } from './AppMenu';

export function RoutineSelect(): JSX.Element {
    const dispatch = useAppDispatch();
    const selectActiveRoutine = (state: RootState) => selectRoutine(state, state.routines.activeRoutineId);
    const activeRoutine = useAppSelector(selectActiveRoutine);
    let name = activeRoutine === undefined ? "" : activeRoutine.name;

    const ownerButton = (<Button
        className={Classes.MINIMAL}
        icon="playbook"
        rightIcon="chevron-down"
        text={name}
    />);

    const routineMenu = (
        <AppMenu
            itemName="routine"
            selectAll={selectAllRoutines}
            selectActiveId={selectActiveRoutineId}

            created={(newName: string) => dispatch(addedRoutine(newName))}
            selected={(id: EntityId) => dispatch(selectedRoutine(id))}

            icon="playbook"
            copied={(id: EntityId) => dispatch(copiedRoutine(id))}
            renamed={(val: { newName: string, id: EntityId }) => dispatch(renamedRoutine(val))}
            deleted={(id: EntityId) => dispatch(deletedRoutine(id))}
        />

    );

    return (
        <Popover2
            children={ownerButton}
            content={routineMenu}
            minimal={true}
            position={"bottom-left"}
        />
    );
}