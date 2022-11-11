import React from "react";
import { NonIdealState } from "@blueprintjs/core";

import { AppTree } from "./Tree/AppTree";
import { Field } from "./Field/Field";

import { useAppSelector } from "./Store/hooks";
import { selectActiveRoutineId } from "./Tree/uiSlice";
import { AppContextMenu } from "./Field/AppContextMenu";

interface AppBodyProps {
    className: string;
}

export function AppBody(_props: AppBodyProps): JSX.Element {
    return (!useAppSelector(selectActiveRoutineId)) ?
        (<NonIdealState
            className="non-ideal-state"
            icon="add"
            title="No routines"
            description="Add a routine to get started."
        />) :
        (<AppContextMenu >
            <div id="App-body" >
                <AppTree />
                <Field />
            </div>
        </AppContextMenu>);
}