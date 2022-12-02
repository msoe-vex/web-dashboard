import React, { ReactNode, useMemo } from "react";
import { useHotkeys } from "@blueprintjs/core";
import { ActionCreators } from "redux-undo";
import { useAppDispatch } from "../Store/hooks";
import { selectionDeleted } from "../Tree/tempUiSlice";

interface GlobalHotkeysProps {
    children: ReactNode;
}

export function GlobalHotkeys(props: GlobalHotkeysProps) {
    const dispatch = useAppDispatch();
    const hotkeys = useMemo(() => [
        {
            combo: "ctrl+z",
            global: true,
            label: "Undo",
            onKeyDown: () => { dispatch(ActionCreators.undo()); }
        },
        {
            combo: "ctrl+y",
            global: true,
            label: "Redo",
            onKeyDown: () => { dispatch(ActionCreators.redo()); }
        },
        {
            combo: "del",
            global: true,
            label: "Delete selection",
            onKeyDown: () => { dispatch(selectionDeleted()); }
        },
        {
            combo: "ctrl",
            global: true,
            label: "Select multiple"
        },
        {
            combo: "shift",
            global: true,
            label: "Select group"
        },
        {
            combo: "ctrl + shift",
            global: true,
            label: "Select all"
        },
    ], [dispatch]);

    const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);
    return (
        <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="App">
            {props.children}
        </div>
    );
}