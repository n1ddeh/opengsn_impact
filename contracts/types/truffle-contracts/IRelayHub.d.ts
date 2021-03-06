/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface IRelayHubContract extends Truffle.Contract<IRelayHubInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<IRelayHubInstance>;
}

export interface Deposited {
  name: "Deposited";
  args: {
    paymaster: string;
    from: string;
    amount: BN;
    0: string;
    1: string;
    2: BN;
  };
}

export interface HubDeprecated {
  name: "HubDeprecated";
  args: {
    fromBlock: BN;
    0: BN;
  };
}

export interface RelayHubConfigured {
  name: "RelayHubConfigured";
  args: {
    config: {
      maxWorkerCount: BN;
      gasReserve: BN;
      postOverhead: BN;
      gasOverhead: BN;
      maximumRecipientDeposit: BN;
      minimumUnstakeDelay: BN;
      minimumStake: BN;
      dataGasCostPerByte: BN;
      externalCallDataCostOverhead: BN;
    };
    0: {
      maxWorkerCount: BN;
      gasReserve: BN;
      postOverhead: BN;
      gasOverhead: BN;
      maximumRecipientDeposit: BN;
      minimumUnstakeDelay: BN;
      minimumStake: BN;
      dataGasCostPerByte: BN;
      externalCallDataCostOverhead: BN;
    };
  };
}

export interface RelayServerRegistered {
  name: "RelayServerRegistered";
  args: {
    relayManager: string;
    baseRelayFee: BN;
    pctRelayFee: BN;
    relayUrl: string;
    0: string;
    1: BN;
    2: BN;
    3: string;
  };
}

export interface RelayWorkersAdded {
  name: "RelayWorkersAdded";
  args: {
    relayManager: string;
    newRelayWorkers: string[];
    workersCount: BN;
    0: string;
    1: string[];
    2: BN;
  };
}

export interface TransactionRejectedByPaymaster {
  name: "TransactionRejectedByPaymaster";
  args: {
    relayManager: string;
    paymaster: string;
    from: string;
    to: string;
    relayWorker: string;
    selector: string;
    innerGasUsed: BN;
    reason: string;
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: BN;
    7: string;
  };
}

export interface TransactionRelayed {
  name: "TransactionRelayed";
  args: {
    relayManager: string;
    relayWorker: string;
    from: string;
    to: string;
    paymaster: string;
    selector: string;
    status: BN;
    charge: BN;
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: BN;
    7: BN;
  };
}

export interface TransactionResult {
  name: "TransactionResult";
  args: {
    status: BN;
    returnValue: string;
    0: BN;
    1: string;
  };
}

export interface Withdrawn {
  name: "Withdrawn";
  args: {
    account: string;
    dest: string;
    amount: BN;
    0: string;
    1: string;
    2: BN;
  };
}

type AllEvents =
  | Deposited
  | HubDeprecated
  | RelayHubConfigured
  | RelayServerRegistered
  | RelayWorkersAdded
  | TransactionRejectedByPaymaster
  | TransactionRelayed
  | TransactionResult
  | Withdrawn;

