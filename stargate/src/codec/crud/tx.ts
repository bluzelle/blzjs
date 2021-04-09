/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "bluzelle.curium.crud";

/** this line is used by starport scaffolding # proto/tx/message */
export interface MsgUpsertCrudValue {
  creator: string;
  uuid: string;
  key: string;
  value: Uint8Array;
  lease: Long;
  metadata: Uint8Array;
}

export interface MsgUpsertCrudValueResponse {}

export interface MsgCreateCrudValue {
  creator: string;
  uuid: string;
  key: string;
  value: Uint8Array;
  lease: Long;
  metadata: Uint8Array;
}

export interface MsgCreateCrudValueResponse {}

export interface MsgUpdateCrudValue {
  creator: string;
  uuid: string;
  key: string;
  value: Uint8Array;
  lease: Long;
  metadata: Uint8Array;
}

export interface MsgUpdateCrudValueResponse {}

export interface MsgDeleteCrudValue {
  creator: string;
  uuid: string;
  key: string;
}

export interface MsgDeleteCrudValueResponse {}

const baseMsgUpsertCrudValue: object = {
  creator: "",
  uuid: "",
  key: "",
  lease: Long.ZERO,
};

export const MsgUpsertCrudValue = {
  encode(
    message: MsgUpsertCrudValue,
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
    if (message.value.length !== 0) {
      writer.uint32(34).bytes(message.value);
    }
    if (!message.lease.isZero()) {
      writer.uint32(40).int64(message.lease);
    }
    if (message.metadata.length !== 0) {
      writer.uint32(50).bytes(message.metadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgUpsertCrudValue {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgUpsertCrudValue } as MsgUpsertCrudValue;
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
          message.value = reader.bytes();
          break;
        case 5:
          message.lease = reader.int64() as Long;
          break;
        case 6:
          message.metadata = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgUpsertCrudValue {
    const message = { ...baseMsgUpsertCrudValue } as MsgUpsertCrudValue;
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
      message.value = bytesFromBase64(object.value);
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = Long.fromString(object.lease);
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = bytesFromBase64(object.metadata);
    }
    return message;
  },

  toJSON(message: MsgUpsertCrudValue): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = base64FromBytes(
        message.value !== undefined ? message.value : new Uint8Array()
      ));
    message.lease !== undefined &&
      (obj.lease = (message.lease || Long.ZERO).toString());
    message.metadata !== undefined &&
      (obj.metadata = base64FromBytes(
        message.metadata !== undefined ? message.metadata : new Uint8Array()
      ));
    return obj;
  },

  fromPartial(object: DeepPartial<MsgUpsertCrudValue>): MsgUpsertCrudValue {
    const message = { ...baseMsgUpsertCrudValue } as MsgUpsertCrudValue;
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
      message.value = new Uint8Array();
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = object.lease as Long;
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = object.metadata;
    } else {
      message.metadata = new Uint8Array();
    }
    return message;
  },
};

const baseMsgUpsertCrudValueResponse: object = {};

export const MsgUpsertCrudValueResponse = {
  encode(
    _: MsgUpsertCrudValueResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgUpsertCrudValueResponse {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgUpsertCrudValueResponse,
    } as MsgUpsertCrudValueResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): MsgUpsertCrudValueResponse {
    const message = {
      ...baseMsgUpsertCrudValueResponse,
    } as MsgUpsertCrudValueResponse;
    return message;
  },

  toJSON(_: MsgUpsertCrudValueResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(
    _: DeepPartial<MsgUpsertCrudValueResponse>
  ): MsgUpsertCrudValueResponse {
    const message = {
      ...baseMsgUpsertCrudValueResponse,
    } as MsgUpsertCrudValueResponse;
    return message;
  },
};

const baseMsgCreateCrudValue: object = {
  creator: "",
  uuid: "",
  key: "",
  lease: Long.ZERO,
};

export const MsgCreateCrudValue = {
  encode(
    message: MsgCreateCrudValue,
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
    if (message.value.length !== 0) {
      writer.uint32(34).bytes(message.value);
    }
    if (!message.lease.isZero()) {
      writer.uint32(40).int64(message.lease);
    }
    if (message.metadata.length !== 0) {
      writer.uint32(50).bytes(message.metadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgCreateCrudValue {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgCreateCrudValue } as MsgCreateCrudValue;
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
          message.value = reader.bytes();
          break;
        case 5:
          message.lease = reader.int64() as Long;
          break;
        case 6:
          message.metadata = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgCreateCrudValue {
    const message = { ...baseMsgCreateCrudValue } as MsgCreateCrudValue;
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
      message.value = bytesFromBase64(object.value);
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = Long.fromString(object.lease);
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = bytesFromBase64(object.metadata);
    }
    return message;
  },

  toJSON(message: MsgCreateCrudValue): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = base64FromBytes(
        message.value !== undefined ? message.value : new Uint8Array()
      ));
    message.lease !== undefined &&
      (obj.lease = (message.lease || Long.ZERO).toString());
    message.metadata !== undefined &&
      (obj.metadata = base64FromBytes(
        message.metadata !== undefined ? message.metadata : new Uint8Array()
      ));
    return obj;
  },

  fromPartial(object: DeepPartial<MsgCreateCrudValue>): MsgCreateCrudValue {
    const message = { ...baseMsgCreateCrudValue } as MsgCreateCrudValue;
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
      message.value = new Uint8Array();
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = object.lease as Long;
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = object.metadata;
    } else {
      message.metadata = new Uint8Array();
    }
    return message;
  },
};

