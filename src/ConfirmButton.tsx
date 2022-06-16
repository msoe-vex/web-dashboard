import React from 'react';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';

interface ConfirmButtonProps {
    onConfirm: () => void;
    onReject: () => void;
}
export function ConfirmButton(props: ConfirmButtonProps) {
    return (
        <ButtonGroup>
            <Button
                icon={"tick"}
                minimal={false}
                intent={Intent.SUCCESS}
                onClick={props.onConfirm}
            />
            <Button
                icon={"cross"}
                minimal={true}
                intent={Intent.DANGER}
                onClick={props.onReject}
            />
        </ButtonGroup>
    );
}