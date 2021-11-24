import React from 'react';
import styled from 'styled-components';
import { variables, H3 } from '@trezor/components';
import { Translation, Image } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    padding: 54px 42px;
    align-items: center;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled(H3)`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 30px;
    text-align: center;
`;

const StyledImage = styled(props => <Image {...props} />)`
    display: flex;
    width: 220px;
    height: 180px;
    margin-right: 52px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-bottom: 20px;
    }
`;

// const InlineButton = styled(Button)`
//     display: inline-flex;
// `;

const SecurityItem = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.BUTTON};

    & + & {
        margin-top: 12px;
    }
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

const EmptyWallet = (props: Props) => (
    <Wrapper {...props} data-test="@dashboard/wallet-ready">
        <StyledImage image="UNI_SUCCESS" />
        <Content>
            <Title>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </Title>
            <SecurityItem>
                <Translation id="TR_ADDITIONAL_SECURITY_FEATURES" />
            </SecurityItem>
        </Content>
    </Wrapper>
);

export default EmptyWallet;
