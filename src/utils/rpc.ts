import {ethers} from "ethers";
import {get1559Fee} from "./fee";
import {ChainConfig, LimitedCallSpec, WalletInfo, TransactionRequest, TransactionResponse} from "../types";

import {getProvider} from "./provider";
import {CHAIN_CONFIG, BigNumber} from '../constants'
import {fetch} from "./hepler";
import {Web3Provider} from "@ethersproject/providers";


export async function getFeeHistory(rpcUrl: string, blockRange: number, percentiles: number[]) {
    const feeHistory = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_feeHistory",
        "params": [blockRange, "latest", percentiles]
    }
    const feeHistoryRes = await ethers.utils.fetchJson(rpcUrl, JSON.stringify(feeHistory))
    return feeHistoryRes.result
    // console.log(Number(feeHistoryRes.result.oldestBlock))
}

export function getChainInfo(chinaId: number): ChainConfig {
    if (CHAIN_CONFIG[chinaId]) {
        return CHAIN_CONFIG[chinaId]
    } else {
        throw new Error(`Chain id ${chinaId} not config`)
    }
}

export async function getChainRpcUrl(chinaId: number, best?: true): Promise<string> {
    const chainNodes = getChainInfo(chinaId)
    const rpcs = chainNodes.rpcs
    try {
        if (rpcs.length > 1 && best) {
            const wait = rpcs.map(async (url: string) => {
                return fetch(url, {method: 'HEAD'})
            })
            const req = await Promise.race(wait)
            return req.url
        } else {
            return rpcs[0]
        }
    } catch (error: any) {
        throw error
    }
}

export async function getEstimateGas(rpcUrl: string, callData: LimitedCallSpec) {
    if (callData.value && callData.value.toString().substr(0, 2) != '0x') {
        callData.value = '0x' + Number(callData.value.toString()).toString(16)
    }
    const estimate = {
        "jsonrpc": "2.0",
        "method": "eth_estimateGas",
        "params": [callData, 'latest'],
        "id": 1
    }
    const gasData = await ethers.utils.fetchJson(rpcUrl, JSON.stringify(estimate))
    if (gasData.result) {
        return Number(gasData.result).toString()
    } else {
        throw gasData.error
    }
}

export async function ethSend(wallet: WalletInfo, callData: LimitedCallSpec): Promise<TransactionResponse> {
    const {walletSigner, address, rpcUrl} = getProvider(wallet)
    const signer = wallet.provider ? new Web3Provider(wallet.provider).getSigner(address) : walletSigner

    // console.log("ethSend signer", signer)
    let value = ethers.BigNumber.from(0)
    if (callData.value) {
        value = ethers.BigNumber.from(callData.value)
    }
    const transactionObject = {
        from: wallet.address,
        to: callData.to,
        data: callData.data,
        value
    } as TransactionRequest

    if (wallet.chainId == 97 || wallet.chainId == 56
        || wallet.chainId == 43113 || wallet.chainId == 43114
        || wallet.chainId == 137 || wallet.chainId == 80001
    ) {
        wallet.offsetGasLimitRatio = wallet.offsetGasLimitRatio || 1.5
    }

    if (wallet.offsetGasLimitRatio) {
        if (wallet.offsetGasLimitRatio < 1) throw 'Offset must be greater than 1 '
        const offsetRatio = wallet.offsetGasLimitRatio || 1
        const gasLimit = await signer.estimateGas(transactionObject)
        const offsetGasLimit = new BigNumber(gasLimit.toString() || "0").times(offsetRatio).toFixed(0)
        transactionObject.gasLimit = ethers.BigNumber.from(offsetGasLimit)
    }

    if (wallet.isSetGasPrice) {
        const tx: TransactionRequest = await signer.populateTransaction(transactionObject).catch(async (error: any) => {
            throw error
        })
        if (tx?.type == 2) {
            const fee = await get1559Fee(rpcUrl?.url)
            transactionObject.maxFeePerGas = ethers.BigNumber.from(fee.maxFeePerGas) //?.mul(gasPriceOffset).div(100).toNumber()
            transactionObject.maxPriorityFeePerGas = ethers.BigNumber.from(fee.maxPriorityFeePerGas) //?.mul(gasPriceOffset).div(100).toNumber()
        } else {
            const fee = await signer.getFeeData()
            const gasPrice = ethers.utils.formatUnits(fee.gasPrice || 5, 'gwei')
            // console.log("GasPrice", gasPrice)
            transactionObject.gasPrice = ethers.BigNumber.from(gasPrice)
        }
    }

    if (callData.gasLimit) {
        transactionObject.gasLimit = ethers.BigNumber.from(callData.gasLimit)
    }

    try {
        return signer.sendTransaction(transactionObject).catch((e: any) => {
            throw e
        })
    } catch (e: any) {
        throw e
    }
}


