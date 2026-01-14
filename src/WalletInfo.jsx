import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

const WalletInfo = () => {
  const { publicKey, connected, connect, disconnect } = useWallet();
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !publicKey) {
        setBalances([]);
        return;
      }
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
        const tokens = accounts.value.map(account => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
          };
        });
        setBalances(tokens);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBalances();
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="mb-6">
        <button onClick={connect} className="bg-[#0052FF] hover:bg-[#004AD9] text-white px-4 py-2 rounded-full text-sm font-medium">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-2xl p-4 mb-6">
      <div className="text-white text-sm mb-2">Wallet: {publicKey.toBase58()}</div>
      {balances.length === 0 ? (
        <div className="text-[#8A919E] text-sm">No tokens found</div>
      ) : (
        <ul className="text-sm text-[#8A919E] space-y-1">
          {balances.map(token => (
            <li key={token.mint}>{token.mint}: {token.amount}</li>
          ))}
        </ul>
      )}
      <button onClick={disconnect} className="mt-2 text-xs text-[#8A919E] hover:text-white">Disconnect</button>
    </div>
  );
};

export default WalletInfo;
