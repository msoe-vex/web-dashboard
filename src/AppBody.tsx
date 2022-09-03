import React from "react";
import { NonIdealState } from "@blueprintjs/core";

import { AppTree } from "./Tree/AppTree";
import { Field } from "./Field/Field";

import { useAppSelector } from "./Store/hooks";
import { selectRoutineById } from "./Navbar/routinesSlice";
import { selectActiveRoutineId } from "./Tree/uiSlice";

interface AppBodyProps {
    className: string;
}

export function AppBody(_props: AppBodyProps): JSX.Element {
    // const dispatch = useAppDispatch();
    const activeRoutine = useAppSelector(state => selectRoutineById(state, selectActiveRoutineId(state)));

    return (!activeRoutine) ?
        (<NonIdealState
            className="non-ideal-state"
            icon="add"
            title="No routines"
            description="Add a routine or import an existing configuration to get started."
        />) :
        (<div
            className="App-body"
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
        >
            <AppTree />
            <Field />
        </div>
        );
}