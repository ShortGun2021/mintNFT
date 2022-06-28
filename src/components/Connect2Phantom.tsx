import { FC, useEffect, useState } from "react";
import * as anchor from '@project-serum/anchor';
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createInitializeMintInstruction, MINT_SIZE } from '@solana/spl-token' // IGNORE THESE ERRORS IF ANY

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from '../idl.json'
import {Program, Provider, web3, BN, getProvider,Wallet} from '@project-serum/anchor'


type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface ConnectOpts {
    onlyIfTrusted: boolean;
}

interface PhantomProvider {
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: ()=>Promise<void>;
    on: (event: PhantomEvent, callback: (args:any)=>void) => void;
    isPhantom: boolean;
}

type WindowWithSolana = Window & { 
    solana?: PhantomProvider;
}



const Connect2Phantom: FC = () => {

    const [ walletAvail, setWalletAvail ] = useState(false);
    const [ provider, setProvider ] = useState<PhantomProvider | null>(null);
    const [ connected, setConnected ] = useState(false);
    const [ pubKey, setPubKey ] = useState<PublicKey | null>(null);







    useEffect( ()=>{
        if ("solana" in window) {
            const solWindow = window as WindowWithSolana;
            if (solWindow?.solana?.isPhantom) {
                setProvider(solWindow.solana);
                setWalletAvail(true);
                // Attemp an eager connection
                solWindow.solana.connect({ onlyIfTrusted: true });
            }
        }
    }, []);

    useEffect( () => {
        provider?.on("connect", (publicKey: PublicKey)=>{ 
            console.log(`connect event: ${publicKey}`);
            setConnected(true); 
            setPubKey(publicKey);
        });
        provider?.on("disconnect", ()=>{ 
            console.log("disconnect event");
            setConnected(false); 
            setPubKey(null);
        });

    }, [provider]);

    console.log("pubkeu", pubKey)
    const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        console.log(`connect handler`);
        provider?.connect()
        .catch((err) => { console.error("connect ERROR:", err); });
    }
   
    
    

    const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        console.log("disconnect handler");
        provider?.disconnect()
        .catch((err) => {console.error("disconnect ERROR:", err); });
    }



    const wallet =  useAnchorWallet()
    console.log("wallet",wallet)
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

    console.log('provider', provider)
   
    async function counter () {
        const provider = getProvider()
        console.log("Provider COnnected")
        
        if (!provider) {
            throw("Provider is NUll")
        }
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
                  0
                );
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
              // const res = await program.provider.sendAndConfirm(mint_tx, [mintKey]);
              // console.log(
              //   await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
              // );
          
              // console.log("Account: ", res);
              // console.log("Mint key: ", mintKey.publicKey.toString());
              // console.log("User: ", provider.wallet.publicKey.toString());
          
              // const metadataAddress = await getMetadata(mintKey.publicKey);
              // const masterEdition = await getMasterEdition(mintKey.publicKey);
          
              // console.log("Metadata address: ", metadataAddress.toBase58());
              // console.log("MasterEdition: ", masterEdition.toBase58());
          
              // const tx = await program.methods.mintNft(
              //   mintKey.publicKey,
              //   "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
              //   "NFT Title",
              // )
              //   .accounts({
              //     mintAuthority: provider.wallet.publicKey,
              //     mint: mintKey.publicKey,
              //     tokenAccount: NftTokenAccount,
              //     tokenProgram: TOKEN_PROGRAM_ID,
              //     metadata: metadataAddress,
              //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              //     payer: provider.wallet.publicKey,
              //     systemProgram: web3.SystemProgram.programId,
              //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              //     masterEdition: masterEdition,
              //   },
              //   )
              //   .rpc();
              // console.log("Your transaction signature", tx);
            

        } catch(err) {
            console.log("err", err)
        }
    }


  



    return (
        <>
    
        <div>
            { walletAvail ?
                <>
                <button disabled={connected} onClick={connectHandler}>Connect to Phantom</button>
                <button disabled={!connected} onClick={disconnectHandler}>Disconnect from Phantom</button>
                { connected ? <p>Your public key is : {pubKey?.toBase58()}</p> : null }
                </>
            :
                <>
                <p>Opp!!! Phantom is not available. Go get it <a href="https://phantom.app/">https://phantom.app/</a>.</p>
                </>
            }
        </div>
        <p>URL 1 : "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA" </p>
        <button onClick={counter}>Mint</button>
        </>

    );



}







export default Connect2Phantom;

const Content: FC =() =>{
  const wallet = useAnchorWallet()

  function getProvider(){
    if (!wallet) {
      return null;
    }

    const network = "http://127.0.0.1:899"
    const connection = new Connection(network, "processed")

    const provider = new Provider(
      connection, wallet, {"preflightCommitment": "processed"}
    )
    return provider
  }

  return (
    <button>Mint2</button>
  )
}


