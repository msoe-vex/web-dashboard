import React, { useCallback, useState } from "react";
import { Button, Classes, Dialog, FormGroup, Intent, NumericInput } from "@blueprintjs/core";
import { selectSplinePointCount, splinePointCountChanged } from "../Field/fieldSlice";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { exportDialogClosed, exportDialogOpened, selectIsExportDialogOpen } from "../Tree/tempUiSlice";
import { selectActiveRoutine } from "../Tree/uiSlice";

/**
 * Defines the a dialog menu used for exporting.
 */
export function ExportDialog(): JSX.Element | null {
    const dispatch = useAppDispatch();

    const handleClose = useCallback(() => { dispatch(exportDialogClosed()); }, [dispatch]);

    const activeRoutine = useAppSelector(selectActiveRoutine);
    const isOpen = useAppSelector(selectIsExportDialogOpen);

    return (!activeRoutine ? null : (<>
        <ExportDialogButton onClick={() => { dispatch(exportDialogOpened()); }} />
        <Dialog
            title={"Export " + activeRoutine.name}
            isOpen={isOpen}
            onClose={handleClose}
            isCloseButtonShown={true}
        >
            <ExportDialogContents handleClose={handleClose} />
        </Dialog>
    </>));
}

interface ExportDialogMenuContentsProps {
    handleClose: () => void;
}

function ExportDialogContents(props: ExportDialogMenuContentsProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    // should probably live in field slice (or robot slice?)
    const [maxVelocity, setMaxVelocity] = useState(50);
    const [maxAcceleration, setMaxAcceleration] = useState(100);

    const splinePointCount = useAppSelector(selectSplinePointCount);

    const splinePointCountField = (
        <FormGroup
            label="Spline point count"
            helperText="The number of points to generate between each waypoint."
        >
            <NumericInput
                stepSize={1}
                majorStepSize={null}
                minorStepSize={null}
                max={100}
                min={1}
                selectAllOnFocus={true}
                value={splinePointCount}
                onValueChange={(value) => { dispatch(splinePointCountChanged(value)); }}
            />
        </FormGroup>
    );

    const { handleClose } = props;
    const handleExport = useCallback(() => {
        const exportData = { "hi": "okay" };
        const jsonString = "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(exportData));
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "path.json"; // download file name
        link.click();
        handleClose();
    }, [handleClose]);

    return (<>
        <div className={Classes.DIALOG_BODY}>
            {splinePointCountField}
            <FormGroup label="Max velocity">
                <NumericInput
                    max={500}
                    min={1}
                    selectAllOnFocus={true}
                    value={maxVelocity}
                    onValueChange={(value) => { setMaxVelocity(value); }}
                />
            </FormGroup>
            <FormGroup label="Max acceleration">
                <NumericInput
                    max={500}
                    min={1}
                    selectAllOnFocus={true}
                    value={maxAcceleration}
                    onValueChange={(value) => { setMaxAcceleration(value); }}
                />
            </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button
                    text="Export"
                    onClick={handleExport}
                    intent={Intent.PRIMARY}
                />
            </div>
        </div>
    </>);
}

interface ExportDialogButtonProps {
    onClick: () => void;
}

function ExportDialogButton(props: ExportDialogButtonProps): JSX.Element {
    return (<Button
        {...props}
        icon="export"
        text="Export"
        minimal={true}
    />);
}