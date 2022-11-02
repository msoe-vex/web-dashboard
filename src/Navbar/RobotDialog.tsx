import React from "react";
import { Menu, Classes, Dialog, FormGroup, NumericInput } from "@blueprintjs/core";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { robotDialogClosed, selectRobotDialogId } from "../Tree/tempUiSlice";
import { Robot, robotMaxAccelerationChanged, robotMaxVelocityChanged, RobotType, robotTypeChanged, selectRobotById } from "../Tree/robotsSlice";
import { MenuItem2 } from "@blueprintjs/popover2";

export function RobotDialog(): JSX.Element | null {
    const dispatch = useAppDispatch();

    const handleClose = React.useCallback(
        () => { dispatch(robotDialogClosed()); }
        , [dispatch]);

    const robotDialogId = useAppSelector(selectRobotDialogId);
    // hook cannot go below early exit
    let robot = useAppSelector(state => selectRobotById(state, robotDialogId));

    return (
        <Dialog
            title={robot.name ?? ""}
            isOpen={robotDialogId !== undefined}
            onClose={handleClose}
            isCloseButtonShown={true}
        >
            <RobotDialogContents robot={robot} />
        </Dialog>);
}

interface RobotDialogMenuContentsProps {
    robot: Robot;
}

function RobotDialogContents(props: RobotDialogMenuContentsProps): JSX.Element {
    const dispatch = useAppDispatch();
    const robot = props.robot;
    return (<>
        <div className={Classes.DIALOG_BODY}>
            <FormGroup label="Robot type" >
                <Menu className="select-menu" >
                    <MenuItem2
                        className={robot.robotType === RobotType.SWERVE ? Classes.SELECTED : ""}
                        roleStructure="listoption"
                        selected={robot.robotType === RobotType.SWERVE}
                        label="Swerve"
                        icon="move"
                        onClick={() => { dispatch(robotTypeChanged({ id: robot.id, robotType: RobotType.SWERVE })); }}
                    />
                    <MenuItem2
                        className={robot.robotType === RobotType.TANK ? Classes.SELECTED : ""}
                        roleStructure="listoption"
                        selected={robot.robotType === RobotType.TANK}
                        label="Tank"
                        icon="arrows-vertical"
                        onClick={() => { dispatch(robotTypeChanged({ id: robot.id, robotType: RobotType.TANK })); }}
                    />
                </Menu>
            </FormGroup>

            <FormGroup label="Max velocity">
                <NumericInput
                    max={500}
                    min={1}
                    selectAllOnFocus={true}
                    value={robot.maxVelocity}
                    onValueChange={(value) => { dispatch(robotMaxVelocityChanged({ id: robot.id, value })); }}
                />
            </FormGroup>
            <FormGroup label="Max acceleration">
                <NumericInput
                    max={500}
                    min={1}
                    selectAllOnFocus={true}
                    value={robot.maxAcceleration}
                    onValueChange={(value) => { dispatch(robotMaxAccelerationChanged({ id: robot.id, value })); }}
                />
            </FormGroup>
        </div>
        {/* <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button
                    text="Close"
                    onClick={() => { dispatch(robotDialogClosed()); }}
                    intent={Intent.PRIMARY}
                />
            </div>
        </div> */}
    </>);
}