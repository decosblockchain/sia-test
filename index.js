const siaUtil = require("./util");
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');


function printAddress() { 
    siaUtil.getConnectedInstance((err, siad) => {
        siaUtil.getNewAddress((err, result) => {
            console.log(result);
        });
    });
}

function ensureEnoughAllowance(callback) {
    siaUtil.getConnectedInstance((err, siad) => {
        if(err) return callback(err, null);
        siaUtil.ensureWalletInitialized((err) => {
            if(err) return callback(err, null);
            siaUtil.renterStats((err, result) => {
                if(err) return callback(err, null);
                var sc = siaUtil.hastingsToSia(result.settings.allowance.funds).toNumber();
                if(sc < 100) {
                    siaUtil.configureRenter(1000, 4320, (err, result) => {
                        if(err) return callback(err, null);
                        console.log("Renter result:", result);
                        callback(null, true);
                    });
                } else {
                    callback(null, true);
                }
            });
        });
    });
}

function uploadFile() {
    ensureEnoughAllowance((err, result) => {
        var fileName =  uuidv4() + '.pdf';
        fs.copyFileSync(path.join(__dirname,"doc.pdf"), "/mnt/files/" + fileName);
        siaUtil.upload("/mnt/files/" + fileName, 'docs/' + fileName, (err, result) => {
            if(err) console.error(err);
            console.log(result);
            setInterval(() => {
                siaUtil.files((err, files) => {
                    if(err) console.error(err);
                    console.log(files);
                    
                });
            }, 5000);
        });
    });
}

function downloadFile() {
    if(fs.existsSync('/mnt/files/test.pdf'))
        fs.unlinkSync('/mnt/files/test.pdf');

    siaUtil.getConnectedInstance((err, siad) => {
        siaUtil.ensureWalletInitialized((err) => {
            if(err) return callback(err, null);
            siaUtil.download('docs/27708069-1954-42bc-96e0-3edbdd649883.pdf', '/mnt/files/test.pdf', (err, result) => {
                if(err) return console.error(err);
                console.log(fs.statSync('/mnt/files/test.pdf'));
            });
        });
    });
}

downloadFile();