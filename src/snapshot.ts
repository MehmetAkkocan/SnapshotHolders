const fs = require("fs");
const anchor = require("@project-serum/anchor");
const web3 = require("@solana/web3.js");

const ankrENDPOINT = 'https://rpc.ankr.com/solana';
const projectSerumENDPOINT = 'https://solana-api.projectserum.com';
const mainnetENDPOINT = 'https://api.mainnet-beta.solana.com';

var dataMint = fs.readFileSync("./src/hashlist.json");
var mintArray = JSON.parse(dataMint);

const connection = new anchor.web3.Connection(
    ankrENDPOINT,
    {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 10 * 1000
    }
);

const TOKEN_PUBKEY = new web3.PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

var holders: any = {};

async function getNftOwner() {    
    (async () => {
        let processNum: number = 0;
        for (let mintAddress of mintArray) {
            try {
                let filter = {
                    memcmp: {
                        offset: 0,
                        bytes: mintAddress,
                    },
                };
                let filter2 = {
                    dataSize: 165,
                };
                let getFilter = [filter, filter2];
                let programAccountsConfig = { filters: getFilter, encoding: "jsonParsed", timeout: 1000 };
                let _listOfTokens = await connection.getParsedProgramAccounts(
                    TOKEN_PUBKEY,
                    programAccountsConfig
                );
                for (let i = 0; i < _listOfTokens.length; i++) {
                    if (
                        _listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"]["amount"] == 1
                    ) {
                        if (!holders[_listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"]]) {
                            holders[_listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"]] = {
                                amount: +_listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"]["amount"],
                                mints: [mintAddress],
                            }
                        }
                        else {
                            holders[_listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"]].amount += +_listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"]["amount"];
                            holders[_listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"]].mints.push(mintAddress);
                        }
                    }

                }
            } 
            catch (e) {
                console.log(e);
            }

            processNum++;
            console.log("Process: " + processNum + "/" + mintArray.length);           
        }
        
        fs.writeFileSync("./src/snapshots/gib-holders.json", JSON.stringify(holders));
    })();
};

export default getNftOwner();