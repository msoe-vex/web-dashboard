import { ContextMenu2 } from "@blueprintjs/popover2";
import { KonvaEventObject } from "konva/lib/Node";
import React from "react";

export type ContextMenuHandler = (contextMenu: JSX.Element, e: MouseEvent) => void;
export const ContextMenuHandlerContext = React.createContext<ContextMenuHandler>(() => { });

interface AppContextMenuProps {
    children: React.ReactNode;
}

export function AppContextMenu(props: AppContextMenuProps): JSX.Element {
    const [contextMenu, setContextMenu] = React.useState<JSX.Element>(<></>);
    const getContextMenu = React.useCallback((): JSX.Element => (contextMenu), [contextMenu]);

    const contextMenuHandler = (contextMenu: JSX.Element, e: MouseEvent) => {
        setContextMenu(wrapContextMenu(contextMenu, e));
    };

    return (
        <ContextMenu2
            content={getContextMenu}
            className={"App-context-menu"}
        >
            <ContextMenuHandlerContext.Provider value={contextMenuHandler}>
                {props.children}
            </ContextMenuHandlerContext.Provider>
        </ContextMenu2>
    );
}

export type konvaContextMenuHandler = (contextMenu: JSX.Element) => (e: KonvaEventObject<MouseEvent>) => void;
export function getKonvaContextMenuHandler(contextMenuHandler: ContextMenuHandler): konvaContextMenuHandler {
    return (contextMenu: JSX.Element) =>
        (e: KonvaEventObject<MouseEvent>) => {
            contextMenuHandler(contextMenu, e.evt);
        };
}

function wrapContextMenu(contextMenu: JSX.Element, e: MouseEvent): JSX.Element {
    return (
        <div style={{
            position: "absolute",
            left: e.clientX,
            top: e.clientY
        }}>
            {contextMenu}
        </div>);
}
