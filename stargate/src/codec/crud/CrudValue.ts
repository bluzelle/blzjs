/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "bluzelle.curium.crud";

export interface CrudValue {
  creator: string;
  uuid: string;
  key: string;
  value: string;
  lease: Long;
  height: Long;
}

const baseCrudValue: object = {
  creator: "",
  uuid: "",
  key: "",
  value: "",
  lease: Long.ZERO,
  height: Long.ZERO,
};

export const CrudValue = {
  encode(
    message: CrudValue,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.creator !== "") {
      writer.uint32(10).string(message.creator);
    }
    if (message.uuid !== "") {
      writer.uint32(18).string(message.uuid);
    }
    if (message.key !== "") {
      writer.uint32(26).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(34).string(message.value);
    }
    if (!message.lease.isZero()) {
      writer.uint32(40).int64(message.lease);
    }
    if (!message.height.isZero()) {
      writer.uint32(48).int64(message.height);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CrudValue {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseCrudValue } as CrudValue;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.creator = reader.string();
          break;
        case 2:
          message.uuid = reader.string();
          break;
        case 3:
          message.key = reader.string();
          break;
        case 4:
          message.value = reader.string();
          break;
        case 5:
          message.lease = reader.int64() as Long;
          break;
        case 6:
          message.height = reader.int64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CrudValue {
    const message = { ...baseCrudValue } as CrudValue;
    if (object.creator !== undefined && object.creator !== null) {
      message.creator = String(object.creator);
    } else {
      message.creator = "";
    }
    if (object.uuid !== undefined && object.uuid !== null) {
      message.uuid = String(object.uuid);
    } else {
      message.uuid = "";
    }
    if (object.key !== undefined && object.key !== null) {
      message.key = String(object.key);
    } else {
      message.key = "";
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = String(object.value);
    } else {
      message.value = "";
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = Long.fromString(object.lease);
    } else {
      message.lease = Long.ZERO;
    }
    if (object.height !== undefined && object.height !== null) {
      message.height = Long.fromString(object.height);
    } else {
      message.height = Long.ZERO;
    }
    return message;
  },

  toJSON(message: CrudValue): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    message.lease !== undefined &&
      (obj.lease = (message.lease || Long.ZERO).toString());
    message.height !== undefined &&
      (obj.height = (message.height || Long.ZERO).toString());
    return obj;
  },

  fromPartial(object: DeepPartial<CrudValue>): CrudValue {
    const message = { ...baseCrudValue } as CrudValue;
    if (object.creator !== undefined && object.creator !== null) {
      message.creator = object.creator;
    } else {
      message.creator = "";
    }
    if (object.uuid !== undefined && object.uuid !== null) {
      message.uuid = object.uuid;
    } else {
      message.uuid = "";
    }
    if (object.key !== undefined && object.key !== null) {
      message.key = object.key;
    } else {
      message.key = "";
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = object.value;
    } else {
      message.value = "";
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = object.lease as Long;
    } else {
      message.lease = Long.ZERO;
    }
    if (object.height !== undefined && object.height !== null) {
      message.height = object.height as Long;
    } else {
      message.height = Long.ZERO;
    }
    return message;
  },
};

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | undefined
  | Long;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
