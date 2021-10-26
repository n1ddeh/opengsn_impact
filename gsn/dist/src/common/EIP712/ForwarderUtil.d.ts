import { IForwarderInstance } from '../../../types/truffle-contracts';
import { Contract } from 'web3-eth-contract';
export declare function registerForwarderForGsn(forwarderTruffleOrWeb3: IForwarderInstance | Contract, sendOptions?: any): Promise<void>;
