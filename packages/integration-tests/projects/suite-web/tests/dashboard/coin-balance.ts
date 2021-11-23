// @group:suite
// @retry=2

const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

describe('Dashboard with regtest', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Regtest is in dashboard and gets updated when tx is created', () => {
        cy.getTestElement('@dashboard/security-card/backup/button').should('be.disabled');

        // when graph becomes visible, discovery was finished
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');
        console.log('sending to address');
        cy.task('sendToAddress', {
            address: ADDRESS_INDEX_1,
            btc_amount: 1,
        });
        cy.task('mineBlocks', { block_amount: 1 });

        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-coins').click();
        cy.getTestElement('@settings/wallet/network/btc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/regtest').click({ force: true });

        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@wallet/coin-balance/value-regtest').should('exist');

        cy.getTestElement('@wallet/coin-balance/value-regtest')
            .text()
            .then(value => {
                expect(Number(value)).to.be.greaterThan(0);
            });
    });
});
