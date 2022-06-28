import { createDefaultAuthorizationResultCache, SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createInitializeMintInstruction, MINT_SIZE } from '@solana/spl-token' // IGNORE THESE ERRORS IF ANY
import idl from './idl.json';
import * as anchor from '@project-serum/anchor';

import {Program, Provider, web3, BN, getProvider,Wallet} from '@project-serum/anchor'
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// import { clusterApiUrl } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo } from 'react';

require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new SolanaMobileWalletAdapter({
                appIdentity: { name: 'Solana Create React App Starter App' },
                authorizationResultCache: createDefaultAuthorizationResultCache(),
            }),
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            // new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {


     const wallet = useAnchorWallet()
     console.log("wallet", wallet)
     function getProvider(){
        if (!wallet) {console.log("no wallet")
            return null
            
        }
        const network = "https://api.devnet.solana.com";
        const connection = new Connection(network, "processed")

        const provider = new Provider(
            connection, wallet, {"preflightCommitment": "processed"}
        );
        return provider
    }

   
    async function counter () {

        const provider = getProvider()
        console.log("Provider COnnected")
        
        if (!provider) {
            throw("Provider is NUll")
        }
        anchor.setProvider(provider)

        const a = JSON.stringify(idl)
        const b = JSON.parse(a)
        const program  = new Program(b, idl.metadata.address, provider)
        console.log("Program Activated")
    
        console.log("Program" , program)

        try {
            const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
                "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
              );
              const lamports: number =
                await program.provider.connection.getMinimumBalanceForRentExemption(
                  MINT_SIZE
                );
              console.log("lamports", lamports)
              const getMetadata = async (
                mint: anchor.web3.PublicKey
              ): Promise<anchor.web3.PublicKey> => {
                return (
                  await anchor.web3.PublicKey.findProgramAddress(
                    [
                      Buffer.from("metadata"),  
                      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                      mint.toBuffer(),
                    ],
                    TOKEN_METADATA_PROGRAM_ID
                  )
                )[0];
              };
              console.log("getMetadata Done")
              const getMasterEdition = async (
                mint: anchor.web3.PublicKey
              ): Promise<anchor.web3.PublicKey> => {
                return (
                  await anchor.web3.PublicKey.findProgramAddress(
                    [
                      Buffer.from("metadata"),
                      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                      mint.toBuffer(),
                      Buffer.from("edition"),
                    ],
                    TOKEN_METADATA_PROGRAM_ID
                  )
                )[0];
              };

              console.log("getMetadataMaster Done")

          
              const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
              console.log("mint key", mintKey)
              const NftTokenAccount = await getAssociatedTokenAddress(
                mintKey.publicKey,
                provider.wallet.publicKey
              );
              console.log("NFT Account: ", NftTokenAccount.toBase58());
          
              const mint_tx = new anchor.web3.Transaction().add(
                anchor.web3.SystemProgram.createAccount({
                  fromPubkey: provider.wallet.publicKey,
                  newAccountPubkey: mintKey.publicKey,
                  space: MINT_SIZE,
                  programId: TOKEN_PROGRAM_ID,
                  lamports,
                }),
                createInitializeMintInstruction(
                  mintKey.publicKey,
                  0,
                  provider.wallet.publicKey,
                  provider.wallet.publicKey
                ),
                createAssociatedTokenAccountInstruction(
                  provider.wallet.publicKey,
                  NftTokenAccount,
                  provider.wallet.publicKey,
                  mintKey.publicKey
                )
              );
              console.log("good to go!")
              console.log(mint_tx)
              const res = await program.provider.send(mint_tx, [mintKey]);
              console.log(
                await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
              );
          
              console.log("Account: ", res);
              console.log("Mint key: ", mintKey.publicKey.toString());
              console.log("User: ", provider.wallet.publicKey.toString());
          
              const metadataAddress = await getMetadata(mintKey.publicKey);
              const masterEdition = await getMasterEdition(mintKey.publicKey);
          
              console.log("Metadata address: ", metadataAddress.toBase58());
              console.log("MasterEdition: ", masterEdition.toBase58());
          
              const tx = await program.methods.mintNft(
                mintKey.publicKey,
                "https://arweave.net/ABzrMVcsndMCFnTJP6kk6v0E8_dCM7ei2g_SpD4K2BA",
                "Mint Func"
              )
                .accounts({
                  mintAuthority: provider.wallet.publicKey,
                  mint: mintKey.publicKey,
                  tokenAccount: NftTokenAccount,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  metadata: metadataAddress,
                  tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                  payer: provider.wallet.publicKey,
                  systemProgram: web3.SystemProgram.programId,
                  rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                  masterEdition: masterEdition,
                },
                )
                .rpc();
              console.log("Completed!!")
              console.log("Your transaction signature", tx);
              console.log("Mint Successful...")
            

        } catch(err) {
            console.log("err", err)
        }
    }

    return (
        <div className="App">
            <button onClick={counter}>mint button </button>
            <WalletMultiButton />
        </div>
    );
};


// import React from 'react';
// import './App.css';
// import Connect2Phantom from './components/Connect2Phantom';

// function App() {



//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Solana Examples</h1>
//         <hr className="fullWidth" />

//         <p>Hello there</p>
//         <Connect2Phantom/>
//         {/* <button>Mint</button> */}

//       </header>
//     </div>
//   );
// }

// export default App;
