// TypeScript
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import {
    ProviderAccounts,
    WalletNames,
    ProviderConnectInfo,
    ProviderMessage, ProviderRpcError
} from '../types'
import {BaseProvider} from "./baseProvider";

function makeWeb3Provider() {
    const APP_NAME = 'Coinbase'
    const APP_LOGO_URL = 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg'
    const DEFAULT_ETH_JSONRPC_URL = "https://mainnet-infura.wallet.coinbase.com"
    const DEFAULT_CHAIN_ID = 1;
    const coinbaseWallet = new CoinbaseWalletSDK({
        appName: APP_NAME,
        appLogoUrl: APP_LOGO_URL,
        darkMode: false
    });
    return coinbaseWallet.makeWeb3Provider(DEFAULT_ETH_JSONRPC_URL, DEFAULT_CHAIN_ID)
}

export class CoinbaseProvider extends BaseProvider {
    public walletName: WalletNames = 'coinbase'

    constructor() {
        super()
        this.provider = window.ethereum
        if (this.provider) {
            // adapter coinbase wallet
            // isCoinbaseWallet
            if (this.provider.overrideIsMetaMask) {
                const provider = this.provider.providerMap.get("CoinbaseWallet")
                if (!provider) {
                    this.provider = makeWeb3Provider()
                }
                this.provider = provider
            }
        } else {
            this.provider = makeWeb3Provider()
        }

        // this.address = this.provider.selectedAddress
        // this.accounts = [this.address]
        // this.chainId = Number(this.provider.chainId)
        this.registerProviderEvents(this.provider)
    }

    private registerProviderEvents(provider) {
        // Events
        provider.on('connect', (connectInfo: ProviderConnectInfo) => {
            // console.log('CoinbaseWallet connect SDK', connectInfo)
            this.emit('connect', connectInfo)
        })

        provider.on('disconnect', (error: ProviderRpcError) => {
            // console.log('Matemask disconnect', error)
            this.emit('CoinbaseWallet disconnect', error)
            this.provider = undefined
            this.chainId = 0
            this.address = ''
            this.accounts = []
            this.emit('disconnect', error)
        })

        provider.on('chainChanged', async (chainId: number) => {
            // console.log('CoinbaseWallet chainChanged SDK', chainId)
            this.chainId = chainId
            this.emit('chainChanged', `0x${chainId.toString(16)}`)
        })

        provider.on('accountsChanged', async (accounts: ProviderAccounts) => {
            // console.log('CoinbaseWallet accountsChanged SDK', accounts)
            this.address = accounts[0]
            this.accounts = accounts
            this.emit('accountsChanged', accounts)
        })

        //eth_subscription
        provider.on('message', (payload: ProviderMessage) => {
            // console.log('CoinbaseWallet message SDK', payload)
            this.emit('message', payload)
        })
    }


}