const baseMsgCreateCrudValueResponse: object = {};

export const MsgCreateCrudValueResponse = {
  encode(
    _: MsgCreateCrudValueResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgCreateCrudValueResponse {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgCreateCrudValueResponse,
    } as MsgCreateCrudValueResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): MsgCreateCrudValueResponse {
    const message = {
      ...baseMsgCreateCrudValueResponse,
    } as MsgCreateCrudValueResponse;
    return message;
  },

  toJSON(_: MsgCreateCrudValueResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(
    _: DeepPartial<MsgCreateCrudValueResponse>
  ): MsgCreateCrudValueResponse {
    const message = {
      ...baseMsgCreateCrudValueResponse,
    } as MsgCreateCrudValueResponse;
    return message;
  },
};

const baseMsgUpdateCrudValue: object = {
  creator: "",
  uuid: "",
  key: "",
  lease: Long.ZERO,
};

export const MsgUpdateCrudValue = {
  encode(
    message: MsgUpdateCrudValue,
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
    if (message.value.length !== 0) {
      writer.uint32(34).bytes(message.value);
    }
    if (!message.lease.isZero()) {
      writer.uint32(40).int64(message.lease);
    }
    if (message.metadata.length !== 0) {
      writer.uint32(50).bytes(message.metadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgUpdateCrudValue {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgUpdateCrudValue } as MsgUpdateCrudValue;
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
          message.value = reader.bytes();
          break;
        case 5:
          message.lease = reader.int64() as Long;
          break;
        case 6:
          message.metadata = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgUpdateCrudValue {
    const message = { ...baseMsgUpdateCrudValue } as MsgUpdateCrudValue;
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
      message.value = bytesFromBase64(object.value);
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = Long.fromString(object.lease);
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = bytesFromBase64(object.metadata);
    }
    return message;
  },

  toJSON(message: MsgUpdateCrudValue): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = base64FromBytes(
        message.value !== undefined ? message.value : new Uint8Array()
      ));
    message.lease !== undefined &&
      (obj.lease = (message.lease || Long.ZERO).toString());
    message.metadata !== undefined &&
      (obj.metadata = base64FromBytes(
        message.metadata !== undefined ? message.metadata : new Uint8Array()
      ));
    return obj;
  },

  fromPartial(object: DeepPartial<MsgUpdateCrudValue>): MsgUpdateCrudValue {
    const message = { ...baseMsgUpdateCrudValue } as MsgUpdateCrudValue;
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
      message.value = new Uint8Array();
    }
    if (object.lease !== undefined && object.lease !== null) {
      message.lease = object.lease as Long;
    } else {
      message.lease = Long.ZERO;
    }
    if (object.metadata !== undefined && object.metadata !== null) {
      message.metadata = object.metadata;
    } else {
      message.metadata = new Uint8Array();
    }
    return message;
  },
};

const baseMsgUpdateCrudValueResponse: object = {};