export interface IRelayHubInstance extends Truffle.ContractInstance {
  /**
   * Add new worker addresses controlled by sender who must be a staked Relay Manager address. Emits a RelayWorkersAdded event. This function can be called multiple times, emitting new events
   */
  addRelayWorkers: {
    (
      newRelayWorkers: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      newRelayWorkers: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      newRelayWorkers: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      newRelayWorkers: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  registerRelayServer: {
    (
      baseRelayFee: number | BN | string,
      pctRelayFee: number | BN | string,
      url: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      baseRelayFee: number | BN | string,
      pctRelayFee: number | BN | string,
      url: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      baseRelayFee: number | BN | string,
      pctRelayFee: number | BN | string,
      url: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      baseRelayFee: number | BN | string,
      pctRelayFee: number | BN | string,
      url: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  /**
   * Deposits ether for a contract, so that it can receive (and pay for) relayed transactions. Unused balance can only be withdrawn by the contract itself, by calling withdraw. Emits a Deposited event.
   */
  depositFor: {
    (target: string, txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(target: string, txDetails?: Truffle.TransactionDetails): Promise<void>;
    sendTransaction(
      target: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      target: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  /**
   * Withdraws from an account's balance, sending it back to it. Relay managers call this to retrieve their revenue, and contracts can also use it to reduce their funding. Emits a Withdrawn event.
   */
  withdraw: {
    (
      amount: number | BN | string,
      dest: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      amount: number | BN | string,
      dest: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      amount: number | BN | string,
      dest: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      amount: number | BN | string,
      dest: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  relayCall: {
    (
      maxAcceptanceBudget: number | BN | string,
      relayRequest: {
        request: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        };
        relayData: {
          gasPrice: number | BN | string;
          pctRelayFee: number | BN | string;
          baseRelayFee: number | BN | string;
          relayWorker: string;
          paymaster: string;
          forwarder: string;
          paymasterData: string;
          clientId: number | BN | string;
        };
      },
      signature: string,
      approvalData: string,
      externalGasLimit: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      maxAcceptanceBudget: number | BN | string,
      relayRequest: {
        request: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        };
        relayData: {
          gasPrice: number | BN | string;
          pctRelayFee: number | BN | string;
          baseRelayFee: number | BN | string;
          relayWorker: string;
          paymaster: string;
          forwarder: string;
          paymasterData: string;
          clientId: number | BN | string;
        };
      },
      signature: string,
      approvalData: string,
      externalGasLimit: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<{ 0: boolean; 1: string }>;
    sendTransaction(
      maxAcceptanceBudget: number | BN | string,
      relayRequest: {
        request: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        };
        relayData: {
          gasPrice: number | BN | string;
          pctRelayFee: number | BN | string;
          baseRelayFee: number | BN | string;
          relayWorker: string;
          paymaster: string;
          forwarder: string;
          paymasterData: string;
          clientId: number | BN | string;
        };
      },
      signature: string,
      approvalData: string,
      externalGasLimit: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      maxAcceptanceBudget: number | BN | string,
      relayRequest: {
        request: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        };
        relayData: {
          gasPrice: number | BN | string;
          pctRelayFee: number | BN | string;
          baseRelayFee: number | BN | string;
          relayWorker: string;
          paymaster: string;
          forwarder: string;
          paymasterData: string;
          clientId: number | BN | string;
        };
      },
      signature: string,
      approvalData: string,
      externalGasLimit: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  penalize: {
    (
      relayWorker: string,
      beneficiary: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      relayWorker: string,
      beneficiary: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      relayWorker: string,
      beneficiary: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      relayWorker: string,
      beneficiary: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  setConfiguration: {
    (
      _config: {
        maxWorkerCount: number | BN | string;
        gasReserve: number | BN | string;
        postOverhead: number | BN | string;
        gasOverhead: number | BN | string;
        maximumRecipientDeposit: number | BN | string;
        minimumUnstakeDelay: number | BN | string;
        minimumStake: number | BN | string;
        dataGasCostPerByte: number | BN | string;
        externalCallDataCostOverhead: number | BN | string;
      },
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _config: {
        maxWorkerCount: number | BN | string;
        gasReserve: number | BN | string;
        postOverhead: number | BN | string;
        gasOverhead: number | BN | string;
        maximumRecipientDeposit: number | BN | string;
        minimumUnstakeDelay: number | BN | string;
        minimumStake: number | BN | string;
        dataGasCostPerByte: number | BN | string;
        externalCallDataCostOverhead: number | BN | string;
      },
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _config: {
        maxWorkerCount: number | BN | string;
        gasReserve: number | BN | string;
        postOverhead: number | BN | string;
        gasOverhead: number | BN | string;
        maximumRecipientDeposit: number | BN | string;
        minimumUnstakeDelay: number | BN | string;
        minimumStake: number | BN | string;
        dataGasCostPerByte: number | BN | string;
        externalCallDataCostOverhead: number | BN | string;
      },
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _config: {
        maxWorkerCount: number | BN | string;
        gasReserve: number | BN | string;
        postOverhead: number | BN | string;
        gasOverhead: number | BN | string;
        maximumRecipientDeposit: number | BN | string;
        minimumUnstakeDelay: number | BN | string;
        minimumStake: number | BN | string;
        dataGasCostPerByte: number | BN | string;
        externalCallDataCostOverhead: number | BN | string;
      },
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  deprecateHub: {
    (
      fromBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      fromBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      fromBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      fromBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  calculateCharge(
    gasUsed: number | BN | string,
    relayData: {
      gasPrice: number | BN | string;
      pctRelayFee: number | BN | string;
      baseRelayFee: number | BN | string;
      relayWorker: string;
      paymaster: string;
      forwarder: string;
      paymasterData: string;
      clientId: number | BN | string;
    },
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  /**
   * Returns the whole hub configuration
   */
  getConfiguration(
    txDetails?: Truffle.TransactionDetails
  ): Promise<{
    maxWorkerCount: BN;
    gasReserve: BN;
    postOverhead: BN;
    gasOverhead: BN;
    maximumRecipientDeposit: BN;
    minimumUnstakeDelay: BN;
    minimumStake: BN;
    dataGasCostPerByte: BN;
    externalCallDataCostOverhead: BN;
  }>;

  calldataGasCost(
    length: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  workerToManager(
    worker: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  workerCount(
    manager: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  /**
   * Returns an account's deposits. It can be either a deposit of a paymaster, or a revenue of a relay manager.
   */
  balanceOf(
    target: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  stakeManager(txDetails?: Truffle.TransactionDetails): Promise<string>;

  penalizer(txDetails?: Truffle.TransactionDetails): Promise<string>;

  /**
   * Uses StakeManager info to decide if the Relay Manager can be considered staked
   */
  isRelayManagerStaked(
    relayManager: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  isDeprecated(txDetails?: Truffle.TransactionDetails): Promise<boolean>;

  deprecationBlock(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  /**
   */
  versionHub(txDetails?: Truffle.TransactionDetails): Promise<string>;

  methods: {
    /**
     * Add new worker addresses controlled by sender who must be a staked Relay Manager address. Emits a RelayWorkersAdded event. This function can be called multiple times, emitting new events
     */
    addRelayWorkers: {
      (
        newRelayWorkers: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        newRelayWorkers: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        newRelayWorkers: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        newRelayWorkers: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    registerRelayServer: {
      (
        baseRelayFee: number | BN | string,
        pctRelayFee: number | BN | string,
        url: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        baseRelayFee: number | BN | string,
        pctRelayFee: number | BN | string,
        url: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        baseRelayFee: number | BN | string,
        pctRelayFee: number | BN | string,
        url: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        baseRelayFee: number | BN | string,
        pctRelayFee: number | BN | string,
        url: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    /**
     * Deposits ether for a contract, so that it can receive (and pay for) relayed transactions. Unused balance can only be withdrawn by the contract itself, by calling withdraw. Emits a Deposited event.
     */
    depositFor: {
      (target: string, txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(
        target: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        target: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        target: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    /**
     * Withdraws from an account's balance, sending it back to it. Relay managers call this to retrieve their revenue, and contracts can also use it to reduce their funding. Emits a Withdrawn event.
     */
    withdraw: {
      (
        amount: number | BN | string,
        dest: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        amount: number | BN | string,
        dest: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        amount: number | BN | string,
        dest: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        amount: number | BN | string,
        dest: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    relayCall: {
      (
        maxAcceptanceBudget: number | BN | string,
        relayRequest: {
          request: {
            from: string;
            to: string;
            value: number | BN | string;
            gas: number | BN | string;
            nonce: number | BN | string;
            data: string;
            validUntil: number | BN | string;
          };
          relayData: {
            gasPrice: number | BN | string;
            pctRelayFee: number | BN | string;
            baseRelayFee: number | BN | string;
            relayWorker: string;
            paymaster: string;
            forwarder: string;
            paymasterData: string;
            clientId: number | BN | string;
          };
        },
        signature: string,
        approvalData: string,
        externalGasLimit: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        maxAcceptanceBudget: number | BN | string,
        relayRequest: {
          request: {
            from: string;
            to: string;
            value: number | BN | string;
            gas: number | BN | string;
            nonce: number | BN | string;
            data: string;
            validUntil: number | BN | string;
          };
          relayData: {
            gasPrice: number | BN | string;
            pctRelayFee: number | BN | string;
            baseRelayFee: number | BN | string;
            relayWorker: string;
            paymaster: string;
            forwarder: string;
            paymasterData: string;
            clientId: number | BN | string;
          };
        },
        signature: string,
        approvalData: string,
        externalGasLimit: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<{ 0: boolean; 1: string }>;
      sendTransaction(
        maxAcceptanceBudget: number | BN | string,
        relayRequest: {
          request: {
            from: string;
            to: string;
            value: number | BN | string;
            gas: number | BN | string;
            nonce: number | BN | string;
            data: string;
            validUntil: number | BN | string;
          };
          relayData: {
            gasPrice: number | BN | string;
            pctRelayFee: number | BN | string;
            baseRelayFee: number | BN | string;
            relayWorker: string;
            paymaster: string;
            forwarder: string;
            paymasterData: string;
            clientId: number | BN | string;
          };
        },
        signature: string,
        approvalData: string,
        externalGasLimit: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        maxAcceptanceBudget: number | BN | string,
        relayRequest: {
          request: {
            from: string;
            to: string;
            value: number | BN | string;
            gas: number | BN | string;
            nonce: number | BN | string;
            data: string;
            validUntil: number | BN | string;
          };
          relayData: {
            gasPrice: number | BN | string;
            pctRelayFee: number | BN | string;
            baseRelayFee: number | BN | string;
            relayWorker: string;
            paymaster: string;
            forwarder: string;
            paymasterData: string;
            clientId: number | BN | string;
          };
        },
        signature: string,
        approvalData: string,
        externalGasLimit: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    penalize: {
      (
        relayWorker: string,
        beneficiary: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        relayWorker: string,
        beneficiary: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        relayWorker: string,
        beneficiary: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        relayWorker: string,
        beneficiary: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    setConfiguration: {
      (
        _config: {
          maxWorkerCount: number | BN | string;
          gasReserve: number | BN | string;
          postOverhead: number | BN | string;
          gasOverhead: number | BN | string;
          maximumRecipientDeposit: number | BN | string;
          minimumUnstakeDelay: number | BN | string;
          minimumStake: number | BN | string;
          dataGasCostPerByte: number | BN | string;
          externalCallDataCostOverhead: number | BN | string;
        },
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _config: {
          maxWorkerCount: number | BN | string;
          gasReserve: number | BN | string;
          postOverhead: number | BN | string;
          gasOverhead: number | BN | string;
          maximumRecipientDeposit: number | BN | string;
          minimumUnstakeDelay: number | BN | string;
          minimumStake: number | BN | string;
          dataGasCostPerByte: number | BN | string;
          externalCallDataCostOverhead: number | BN | string;
        },
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _config: {
          maxWorkerCount: number | BN | string;
          gasReserve: number | BN | string;
          postOverhead: number | BN | string;
          gasOverhead: number | BN | string;
          maximumRecipientDeposit: number | BN | string;
          minimumUnstakeDelay: number | BN | string;
          minimumStake: number | BN | string;
          dataGasCostPerByte: number | BN | string;
          externalCallDataCostOverhead: number | BN | string;
        },
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _config: {
          maxWorkerCount: number | BN | string;
          gasReserve: number | BN | string;
          postOverhead: number | BN | string;
          gasOverhead: number | BN | string;
          maximumRecipientDeposit: number | BN | string;
          minimumUnstakeDelay: number | BN | string;
          minimumStake: number | BN | string;
          dataGasCostPerByte: number | BN | string;
          externalCallDataCostOverhead: number | BN | string;
        },
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    deprecateHub: {
      (
        fromBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        fromBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        fromBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        fromBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    calculateCharge(
      gasUsed: number | BN | string,
      relayData: {
        gasPrice: number | BN | string;
        pctRelayFee: number | BN | string;
        baseRelayFee: number | BN | string;
        relayWorker: string;
        paymaster: string;
        forwarder: string;
        paymasterData: string;
        clientId: number | BN | string;
      },
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    /**
     * Returns the whole hub configuration
     */
    getConfiguration(
      txDetails?: Truffle.TransactionDetails
    ): Promise<{
      maxWorkerCount: BN;
      gasReserve: BN;
      postOverhead: BN;
      gasOverhead: BN;
      maximumRecipientDeposit: BN;
      minimumUnstakeDelay: BN;
      minimumStake: BN;
      dataGasCostPerByte: BN;
      externalCallDataCostOverhead: BN;
    }>;

    calldataGasCost(
      length: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    workerToManager(
      worker: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;

    workerCount(
      manager: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    /**
     * Returns an account's deposits. It can be either a deposit of a paymaster, or a revenue of a relay manager.
     */
    balanceOf(
      target: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    stakeManager(txDetails?: Truffle.TransactionDetails): Promise<string>;

    penalizer(txDetails?: Truffle.TransactionDetails): Promise<string>;

    /**
     * Uses StakeManager info to decide if the Relay Manager can be considered staked
     */
    isRelayManagerStaked(
      relayManager: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    isDeprecated(txDetails?: Truffle.TransactionDetails): Promise<boolean>;

    deprecationBlock(txDetails?: Truffle.TransactionDetails): Promise<BN>;

    /**
     */
    versionHub(txDetails?: Truffle.TransactionDetails): Promise<string>;
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
}
