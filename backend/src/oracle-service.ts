import { ethers } from 'ethers';
import { ORACLE_ABI, MARKET_ABI } from './contracts';

/**
 * OracleService — wraps the SimpleOracle contract with a signing wallet.
 * The owner of the deployed SimpleOracle must be the wallet using ORACLE_PRIVATE_KEY.
 */
export class OracleService {
  private oracleSigner: ethers.Wallet;
  private oracle: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private trackedMarkets: Map<string, { expiry: number; question: string }> = new Map();

  constructor(
    provider: ethers.JsonRpcProvider,
    oracleAddress: string,
    privateKey: string
  ) {
    this.provider = provider;
    this.oracleSigner = new ethers.Wallet(privateKey, provider);
    this.oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, this.oracleSigner);
  }

  /** Track a market for monitoring */
  addMarket(address: string, expiry: number, question: string) {
    this.trackedMarkets.set(address.toLowerCase(), { expiry, question });
  }

  getTrackedMarkets() {
    return this.trackedMarkets;
  }

  getSignerAddress(): string {
    return this.oracleSigner.address;
  }

  /**
   * Resolve a market via the oracle contract.
   * Calls oracle.resolveMarket() which internally calls market.resolve().
   */
  async resolveMarket(
    marketAddress: string,
    outcomeYes: boolean
  ): Promise<ethers.TransactionReceipt | null> {
    console.log(
      `[Oracle] Resolving market ${marketAddress} with outcome: ${outcomeYes ? 'YES' : 'NO'}`
    );
    const tx = await this.oracle.resolveMarket(marketAddress, outcomeYes);
    const receipt = await tx.wait();
    console.log(`[Oracle] Market ${marketAddress} resolved. Tx: ${receipt?.hash}`);
    return receipt;
  }

  /**
   * Check all tracked markets for expired+unresolved status.
   * Logs them — actual resolution requires external data or manual trigger.
   */
  async checkExpiredMarkets(): Promise<string[]> {
    const now = Math.floor(Date.now() / 1000);
    const expired: string[] = [];

    for (const [addr, info] of this.trackedMarkets.entries()) {
      try {
        const market = new ethers.Contract(addr, MARKET_ABI, this.provider);
        const resolved: boolean = await market.resolved();

        if (info.expiry < now && !resolved) {
          expired.push(addr);
          console.log(
            `[Oracle] Market ${addr} ("${info.question}") expired and awaiting resolution`
          );
        }
      } catch (err) {
        console.error(`[Oracle] Error checking market ${addr}:`, err);
      }
    }

    return expired;
  }
}
