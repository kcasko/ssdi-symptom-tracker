declare module 'react-native-aes-crypto' {
  const AES: {
    encrypt: (text: string, keyHex: string, ivHex: string, mode?: string) => Promise<string>;
    decrypt: (cipher: string, keyHex: string, ivHex: string, mode?: string) => Promise<string>;
  };
  export default AES;
}
