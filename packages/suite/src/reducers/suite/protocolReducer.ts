import produce from 'immer';
import { PROTOCOL } from '@suite-actions/constants';
import type { Action } from '@suite-types';
import type { Network } from '@wallet-types';

export enum PROTOCOL_SCHEME {
    BITCOIN = 'bitcoin',
    AOPP = 'aopp',
}

export const PROTOCOL_TO_SYMBOL: { [key: string]: Network['symbol'] } = {
    [PROTOCOL_SCHEME.BITCOIN]: 'btc',
};

export interface SendFormState {
    address?: string;
    amount?: number;
    scheme?: PROTOCOL_SCHEME;
    shouldFillSendForm?: boolean;
}

export interface AoppState {
    message: string;
    asset: Network['symbol'];
    callback?: string;
    format?: string;
}

export interface State {
    sendForm: SendFormState;
    aopp: Partial<AoppState> & {
        shouldFill?: boolean;
    };
}

export const initialState: State = {
    sendForm: {},
    aopp: {},
};

const protocolReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case PROTOCOL.FILL_SEND_FORM:
                draft.sendForm.shouldFillSendForm = action.payload;
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                draft.sendForm.address = action.payload.address;
                draft.sendForm.scheme = action.payload.scheme;
                draft.sendForm.amount = action.payload.amount;
                draft.sendForm.shouldFillSendForm = false;
                break;
            case PROTOCOL.FILL_AOPP:
                draft.aopp.shouldFill = action.payload;
                break;
            case PROTOCOL.SAVE_AOPP_PROTOCOL:
                draft.aopp.message = action.payload.message;
                draft.aopp.callback = action.payload.callback;
                draft.aopp.asset = action.payload.asset;
                draft.aopp.format = action.payload.format;
                draft.aopp.shouldFill = false;
                break;
            case PROTOCOL.RESET:
                return initialState;
            // no default
        }
    });

export default protocolReducer;
