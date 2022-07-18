import React from "react";
import { NonIdealState } from "@blueprintjs/core";

import { selectRoutineById } from "./Navbar/routinesSlice";
import { useAppDispatch, useAppSelector } from "./Store/hooks";
import { AppTree } from "./Tree/AppTree";
import { deselectedWaypoints, selectActiveRoutineId } from "./Tree/uiSlice";

interface AppBodyProps {
    className: string;
}

export function AppBody(props: AppBodyProps): JSX.Element {
    const dispatch = useAppDispatch();
    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const activeRoutine = useAppSelector(state => selectRoutineById(state, activeRoutineId));

    const body = (!activeRoutine) ?
        (<NonIdealState
            className="App-non-ideal-state"
            icon="add"
            title="No routines"
            description="Add a routine or import an existing configuration to get started."
        />) :
        (<div
            onClick={(e: React.MouseEvent) => {
                if (!e.isPropagationStopped()) {
                    dispatch(deselectedWaypoints());
                }
            }}
        >
            <AppTree />
        </div>
        );

    return (
        <div {...props}>
            {body}
        </div>
    );
}