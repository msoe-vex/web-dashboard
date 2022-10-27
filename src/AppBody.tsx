import React from "react";
import { NonIdealState } from "@blueprintjs/core";

import { AppTree } from "./Tree/AppTree";
import { Field } from "./Field/Field";

import { useAppSelector } from "./Store/hooks";
import { selectActiveRoutine } from "./Tree/uiSlice";
import { AppContextMenu } from "./Field/AppContextMenu";

interface AppBodyProps {
    className: string;
}

export function AppBody(_props: AppBodyProps): JSX.Element {
    // const dispatch = useAppDispatch();
    return (!useAppSelector(selectActiveRoutine)) ?
        (<NonIdealState
            className="non-ideal-state"
            icon="add"
            title="No routines"
            description="Add a routine or import an existing configuration to get started."
        />) :
        (
            <AppContextMenu >
                <div id="App-body" >
                    <AppTree />
                    <Field />
                </div>
            </AppContextMenu>
        );
}