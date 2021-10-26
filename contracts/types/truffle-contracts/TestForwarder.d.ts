/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface TestForwarderContract
  extends Truffle.Contract<TestForwarderInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<TestForwarderInstance>;
}

export interface Result {
  name: "Result";
  args: {
    success: boolean;
    error: string;
    0: boolean;
    1: string;
  };
}

type AllEvents = Result;

export interface TestForwarderInstance extends Truffle.ContractInstance {
  callExecute: {
    (
      forwarder: string,
      req: {
        from: string;
        to: string;
        value: number | BN | string;
        gas: number | BN | string;
        nonce: number | BN | string;
        data: string;
        validUntil: number | BN | string;
      },
      domainSeparator: string,
      requestTypeHash: string,
      suffixData: string,
      sig: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      forwarder: string,
      req: {
        from: string;
        to: string;
        value: number | BN | string;
        gas: number | BN | string;
        nonce: number | BN | string;
        data: string;
        validUntil: number | BN | string;
      },
      domainSeparator: string,
      requestTypeHash: string,
      suffixData: string,
      sig: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      forwarder: string,
      req: {
        from: string;
        to: string;
        value: number | BN | string;
        gas: number | BN | string;
        nonce: number | BN | string;
        data: string;
        validUntil: number | BN | string;
      },
      domainSeparator: string,
      requestTypeHash: string,
      suffixData: string,
      sig: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      forwarder: string,
      req: {
        from: string;
        to: string;
        value: number | BN | string;
        gas: number | BN | string;
        nonce: number | BN | string;
        data: string;
        validUntil: number | BN | string;
      },
      domainSeparator: string,
      requestTypeHash: string,
      suffixData: string,
      sig: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  decodeErrorMessage(
    ret: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  getChainId(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  methods: {
    callExecute: {
      (
        forwarder: string,
        req: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        },
        domainSeparator: string,
        requestTypeHash: string,
        suffixData: string,
        sig: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        forwarder: string,
        req: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        },
        domainSeparator: string,
        requestTypeHash: string,
        suffixData: string,
        sig: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        forwarder: string,
        req: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        },
        domainSeparator: string,
        requestTypeHash: string,
        suffixData: string,
        sig: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        forwarder: string,
        req: {
          from: string;
          to: string;
          value: number | BN | string;
          gas: number | BN | string;
          nonce: number | BN | string;
          data: string;
          validUntil: number | BN | string;
        },
        domainSeparator: string,
        requestTypeHash: string,
        suffixData: string,
        sig: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    decodeErrorMessage(
      ret: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;

    getChainId(txDetails?: Truffle.TransactionDetails): Promise<BN>;
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