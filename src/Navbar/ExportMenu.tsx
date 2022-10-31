import { Button, Card, FormGroup, NumericInput, Overlay } from "@blueprintjs/core";
import React from "react";

interface ExportMenuProps {

}

export function ExportMenu(props: ExportMenuProps): JSX.Element {
    const [isOverlayOpen, setIsOverlayOpen] = React.useState(false);
    const closeOverlay = () => { setIsOverlayOpen(false); }

    const exportMenuButton = (<ExportMenuButton
        onClick={() => { setIsOverlayOpen(true); }}
    />);


    return (<>
        {exportMenuButton}
        < Overlay
            isOpen={isOverlayOpen}
            onClose={closeOverlay}
        // canOutsideClickClose={false}
        >
            <ExportMenuOverlayContents closeOverlay={closeOverlay} />
        </Overlay>
    </>);
}

interface ExportMenuOverlayContentsProps {
    closeOverlay: () => void;
}

function ExportMenuOverlayContents(props: ExportMenuOverlayContentsProps): JSX.Element {
    // should probably live in field slice
    const [stepPoints, setStepPoints] = React.useState(7);

    return (<Card
        elevation={3}
        className="export-menu"
    >
        <FormGroup
            label="Spline points"
        >
            <NumericInput
                majorStepSize={null}
                minorStepSize={null}
                max={100}
                min={1}
                value={stepPoints}
                onValueChange={(value) => { setStepPoints(value); }}
            />
        </FormGroup>
        <FormGroup>
            <Button
                text="Export"
                onClick={props.closeOverlay}
            />
            <Button
                text="Cancel"
                onClick={props.closeOverlay}
            />
        </FormGroup>
    </Card>);
}

interface ExportMenuButtonProps {
    onClick: () => void;
}

function ExportMenuButton(props: ExportMenuButtonProps): JSX.Element {
    return (<Button
        {...props}
        icon="export"
        text="Export"
        minimal={true}
    />);
}