import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { isWeb, isDesktop } from '@suite-utils/env';
import { getProtocolInfo } from '@suite-utils/parseUri';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as protocolActions from '@suite-actions/protocolActions';
import { PROTOCOL_SCHEME } from '@suite-reducers/protocolReducer';

const Protocol = () => {
    const { addToast, saveCoinProtocol, saveAoppProtocol } = useActions({
        addToast: notificationActions.addToast,
        saveCoinProtocol: protocolActions.saveCoinProtocol,
        saveAoppProtocol: protocolActions.saveAoppProtocol,
    });

    const handleProtocolRequest = useCallback(
        uri => {
            const protocolInfo = getProtocolInfo(uri);
            switch (protocolInfo?.scheme) {
                case PROTOCOL_SCHEME.BITCOIN: {
                    const { scheme, amount, address } = protocolInfo;
                    saveCoinProtocol(scheme, address, amount);
                    addToast({
                        type: 'coin-scheme-protocol',
                        address,
                        scheme,
                        amount,
                        autoClose: false,
                    });
                    break;
                }
                case PROTOCOL_SCHEME.AOPP: {
                    const { asset, msg, callback, format } = protocolInfo;
                    saveAoppProtocol({
                        asset,
                        message: msg,
                        callback,
                        format,
                    });
                    addToast({
                        type: 'aopp-protocol',
                        message: msg,
                        asset,
                        autoClose: false,
                    });
                    break;
                }
                default:
                    break;
            }
        },
        [addToast, saveCoinProtocol, saveAoppProtocol],
    );

    const { search } = useLocation();
    useEffect(() => {
        if (search) {
            const query = new URLSearchParams(search);
            const uri = query.get('uri');
            if (uri) {
                handleProtocolRequest(uri);
            }
        }
    }, [search, handleProtocolRequest]);

    useEffect(() => {
        if (isWeb() && navigator.registerProtocolHandler) {
            navigator.registerProtocolHandler(
                'bitcoin',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}/?uri=%s`,
                // @ts-ignore - title is deprecated but it is recommended to be set because of backwards-compatibility
                'Bitcoin / Trezor Suite',
            );

            /*
            navigator.registerProtocolHandler(
                'web+aopp',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}/?uri=%s`,
                // @ts-ignore - title is deprecated but it is recommended to be set because of backwards-compatibility
                'AOPP / Trezor Suite',
            );
            */
        }

        if (isDesktop()) {
            // @ts-ignore TS2339: Property 'desktopApi' does not exist on type 'Window & typeof globalThis'.
            window.desktopApi?.on('protocol/open', handleProtocolRequest);
        }
    }, [handleProtocolRequest]);

    return null;
};

export default Protocol;
