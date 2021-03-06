const _ = require('lodash');
const { Transaction, TxIn, UnspentTxOut, validateTransaction } = require('./transaction');
const {saveTransaction} = require('../utils/storeChain');
let transactionPool = [];

const getTransactionPool = () => {
    return _.cloneDeep(transactionPool);
};

const addToTransactionPool = (tx, unspentTxOuts) => {

    if (!validateTransaction(tx, unspentTxOuts)) {
        throw Error('Trying to add invalid tx to pool');
    }

    if (!isValidTxForPool(tx, transactionPool)) {
        throw Error('Trying to add invalid tx to pool');
    }
    console.log('adding to txPool: %s', JSON.stringify(tx));
    transactionPool.push(tx);
    saveTransaction(transactionPool)
};

const hasTxIn = (txIn, unspentTxOuts) => {
    const foundTxIn = unspentTxOuts.find((uTxO) => {
        return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex;
    });
    return foundTxIn !== undefined;
};

const updateTransactionPool = (unspentTxOuts) => {
    const invalidTxs = [];
    for (const tx of transactionPool) {
        for (const txIn of tx.txIns) {
            if (!hasTxIn(txIn, unspentTxOuts)) {
                invalidTxs.push(tx);
                break;
            }
        }
    }
    if (invalidTxs.length > 0) {
        console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
        transactionPool = _.without(transactionPool, ...invalidTxs);
        saveTransaction(transactionPool)
    }

};

const getTxPoolIns = (aTransactionPool) => {
    return _(aTransactionPool)
        .map((tx) => tx.txIns)
        .flatten()              // remove 1 outer array
        .value();               // perform all library lodash function 
};

const isValidTxForPool = (tx, aTtransactionPool) => {
    const txPoolIns = getTxPoolIns(aTtransactionPool);

    const containsTxIn = (txIns, txIn) => {
        return _.find(txPoolIns, ((txPoolIn) => {
            return txIn.txOutIndex === txPoolIn.txOutIndex && txIn.txOutId === txPoolIn.txOutId;
        }));
    };

    for (const txIn of tx.txIns) {
        if (containsTxIn(txPoolIns, txIn)) {
            console.log('txIn already found in the txPool');
            return false;
        }
    }
    return true;
};

const setTransactionPool = (transactionPool) => {
    this.transactionPool = transactionPool;
}
module.exports = { addToTransactionPool, getTransactionPool, updateTransactionPool, setTransactionPool };