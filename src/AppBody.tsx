import React from "react";
import { NonIdealState } from "@blueprintjs/core";

import { selectRoutineById } from "./Navbar/routinesSlice";
import { useAppSelector } from "./Store/hooks";
import { AppTree } from "./Tree/AppTree";
import { selectActiveRoutineId } from "./Tree/uiSlice";

export function AppBody(): JSX.Element {
    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const activeRoutine = useAppSelector(state => selectRoutineById(state, activeRoutineId));
    return activeRoutine === undefined ?
        (<NonIdealState
            icon="add"
            title="No routines"
            description="Add a routine or import an existing configuration to get started."
        />) :
        (<AppTree pathId={activeRoutine.pathIds[0]} />);
}