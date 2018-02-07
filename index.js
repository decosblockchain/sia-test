const siaUtil = require("./util");
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');

const walletPassword = process.env.SIA_WALLET_PASSWORD || '';



siaUtil.getConnectedInstance((err, siad) => {
    if(err) console.error(err);
    console.log("Got connected Sia instance!");
    siaUtil.ensureWalletInitialized((err) => {
        console.log("Wallet initialized!");
        siaUtil.renterStats((err, result) => {
            var sc = siaUtil.hastingsToSia(result.settings.allowance.funds).toNumber();
            console.log("Allowance is ", sc);
            if(sc < 30) {
                siaUtil.configureRenter(40, 500, (err, result) => {
                    if(err) console.error(err);
                    console.log("Renter result:", result);
                });
            }
        });
    });
});

