import {once} from 'lodash';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

export const useChaiAsPromised = once(() => chai.use(chaiAsPromised));