export const MsgUpdateCrudValueResponse = {
  encode(
    _: MsgUpdateCrudValueResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgUpdateCrudValueResponse {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgUpdateCrudValueResponse,
    } as MsgUpdateCrudValueResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): MsgUpdateCrudValueResponse {
    const message = {
      ...baseMsgUpdateCrudValueResponse,
    } as MsgUpdateCrudValueResponse;
    return message;
  },

  toJSON(_: MsgUpdateCrudValueResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(
    _: DeepPartial<MsgUpdateCrudValueResponse>
  ): MsgUpdateCrudValueResponse {
    const message = {
      ...baseMsgUpdateCrudValueResponse,
    } as MsgUpdateCrudValueResponse;
    return message;
  },
};

const baseMsgDeleteCrudValue: object = { creator: "", uuid: "", key: "" };

export const MsgDeleteCrudValue = {
  encode(
    message: MsgDeleteCrudValue,
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
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgDeleteCrudValue {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgDeleteCrudValue } as MsgDeleteCrudValue;
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
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgDeleteCrudValue {
    const message = { ...baseMsgDeleteCrudValue } as MsgDeleteCrudValue;
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
    return message;
  },

  toJSON(message: MsgDeleteCrudValue): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    message.key !== undefined && (obj.key = message.key);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgDeleteCrudValue>): MsgDeleteCrudValue {
    const message = { ...baseMsgDeleteCrudValue } as MsgDeleteCrudValue;
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
    return message;
  },
};

const baseMsgDeleteCrudValueResponse: object = {};

export const MsgDeleteCrudValueResponse = {
  encode(
    _: MsgDeleteCrudValueResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgDeleteCrudValueResponse {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgDeleteCrudValueResponse,
    } as MsgDeleteCrudValueResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): MsgDeleteCrudValueResponse {
    const message = {
      ...baseMsgDeleteCrudValueResponse,
    } as MsgDeleteCrudValueResponse;
    return message;
  },

  toJSON(_: MsgDeleteCrudValueResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(
    _: DeepPartial<MsgDeleteCrudValueResponse>
  ): MsgDeleteCrudValueResponse {
    const message = {
      ...baseMsgDeleteCrudValueResponse,
    } as MsgDeleteCrudValueResponse;
    return message;
  },
};

/** Msg defines the Msg service. */
export interface Msg {
  /** this line is used by starport scaffolding # proto/tx/rpc */
  UpsertCrudValue(
    request: MsgUpsertCrudValue
  ): Promise<MsgUpsertCrudValueResponse>;
  CreateCrudValue(
    request: MsgCreateCrudValue
  ): Promise<MsgCreateCrudValueResponse>;
  UpdateCrudValue(
    request: MsgUpdateCrudValue
  ): Promise<MsgUpdateCrudValueResponse>;
  DeleteCrudValue(
    request: MsgDeleteCrudValue
  ): Promise<MsgDeleteCrudValueResponse>;
}

export class MsgClientImpl implements Msg {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }
  UpsertCrudValue(
    request: MsgUpsertCrudValue
  ): Promise<MsgUpsertCrudValueResponse> {
    const data = MsgUpsertCrudValue.encode(request).finish();
    const promise = this.rpc.request(
      "bluzelle.curium.crud.Msg",
      "UpsertCrudValue",
      data
    );
    return promise.then((data) =>
      MsgUpsertCrudValueResponse.decode(new _m0.Reader(data))
    );
  }

  CreateCrudValue(
    request: MsgCreateCrudValue
  ): Promise<MsgCreateCrudValueResponse> {
    const data = MsgCreateCrudValue.encode(request).finish();
    const promise = this.rpc.request(
      "bluzelle.curium.crud.Msg",
      "CreateCrudValue",
      data
    );
    return promise.then((data) =>
      MsgCreateCrudValueResponse.decode(new _m0.Reader(data))
    );
  }

  UpdateCrudValue(
    request: MsgUpdateCrudValue
  ): Promise<MsgUpdateCrudValueResponse> {
    const data = MsgUpdateCrudValue.encode(request).finish();
    const promise = this.rpc.request(
      "bluzelle.curium.crud.Msg",
      "UpdateCrudValue",
      data
    );
    return promise.then((data) =>
      MsgUpdateCrudValueResponse.decode(new _m0.Reader(data))
    );
  }

  DeleteCrudValue(
    request: MsgDeleteCrudValue
  ): Promise<MsgDeleteCrudValueResponse> {
    const data = MsgDeleteCrudValue.encode(request).finish();
    const promise = this.rpc.request(
      "bluzelle.curium.crud.Msg",
      "DeleteCrudValue",
      data
    );
    return promise.then((data) =>
      MsgDeleteCrudValueResponse.decode(new _m0.Reader(data))
    );
  }
}

interface Rpc {
  request(
    service: string,
    method: string,
    data: Uint8Array
  ): Promise<Uint8Array>;
}

declare var self: any | undefined;
declare var window: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  throw "Unable to locate global object";
})();

const atob: (b64: string) => string =
  globalThis.atob ||
  ((b64) => globalThis.Buffer.from(b64, "base64").toString("binary"));
function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

const btoa: (bin: string) => string =
  globalThis.btoa ||
  ((bin) => globalThis.Buffer.from(bin, "binary").toString("base64"));
function base64FromBytes(arr: Uint8Array): string {
  const bin: string[] = [];
  for (let i = 0; i < arr.byteLength; ++i) {
    bin.push(String.fromCharCode(arr[i]));
  }
  return btoa(bin.join(""));
}

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
