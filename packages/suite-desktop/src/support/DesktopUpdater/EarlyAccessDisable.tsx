import React, { useCallback, useState } from 'react';

import { Button } from '@trezor/components';
import { Translation, Modal, Image, TrezorLink } from '@suite-components';
import { ImageWrapper, ButtonWrapper, Description, LeftCol, RightCol, Title } from './styles';
import { SUITE_URL } from '@suite-constants/urls';

interface Props {
    hideWindow: () => void;
}

const EarlyAccessDisable = ({ hideWindow }: Props) => {
    const [enabled, setEnabled] = useState(true);

    const allowPrerelease = useCallback(() => {
        window.desktopApi?.allowPrerelease(false);
        setEnabled(false);
    }, []);

    return enabled ? (
        <Modal>
            <ImageWrapper>
                <Image width={60} height={60} image="EARLY_ACCESS_DISABLE" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
            </Description>

            <ButtonWrapper>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <Button onClick={allowPrerelease} fullWidth>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Button>
                </RightCol>
            </ButtonWrapper>
        </Modal>
    ) : (
        <Modal>
            <ImageWrapper>
                <Image image="UNI_SUCCESS" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />
            </Description>

            <ButtonWrapper>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <TrezorLink size="small" variant="nostyle" href={SUITE_URL}>
                        <Button icon="EXTERNAL_LINK" alignIcon="right" fullWidth>
                            <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                        </Button>
                    </TrezorLink>
                </RightCol>
            </ButtonWrapper>
        </Modal>
    );
};

export default EarlyAccessDisable;
