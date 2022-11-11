import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';
import { RootState, AppDispatch } from './store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;

export function useAppDispatchHandler() {
    return getDispatchHandler(useAppDispatch());
}
export type DispatchHandler = (action: AnyAction) => () => void;

export function getDispatchHandler(dispatch: AppDispatch): DispatchHandler {
    return (action: AnyAction) => {
        return () => { dispatch(action); }
    };
}