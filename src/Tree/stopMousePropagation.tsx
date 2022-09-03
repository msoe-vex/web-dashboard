import React from 'react';

export const stopMousePropagation = (callback?: React.MouseEventHandler): React.MouseEventHandler => {
    return (e) => {
        e.stopPropagation();
        if (callback) { callback(e); }
    };
};