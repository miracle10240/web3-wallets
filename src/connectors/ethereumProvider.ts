import {
    WalletNames,
    ProviderConnectInfo,
    ProviderMessage,
    ProviderRpcError
} from '../types'
import {BaseProvider} from "./baseProvider";


// https://github.com/metamask/test-dapp
// https://metamask.github.io/test-dapp/
export class EthereumProvider extends BaseProvider {
    public walletName: WalletNames = 'metamask'

    constructor(name?: WalletNames) {
        super()
        this.provider = window && window.ethereum
        if (this.provider) {
            if (this.provider.overrideIsMetaMask) {
                const provider = this.provider.providerMap.get("MetaMask")
                this.provider = provider
            }
            // @ts-ignore
            if (!this.provider.isMetaMask &&  window.web3) {
                // @ts-ignore
                const provider =window.web3.currentProvider
                this.provider = provider
            }
            // debugger
            // this.chainId =this.provider.networkVersion
            //     ? Number(this.provider.networkVersion)
            //     : this.provider.chainId ? Number(this.provider.chainId):0
            // this.address = this.provider.selectedAddress
            // this.accounts = [this.address]
        } else {
            throw new Error('Install web3 wallet')
        }

        const provider = this.provider
        if (provider && provider.isImToken) {
            this.walletName = 'imtoken'
        }
        if (provider && provider.isMathWallet) {
            this.walletName = 'math_wallet'
        }
        if (provider && provider.isTokenPocket) {
            this.walletName = 'token_pocket'
        }
        // @ts-ignore
        if (name == "bitkeep" && window.bitkeep) {
            // @ts-ignore
            this.provider = window.bitkeep.ethereum;
            this.walletName = 'bitkeep'
            //isBitKeep
            //isBitEthereum: true
            //isBitKeepChrome: true
        }
        // @ts-ignore
        if (name == "onekey" && window.$onekey) {
            // @ts-ignore
            this.provider = window.$onekey.ethereum
            this.walletName = 'onekey'
            // if ($onekey) return $onekey.ethereum.isOneKey
        }

        // @ts-ignore
        if (name == "onto_wallet" && window.onto) {
            // ethereum && ethereum.isONTO
            // @ts-ignore
            this.provider = window.onto
            this.walletName = 'onto_wallet'
        }

        this.registerProviderEvents(this.provider)

    }

    private registerProviderEvents(provider) {
        // Events
        provider.on('connect', (connectInfo: ProviderConnectInfo) => {
            console.log('Matemask connect SDK', connectInfo)
            this.emit('connect', connectInfo)
        })

        provider.on('disconnect', (error: ProviderRpcError) => {
            // console.log('Matemask disconnect', error)
            this.emit('Matemask disconnect', error)
            this.provider = undefined
            this.chainId = 0
            this.address = ''
            this.accounts = []
        })

        provider.on('chainChanged', async (chainId: string) => {
            console.log('Matemask chainChanged SDK', chainId)
            this.chainId = Number(chainId)
            this.emit('chainChanged', chainId)
        })

        provider.on('accountsChanged', async (accounts: Array<string>) => {
            console.log('Matemask accountsChanged SDK', accounts)
            this.address = accounts[0]
            this.accounts = accounts
            this.emit('accountsChanged', accounts)
        })

        //eth_subscription
        provider.on('message', (payload: ProviderMessage) => {
            // console.log('Matemask RPC message', payload)
            this.emit('message', payload)
        })
    }

    isUnlocked() {
        return this.provider?._metamask?.isUnlocked()
    }

    static openDownload(name: WalletNames) {
        const provider = window && window.ethereum;
        if (!provider && name == 'metamask') {
            window.open('https://metamask.io/download/');
        }
        if (!provider && name == 'bitkeep') {
            window.open('https://bitkeep.com/download?type=0&theme=light');
        }

        if (!provider && name == 'onekey') {
            window.open('https://onekey.so/download/?client=browserExtension');
        }
    }
}

// async request(args: RequestArguments): Promise<unknown> {
//     return new Promise<unknown>(async (resolve, reject) => {
//         const result = await this.provider.request(args)
//         resolve(result)
//     })
// };



// const ye = {
//     chainId: 1,
//     rpcUrl: "https://api.bitski.com/v1/web3/mainnet"
// }
//     , be = {
//     chainId: 4,
//     rpcUrl: "https://api.bitski.com/v1/web3/rinkeby"
// }
//     , we = {
//     chainId: 137,
//     rpcUrl: "https://api.bitski.com/v1/web3/polygon"
// }
//     , _e = {
//     chainId: 80001,
//     rpcUrl: "https://api.bitski.com/v1/web3/mumbai"
// };
