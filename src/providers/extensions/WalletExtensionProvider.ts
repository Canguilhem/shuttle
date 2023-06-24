import type { BroadcastResult, SigningResult, SimulateResult } from "../../internals/transactions";
import type { TransactionMsg } from "../../internals/transactions/messages";
import type { ExtensionProviderAdapter } from "../../internals/adapters";
import type { Network } from "../../internals/network";
import type { WalletConnection } from "../../internals/wallet";
import SimulateClient from "../../internals/cosmos/SimulateClient";

export abstract class WalletExtensionProvider {
  id: string;
  name: string;
  networks: Map<string, Network>;
  initializing: boolean = false;
  initialized: boolean = false;
  onUpdate?: () => void;

  extensionProviderAdapter: ExtensionProviderAdapter;

  constructor({
    id,
    name,
    networks,
    extensionProviderAdapter,
  }: {
    id: string;
    name: string;
    networks: Network[];
    extensionProviderAdapter: ExtensionProviderAdapter;
  }) {
    this.id = id;
    this.name = name;
    this.networks = new Map(networks.map((network) => [network.chainId, network]));
    this.extensionProviderAdapter = extensionProviderAdapter;
  }

  setOnUpdateCallback(callback: () => void): void {
    this.onUpdate = callback;
  }

  async init(): Promise<void> {
    if (this.initializing || this.initialized) {
      return;
    }

    this.initializing = true;

    await this.extensionProviderAdapter.init(this);

    this.initialized = true;
    this.initializing = false;
  }

  async connect({ chainId }: { chainId: string }): Promise<WalletConnection> {
    if (!this.extensionProviderAdapter.isReady()) {
      throw new Error(`${this.name} is not available`);
    }

    const network = this.networks.get(chainId);
    if (!network) {
      throw new Error(`Network with chainId "${chainId}" not found`);
    }

    return await this.extensionProviderAdapter.connect(this, { network });
  }

  async disconnect({ wallet }: { wallet: WalletConnection }): Promise<void> {
    if (!this.extensionProviderAdapter.isReady()) {
      return;
    }

    const network = this.networks.get(wallet.network.chainId);
    if (!network) {
      return;
    }

    return await this.extensionProviderAdapter.disconnect(this, { network });
  }

  async simulate({
    messages,
    wallet,
  }: {
    messages: TransactionMsg[];
    wallet: WalletConnection;
  }): Promise<SimulateResult> {
    if (!this.extensionProviderAdapter.isReady()) {
      throw new Error(`${this.name} is not available`);
    }

    const network = this.networks.get(wallet.network.chainId);

    if (!network) {
      throw new Error(`Network with chainId "${wallet.network.chainId}" not found`);
    }

    const currentWallet = await this.connect({ chainId: network.chainId });

    if (currentWallet.account.address !== wallet.account.address) {
      throw new Error("Wallet not connected");
    }

    return SimulateClient.run({
      network,
      wallet,
      messages,
    });
  }

  async sign({
    messages,
    wallet,
    feeAmount,
    gasLimit,
    memo,
    overrides,
  }: {
    messages: TransactionMsg[];
    wallet: WalletConnection;
    feeAmount?: string | null;
    gasLimit?: string | null;
    memo?: string | null;
    overrides?: {
      rpc?: string;
      rest?: string;
    };
  }): Promise<SigningResult> {
    if (!this.extensionProviderAdapter.isReady()) {
      throw new Error(`${this.name} is not available`);
    }

    const network = this.networks.get(wallet.network.chainId);

    if (!network) {
      throw new Error(`Network with chainId "${wallet.network.chainId}" not found`);
    }

    const currentWallet = await this.connect({ chainId: network.chainId });

    if (currentWallet.account.address !== wallet.account.address) {
      throw new Error("Wallet not connected");
    }

    return await this.extensionProviderAdapter.sign(this, {
      network,
      wallet,
      messages,
      feeAmount,
      gasLimit,
      memo,
      overrides,
    });
  }

  async broadcast({
    messages,
    wallet,
    feeAmount,
    gasLimit,
    memo,
    overrides,
  }: {
    messages: TransactionMsg[];
    wallet: WalletConnection;
    feeAmount?: string | null;
    gasLimit?: string | null;
    memo?: string | null;
    overrides?: {
      rpc?: string;
      rest?: string;
    };
  }): Promise<BroadcastResult> {
    if (!this.extensionProviderAdapter.isReady()) {
      throw new Error(`${this.name} is not available`);
    }

    const network = this.networks.get(wallet.network.chainId);

    if (!network) {
      throw new Error(`Network with chainId "${wallet.network.chainId}" not found`);
    }

    const currentWallet = await this.connect({ chainId: network.chainId });

    if (currentWallet.account.address !== wallet.account.address) {
      throw new Error("Wallet not connected");
    }

    return await this.extensionProviderAdapter.signAndBroadcast(this, {
      network,
      wallet,
      messages,
      feeAmount,
      gasLimit,
      memo,
      overrides,
    });
  }
}

export type WalletProvider = WalletExtensionProvider;

export default WalletExtensionProvider;