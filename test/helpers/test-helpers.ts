import {range} from 'lodash';

export const getPrintableChars = (): string =>
    range(32, 127)
        .map(n => String.fromCharCode(n))
        .join('')