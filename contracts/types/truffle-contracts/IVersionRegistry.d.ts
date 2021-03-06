/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface IVersionRegistryContract
  extends Truffle.Contract<IVersionRegistryInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<IVersionRegistryInstance>;
}

export interface VersionAdded {
  name: "VersionAdded";
  args: {
    id: string;
    version: string;
    value: string;
    time: BN;
    0: string;
    1: string;
    2: string;
    3: BN;
  };
}

export interface VersionCanceled {
  name: "VersionCanceled";
  args: {
    id: string;
    version: string;
    reason: string;
    0: string;
    1: string;
    2: string;
  };
}

type AllEvents = VersionAdded | VersionCanceled;

export interface IVersionRegistryInstance extends Truffle.ContractInstance {
  /**
   * add a version
   * @param id the object-id to add a version (32-byte string)
   * @param value value to attach to this version
   * @param version the new version to add (32-byte string)
   */
  addVersion: {
    (
      id: string,
      version: string,
      value: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      id: string,
      version: string,
      value: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      id: string,
      version: string,
      value: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      id: string,
      version: string,
      value: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  /**
   * cancel a version.
   */
  cancelVersion: {
    (
      id: string,
      version: string,
      reason: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      id: string,
      version: string,
      reason: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      id: string,
      version: string,
      reason: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      id: string,
      version: string,
      reason: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  methods: {
    /**
     * add a version
     * @param id the object-id to add a version (32-byte string)
     * @param value value to attach to this version
     * @param version the new version to add (32-byte string)
     */
    addVersion: {
      (
        id: string,
        version: string,
        value: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        id: string,
        version: string,
        value: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        id: string,
        version: string,
        value: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        id: string,
        version: string,
        value: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    /**
     * cancel a version.
     */
    cancelVersion: {
      (
        id: string,
        version: string,
        reason: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        id: string,
        version: string,
        reason: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        id: string,
        version: string,
        reason: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        id: string,
        version: string,
        reason: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };
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
