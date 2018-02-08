const sia = require("sia.js");
const siaPath = process.env.SIAD_PATH || '/usr/local/sia/siad';
const siaDataPath = process.env.SIA_DATAPATH || '/root/siadata';

module.exports = {};

module.exports.connect = function(callback) {
    try { 
        sia.connect('siatest-sia:8000')
        .then((siad) => { this.siad = siad; callback(null, siad); })
        .catch((err) => { callback(err, null); });
    } catch (e) {
        callback(e, null);
        console.error('error connecting siad: ' + e.toString())
    }
}

module.exports.connectWithRetry = function(retryLimit, callback) {
    module.exports.connect((err, siad) => {
        if(err) {
            retryLimit--;
            if(retryLimit == 0)
                return callback("Retry limit reached", null);
            
            console.log("Failed connection to SIA, retrying (", retryLimit, ")");

            setTimeout(() => { module.exports.connectWithRetry(retryLimit, callback); }, 2000);
        } else {
            callback(null, siad);
        }
    })
}

module.exports.consensus = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/consensus')
    .then((consensus) => {
        callback(null, consensus);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.waitForSync = function(callback) {
    module.exports.consensus((err, consensus) => {
        if(err) return callback(err, null);

        if(consensus.synced) {
            callback(null, true);
        } else {
            console.log("Not yet synced, retrying after 5s. At height: ", consensus.height);
            setTimeout(() => { module.exports.waitForSync(callback); }, 5000);
        }
    });
}


module.exports.getSyncedInstance = function(callback) {
    module.exports.getConnectedInstance((err, siad) => {
        if(this.synced) {
            callback(null, siad);
        } else {
            module.exports.waitForSync((err, success) => {
                if(err) return callback(err, null);
                this.synced = true;
                callback(null, siad);
            });
        }
    });
}

module.exports.getConnectedInstance = function(callback) {

            module.exports.connectWithRetry(10, (err, siad) => {
                if(err) return callback(err, null);
                callback(null, siad);
            });

}


module.exports.walletSeeds = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/wallet/seeds')
    .then((seeds) => {
        callback(null, seeds);
    })
    .catch((err) => { callback(err, null); });
}


module.exports.walletStatus = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/wallet')
    .then((wallet) => {
        callback(null, wallet);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.unlockWallet = function(password, callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call({
        url: '/wallet/unlock',
        method: 'POST',
        qs : {
            encryptionpassword: password
        }
    })
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.initWallet = function(password, callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call({
        url: '/wallet/init',
        method: 'POST',
        qs: {
            encryptionpassword : password
        }
    })
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.shutdown = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    console.log("Shutting down SIA");
    this.siad.call('/stop')
    .then((response) => {
        callback(null, true);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.ensureWalletInitialized = function(callback) {

    const walletPassword = process.env.SIA_WALLET_PASSWORD || '';
    module.exports.walletStatus((err, walletStatus) => {
        if(err) return callback(err);
        if(walletStatus.unlocked) return callback(null);    
        module.exports.unlockWallet(walletPassword, (err, result) => {
            if(!err) return callback(null);
            if(err) console.error(err);
            module.exports.initWallet(walletPassword, (err, result) => {
                if(err) console.error(err);
                console.log(result);
                module.exports.unlockWallet(walletPassword, (err, result) => {
                    if(err) console.error(err);
                    callback(null);
                });
            });
        });
    });
}

module.exports.getNewAddress = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/wallet/address')
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.getAddresses = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/wallet/addresses')
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}


module.exports.renterStats = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/renter')
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.configureRenter = function(amountSC, amountBlocks, callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    var qs = {
        funds : module.exports.siaToHastings(amountSC).toString(),
        hosts : 50,
        period: amountBlocks,
        renewwindow: 288
    };

    console.log(qs);
    this.siad.call({
        method : 'POST',
        url: '/renter',
        qs: qs
    })
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.siaToHastings = function(sc) {
    return sia.siacoinsToHastings(sc);
}

module.exports.hastingsToSia = function(hastings) {
    return sia.hastingsToSiacoins(hastings);
}

module.exports.upload = function(source, target, callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call({
        method : 'POST',
        url: '/renter/upload/' + target,
        qs: {
            source : source
        }
    })
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.files = function(callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call('/renter/files')
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}

module.exports.download = function(filename, target, callback) {
    if(this.siad == null) return callback("Connect to Sia first", null);
    this.siad.call({
        url: '/renter/download/' + filename,
        qs: {
            destination : target
        },
        timeout: 60000
    })
    .then((response) => {
        callback(null, response);
    })
    .catch((err) => { callback(err, null); });
}