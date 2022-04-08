import { Blob } from "buffer";

// This was inspired by ethereumjs implementation
export type Encodable = string | List; // | number;

// Use interface extension instead of type alias to
// make circular declaration possible.
export interface List extends Array<Encodable> {}

// end This was inspired by ethereumjs implementation

function int_size(i: number): number {
  for (let size = 1; ; size++) {
    if (i >> 8 == 0) {
      return size;
    }
  }
}

function get_total_length_byte(input: Encodable): number {
  let total = 0;
  if (typeof input == "string") {
    total += new Blob([input]).size;
  } else if (typeof input == "number") {
    total += int_size(input);
  } else {
    for (let i = 0; i < input.length; i++) {
      total += get_total_length_byte(input);
    }
  }

  return total;
}

function get_combinated_length(input: Encodable): number {
  // initializing total to the length since I'm still treating output as an string so "83dog" has 5 length but should be [83, d, o, g] which has 4
  // when input is an array with two strings, for exemple ["cat", "dog"]
  // the output would be [83, c, a, t, 83, d, o, g] this output's length is 8.  -- The 83 here means 0x83 (0x80 + "cat"/"dog".length)
  // the demo uses the encoded output's length, but in our case it would be "83cat83dog" which has a length of 10.
  // Because we know that each string will have its total caracters length on top of a character for the length of the string
  // length: 83  c  a  t  83  d  o  g
  //         1   2  3  4  5   6  7  8
  // once the output becomes an array we must initialize total to 0

  let total = input.length;
  for (let i = 0; i < input.length; i++) {
    total += input[i].length;
  }

  return total;
}

function chr(int: number): string {
  return int.toString(16);
}

function encode_length(len: number, offset: number): number | string {
  if (len < 56) {
    return chr(len + offset);
  } else if (len < Math.pow(256, 8)) {
    // this is wrong, still needs implementation
    return chr(offset + 55 + int_size(len));
  } else {
    throw new Error("the given input is too long");
  }
}

function encode(input: Encodable): string | Encodable {
  let output = "";
  if (typeof input == "string") {
    if (input.length == 1 && input.charCodeAt(0) < 0x80) {
      return chr(input.charCodeAt(0));
    } else {
      const bytes = new Blob([input]).size;

      // is this ternary if correct?
      return `${encode_length(bytes, 0x80)}${
        bytes < 56 ? "" : input.length
      }${input}`;
    }
  }

  let item_output = "";
  for (let i = 0; i < input.length; i++) {
    item_output += encode(input[i]);
  }
  output += `${encode_length(
    get_combinated_length(input),
    0xc0
  )}${item_output}`;

  return output;
}

export { encode };
