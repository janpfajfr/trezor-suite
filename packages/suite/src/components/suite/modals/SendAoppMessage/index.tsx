import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import type { UserContextPayload } from '@suite-actions/modalActions';

const Row = styled.div`
    display: flex;
    text-align: left;
    margin-bottom: 8px;
    & > * {
        &:first-child {
            min-width: 120px;
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        }
        &:not(:first-child) {
            overflow-wrap: anywhere;
        }
    }
`;

const ActionRow = styled.div`
    display: flex;
    justify-content: space-evenly;
    margin-top: 24px;
`;

const StyledButton = styled(Button)`
    width: 200px;
`;

type Props = Extract<UserContextPayload, { type: 'send-aopp-message' }> & {
    onCancel: () => void;
};

const post = (callback: string, address: string, signature: string) =>
    fetch(callback, {
        method: 'POST',
        headers: { 'content-type': 'application/json; utf-8' },
        mode: 'no-cors', // what TODO with that?
        body: JSON.stringify({
            version: 0,
            address,
            signature,
        }),
    })
        .then(res => res.status === 204 || res.status === 0) // TODO zero in case of opaque request
        .catch(_e => false);

const SendAoppMessage = ({ onCancel, decision, address, signature, callback }: Props) => (
    <Modal cancelable onCancel={onCancel} heading={<Translation id="TR_AOPP_SEND" />}>
        <Row>
            <Translation id="TR_ADDRESS" />
            <div>{address}</div>
        </Row>
        <Row>
            <Translation id="TR_SIGNATURE" />
            <div>{signature}</div>
        </Row>
        <Row>
            <Translation id="TR_TO" />
            <div>{callback}</div>
        </Row>
        <ActionRow>
            <StyledButton
                onClick={async () => {
                    const success = await post(callback, address, signature);
                    decision.resolve(success);
                    onCancel();
                }}
            >
                <Translation id="TR_NAV_SEND" />
            </StyledButton>
        </ActionRow>
    </Modal>
);

export default SendAoppMessage;
