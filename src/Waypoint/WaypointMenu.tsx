import React from "react";
import { Card, ControlGroup, H5 } from "@blueprintjs/core";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { EntityId } from "@reduxjs/toolkit";
import { selectWaypointById } from "../Tree/waypointsSlice";


interface MenuCardProps {
    children?: JSX.Element;
}

export function MenuCard(props: MenuCardProps): JSX.Element {
    return (<Card
        elevation={0}
        interactive={true}
        draggable={true}
    >
        {props.children}
    </Card>);

}

export interface WaypointMenuProps {
    id: EntityId;
}

/**
 * A draggable menu which exists over the field and can be used to manipulate certain waypoint properties:
 * WaypointType (eventually)
 * Position (x, y, angle) 
 * 
 */
export function WaypointMenu(props: WaypointMenuProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const waypoint = useAppSelector(state => selectWaypointById(state, props.id));

    return !waypoint ? null :
        (<MenuCard>
            <H5>{waypoint.name}</H5>
            
        </MenuCard>);
}